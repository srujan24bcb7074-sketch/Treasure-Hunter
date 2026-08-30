import Link from "next/link";

export default function Home() {
  return (
    <div className="hunt-shell">
      <section className="panel text-center">
        <div className="eyebrow">The Hunt Begins</div>
        <h1 className="title">WELCOME, CREW.</h1>
        <p className="body-copy">
          A treasure capable of granting a single wish has disappeared.
          Its trail was scattered behind riddles, deception and secrets.
        </p>
        <div className="mt-8">
          <Link className="button inline-block" href="/story">
            ENTER THE HUNT
          </Link>
        </div>
      </section>
    </div>
  );
}
