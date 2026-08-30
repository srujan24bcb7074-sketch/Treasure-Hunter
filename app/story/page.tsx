import Link from "next/link";

const lines = [
  "A treasure capable of granting a single wish has disappeared.",
  "Its trail was deliberately scattered, hidden behind riddles, deception, and secrets.",
  "No map was left behind. No one knows where it lies.",
  "Only fragments of the path remain.",
  "Your crew has been chosen to follow them.",
  "Not everything you see is what it seems.",
  "Not everything that knows the truth will tell you.",
  "And sometimes, the answer has been right in front of you all along.",
  "Five trials. One treasure.",
];

export default function Story() {
  return (
    <div className="hunt-shell">
      <section className="panel">
        <div className="eyebrow">The Legend</div>
        <h1 className="title">BEGIN THE HUNT.</h1>
        <div className="body-copy space-y-3">
          {lines.map((line) => <p className="story-line" key={line}>{line}</p>)}
        </div>
        <div className="mt-10">
          <Link className="button inline-block" href="/register">
            ASSEMBLE YOUR CREW
          </Link>
        </div>
      </section>
    </div>
  );
}
