'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  error: Error | null;
  onRetry: () => void;
  isRetrying?: boolean;
  onResetSimulatedError?: () => void;
  isSimulatedError?: boolean;
}

export function ErrorState({
  error,
  onRetry,
  isRetrying = false,
  onResetSimulatedError,
  isSimulatedError = false,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/60 p-8 text-center sm:p-12 shadow-xs"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
        <AlertTriangle className="h-7 w-7" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
        Failed to fetch service catalog
      </h3>

      <p className="mt-2 max-w-md text-sm text-slate-600 leading-relaxed">
        {error?.message ||
          'A network error occurred while connecting to MedEx catalog services.'}
      </p>

      {isSimulatedError && (
        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-800">
          Note: This failure was triggered on demand via the API Simulation mode.
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Retrying...' : 'Retry Connection'}</span>
        </button>

        {isSimulatedError && onResetSimulatedError && (
          <button
            type="button"
            onClick={onResetSimulatedError}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Turn Off Simulated Failure
          </button>
        )}
      </div>
    </div>
  );
}
