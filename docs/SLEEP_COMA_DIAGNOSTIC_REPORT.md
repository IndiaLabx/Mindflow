# MindFlow Sleep Coma Diagnostic Report

## 1. Exact Reproduction Chain

The "stale zombie state" (Sleep Coma) is triggered by the following sequence:

1. **Active Use**: A user actively uses the application, maintaining a live IndexedDB/Zustand local state.
2. **Backgrounding/Sleep**: The user switches browser tabs, minimizes the app, or locks their mobile device. The OS suspends the JavaScript thread and terminates active TCP connections (including WebSockets and keep-alive HTTP requests) to save battery/resources.
3. **Event Firing on Sleep**: As the app is backgrounded, `document.visibilitychange` (hidden) and/or `window.beforeunload` listeners trigger.
4. **The Hanging Fetch**: The `useQuiz.ts` hook fires its safety-net sync to Supabase (`syncToSupabase(true)`) using a standard `fetch` with `keepalive: true`. Concurrently, `PWAUpdateManager.tsx` might fire service worker updates.
5. **The TCP Blackhole**: Because the OS suspends networking, these `fetch` requests (and any ongoing Supabase queries like `fetchQuestionsByIds` in `QuizConfig.tsx`) never reach the server, but crucially, they *never resolve or reject* either. They enter a permanent pending state.
6. **Reawakening Deadlock**: The user returns to the app. `useAppVisibilityReawakening.ts` detects the visibility change and immediately `await`s `supabase.auth.getSession()` to refresh auth tokens *before* telling React Query to resume paused mutations. If the Supabase client is stuck waiting on a dead socket, this `await` never resolves.
7. **Zombie UI**: Because MindFlow utilizes a robust Optimistic UI architecture backed by Zustand (`useQuizSessionStore`), the local UI continues to accept user inputs, increment scores, and transition local component states synchronously. However, network mutations are completely paralyzed behind the scenes.

## 2. Runtime Lifecycle Analysis

*   **Supabase Client (`src/lib/supabase.ts`)**: Initialized strictly with default settings. There is no custom fetch wrapper overriding the browser's default timeout, meaning a dropped TCP socket will cause Supabase API calls to hang indefinitely rather than throwing an error.
*   **React Query (`src/providers/AppProvider.tsx`)**: Configured correctly for `refetchOnWindowFocus`. However, if `resumePausedMutations` in the reawakening hook is blocked by a hanging `getSession()` call, the recovery mechanism is bypassed.
*   **Visibility Handlers (`src/hooks/useAppVisibilityReawakening.ts`)**: The sequence is `await supabase.auth.getSession()` followed by `queryClient.resumePausedMutations()`. This strict serial execution creates a single point of failure.
*   **Zustand Local State (`src/features/quiz/stores/useQuizSessionStore.ts`)**: Operates entirely decoupled from explicit fetch resolutions. It relies on debounced background syncs. Since the background syncs use raw `fetch` without `AbortController` or timeouts, a failed sync simply fails silently. No `catch` block is reached, and no error toast is displayed.
*   **Loading State Ownership (`src/features/quiz/components/QuizConfig.tsx`)**: `isStartingQuiz` is set to `true` before `fetchQuestionsByIds` and `supabase.from('...').insert(...)`. If either promise hangs indefinitely, the `finally` block is never reached. The loading spinner remains forever.

## 3. Root-Cause Candidates (Ranked by Probability)

