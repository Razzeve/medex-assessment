import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ServiceExplorerView } from '@/features/service-explorer/components/service-explorer-view';
import { ServiceExplorerSkeleton } from '@/features/service-explorer/components/service-explorer-skeleton';
import { PageHeader } from '@/components/layout/page-header';

export const metadata: Metadata = {
  title: 'Service Explorer | MedEx Healthcare Marketplace',
  description:
    'Browse and compare health check-ups, diagnostic lab tests, and wellness packages grouped by provider across Thailand, Nepal, and India.',
};

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50">
          <PageHeader
            title="Service Explorer & Healthcare Catalog"
            description="Discover and schedule specialized healthcare services, lab tests, and doctor consultations with real-time filtering and live availability."
            actions={
              <div className="h-8 w-32 rounded-lg bg-slate-200 animate-pulse" />
            }
          />
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <ServiceExplorerSkeleton />
          </div>
        </div>
      }
    >
      <ServiceExplorerView />
    </Suspense>
  );
}
