# MindFlow Sleep Coma Stabilization Plan

This document outlines the exact architectural roadmap to eradicate the "Sleep Coma" (Zombie State) vulnerability caused by suspended TCP sockets and hanging fetch promises. The focus is on minimal, foundational stabilization with explicit state ownership.

---

## 1. Layered Fix Strategy

*   **Foundation (Network/Supabase Layer):** Enforce strict temporal boundaries on all external network requests. A request must resolve or reject.
*   **Core (Visibility/Reawakening Layer):** Decouple network resumption from authentication refresh to prevent deadlocks on wake.
*   **Application (UI/Loading-State Layer):** Bind UI loading flags to deterministic Promise lifecycles, ensuring no orphaned spinners.
*   **Periphery (PWA/Service-Worker Layer):** Remove legacy, unsafe state-flushes during background updates that mask or destroy local state.

## 2. Minimal vs Over-Engineered Fixes

| Area | Clean Minimal Approach | Over-Engineered (Avoid) |
| :--- | :--- | :--- |
| **Timeouts** | Injecting a global `fetch` wrapper with `AbortSignal.timeout()` into `createClient` inside `src/lib/supabase.ts`. | Writing custom hook wrappers for every Supabase query throughout the codebase. |
| **Reawakening** | Fire `auth.getSession()` and `queryClient.resumePausedMutations()` concurrently via `Promise.allSettled`. | Building a complex state machine (XState) to manage app lifecycle transitions. |
| **Loading State** | Relying on the global fetch rejection to guarantee the `finally` block executes. | Polling intervals to check if a specific loading state has been active "too long". |
| **PWA Cache** | Removing the `localStorage` fallback logic in `PWAUpdateManager` and relying entirely on IndexedDB persistence. | Implementing a custom Service Worker messaging bridge for state synchronization. |

## 3. Exact Runtime Ownership Rules

*   **Loading State Ownership:** UI components (via local `useState` or specific Zustand flags) own the loading state. They are strictly bounded by `try/finally` blocks.
*   **Timeout Responsibility:** The **Network Layer** (Supabase Client wrapper) exclusively owns timeouts. Components should *never* write bespoke timeout logic.
*   **Recovery Triggers:** `useAppVisibilityReawakening.ts` owns the trigger, acting as the bridge between OS/Browser events and React Query/Supabase.
*   **Offline Detection:** Handled implicitly by React Query's `onlineManager` and explicit fetch rejections.
*   **Final Error Surfacing:** The calling component (or global boundary) handles the rejected promise and surfaces it via `useNotificationStore` toasts.

## 4. Timeout Architecture Proposal

*   **Placement:** Global injection at the initialization of the Supabase client (`src/lib/supabase.ts`).
*   **Implementation:** Use the `globalThis.fetch` override parameter in `createClient`.
    ```typescript
    // Conceptual Example
    globalThis.fetch = (url, options) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(new Error('NetworkTimeout')), 15000);
      return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(id));
    };
    ```
*   **Interaction:** When the timeout rejects the promise, React Query (if managing the call) will automatically handle the failure and schedule retries based on its configuration. For direct calls (like `useQuiz.ts` background sync), it will trigger the `catch` block.

## 5. Reawakening Recovery Strategy

*   **On `visibilitychange` (Visible):**
    1.  Fire `queryClient.resumePausedMutations()` *immediately*. Do not await Auth.
    2.  Fire `supabase.auth.getSession()` concurrently in the background.
*   **If Auth Refresh Hangs:** Because it is no longer awaited sequentially, React Query will retry its pending mutations. If the global timeout (Step 4) kills the hung Auth request, Supabase will cleanly throw an error, preventing silent lockups.
*   **Clearing Zombie State:** By strictly enforcing timeouts, any "zombie" request from before the sleep phase will have rejected by the time the app wakes up, clearing out stale loading states.

## 6. Loading-State Hardening Strategy

*   **Deterministic State:** Once the global fetch timeout is implemented, every `await` is mathematically guaranteed to proceed to the next line or throw an error within 15 seconds.
*   **Prevention of Orphans:** The `finally { setIsLoading(false); }` pattern becomes ironclad.
*   **Actionable Feedback:** The `catch` blocks must be audited to ensure they translate the `AbortError` or custom `NetworkTimeout` into a visible UI toast: *"Network timeout. Please check your connection."*

## 7. Service Worker / PWA Stabilization

*   **Stale Logic Removal:** Delete the `localStorage.getItem('mindflow-quiz-session')` check in `src/components/common/PWAUpdateManager.tsx`.
*   **Forced Reloads:** Forced reloads should only occur when the user explicitly accepts them (via a Toast button), *never* automatically in the background while the user might be actively answering a quiz question off-main-thread.
*   **Background Sync:** We will rely on the `useQuiz.ts` debounced keepalive fetch (now protected by the global timeout) rather than Service Worker Background Sync API, keeping the architecture simpler.

## 8. Verification Strategy (Pre-Implementation)

1.  **Network Blackhole Test:** (Like the Playwright script). Simulate dropped TCP. Verify UI loading states clear after 15 seconds and an error toast appears.
2.  **Reawakening Race Condition:** Sleep app -> Drop TCP -> Wake App. Verify React Query immediately attempts to resume mutations without waiting for the blocked Auth call to time out.
3.  **Active Quiz Sync Test:** Start Quiz -> Turn off network -> Answer question. Verify local state updates immediately, and the background sync silently fails (or queues) without crashing the UI.
4.  **PWA Update Test:** Trigger a Service Worker update while offline. Verify the app does not force-refresh and destroy the current DOM state.

## 9. Migration Risk Assessment

*   **High Risk:** Altering the global `fetch` signature in Supabase. We must ensure native APIs (like FormData uploads for avatars) are not broken by the `AbortController` wrapper.
*   **Race Conditions:** Firing `resumePausedMutations` before `getSession` finishes *could* theoretically cause a mutation to fire with an expired JWT if the token expired during sleep. However, Supabase handles auto-refresh on 401s reasonably well, making this a preferable trade-off to a total application deadlock.
*   **Regression Risk:** Low, assuming the fetch wrapper is written cleanly and purely targets timeouts.

## 10. Final Recommended Execution Order

1.  **Phase 1: The PWA Cleanup (Low Risk, High Value)**
    *   Remove legacy `localStorage` logic from `PWAUpdateManager.tsx`.
2.  **Phase 2: The Reawakening Decoupling (Medium Risk)**
    *   Refactor `useAppVisibilityReawakening.ts` to unblock `resumePausedMutations()`.
3.  **Phase 3: The Global Network Timeout (High Risk, Foundational)**
    *   Implement the `fetch` override with `AbortController` in `src/lib/supabase.ts`.
4.  **Phase 4: UI Hardening & Toasts (Low Risk)**
    *   Audit critical paths (like `QuizConfig.tsx` creation) to ensure `try/catch/finally` blocks correctly surface the new timeout errors.
