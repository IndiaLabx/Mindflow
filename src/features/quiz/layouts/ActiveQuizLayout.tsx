import React from 'react';

interface ActiveQuizLayoutProps {
  header: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
  overlays?: React.ReactNode;
}

export const ActiveQuizLayout: React.FC<ActiveQuizLayoutProps> = ({
  header,
  children,
  footer,
  overlays
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-800 flex flex-col animate-in fade-in duration-200 overflow-x-hidden w-full max-w-[100vw]">
      
      {/* Main Content Slot - Header is now part of the scroll flow */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-[100vw] bg-white dark:bg-gray-800 relative scroll-smooth">
        {/* Header rendered here to scroll with content */}
        {header && (
          <div className="border-b border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
            {header}
          </div>
        )}
        
        <div className="max-w-3xl mx-auto p-4 md:p-6 pb-24">
          {children}
        </div>
      </main>

      {/* Footer Slot - Remains fixed/sticky at bottom */}
      <footer className="flex-none bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {footer}
      </footer>

      {/* Overlays Slot (Modals, Drawers) */}
      {overlays}
    </div>
  );
};