import SectionHeading from "@/components/common/SectionHeading";
import RegistrationForm from "@/components/events/RegistrationForm";
import type { FestivalEvent } from "@/domain/events/types";

interface RegisterSectionProps {
  events: FestivalEvent[];
}

export default function RegisterSection({ events }: RegisterSectionProps) {
  return (
    <section id="register" className="section warm" aria-labelledby="register-heading">
      <div className="container formLayout">
        <SectionHeading
          id="register-heading"
          kicker="Join the celebration"
          title="Register for an Event"
          text="Share resident and participant details. Submissions are recorded by the cultural committee and you will be contacted with event instructions."
          align="left"
        />

        <RegistrationForm events={events} />
      </div>
    </section>
  );
}

