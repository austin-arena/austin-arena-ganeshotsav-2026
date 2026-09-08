"use client";

import { useSyncExternalStore } from "react";

interface CountdownProps {
  /** First day of the festival, `YYYY-MM-DD`, taken from the event data. */
  startDateISO?: string;
  /** Last day of the festival, used to detect that the festival has ended. */
  endDateISO?: string;
}

const UNITS = ["Days", "Hours", "Minutes", "Seconds"] as const;

/** Ticks once per second. Snapshots are second-resolution so they stay stable. */
function subscribeToClock(onChange: () => void) {
  const intervalId = setInterval(onChange, 1000);
  return () => clearInterval(intervalId);
}

const getClockSnapshot = () => Math.floor(Date.now() / 1000);
const getServerClockSnapshot = () => null;

function breakdown(milliseconds: number) {
  return {
    Days: Math.floor(milliseconds / 86_400_000),
    Hours: Math.floor(milliseconds / 3_600_000) % 24,
    Minutes: Math.floor(milliseconds / 60_000) % 60,
    Seconds: Math.floor(milliseconds / 1_000) % 60,
  };
}

/** Parses an ISO date as midnight in the festival timezone (IST). */
function toTimestamp(dateISO?: string, endOfDay = false): number | null {
  if (!dateISO) {
    return null;
  }

  const time = endOfDay ? "23:59:59" : "00:00:00";
  const parsed = new Date(`${dateISO}T${time}+05:30`).getTime();

  return Number.isNaN(parsed) ? null : parsed;
}

export default function Countdown({ startDateISO, endDateISO }: CountdownProps) {
  // `null` on the server and during hydration, so markup matches exactly.
  const seconds = useSyncExternalStore(
    subscribeToClock,
    getClockSnapshot,
    getServerClockSnapshot,
  );

  const start = toTimestamp(startDateISO);
  const end = toTimestamp(endDateISO ?? startDateISO, true);

  if (start === null) {
    return null;
  }

  // Reserve the space during hydration to avoid layout shift.
  if (seconds === null) {
    return (
      <div className="countdown" role="status">
        <span>Ganeshotsav countdown</span>
        <span className="countdownLoading" aria-hidden="true">
          {UNITS.map((label) => (
            <b key={label}>
              --
              <small>{label}</small>
            </b>
          ))}
        </span>
      </div>
    );
  }

  const now = seconds * 1000;

  if (end !== null && now > end) {
    return (
      <div className="countdown" role="status">
        <strong>Ganeshotsav 2026 has concluded — thank you for celebrating with us.</strong>
      </div>
    );
  }

  if (now >= start) {
    return (
      <div className="countdown" role="status">
        <strong>Ganeshotsav celebrations are underway. Ganpati Bappa Morya!</strong>
      </div>
    );
  }

  const values = breakdown(start - now);

  return (
    <div className="countdown" role="timer" aria-live="off">
      <span>Ganeshotsav begins in</span>
      {UNITS.map((label) => (
        <b key={label}>
          {String(values[label]).padStart(2, "0")}
          <small>{label}</small>
        </b>
      ))}
    </div>
  );
}
