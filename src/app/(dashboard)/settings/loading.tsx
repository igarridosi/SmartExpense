import { SkeletonCard } from "@/components/ui/skeletons";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-36 animate-pulse rounded bg-gray-200" />
      <div className="max-w-lg space-y-4">
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-32" />
      </div>
    </div>
  );
}
