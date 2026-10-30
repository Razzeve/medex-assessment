import React from 'react';

export interface PageHeaderProps {
  /** Main page heading */
  title: string;
  /** Professional subtitle / description */
  description?: React.ReactNode;
  /** Status badge or item count badge displayed next to the title */
  badge?: React.ReactNode;
  /** Primary / secondary actions or aligned status indicator in right slot */
  actions?: React.ReactNode;
  /** Optional breadcrumbs element displayed above title */
  breadcrumbs?: React.ReactNode;
  /** Inner container class name (defaults to standardized 7xl padding container) */
  containerClassName?: string;
  /** Outer container class name extension */
  className?: string;
  /** Additional custom children content if needed */
  children?: React.ReactNode;
}

/**
 * Standardized Page Header Component for MedEx Core Modules.
 * Provides a unified layout structure:
 * - Production-grade title (text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight)
 * - Clear, professional subtitle/description (text-sm text-slate-600 mt-1 max-w-2xl)
 * - Right-hand action slot for primary/secondary actions or status badge
 * - Strict light bg-slate-50 background canvas with subtle border-b border-slate-200
 */
export function PageHeader({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
  containerClassName = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
  className = '',
  children,
}: PageHeaderProps) {
  return (
    <header className={`bg-slate-50 border-b border-slate-200 py-6 sm:py-8 ${className}`}>
      <div className={containerClassName}>
        {breadcrumbs && (
          <nav className="mb-2.5 sm:mb-3" aria-label="Breadcrumb">
            {breadcrumbs}
          </nav>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {title}
              </h1>
              {badge && <div className="inline-flex shrink-0 items-center">{badge}</div>}
            </div>
            {description && (
              <p className="mt-1 text-sm text-slate-600 max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
              {actions}
            </div>
          )}
        </div>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </header>
  );
}

/**
 * Skeleton placeholder for PageHeader matching identical heights, padding, and layout structure.
 */
export function PageHeaderSkeleton({
  containerClassName = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
  className = '',
}: {
  containerClassName?: string;
  className?: string;
}) {
  return (
    <header className={`bg-slate-50 border-b border-slate-200 py-6 sm:py-8 ${className}`}>
      <div className={containerClassName}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-8 sm:h-9 w-64 sm:w-80 rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-5 w-20 rounded-lg bg-slate-200 animate-pulse" />
            </div>
            <div className="h-4 w-full max-w-xl rounded-lg bg-slate-200 animate-pulse" />
          </div>
          <div className="h-9 w-32 rounded-lg bg-slate-200 animate-pulse shrink-0" />
        </div>
      </div>
    </header>
  );
}

