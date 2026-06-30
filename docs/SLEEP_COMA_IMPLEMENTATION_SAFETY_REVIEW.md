# MindFlow Sleep Coma: Implementation Safety Review

## 1. Supabase-Native Timeout Injection Strategy

**Validation Findings:**
*   **Official Support:** Supabase explicitly supports injecting a custom `fetch` implementation globally via the `global.fetch` config option in `createClient`. This is documented as the standard pattern for adding functionality like automatic retries (e.g., using `fetch-retry`).
*   **AbortController Wrapping:** Wrapping `globalThis.fetch` with an `AbortSignal.timeout()` is the cleanest, most standard way to enforce deterministic request termination without altering the signature of the Supabase client API used throughout the app.
*   **Auth Refresh & Realtime:**
    *   Auth requests (`/auth/v1/user`) use the same global fetch and will correctly reject upon timeout. Supabase Auth handles failed fetch calls gracefully and will retry on the next interaction.
    *   Realtime (WebSockets) are handled by a separate transport layer (`@supabase/realtime-js` / Phoenix channels) and are **not** affected by the `global.fetch` override. This is desired, as WebSockets have their own ping/pong keep-alive mechanisms.
*   **Storage Uploads:** Small uploads using `.upload()` use the standard `fetch` and will be subject to the timeout. Large files (tus resumable uploads) might need special consideration if they exceed the global timeout, but MindFlow currently relies on Cloudinary for heavy media (reels), mitigating this risk.

**Safe Pattern:**
```typescript
const customFetch = (url: RequestInfo | URL, options?: RequestInit) => {
  const timeoutMs = 15000;
  // Browser-native AbortSignal.timeout is preferred where available
  const signal = AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : (() => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(new Error('TimeoutError')), timeoutMs);
      return controller.signal;
  })();

  return fetch(url, { ...options, signal });
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch: customFetch }
});
```

## 2. Browser Compatibility Strategy

**Validation Findings:**
*   `AbortSignal.timeout()` is widely supported in modern browsers (Chrome 103+, Safari 16+, Firefox 100+).
*   **Fallback:** For older WebViews or Capacitor environments that might lack `AbortSignal.timeout`, a manual `AbortController` combined with `setTimeout` is a robust and universally supported fallback (as shown in the pattern above).
*   **Aborted Fetch Rejection:** In all environments, an aborted `fetch` triggers a promise rejection with a `DOMException` (name: 'AbortError') or the custom error provided to `.abort()`. This guarantees the `catch` and `finally` blocks execute.

## 3. React Query Interaction Safety

**Validation Findings:**
*   **Handling Aborts:** React Query intercepts rejected promises correctly. If the custom fetch aborts, React Query marks the attempt as failed.
*   **Retries:** By default, React Query retries failed queries. A timeout error will trigger this retry mechanism (respecting the `retry: 1` setting in `AppProvider.tsx`). This is safe and desired.
*   **Mutations:** Paused mutations that resume and then timeout will also fail cleanly, preventing infinite hanging.
*   **No NetworkMode Changes:** The default `networkMode` is appropriate as long as the underlying fetch correctly fails when the network drops.

## 4. Supabase Auth Recovery Safety

**Validation Findings:**
*   **Decoupling Auth from Wake:** Prioritizing React Query resumption *before* `getSession()` completes is mathematically necessary to break the deadlock.
*   **JWT Expiration Race:** If a token expires during sleep, and a paused mutation resumes *before* `getSession` completes, the request might fire with an expired token.
*   **Supabase Handling:** Supabase automatically returns a `401 Unauthorized`. If the application uses React Query's retry logic, the failed mutation will retry. By the time it retries, the parallel `getSession()` call should have refreshed the token. This is a significantly safer and more resilient failure mode than a total application deadlock.

## 5. Zombie-State Recovery Semantics

**Explicit Rules:**
1.  **Definition of Dead:** Any network request that does not receive a response within 15 seconds is considered dead and is forcefully aborted.
2.  **State Ownership:** The component that initiated the request (and holds the `isLoading` state) is responsible for clearing it in its `finally` block, which is now guaranteed to run.
3.  **Active Request Cancellation:** We do *not* need to explicitly cancel requests on `visibilitychange(hidden)`. They will either complete successfully in the background or hit the 15-second timeout and fail cleanly.
4.  **Wake-up Invalidation:** `resumePausedMutations` automatically handles retrying mutations that were queued during the offline/sleep period.

## 6. Runtime Telemetry Strategy

**Recommendations:**
*   **Timeout Telemetry:** Log an analytics event (e.g., `network_timeout_aborted`) inside the custom fetch wrapper's `catch` block if the error is an `AbortError`. This provides direct visibility into how often the timeout safety net is triggered in production.
*   **Wake-up Tracking:** Log `app_reawakened` in `useAppVisibilityReawakening.ts` to correlate wake events with subsequent timeout spikes.

## 7. Final Recommendations

**Safe vs Unsafe Patterns:**

*   **SAFE:** Wrapping `global.fetch` in `createClient`. (Centralized, affects all Supabase REST/RPC calls consistently).
*   **UNSAFE:** Modifying individual component `useEffect` hooks with custom timeout logic. (Prone to omissions and creates inconsistent behavior).
*   **SAFE:** Firing `getSession()` and `resumePausedMutations()` concurrently on wake. (Prevents deadlocks).
*   **UNSAFE:** Awaiting `getSession()` before allowing any other application activity on wake. (Creates the current deadlock).
*   **SAFE:** Removing `localStorage.getItem('mindflow-quiz-session')` from PWA reload logic. (Removes interaction with outdated state schemas).

**Conclusion:** The stabilization plan is architecturally sound, safe to implement, and aligns with Supabase's recommended patterns for customizing fetch behavior. The fallback `AbortController` strategy ensures 100% coverage across Capacitor and PWA environments.
