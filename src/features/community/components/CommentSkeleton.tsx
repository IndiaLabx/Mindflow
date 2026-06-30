import React from 'react';
import { ShimmerBlock } from '../../../components/ui/ShimmerBlock';

export const CommentSkeleton: React.FC<{ isReply?: boolean }> = ({ isReply }) => {
  return (
    <div className={`flex gap-3 ${isReply ? 'ml-12 mt-3' : 'mt-4'}`}>
      <ShimmerBlock className="w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-3 border border-gray-100 dark:border-gray-700/50">
           <ShimmerBlock className="h-3 w-1/4 rounded mb-2" />
           <ShimmerBlock className="h-3 w-full rounded mb-1" />
           <ShimmerBlock className="h-3 w-5/6 rounded" />
        </div>
        <div className="flex gap-4 px-2">
            <ShimmerBlock className="h-3 w-8 rounded" />
            <ShimmerBlock className="h-3 w-12 rounded" />
        </div>
      </div>
    </div>
  );
};
