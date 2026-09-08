import { Clock3 } from "lucide-react";
import SectionHeading from "@/components/common/SectionHeading";
import { AARTI_SCHEDULE, SOCIETY } from "@/config/site";

export default function AartiSection() {
  return (
    <section id="aarti" className="section warm" aria-labelledby="aarti-heading">
      <div className="container split">
        <SectionHeading
          id="aarti-heading"
          kicker="Daily devotion"
          title="Daily Aarti Schedule"
          text={`Join ${SOCIETY.name} residents at the Ganesh Mandap every morning and evening.`}
          align="left"
        />

        <ul className="aartiGrid" role="list">
          {AARTI_SCHEDULE.map((slot) => (
            <li className="aartiCard" key={slot.title}>
              <Clock3 aria-hidden="true" />
              <b>{slot.title}</b>
              <strong>{slot.time}</strong>
              <span>{slot.venue}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

