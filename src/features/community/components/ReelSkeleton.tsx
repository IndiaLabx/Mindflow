import React from 'react';

export const ReelSkeleton: React.FC = () => {
  return (
    <div className="h-[100dvh] w-full snap-start relative bg-gray-900 overflow-hidden flex items-center justify-center animate-pulse">
      {/* Background Media Placeholder */}
      <div className="absolute inset-0 w-full h-full bg-gray-800" />

      {/* Overlay Gradient */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      {/* Side Action Bar */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-10">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-gray-700 rounded-full" />
            <div className="w-8 h-3 bg-gray-700 rounded mt-1" />
          </div>
        ))}
      </div>

      {/* Bottom Content Area */}
      <div className="absolute bottom-0 left-0 right-16 p-4 z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-700 border border-gray-600" />
          <div className="w-32 h-4 bg-gray-700 rounded" />
          <div className="w-16 h-6 bg-gray-700 rounded-full ml-2" />
        </div>

        <div className="space-y-2 mb-4">
          <div className="w-full h-4 bg-gray-700 rounded" />
          <div className="w-2/3 h-4 bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
};
