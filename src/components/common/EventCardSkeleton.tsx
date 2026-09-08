/** Card-shaped skeleton used by route-level loading states. */
export default function EventCardSkeleton() {
  return (
    <div className="skeletonCard" aria-hidden="true">
      <div className="skeletonBand">
        <span className="skeletonLine w-30" />
        <span className="skeletonPill" />
      </div>
      <div className="skeletonBody">
        <span className="skeletonLine w-70 lg" />
        <span className="skeletonLine w-100" />
        <span className="skeletonLine w-85" />
        <span className="skeletonLine w-50" />
        <span className="skeletonLine w-60" />
        <span className="skeletonButton" />
      </div>
    </div>
  );
}

