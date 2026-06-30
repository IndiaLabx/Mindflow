import React from 'react';
import { ErrorState } from './ErrorState';
import { SynapticLoader } from '../SynapticLoader';

interface QueryStateHandlerProps {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry: () => void;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export const QueryStateHandler: React.FC<QueryStateHandlerProps> = ({
  isLoading,
  isError,
  error,
  onRetry,
  children,
  loadingComponent,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48 w-full">
        {loadingComponent || <SynapticLoader />}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        onRetry={onRetry}
        message={error?.message || "Failed to load data. Please try again."}
      />
    );
  }

  return <>{children}</>;
};
