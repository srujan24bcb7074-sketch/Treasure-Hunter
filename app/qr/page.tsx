"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QRTestPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");

  async function scan() {
    setStatus("Checking QR...");

    const response = await fetch("/api/qr/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: "test-qr2",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "QR rejected.");
      return;
    }

    setStatus("QR accepted!");

    router.push("/clue/2");
  }

  return (
    <main className="hunt-shell">
      <section className="panel">
        <div className="eyebrow">Development Test</div>

        <h1 className="title">
          QR 2 SIMULATOR
        </h1>

        <p className="body-copy">
          This is only a temporary testing page.
        </p>

        <button
          className="button mt-8"
          onClick={scan}
        >
          SIMULATE SCANNING QR 2
        </button>

        {status && (
          <p className="mt-5 text-zinc-300">
            {status}
          </p>
        )}
      </section>
    </main>
  );
}