"use client";

import { QRScanner } from "@/components/qr/QRScanner";
import { QrCode, Sparkles, ShieldCheck } from "lucide-react";

export default function ScanPage() {
  return (
    <div className="max-w-2xl mx-auto py-6 space-y-8 animate-in fade-in duration-150">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-xs text-cyan-300 font-mono">
          <QrCode className="h-3.5 w-3.5" />
          <span>OPTICAL INSTRUMENT RESOLVER</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-100">
          Scan Laboratory Instrument QR Code
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Every instrument is bound to a static UUID. Scan using your device webcam, upload a photo,
          or enter the UUID directly to open its specification card and audit history.
        </p>
      </div>

      <QRScanner />
    </div>
  );
}
