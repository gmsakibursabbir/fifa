import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  variant?: "match-card" | "channel-card" | "standing-row" | "text" | "hero";
}

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div className={cn("skeleton-shimmer rounded-xl", className)} />
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <ShimmerBlock className="h-4 w-24" />
        <ShimmerBlock className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <ShimmerBlock className="w-10 h-10 rounded-full" />
          <ShimmerBlock className="h-4 w-32" />
        </div>
        <div className="text-center">
          <ShimmerBlock className="h-8 w-20 rounded-lg" />
        </div>
        <div className="flex items-center gap-3 flex-1 justify-end">
          <ShimmerBlock className="h-4 w-32" />
          <ShimmerBlock className="w-10 h-10 rounded-full" />
        </div>
      </div>
      <ShimmerBlock className="h-3 w-32" />
    </div>
  );
}

export function ChannelCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-4 flex items-center gap-4">
      <ShimmerBlock className="w-14 h-14 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <ShimmerBlock className="h-4 w-3/4" />
        <ShimmerBlock className="h-3 w-1/2" />
      </div>
      <ShimmerBlock className="w-8 h-8 rounded-full flex-shrink-0" />
    </div>
  );
}

export function StandingRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3 px-4">
      <ShimmerBlock className="h-4 w-5" />
      <ShimmerBlock className="w-8 h-8 rounded-full" />
      <ShimmerBlock className="h-4 w-32 flex-1" />
      <ShimmerBlock className="h-4 w-8" />
      <ShimmerBlock className="h-4 w-8" />
      <ShimmerBlock className="h-4 w-8" />
      <ShimmerBlock className="h-4 w-10" />
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="w-full h-[500px] skeleton-shimmer rounded-3xl" />
  );
}

export default function LoadingSkeleton({
  count = 3,
  variant = "match-card",
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (variant === "match-card") {
    return (
      <div className="space-y-3">
        {skeletons.map((i) => <MatchCardSkeleton key={i} />)}
      </div>
    );
  }
  if (variant === "channel-card") {
    return (
      <div className="space-y-3">
        {skeletons.map((i) => <ChannelCardSkeleton key={i} />)}
      </div>
    );
  }
  if (variant === "standing-row") {
    return (
      <div className="space-y-1">
        {skeletons.map((i) => <StandingRowSkeleton key={i} />)}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {skeletons.map((i) => (
        <ShimmerBlock key={i} className="h-6 w-full" />
      ))}
    </div>
  );
}
