import EventCardSkeleton from "@/components/common/EventCardSkeleton";

export default function Loading() {
  return (
    <div className="routeLoading" role="status" aria-live="polite">
      <span className="srOnly">Loading the Ganeshotsav schedule…</span>

      <div className="container">
        <div className="skeletonHeading">
          <span className="skeletonLine w-30" />
          <span className="skeletonLine w-50 lg" />
          <span className="skeletonLine w-70" />
        </div>

        <div className="cardGrid">
          {[0, 1, 2].map((index) => (
            <EventCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

