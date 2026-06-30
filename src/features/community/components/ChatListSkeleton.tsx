import React from 'react';
import { ShimmerBlock } from '../../../components/ui/ShimmerBlock';

export const ChatListSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-32 px-4">
      {/* Messages Header - Static Text */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-4">Messages</h2>

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100"
          >
            {/* Avatar Skeleton */}
            <ShimmerBlock className="w-12 h-12 rounded-full shrink-0" />

            {/* Text Skeletons */}
            <div className="flex flex-col gap-2 flex-1">
              {/* Name Skeleton */}
              <ShimmerBlock className="w-24 h-4 rounded-md" />
              {/* Preview Text Skeleton */}
              <ShimmerBlock className="w-40 h-3 rounded-md opacity-60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
