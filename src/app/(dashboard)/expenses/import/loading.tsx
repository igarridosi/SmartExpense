import { SkeletonCard } from "@/components/ui/skeletons";

export default function ImportLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-36 animate-pulse rounded bg-gray-200" />
        <div className="mt-1 h-4 w-64 animate-pulse rounded bg-gray-100" />
      </div>
      <SkeletonCard className="h-48" />
    </div>
  );
}
