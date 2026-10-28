export function ServiceExplorerSkeleton() {
  return (
    <div className="w-full animate-pulse" aria-label="Loading service catalog" aria-busy="true">
      {/* Top Search & Filter Bar Skeleton */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-11 w-full max-w-xl rounded-xl bg-slate-200" />
        <div className="h-10 w-48 rounded-xl bg-slate-200" />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Skeleton */}
        <aside className="w-full lg:w-80 shrink-0">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="h-5 w-28 rounded bg-slate-200" />
              <div className="h-4 w-12 rounded bg-slate-200" />
            </div>

            <div className="space-y-3">
              <div className="h-4 w-20 rounded bg-slate-200" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-5/6 rounded bg-slate-100" />
              <div className="h-4 w-4/6 rounded bg-slate-100" />
            </div>

            <div className="space-y-3">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="h-8 w-full rounded-lg bg-slate-100" />
              <div className="h-8 w-full rounded-lg bg-slate-100" />
            </div>

            <div className="space-y-3">
              <div className="h-4 w-20 rounded bg-slate-200" />
              <div className="grid grid-cols-3 gap-1">
                <div className="h-8 rounded bg-slate-100" />
                <div className="h-8 rounded bg-slate-100" />
                <div className="h-8 rounded bg-slate-100" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="h-9 w-full rounded-lg bg-slate-100" />
            </div>
          </div>
        </aside>

        {/* Content Skeletons */}
        <main className="flex-1 space-y-6">
          <div className="h-12 w-full rounded-xl bg-white border border-slate-200" />

          {/* 3 Provider Group Skeletons */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              {/* Provider Header Skeleton */}
              <div className="flex items-center gap-3.5 border-b border-slate-100 bg-slate-50/50 p-4">
                <div className="h-11 w-11 rounded-xl bg-slate-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-5 w-48 rounded bg-slate-200" />
                  <div className="h-3.5 w-72 rounded bg-slate-100" />
                </div>
              </div>

              {/* Service Cards Skeletons */}
              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((card) => (
                  <div
                    key={card}
                    className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/40 p-4 space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex gap-1.5">
                        <div className="h-4 w-16 rounded bg-slate-200" />
                        <div className="h-4 w-24 rounded bg-slate-200" />
                      </div>
                      <div className="h-5 w-full rounded bg-slate-200" />
                      <div className="h-5 w-3/4 rounded bg-slate-200" />
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                      <div className="h-6 w-20 rounded bg-slate-200" />
                      <div className="h-8 w-24 rounded-lg bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
