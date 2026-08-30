"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QRTest() {
  const router = useRouter();
  const [status, setStatus] = useState("");

  async function test() {
    const token = prompt("Paste the QR2_TOKEN from .env for this local test:");
    if (!token) return;
    setStatus("Checking...");
    const res = await fetch("/api/qr/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) return setStatus(data.error ?? "Rejected");
    router.push(`/clue/${data.nextStage.replace("CLUE_", "")}`);
  }

  return <div className="hunt-shell"><section className="panel"><div className="eyebrow">Development Only</div><h1 className="text-4xl font-black mt-2">QR2 TEST</h1><p className="body-copy mt-4">Temporary test page. Real QR images will be generated after the public URL is known.</p><button className="button mt-8" onClick={test}>TEST QR2</button>{status && <p className="mt-4 text-zinc-300">{status}</p>}</section></div>;
}
