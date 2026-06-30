import React from 'react';
import { ShimmerBlock } from '../../../components/ui/ShimmerBlock';

export const PostCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50 mb-6">
      <div className="flex items-center gap-4 mb-4">
        <ShimmerBlock className="w-12 h-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <ShimmerBlock className="h-4 w-1/3 rounded" />
          <ShimmerBlock className="h-3 w-1/4 rounded" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <ShimmerBlock className="h-4 w-full rounded" />
        <ShimmerBlock className="h-4 w-5/6 rounded" />
        <ShimmerBlock className="h-4 w-4/6 rounded" />
      </div>
      <ShimmerBlock className="w-full h-64 rounded-2xl mb-4" />
      <div className="flex gap-4">
        <ShimmerBlock className="h-8 w-16 rounded-full" />
        <ShimmerBlock className="h-8 w-16 rounded-full" />
      </div>
    </div>
  );
};
