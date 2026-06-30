# Final Runtime Hardening Report

## 1. Remaining Runtime Vulnerabilities
- **Silent Data Loss in Background Sync:** `src/features/quiz/hooks/useQuiz.ts` bypasses the newly introduced `global.fetch` timeout layer by making raw `fetch()` calls to the Supabase REST API for partial updates. If these requests hang or fail (especially the non-keepalive path), the `catch` block simply logs to the console. The user is never informed that their sync failed, leading to silent data loss if they refresh or close the app before a successful retry.
- **Silent Error Swallowing in Manual Flushes:** `src/features/quiz/stores/useQuizSessionStore.ts` contains `flushToCloud()`. When this fails, it executes `catch (err) { console.error("Failed explicit flush to cloud:", err); }`. If the user hits "Home" while offline or deadlocked, the flush silently aborts, and the local state is cleared (`enterHome: () => { flushToCloud(get()); set({ ...initialState, status: 'idle' }); }`), permanently deleting the un-synced data.

## 2. Exact Files Still Risky
- `src/features/quiz/hooks/useQuiz.ts` (Raw fetch usage bypasses timeout; silent catch blocks)
- `src/features/quiz/stores/useQuizSessionStore.ts` (Silent data loss on explicitly commanded navigations out of the quiz)

## 3. Confidence Ranking
- **PWA Cleanup (Phase 1):** 100% (Confirmed fixed)
- **Reawakening Decoupling (Phase 2):** 100% (Confirmed fixed)
- **Global Timeout Layer (Phase 3):** 90% (Supabase client is covered, but explicit raw fetches aren't using the wrapper yet)
- **Data Persistence Resilience (Phase 4 scope):** 60% (Silent swallows still present in the store's explicit flush methods)

## 4. Unresolved Edge Cases
- **Raw Fetch Bypass:** `fetch()` calls inside `useQuiz.ts` do not use `AbortSignal.timeout` and may still hang indefinitely on a dropped TCP socket.
- **`flushToCloud` Destructive State Transitions:** Navigating away from a quiz clears the active Zustand memory regardless of whether `flushToCloud` successfully pushed to IndexedDB/Supabase. While it *does* `await db.updateQuizProgress` (which is good), if `supabase.auth.getSession()` inside `flushToCloud` hangs or rejects (due to our Phase 3 timeout), the local IndexedDB save is never reached.

## 5. Is the app production-safe against Sleep Coma?
**No, not completely.** While the UI will no longer deadlock forever on wake (due to Phase 2/3), the background synchronization engine is still susceptible to hanging promises because it explicitly uses native `fetch` instead of the hardened Supabase client. Furthermore, any failures stemming from the new timeout layer are silently swallowed in critical paths (`flushToCloud`), resulting in state destruction without user consent.

## 6. Recommendations for Final Stabilization
1. Migrate `useQuiz.ts` to use `supabase.from('saved_quizzes').update()` instead of raw `fetch()`, guaranteeing the timeout layer applies.
2. Inject `useNotificationStore().showToast()` into the `catch` blocks of `syncToSupabase` and `flushToCloud`.
3. Do not blindly `set({ ...initialState })` if `flushToCloud` throws an error; block the navigation or show a destructive warning popup.
