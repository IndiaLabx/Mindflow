import { createClient } from '@supabase/supabase-js';
import { fetchWithTimeout } from './fetchWithTimeout';

export const SUPABASE_URL = 'https://sjcfagpjstbfxuiwhlps.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqY2ZhZ3Bqc3RiZnh1aXdobHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NDQ5OTUsImV4cCI6MjA3NjUyMDk5NX0.8p6tIdBum2uhi0mRYENtF81WryaVlZFCwukwAAwJwJA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch: fetchWithTimeout }
});

// --- AUTH RUNTIME STABILIZATION: HARD MUTEX TIMEOUTS ---
// The gotrue-js client uses an internal promise queue (mutex).
// If an operation (like a background refresh during network transition) silently hangs,
// it permanently poisons the singleton, blocking all future auth calls (getSession, signOut).
// We wrap all critical auth methods in a strict Promise.race to force them to reject,
// preventing the mutex from locking the entire app runtime.

const AUTH_TIMEOUT_MS = 8000; // 8 seconds max for any auth operation

const withAuthTimeout = <T>(
    operationName: string,
    operation: () => Promise<T>
): Promise<T> => {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            console.error(`[AuthStabilization] ${operationName} exceeded ${AUTH_TIMEOUT_MS}ms timeout. Forcing rejection to unblock mutex.`);
            reject(new Error(`AuthTimeout: ${operationName} hung permanently.`));
        }, AUTH_TIMEOUT_MS);

        operation()
            .then((res) => {
                clearTimeout(timeoutId);
                resolve(res);
            })
            .catch((err) => {
                clearTimeout(timeoutId);
                reject(err);
            });
    });
};

const originalGetSession = supabase.auth.getSession.bind(supabase.auth);
supabase.auth.getSession = async (...args) => {
    return withAuthTimeout('getSession', () => originalGetSession(...args));
};

const originalSignOut = supabase.auth.signOut.bind(supabase.auth);
supabase.auth.signOut = async (...args) => {
    return withAuthTimeout('signOut', () => originalSignOut(...args));
};

const originalRefreshSession = supabase.auth.refreshSession.bind(supabase.auth);
supabase.auth.refreshSession = async (...args) => {
    return withAuthTimeout('refreshSession', () => originalRefreshSession(...args));
};

const originalGetUser = supabase.auth.getUser.bind(supabase.auth);
supabase.auth.getUser = async (...args) => {
    return withAuthTimeout('getUser', () => originalGetUser(...args));
};
// -------------------------------------------------------
