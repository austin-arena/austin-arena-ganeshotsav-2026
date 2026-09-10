import { Camera, HeartHandshake, Palette, Users, Utensils } from "lucide-react";
import SectionHeading from "@/components/common/SectionHeading";
import RegisterLink from "@/components/events/RegisterLink";
import { CONTRIBUTION_OPTIONS } from "@/config/site";

const ICONS = {
  volunteer: HeartHandshake,
  decoration: Palette,
  photography: Camera,
  prasad: Utensils,
  support: Users,
} as const;

export default function ContributeSection() {
  return (
    <section id="contribute" className="section contribution" aria-labelledby="contribute-heading">
      <div className="container">
        <SectionHeading
          id="contribute-heading"
          kicker="Support the celebration"
          title="Contribute to Ganeshotsav"
          text="Residents can contribute time, skills, materials or approved sponsorship support."
          light
          align="center"
        />

        <ul className="contributeGrid" role="list">
          {CONTRIBUTION_OPTIONS.map((option) => {
            const Icon = ICONS[option.icon];

            return (
              <li key={option.title}>
                <span className="contributeIcon" aria-hidden="true">
                  <Icon />
                </span>
                <h3>{option.title}</h3>
                <p>{option.description}</p>
              </li>
            );
          })}
        </ul>

        {/*<div className="centerAction">*/}
        {/*  <RegisterLink*/}
        {/*    eventId="volunteer"*/}
        {/*    eventName="Volunteer Contribution"*/}
        {/*    className="button gold"*/}
        {/*  >*/}
        {/*    Register as Volunteer*/}
        {/*  </RegisterLink>*/}
        {/*</div>*/}
      </div>
    </section>
  );
}

