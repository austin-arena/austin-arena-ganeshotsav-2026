import Image from "next/image";

interface SectionHeadingProps {
  kicker: string;
  title: string;
  text?: string;
  light?: boolean;
  align?: "left" | "center";
  /** Rendered as the accessible name of the surrounding section. */
  id?: string;
  /** Heading level, so pages keep a single h1 and a valid outline. */
  as?: "h1" | "h2";
}

export default function SectionHeading({
  kicker,
  title,
  text,
  light = false,
  align = "left",
  id,
  as: Heading = "h2",
}: SectionHeadingProps) {
  return (
    <header className={`sectionHead${light ? " light" : ""}${align === "center" ? " center" : ""}`}>
      <span className="kicker">{kicker}</span>
      <Heading id={id}>{title}</Heading>
      <Image
        className="ornament"
        src="/divider-ornament.svg"
        width={160}
        height={24}
        alt=""
        aria-hidden="true"
      />
      {text ? <p>{text}</p> : null}
    </header>
  );
}
