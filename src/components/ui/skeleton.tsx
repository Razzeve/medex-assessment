import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Standardized Loading Skeleton primitive.
 * Enforces unified tokens: bg-slate-200 rounded-lg animate-pulse across all modules.
 */
export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`bg-slate-200 rounded-lg animate-pulse ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

