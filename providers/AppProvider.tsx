import React from 'react';

// In a real app, this would compose ThemeProvider, AuthProvider, QueryClientProvider etc.
interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <React.Fragment>
      {children}
    </React.Fragment>
  );
};