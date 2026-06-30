import React from 'react';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { ToastContainer } from '../components/ui/Notification/ToastContainer';
import { Popup } from '../components/ui/Notification/Popup';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';

interface AppProviderProps {
  children: React.ReactNode;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

// --- DIAGNOSTIC INSTRUMENTATION ---
queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'fetch') {
        console.log(`[Diagnostic-RQ] Query fetching started: ${event.query.queryHash}`);
    }
    if (event.type === 'updated' && event.action.type === 'pause') {
        console.log(`[Diagnostic-RQ] Query PAUSED: ${event.query.queryHash}`);
    }
    if (event.type === 'updated' && event.action.type === 'error') {
        console.log(`[Diagnostic-RQ] Query ERROR: ${event.query.queryHash}`);
    }
});

queryClient.getMutationCache().subscribe((event) => {
    if (event.type === 'updated' && event.action?.type === 'pending') {
        console.log(`[Diagnostic-RQ] Mutation pending:`, event.mutation.options.mutationKey);
    }
    if (event.type === 'updated' && event.action?.type === 'pause') {
        console.log(`[Diagnostic-RQ] Mutation PAUSED:`, event.mutation.options.mutationKey);
    }
});

onlineManager.subscribe((isOnline) => {
    console.log(`[Diagnostic-RQ] onlineManager status changed. isOnline: ${isOnline}`);
});

// Attach queryClient to window for diagnostics
(window as any).__queryClient = queryClient;
// -----------------------------------

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      {children}
      <ToastContainer />
      <Popup />
    </AuthProvider>
    </QueryClientProvider>
  );
};
