"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import type { FestivalEvent } from "@/domain/events/types";
import type { ValidationErrors } from "@/domain/registration/schema";
import { submitRegistrationForm } from "@/domain/registration/client";
import {
  consumePendingRegistration,
  onRegistrationRequested,
} from "@/components/events/registration-channel";

interface RegistrationFormProps {
  events: FestivalEvent[];
}

type Status = "idle" | "submitting" | "success" | "error";

const VOLUNTEER_OPTION = "volunteer";

export default function RegistrationForm({ events }: RegistrationFormProps) {
  const [selected, setSelected] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Event cards elsewhere on the page (or on /events) preselect the event here.
  useEffect(() => {
    const unsubscribe = onRegistrationRequested((eventId) => {
      setSelected(eventId);
      setStatus("idle");
    });

    // Read a cross-route selection after paint, so the initial render is not
    // immediately invalidated by a cascading state update.
    const timer = window.setTimeout(() => {
      const pending = consumePendingRegistration();
      if (pending) {
        setSelected(pending);
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const resolveEventName = (id: string) => {
    if (id === VOLUNTEER_OPTION) {
      return "Volunteer Contribution";
    }

    return events.find((item) => item.id === id)?.name ?? id;
  };

  const handleSubmit = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    const form = submitEvent.currentTarget;
    const formData = new FormData(form);

    setStatus("submitting");
    setErrors({});
    setMessage("");

    const payload = {
      residentName: formData.get("residentName"),
      flat: formData.get("flat"),
      mobile: formData.get("mobile"),
      email: formData.get("email"),
      participantName: formData.get("participantName"),
      participantAge: formData.get("participantAge"),
      eventId: selected,
      eventName: resolveEventName(selected),
      comments: formData.get("comments"),
      consent: formData.get("consent") === "on",
      website: formData.get("website"),
    };

    try {
      const result = await submitRegistrationForm(payload);

      if (!result.ok) {
        setErrors(result.errors ?? {});
        setMessage(result.message);
        setStatus("error");
        return;
      }

      form.reset();
      setSelected("");
      setMessage(result.message);
      setStatus("success");
    } catch {
      setMessage("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="success" role="status">
        <b aria-hidden="true">✓</b>
        <h3>Registration submitted</h3>
        <p>{message} The Austin Arena cultural committee will contact you with event details.</p>
        <button className="button" onClick={() => setStatus("idle")} type="button">
          Register Another
        </button>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
      {status === "error" ? (
        <p className="formAlert" role="alert">
          {message}
        </p>
      ) : null}

      <label htmlFor="residentName">
        Resident name
        <input
          id="residentName"
          name="residentName"
          required
          placeholder="Full name"
          autoComplete="name"
          aria-invalid={Boolean(errors.residentName)}
          aria-describedby={errors.residentName ? "residentName-error" : undefined}
        />
        {errors.residentName ? (
          <small className="fieldError" id="residentName-error">
            {errors.residentName}
          </small>
        ) : null}
      </label>

      <div className="formRow">
        <label htmlFor="flat">
          Flat number
          <input
            id="flat"
            name="flat"
            required
            placeholder="A-101"
            autoComplete="address-line1"
            aria-invalid={Boolean(errors.flat)}
            aria-describedby={errors.flat ? "flat-error" : undefined}
          />
          {errors.flat ? (
            <small className="fieldError" id="flat-error">
              {errors.flat}
            </small>
          ) : null}
        </label>

        <label htmlFor="mobile">
          Mobile number
          <input
            id="mobile"
            name="mobile"
            required
            type="tel"
            inputMode="tel"
            placeholder="+91 99999 99999"
            autoComplete="tel"
            aria-invalid={Boolean(errors.mobile)}
            aria-describedby={errors.mobile ? "mobile-error" : undefined}
          />
          {errors.mobile ? (
            <small className="fieldError" id="mobile-error">
              {errors.mobile}
            </small>
          ) : null}
        </label>
      </div>

      <label htmlFor="email">
        Email address
        <input
          id="email"
          name="email"
          required
          type="email"
          inputMode="email"
          placeholder="name@example.com"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email ? (
          <small className="fieldError" id="email-error">
            {errors.email}
          </small>
        ) : null}
      </label>

      <div className="formRow">
        <label htmlFor="participantName">
          Participant name
          <input
            id="participantName"
            name="participantName"
            required
            autoComplete="name"
            aria-invalid={Boolean(errors.participantName)}
            aria-describedby={errors.participantName ? "participantName-error" : undefined}
          />
          {errors.participantName ? (
            <small className="fieldError" id="participantName-error">
              {errors.participantName}
            </small>
          ) : null}
        </label>

        <label htmlFor="participantAge">
          Participant age
          <input
            id="participantAge"
            name="participantAge"
            required
            type="number"
            min="1"
            max="110"
            inputMode="numeric"
            aria-invalid={Boolean(errors.participantAge)}
            aria-describedby={errors.participantAge ? "participantAge-error" : undefined}
          />
          {errors.participantAge ? (
            <small className="fieldError" id="participantAge-error">
              {errors.participantAge}
            </small>
          ) : null}
        </label>
      </div>

      <label htmlFor="eventId">
        Select event
        <select
          id="eventId"
          name="eventId"
          required
          value={selected}
          onChange={(changeEvent) => setSelected(changeEvent.target.value)}
          aria-invalid={Boolean(errors.eventId)}
          aria-describedby={errors.eventId ? "eventId-error" : undefined}
        >
          <option value="">Choose an event</option>
          {events.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} — {item.shortDateLabel}
            </option>
          ))}
          <option value={VOLUNTEER_OPTION}>Volunteer Contribution</option>
        </select>
        {errors.eventId ? (
          <small className="fieldError" id="eventId-error">
            {errors.eventId}
          </small>
        ) : null}
      </label>

      <label htmlFor="comments">
        Comments
        <textarea id="comments" name="comments" rows={3} placeholder="Optional notes" />
      </label>

      {/* Honeypot: hidden from users, attractive to bots. */}
      <input
        className="honeypot"
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <label className="check" htmlFor="consent">
        <input id="consent" type="checkbox" name="consent" required /> I agree to the event
        guidelines and consent to be contacted by the committee.
      </label>
      {errors.consent ? <small className="fieldError">{errors.consent}</small> : null}

      <button className="button gold" type="submit" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="spin" aria-hidden="true" /> Submitting…
          </>
        ) : (
          "Confirm Registration"
        )}
      </button>
    </form>
  );
}
