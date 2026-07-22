import React, { useMemo } from 'react';

const Skeleton = ({ className = '', width, height = '1rem', borderRadius = '8px' }) => (
  <div
    className={`animate-pulse bg-[var(--bg-tertiary)] ${className}`}
    style={{
      width: width || '100%',
      height,
      borderRadius,
      opacity: 0.6,
    }}
    aria-hidden="true"
  />
);

export const CardSkeleton = () => (
  <div className="bg-white dark:bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton width="2.5rem" height="2.5rem" borderRadius="12px" />
      <div className="flex-1 space-y-1.5">
        <Skeleton width="40%" height="0.75rem" />
        <Skeleton width="60%" height="1.25rem" />
      </div>
    </div>
    <Skeleton width="100%" height="0.625rem" />
    <Skeleton width="80%" height="0.625rem" />
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 p-3">
        <Skeleton width="2rem" height="2rem" borderRadius="50%" />
        <div className="flex-1 space-y-1.5">
          <Skeleton width="60%" height="0.75rem" />
          <Skeleton width="40%" height="0.625rem" />
        </div>
        <Skeleton width="5rem" height="1.5rem" borderRadius="999px" />
      </div>
    ))}
  </div>
);

const BAR_HEIGHTS = [60, 85, 45, 95, 70, 50, 80, 65];

export const ChartSkeleton = () => {
  const heights = useMemo(() => {
    return BAR_HEIGHTS.map(h => `${h}%`);
  }, []);

  return (
    <div className="bg-white dark:bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton width="30%" height="1rem" />
        <Skeleton width="1.5rem" height="1.5rem" borderRadius="8px" />
      </div>
      <div className="flex items-end gap-2 h-40">
        {heights.map((height, i) => (
          <Skeleton key={i} width="100%" height={height} borderRadius="6px" />
        ))}
      </div>
    </div>
  );
};

export default Skeleton;
