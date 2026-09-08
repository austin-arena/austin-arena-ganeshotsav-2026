export interface RegistrationInput {
  residentName: string;
  flat: string;
  mobile: string;
  email: string;
  participantName: string;
  participantAge: string;
  eventId: string;
  eventName: string;
  comments: string;
  consent: boolean;
  /** Honeypot field — must stay empty for genuine submissions. */
  website?: string;
}

export interface RegistrationRecord extends Omit<RegistrationInput, "website"> {
  submittedAt: string;
}

export type ValidationErrors = Partial<Record<keyof RegistrationInput, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const MOBILE_PATTERN = /^[+\d][\d\s-]{7,17}$/;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateRegistration(payload: unknown): {
  errors: ValidationErrors;
  data: RegistrationRecord | null;
} {
  const source = (payload ?? {}) as Record<string, unknown>;
  const errors: ValidationErrors = {};

  const residentName = text(source.residentName);
  const flat = text(source.flat);
  const mobile = text(source.mobile);
  const email = text(source.email);
  const participantName = text(source.participantName);
  const participantAge = text(source.participantAge);
  const eventId = text(source.eventId);
  const eventName = text(source.eventName);
  const comments = text(source.comments);
  const consent = source.consent === true || source.consent === "true";
  const website = text(source.website);

  if (residentName.length < 2) {
    errors.residentName = "Please enter the resident's full name.";
  }
  if (flat.length < 1) {
    errors.flat = "Flat number is required.";
  }
  if (!MOBILE_PATTERN.test(mobile)) {
    errors.mobile = "Enter a valid mobile number.";
  }
  if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }
  if (participantName.length < 2) {
    errors.participantName = "Participant name is required.";
  }

  const age = Number(participantAge);
  if (!Number.isFinite(age) || age < 1 || age > 110) {
    errors.participantAge = "Enter an age between 1 and 110.";
  }

  if (!eventId) {
    errors.eventId = "Please choose an event.";
  }
  if (!consent) {
    errors.consent = "Consent is required to register.";
  }
  if (website) {
    // Bot filled the hidden field.
    errors.website = "Invalid submission.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, data: null };
  }

  return {
    errors,
    data: {
      residentName,
      flat,
      mobile,
      email,
      participantName,
      participantAge: String(age),
      eventId,
      eventName: eventName || eventId,
      comments,
      consent: true,
      submittedAt: new Date().toISOString(),
    },
  };
}

