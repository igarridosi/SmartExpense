export default function InsightsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-pulse rounded-xl bg-zinc-200/70" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-xl bg-zinc-200/70" />
        <div className="h-28 animate-pulse rounded-xl bg-zinc-200/70" />
        <div className="h-28 animate-pulse rounded-xl bg-zinc-200/70" />
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="h-96 animate-pulse rounded-xl bg-zinc-200/70 xl:col-span-7" />
        <div className="h-96 animate-pulse rounded-xl bg-zinc-200/70 xl:col-span-5" />
      </div>
    </div>
  );
}
