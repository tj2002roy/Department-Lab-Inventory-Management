"use client";

import { useState } from "react";
import { Download, Printer, Copy, Check, QrCode as QrIcon } from "lucide-react";

interface QRCodeCardProps {
  item: {
    id: string;
    qr_uuid: string;
    name: string;
    category: string;
    lab: { name: string };
    system?: { unique_id: string; name: string } | null;
  };
  qrDataUrl: string;
  targetUrl: string;
}

export function QRCodeCard({ item, qrDataUrl, targetUrl }: QRCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(item.qr_uuid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `QR-${item.name.replace(/\s+/g, "_")}-${item.qr_uuid.slice(0, 8)}.png`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
      {/* Decorative background grid */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <QrIcon className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200 tracking-wide">Static Asset Tag</h3>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/60">
          UUID ENCODED
        </span>
      </div>

      {/* QR Code Container */}
      <div className="flex flex-col items-center bg-white p-5 rounded-lg shadow-inner border border-slate-200">
        {/* Printable Asset Tag Header */}
        <div className="w-full text-center border-b border-slate-200 pb-2 mb-2">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">UEM Jaipur Laboratory Asset</p>
          <p className="text-xs font-black text-slate-900 truncate">{item.name}</p>
        </div>

        {/* The Static QR Code */}
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt={`Static QR for ${item.name}`}
            className="w-48 h-48 object-contain rounded"
          />
        ) : (
          <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded text-slate-400 text-xs">
            Generating QR...
          </div>
        )}

        {/* Printable Asset Tag Footer */}
        <div className="w-full mt-2 pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-600 font-mono">
          <span>{item.lab.name}</span>
          <span>{item.system ? item.system.unique_id : "STANDALONE"}</span>
        </div>
      </div>

      {/* UUID Display & Copy */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Static UUID (Immutable)</span>
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy UUID</span>
              </>
            )}
          </button>
        </div>
        <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 break-all select-all">
          {item.qr_uuid}
        </div>
      </div>

      {/* Target URL Preview */}
      <div className="mt-3 text-[11px] text-slate-500 truncate">
        Resolves to: <span className="text-slate-400 font-mono">{targetUrl}</span>
      </div>

      {/* Download & Print Actions */}
      <div className="mt-5 grid grid-cols-2 gap-2 no-print">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Save PNG</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-colors"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Tag</span>
        </button>
      </div>
    </div>
  );
}
