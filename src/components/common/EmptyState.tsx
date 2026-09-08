import type { ReactNode } from "react";
import { CalendarX2 } from "lucide-react";

interface EmptyStateProps {
  title: string;
  text: string;
  /** Optional call to action, e.g. a link to the full schedule. */
  action?: ReactNode;
}

export default function EmptyState({ title, text, action }: EmptyStateProps) {
  return (
    <div className="emptyState" role="status">
      <span className="emptyIcon" aria-hidden="true">
        <CalendarX2 />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action ? <div className="emptyAction">{action}</div> : null}
    </div>
  );
}
