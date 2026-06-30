# Handling OAuth with HashRouter (A Developer's Guide)

## The Problem
When integrating OAuth providers (like "Sign in with Google") into a Single Page Application (SPA) using a Hash-based router (`HashRouter` in React), conflicts arise during the redirect flow.

1. **The OAuth Redirect:** When a user successfully authenticates with an external provider, the provider redirects them back to your application, appending authentication tokens to the URL. Supabase, by default, returns these tokens as a URL hash fragment (e.g., `https://yourapp.com/?#access_token=...&refresh_token=...`).
2. **The HashRouter Conflict:** A `HashRouter` interprets everything after the `#` symbol as a route path. When the OAuth provider redirects back, the `HashRouter` attempts to navigate to the route `/#access_token=...`, which doesn't exist, leading to a blank page, a 404 error, or a broken authentication state.

## The Solution: A Generalized Approach

To successfully implement OAuth with a `HashRouter` (such as using Supabase Auth), you must intercept and process the authentication tokens *before* the router is initialized and begins interpreting the URL.

Here is a step-by-step breakdown of how this is handled, generalized for implementation in similar applications:

### 1. Configure the Redirect URL correctly
When initiating the OAuth flow, ensure the `redirectTo` URL is the base URL of your application, **without any hash route appended**.

```typescript
// Example: Initiating Google OAuth
const handleOAuthSignIn = async () => {
  // Determine the base URL (e.g., handling production vs local dev)
  // Ensure this URL does NOT end with /#/...
  const redirectURL = process.env.NODE_ENV === 'production'
    ? 'https://yourdomain.com/?' // Note the trailing /? to enforce a clean query string boundary
    : 'http://localhost:3000';

  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectURL,
    }
  });
};
```

### 2. Pre-Router Authentication Initialization
The core of the solution is to delay the mounting of the `HashRouter` until the authentication client (e.g., Supabase) has had a chance to inspect the URL, extract the tokens, and establish a session.

In your application's root component (e.g., `App.tsx`), wrap the router rendering in a loading state.

```tsx
import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { AppRoutes } from './routes';

const App = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      // 1. Calling getSession() forces the Supabase client to inspect the current URL.
      // 2. If it finds auth tokens in the hash (e.g., #access_token=...), it extracts them,
      //    establishes the user session, and automatically clears the tokens from the URL history.
      await supabase.auth.getSession();

      // 3. Once getSession() is complete (and the URL is clean), mark the app as ready.
      setIsReady(true);
    };

    initAuth();
  }, []);

  if (!isReady) {
    // Render a loading spinner or initial splash screen while checking the session
    return <LoadingSpinner />;
  }

  // Only render the HashRouter AFTER the auth client has processed any potential redirect tokens.
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
};

export default App;
```

### 3. Handling PWA / Popup Authentication Flows
In Progressive Web Apps (PWAs) or when OAuth flows are launched in secondary windows/popups, the main application window might not receive the direct URL redirect. Instead, the authentication client in the popup writes the new session data to `localStorage`.

To handle this gracefully, implement a cross-window communication listener in your authentication context provider.

```tsx
import React, { useEffect } from 'react';
import { supabase } from './lib/supabase';

export const AuthProvider = ({ children }) => {
  useEffect(() => {
    // Listen for storage events across tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      // Supabase stores auth tokens in localStorage with keys containing 'auth-token'
      if (event.key?.includes('auth-token') && event.newValue) {
        // A new auth token appeared, meaning a popup authentication was successful.
        // Reload the main window to bootstrap the app with the new authenticated state.
        console.log('Auth token changed in storage, reloading PWA...');
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // If this code runs inside the auth popup (opened by Google OAuth),
      // close the popup immediately after successful sign-in.
      if (event === 'SIGNED_IN' && window.opener) {
        window.close();
        return;
      }

      // ... handle normal session state updates ...
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      subscription?.unsubscribe();
    };
  }, []);

  // ... rest of provider
};
```

## Summary
By enforcing a strict sequence of execution—**Redirect -> App Mounts -> Auth Client Parses URL -> HashRouter Mounts**—you eliminate conflicts between OAuth provider callbacks and Hash-based routing architectures.
