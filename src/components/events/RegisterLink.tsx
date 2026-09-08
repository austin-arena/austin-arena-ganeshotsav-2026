"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { requestRegistration } from "./registration-channel";

interface RegisterLinkProps {
  eventId: string;
  eventName: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Client island used inside otherwise-static event cards.
 *
 * Renders as a real link so it works without JavaScript and on touch devices,
 * while progressively enhancing to pre-select the event in the form.
 */
export default function RegisterLink({
  eventId,
  eventName,
  className = "button ghostBtn",
  children,
}: RegisterLinkProps) {
  const router = useRouter();

  return (
    <Link
      className={className}
      href="/#register"
      aria-label={`Register for ${eventName} using the society form`}
      onClick={(clickEvent) => {
        clickEvent.preventDefault();

        if (!requestRegistration(eventId)) {
          router.push("/#register");
        }
      }}
    >
      {children}
    </Link>
  );
}
