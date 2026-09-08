import { AlertTriangle } from "lucide-react";
import type { EventSourceMeta } from "@/domain/events/types";

interface DataNoticeProps {
  meta: EventSourceMeta;
}

/**
 * Non-blocking banner shown only when the live Google Sheet could not be read
 * and the committed snapshot is being served instead.
 */
export default function DataNotice({ meta }: DataNoticeProps) {
  if (!meta.warning) {
    return null;
  }

  return (
    <div className="container">
      <p className="dataNotice" role="status">
        <AlertTriangle aria-hidden="true" />
        {meta.warning}
      </p>
    </div>
  );
}

