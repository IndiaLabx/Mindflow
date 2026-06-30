# Final Network Consistency Review

## 1. Remaining Unsafe Network Paths
The global fetch timeout layer (`src/lib/supabase.ts`) secures all traffic routed through `createClient`. However, several raw `fetch()` calls bypass this layer completely:

1. **`src/features/quiz/hooks/useQuiz.ts`**: The `syncToSupabase` debounce loop manually calls `fetch(...)` to perform `PATCH` updates for quiz sessions. These requests inherit the default infinite timeout of the browser.
2. **`src/components/PresenceProvider.tsx`**: Uses `fetch(...)` with `keepalive: true` during `beforeunload` to mark users offline.
3. **External API Calls**: `useAIChat.ts`, `useTextToSpeech.ts`, and `SchoolDownloads.tsx` use `fetch()` for Google GenAI, ElevenLabs/Google TTS, and file blob downloads.

## 2. Timeout Coverage Map
| Subsystem | Protected by Phase 3 Timeout? | Notes |
| :--- | :--- | :--- |
| Supabase Auth (`getSession`) | ✅ YES | Uses `global.fetch` |
| Supabase RPCs / Inserts | ✅ YES | Uses `global.fetch` |
| Supabase Storage (Small) | ✅ YES | Uses `global.fetch` |
| **Quiz Background Sync** (`useQuiz`) | ❌ NO | Uses raw `fetch` |
| **Presence Unload Event** | ❌ NO | Uses raw `fetch` |
| External AI / Audio APIs | ❌ NO | Uses raw `fetch` |

## 3. Remaining Silent-Failure Paths
The codebase suffers from a systemic lack of user-facing error reporting in its persistence layer. The `catch` blocks predominantly use `console.error` and fail to notify the user or rollback Optimistic UI changes:

- **`src/features/quiz/stores/useQuizSessionStore.ts` (`flushToCloud`)**: Silently catches explicit flush errors (`console.error("Failed explicit flush to cloud:", err);`).
- **`src/lib/syncService.ts`**: Every push function (`pushSavedQuiz`, `pushChatConversation`, etc.) logs an error and `return`s. If a timeout occurs, the UI is never told that the backend is out of sync.
- **`useQuiz.ts` (`syncToSupabase`)**: Swallows the timeout/error (`.catch(() => {})` for keepalive, and `catch (e) { console.error(...) }` for standard fetches).

## 4. Recommended Consistency Strategy
To avoid scattering `AbortController` instances everywhere and to unify error handling, we must:

1. **Standardize Sync API**: Refactor `useQuiz.ts` and `PresenceProvider.tsx` to stop using raw `fetch`. They should use standard Supabase query builders (e.g., `supabase.from('saved_quizzes').update()`).
    - *Note on Keepalive*: If standard Supabase clients strip `keepalive`, we should build a unified `fetchWithKeepalive(url, options)` utility that explicitly manages a 10-second `AbortSignal.timeout` internally.
2. **Harden Sync Service Visibility**: Inject the `useNotificationStore` into `src/lib/syncService.ts`. If a push fails due to a network timeout, spawn a `variant: 'sync'` toast: *"Background sync failed. You may be offline."*
3. **Block Destructive Navigation**: In `useQuizSessionStore.ts`, the `goHome` and `enterHome` methods execute `flushToCloud(get()); set({ ...initialState });`. This is dangerously synchronous. The UI clears memory *before* the network push finishes or fails. Navigation state resets should be `await`ed and blocked if the flush rejects.

## 5. Production Readiness Assessment
**Status: YELLOW (Degraded Resilience).**
The app is safe from catastrophic "Sleep Coma" deadlocks on wake-up. However, it remains heavily susceptible to **silent data loss** during network transitions because optimistic UI states are cleared locally while their background network pushes silently fail and drop. Until the background sync pipeline routes through the global timeout layer and `flushToCloud` explicitly blocks state-destruction on failure, the app is not fully hardened for unstable network environments.
