/**
 * Skeleton loading components for Suspense boundaries.
 * Used across dashboard, expenses, and categories pages.
 */

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-gray-200 bg-white p-6 ${className}`}
    >
      <div className="h-4 w-24 rounded bg-gray-200" />
      <div className="mt-3 h-8 w-32 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-20 rounded bg-gray-100" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-gray-200" />
        <div>
          <div className="h-4 w-28 rounded bg-gray-200" />
          <div className="mt-1 h-3 w-20 rounded bg-gray-100" />
        </div>
      </div>
      <div className="h-4 w-16 rounded bg-gray-200" />
    </div>
  );
}

export function SkeletonChart({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex animate-pulse items-center justify-center rounded-xl border border-gray-200 bg-white p-6 ${className}`}
    >
      <div className="h-44 w-44 rounded-full border-8 border-gray-200 bg-gray-50" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

/** Full-page skeleton matching the dashboard layout */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-32 rounded bg-gray-200" />
      <div className="grid gap-4 sm:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <SkeletonChart className="lg:col-span-3 h-96" />
        <div className="space-y-0 rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <div className="h-5 w-32 rounded bg-gray-200 mb-4" />
          <SkeletonTable rows={5} />
        </div>
      </div>
    </div>
  );
}

/** Skeleton for expense list page */
export function ExpensesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-24 rounded bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded bg-gray-200" />
          <div className="h-8 w-32 rounded bg-gray-200" />
          <div className="h-8 w-8 rounded bg-gray-200" />
        </div>
      </div>
      <SkeletonCard className="h-48" />
      <SkeletonTable rows={6} />
    </div>
  );
}

/** Skeleton for categories page */
export function CategoriesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-32 rounded bg-gray-200" />
      <SkeletonCard className="h-32" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex animate-pulse items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
          >
            <div className="h-8 w-8 rounded bg-gray-200" />
            <div className="h-4 w-24 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