1.  **Hanging Promises due to Lack of Network Timeouts (Primary)**: The browser's default `fetch` behavior combined with OS-level socket termination causes pending Supabase queries and background syncs to hang in a permanent pending state. Without explicit `AbortController` timeouts, `finally` blocks are never executed.
2.  **Reawakening Deadlock (Secondary)**: `useAppVisibilityReawakening.ts` awaits `supabase.auth.getSession()` before unpausing React Query. If the auth session request hangs on the dead socket, React Query is never informed that the network is back online.
3.  **Silent Failures in Optimistic UI (Tertiary)**: The decoupling of the Zustand store's synchronous state updates from the asynchronous network pushes (`flushToCloud`) means the UI gracefully hides network failures, creating the illusion of a working app while data is silently lost.
4.  **PWA Update Manager Local Storage Mismatch**: `PWAUpdateManager.tsx` attempts a smart reload by reading `mindflow-quiz-session` from `localStorage`. However, `useQuizSessionStore` does not use the `persist` middleware, so this key likely doesn't exist or is outdated, leading to potentially corrupted state saves right before a forced service worker reload.

## 4. Evidence for Each Candidate

*   **Hanging Promises**: `src/features/quiz/hooks/useQuiz.ts` uses raw `fetch` for `syncToSupabase` and Supabase `.select()` without `AbortSignal`.
*   **Reawakening Deadlock**: `src/hooks/useAppVisibilityReawakening.ts` lines 14-19 explicitly show `await supabase.auth.getSession()` blocking `queryClient.resumePausedMutations()`.
*   **Silent Failures**: `src/features/quiz/stores/useQuizSessionStore.ts` `flushToCloud` catches errors (`catch (err) { console.error(...) }`) but never reflects that error back into the state machine (e.g., setting a `sync_failed` status).
*   **PWA Cache Lifecycle**: `src/components/common/PWAUpdateManager.tsx` line 88 checks `localStorage.getItem('mindflow-quiz-session')`, but `useQuizSessionStore` has no `persist` wrapper in its definition.

## 5. Exact Files & Components Involved

*   `src/lib/supabase.ts` (Client Initialization)
*   `src/hooks/useAppVisibilityReawakening.ts` (Visibility Lifecycle)
*   `src/features/quiz/hooks/useQuiz.ts` (Background Sync Logic)
*   `src/features/quiz/components/QuizConfig.tsx` (Quiz Creation Lifecycle)
*   `src/components/common/PWAUpdateManager.tsx` (PWA Reload Logic)
*   `src/features/quiz/stores/useQuizSessionStore.ts` (State Management)

## 6. Why the Issue Survives Silently

The architecture is heavily local-first (IndexedDB + Zustand). When network requests fail to throw an exception (because they are hanging in pending status rather than rejecting), no error boundary is triggered, no `catch` block executes, and no UI error notifications (toasts) are dispatched. The app continues to process local Javascript memory transitions.

## 7. Why Hard Refresh Fixes It

A hard refresh entirely tears down the Javascript execution context. It destroys the hanging promises, recreates the Supabase client, re-establishes fresh TCP connections, and hydrates the UI strictly from the verified IndexedDB/Supabase state, clearing the deadlock.

## 8. Unsafe Architectural Assumptions

1.  **Assumption**: `fetch` and Supabase client calls will always eventually resolve or reject. (False: They can hang forever if the OS drops the connection).
2.  **Assumption**: `finally` blocks are guaranteed to execute. (False: If the `try` block `await`s a hanging promise, `finally` is never reached).
3.  **Assumption**: `document.visibilitychange` implies an immediate return of robust network connectivity. (False: The socket may still be dead when the event fires).
4.  **Assumption**: `mindflow-quiz-session` exists in `localStorage`. (False: It is managed by IndexedDB now).

## 9. Minimal Clean Fix Direction (Conceptual)

1.  **Global Timeout Interceptor**: Implement a global custom fetch wrapper injected into `createClient` in `src/lib/supabase.ts` that enforces a strict `AbortController` timeout (e.g., 10-15 seconds) on all network requests. This ensures hanging promises are forcibly rejected.
2.  **Non-Blocking Reawakening**: Refactor `useAppVisibilityReawakening.ts` to unpause React Query *concurrently* with, or independent of, the `getSession()` check. Do not `await` auth if it blocks network resumption.
3.  **Hardened Catch/Finally Ownership**: Ensure that loading states (like `isStartingQuiz`) have timeout fallbacks or are tied to deterministic promise resolutions.
