"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ScanContent() {
  const router = useRouter();
  const params = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Point the camera at the QR code.");
  const [busy, setBusy] = useState(false);

  async function processToken(token: string) {
    if (busy) return;
    setBusy(true);
    setStatus("Verifying your crew's progress...");
    const res = await fetch("/api/qr/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error ?? "QR code rejected.");
      setBusy(false);
      return;
    }
    router.push(`/clue/${data.nextStage.replace("CLUE_", "")}`);
  }

  useEffect(() => {
    const queryToken = params.get("t");
    if (queryToken) processToken(queryToken);
  }, [params]);

  useEffect(() => {
    let controls: { stop: () => void } | undefined;
    let cancelled = false;
    async function startScanner() {
      if (params.get("t")) return;
      try {
        const { BrowserQRCodeReader } = await import("@zxing/browser");
        const reader = new BrowserQRCodeReader();
        const devices = await BrowserQRCodeReader.listVideoInputDevices();
        if (!devices.length) throw new Error("No camera found.");
        const deviceId = devices[devices.length - 1].deviceId;
        controls = await reader.decodeFromVideoDevice(deviceId, videoRef.current!, (result) => {
          if (!cancelled && result) processToken(result.getText());
        });
      } catch (error) {
        console.error(error);
        setStatus("Camera access is unavailable. Allow camera access and refresh this page.");
      }
    }
    startScanner();
    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [params]);

  return (
    <div className="hunt-shell">
      <section className="panel text-center">
        <div className="eyebrow">QR Gateway</div>
        <h1 className="text-4xl font-black mt-2 mb-4">SCAN THE NEXT CLUE</h1>
        <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-black">
          <video ref={videoRef} className="w-full aspect-video object-cover" muted playsInline />
        </div>
        <p className="mt-5 text-zinc-300">{status}</p>
      </section>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="hunt-shell">
          <section className="panel text-center">
            <div className="eyebrow">QR Gateway</div>
            <h1 className="text-4xl font-black mt-2 mb-4">SCAN THE NEXT CLUE</h1>
            <p className="mt-5 text-zinc-300">Loading scanner...</p>
          </section>
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}
