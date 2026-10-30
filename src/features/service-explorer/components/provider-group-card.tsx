'use client';

import { useState } from 'react';
import {
  Star,
  Building2,
  MapPin,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { ProviderGroup, ViewMode } from '../types';
import { ServiceCard } from './service-card';

interface ProviderGroupCardProps {
  group: ProviderGroup;
  viewMode?: ViewMode;
}

export function ProviderGroupCard({ group, viewMode = 'grid' }: ProviderGroupCardProps) {
  const [expanded, setExpanded] = useState(false);
  const provider = group.provider;
  const info = provider.providerInformation;
  const rating = info.rating;
  const reviewCount = info.reviewCount;
  const total = group.totalMatchingServices;

  // MedEx requirement: Show at most 3 initially, with clear way to view all matching services
  const displayedServices = expanded ? group.services : group.services.slice(0, 3);
  const hasMore = total > 3;

  return (
    <section
      aria-labelledby={`provider-${provider.id}-title`}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-teal-50/20 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
              <Building2 className="h-6 w-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2
                  id={`provider-${provider.id}-title`}
                  className="text-base font-bold text-slate-900 sm:text-lg"
                >
                  {provider.name}
                </h2>
                <ShieldCheck className="h-4 w-4 text-teal-600" aria-label="Verified Provider" />
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {info.city.name}, {info.country.name}
                </span>

                <span className="text-slate-300">•</span>

                {/* Sensible state when no rating exists */}
                {rating !== null && rating !== undefined ? (
                  <span className="flex items-center gap-1 text-slate-700 font-semibold">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{rating.toFixed(1)}</span>
                    <span className="font-normal text-slate-500">
                      ({reviewCount?.toLocaleString() || 0} reviews)
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    New Provider (No ratings yet)
                  </span>
                )}

                <span className="text-slate-300">•</span>

                <span className="inline-flex items-center gap-1 font-medium text-teal-700">
                  <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
                  {total} {total === 1 ? 'service matches filters' : 'services match filters'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick comparison tag */}
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-lg bg-teal-50 px-2.5 py-1 font-semibold text-teal-800 border border-teal-200/60">
              {info.currency} Catalog
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div
          className={
            viewMode === 'grid'
              ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
              : 'flex flex-col gap-3'
          }
        >
          {displayedServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              viewMode={viewMode}
              showProviderHeader={false}
            />
          ))}
        </div>

        {hasMore && (
          <div className="mt-4 flex justify-center border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:ring-2 focus:ring-teal-500/20"
            >
              {expanded ? (
                <>
                  <span>Show top 3 services only</span>
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>
                    View all {total} services from {provider.name}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
