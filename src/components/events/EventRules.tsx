"use client";

import { useState } from "react";

interface EventRulesProps {
  text: string;
}

/** Rules longer than this are collapsed behind a "Show more" toggle. */
const PREVIEW_LIMIT = 150;

/**
 * Renders event rules with a "Show more / Show less" toggle when the content is
 * long, so cards stay compact but full guidelines remain one tap away.
 */
export default function EventRules({ text }: EventRulesProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > PREVIEW_LIMIT;

  const shown =
    expanded || !isLong ? text : `${text.slice(0, PREVIEW_LIMIT).replace(/\s+\S*$/, "")}…`;

  return (
    <div className="eventRules">
      <p>
        <strong>Please note:</strong> {shown}
      </p>
      {isLong ? (
        <button
          type="button"
          className="rulesToggle"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}

