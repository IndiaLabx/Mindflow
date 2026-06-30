# MindFlow Runtime Stabilization Summary

## 1. Original Root Cause Chain
The application suffered from a vulnerability colloquially labeled "Sleep Coma."
When users backgrounded the app (triggering OS-level TCP socket suspension) during active network requests, the browser's default `fetch` API hung in an infinite pending state rather than rejecting. Upon waking the app, `useAppVisibilityReawakening` would `await supabase.auth.getSession()` before unpausing React Query. If the auth refresh request hung on the dead socket, React Query was deadlocked. This left the user interacting with an orphaned Optimistic UI that could no longer synchronize data.

## 2. Architectural Weaknesses Discovered
1. **Lack of Global Timeouts:** Supabase REST/RPC queries relied on standard `fetch`, meaning dropped TCP connections caused permanent hanging promises.
2. **Reawakening Deadlocks:** Synchronous `await` calls in visibility listeners paralyzed recovery logic.
3. **PWA Cache Destruction:** The Service Worker update manager attempted forced background reloads while referencing obsolete `localStorage` schemas.
4. **Raw Fetch Escape Hatches:** Critical background syncs (e.g., `useQuiz.ts`) explicitly bypassed `createClient` wrappers.
5. **Silent Sync Degradation:** Network failures in critical flush operations (e.g., `flushToCloud`) silently swallowed errors via `console.error`, creating invisible data-loss vectors when memory was subsequently wiped by navigation.

## 3. Phases Completed
- **Phase 1: PWA Cleanup** - Eliminated unsafe `localStorage` assumptions and automatic forced background updates.
- **Phase 2: Reawakening Decoupling** - Removed the `await` deadlock blocking React Query resumption.
- **Phase 3: Global Timeout Layer** - Injected `AbortSignal.timeout(15000)` globally into `createClient`.
- **Phase 4: Runtime Loading Audit** - Identified raw `fetch` and silent `console.error` loopholes remaining after Phase 3.
- **Phase 5 & 6: Operational Consistency Hardening** - Standardized `fetchWithTimeout`, exposed a unified `syncStatus` UI paradigm, and blocked destructive unmounts during failing network syncs.

## 4. Runtime Behavior (Before vs After)
| Scenario | Before | After |
| :--- | :--- | :--- |
| **Network Drops** | App hangs indefinitely (infinite spinners). | Request aborts in 15s; UI catches and reports error. |
| **App Reawakens** | Total UI deadlock if auth refresh hangs. | React Query resumes instantly; Auth refreshes concurrently. |
| **Service Worker Update** | Forcefully reloads app, wiping active UI state. | Politely prompts user to reload via explicit toast action. |
| **Background Sync Fails** | Fails silently; data lost if user exits. | Marks `sync_failed`/`offline_pending`; prevents accidental exit. |

## 5. Final Timeout Architecture
A unified `fetchWithTimeout` wrapper enforces a strict 15-second boundary. It leverages `AbortSignal.timeout` (or a fallback manual `AbortController` + `setTimeout` for older WebViews/Capacitor). This wrapper protects:
1. All Supabase REST, RPC, Auth, and Storage queries (via `global.fetch` configuration).
2. Debounced active Quiz persistence (`useQuiz.ts`).
3. Presence Engine cleanup triggers (`PresenceProvider.tsx`).

## 6. Sync Visibility Semantics
The `QuizSessionState` now exposes a `syncStatus`:
- `'idle'`: No network activity pending.
- `'syncing'`: Background push in progress.
- `'synced'`: Cloud state matches local IndexedDB state.
- `'sync_failed'`: Push rejected/timed out (user receives a `useNotificationStore` error).
- `'offline_pending'`: Device is offline; local save confirmed, deferred sync pending (user receives an info toast).
Critical UI unmounts (e.g., `goHome`) now explicitly `await` network resolution to prevent silent data wiping.

## 7. Remaining Known Non-Critical Risks
- External integrations (e.g., Google Text-to-Speech) utilize raw `fetch()` directly without global timeouts. While they may hang the specific media playback logic, they do not disrupt core database persistence or application state machines.

## 8. Operational Recommendations for Future Maintenance
- **Do not introduce bare `fetch` calls.** All internal API interactions must route through the Supabase client or explicitly import `fetchWithTimeout`.
- **Never `await` network calls in global window event listeners** (e.g., `visibilitychange`, `beforeunload`) unless using specifically designed decoupled patterns.
- **Avoid deep state machines for sync.** The current 5-tier `syncStatus` is optimally lightweight. Do not over-engineer it into complex XState patterns unless absolutely required by new multi-device requirements.

## 9. Developer-Facing Observability Guidance
- **Timeout Telemetry:** If an analytics system (e.g., NewRelic or Datadog) is integrated, monitor `TimeoutError` exceptions thrown by `fetchWithTimeout`. High spikes indicate poor cellular connectivity or regional CDN blockages.
- **Key Metrics:** Monitor the frequency of `'sync_failed'` transitions. If `sync_failed` exceeds 5% of quiz completions, the 15-second timeout boundary may be too aggressive for the target demographic's bandwidth.
- **Warning Signs:** Re-appearance of infinite spinners in the UI strongly suggests an external library or custom hook is making network calls outside the `fetchWithTimeout` wrapper.
