import EventCardSkeleton from "@/components/common/EventCardSkeleton";

export default function EventsLoading() {
  return (
    <div className="routeLoading" role="status" aria-live="polite">
      <span className="srOnly">Loading all Ganeshotsav events…</span>

      <div className="container">
        <div className="skeletonHeading">
          <span className="skeletonLine w-30" />
          <span className="skeletonLine w-50 lg" />
        </div>

        <div className="skeletonFilters">
          {[0, 1, 2, 3].map((index) => (
            <span key={index} className="skeletonPill" />
          ))}
        </div>

        <div className="cardGrid">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <EventCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

