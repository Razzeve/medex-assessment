import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ServiceExplorerView } from '@/features/service-explorer/components/service-explorer-view';
import { ServiceExplorerSkeleton } from '@/features/service-explorer/components/service-explorer-skeleton';

export const metadata: Metadata = {
  title: 'Service Explorer | MedEx Healthcare Marketplace',
  description:
    'Browse and compare health check-ups, diagnostic lab tests, and wellness packages grouped by provider across Thailand, Nepal, and India.',
};

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ServiceExplorerSkeleton />
        </div>
      }
    >
      <ServiceExplorerView />
    </Suspense>
  );
}
