import { cn } from '@/lib/utils';

interface SkeletonBlockProps {
  className?: string;
}

function SkeletonBlock({ className }: SkeletonBlockProps) {
  return <div className={cn('rounded-md bg-muted shimmer', className)} />;
}

/** Card skeleton — thumbnail + 2 text lines */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 space-y-3 animate-pulse', className)}>
      <SkeletonBlock className="h-36 w-full rounded-lg" />
      <SkeletonBlock className="h-4 w-3/4" />
      <SkeletonBlock className="h-3 w-1/2" />
    </div>
  );
}

/** Course card skeleton */
export function CourseSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
      <SkeletonBlock className="h-44 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <SkeletonBlock className="h-5 w-4/5" />
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-3 w-2/3" />
        <div className="flex justify-between pt-2">
          <SkeletonBlock className="h-6 w-16" />
          <SkeletonBlock className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** Table row skeleton */
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonBlock key={i} className={cn('h-4', i === 0 ? 'w-1/3' : 'w-1/5')} />
      ))}
    </div>
  );
}

/** Text block skeleton — for paragraphs */
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className={cn('h-3.5', i === lines - 1 ? 'w-3/5' : 'w-full')}
        />
      ))}
    </div>
  );
}

/** Avatar + name skeleton */
export function AvatarSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <SkeletonBlock className="h-9 w-9 rounded-full" />
      <div className="space-y-1.5">
        <SkeletonBlock className="h-3.5 w-24" />
        <SkeletonBlock className="h-2.5 w-16" />
      </div>
    </div>
  );
}

/** Stats skeleton */
export function StatsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex gap-8 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <SkeletonBlock className="h-7 w-14" />
          <SkeletonBlock className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}
