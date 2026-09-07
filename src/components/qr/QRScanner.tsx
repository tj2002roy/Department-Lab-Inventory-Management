"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CameraOff, Upload, Search, AlertCircle, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess?: (uuid: string) => void;
}

export function QRScanner({ onScanSuccess }: QRScannerProps) {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to extract UUID whether input is raw UUID or full URL
  const extractUuid = (text: string): string | null => {
    const trimmed = text.trim();
    // UUID regex: 8-4-4-4-12 hex digits
    const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
    const match = trimmed.match(uuidRegex);
    return match ? match[0] : null;
  };

  const handleResolvedUuid = (uuid: string) => {
    setIsProcessing(true);
    if (scannerRef.current && isScanning) {
      scannerRef.current.stop().catch(() => {});
      setIsScanning(false);
    }

    if (onScanSuccess) {
      onScanSuccess(uuid);
    } else {
      router.push(`/inventory/item/${uuid}`);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          const uuid = extractUuid(decodedText);
          if (uuid) {
            handleResolvedUuid(uuid);
          }
        },
        () => {
          // ignore frame errors during scanning
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.warn("Camera init error:", err);
      setCameraError(
        "Camera stream unavailable. Ensure camera permissions are granted, or use Image Upload / Manual Entry below."
      );
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error("Error stopping camera:", err);
      } finally {
        setIsScanning(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isScanning]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCameraError(null);
      const html5QrCode = new Html5Qrcode("reader");
      const result = await html5QrCode.scanFile(file, true);
      const uuid = extractUuid(result);
      if (uuid) {
        handleResolvedUuid(uuid);
      } else {
        setCameraError("Decoded QR code did not contain a valid Laboratory Asset UUID.");
      }
    } catch (err: any) {
      setCameraError("Could not detect a clear QR code in this image. Please try another angle.");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const uuid = extractUuid(manualInput);
    if (uuid) {
      handleResolvedUuid(uuid);
    } else {
      setCameraError("Invalid format. Please enter a valid 36-character UUID or scan URL.");
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Scanner Visual Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <div className={`h-2.5 w-2.5 rounded-full ${isScanning ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`} />
            <h2 className="text-sm font-semibold text-slate-200">Optical Asset Scanner</h2>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
            AUTO-RESOLVE ON SCAN
          </span>
        </div>

        {/* Viewport / Live Stream */}
        <div className="relative min-h-[300px] flex flex-col items-center justify-center p-4 bg-slate-950">
          {/* Target Box Animation */}
          <div id="reader" className="w-full max-w-sm overflow-hidden rounded-xl" />

          {!isScanning && (
            <div className="text-center p-6 space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-inner">
                <Camera className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Live Camera Stream</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Position instrument QR code inside the viewfinder to resolve specs and history instantly.
                </p>
              </div>
              <button
                onClick={startCamera}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
              >
                <Camera className="h-4 w-4" />
                <span>Activate Camera</span>
              </button>
            </div>
          )}

          {isScanning && (
            <button
              onClick={stopCamera}
              className="mt-4 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors"
            >
              <CameraOff className="h-3.5 w-3.5" />
              <span>Deactivate Camera</span>
            </button>
          )}
        </div>

        {/* Camera error message */}
        {cameraError && (
          <div className="p-3 bg-amber-500/10 border-t border-amber-500/30 text-amber-200 text-xs flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-400" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Image File Upload Fallback */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Have a barcode snapshot or image?</span>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Image</span>
          </button>
        </div>
      </div>

      {/* Manual UUID / Direct Link Input */}
      <form
        onSubmit={handleManualSubmit}
        className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-3"
      >
        <div className="flex items-center justify-between">
          <label htmlFor="uuid-input" className="text-xs font-semibold text-slate-300">
            Manual UUID Lookup / Barcode Gun Input
          </label>
          <span className="text-[10px] text-slate-500">Auto-parses standard UUIDs & URLs</span>
        </div>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              id="uuid-input"
              type="text"
              placeholder="e.g. 8f6b21c4-1234-4a21-9988-abcdef123456"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!manualInput.trim() || isProcessing}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors"
          >
            <span>Resolve</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>

      {/* Seeded Quick-Test Items */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-cyan-400 mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Quick-Demo Asset Resolvers (Seeded Instruments)</span>
        </div>
        <p className="text-[11px] text-slate-400 mb-3">
          Click any seeded instrument below to immediately simulate a QR code scan:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={async () => {
              const res = await fetch("/api/items");
              const data = await res.json();
              if (data.data?.length > 0) {
                // Pick Chair #L1-5 if present, or first
                const target = data.data.find((i: any) => i.name.includes("Chair #L1-5")) || data.data[0];
                router.push(`/inventory/item/${target.qr_uuid}`);
              }
            }}
            className="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-200">Chair #L1-5</span>
              <span className="text-[10px] text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded">Lab 1</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">Standalone • Audit Trail Demo</p>
          </button>

          <button
            type="button"
            onClick={async () => {
              const res = await fetch("/api/items");
              const data = await res.json();
              if (data.data?.length > 0) {
                const target = data.data.find((i: any) => i.name.includes("UltraSharp")) || data.data[1];
                router.push(`/inventory/item/${target.qr_uuid}`);
              }
            }}
            className="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-200">Dell UltraSharp 27"</span>
              <span className="text-[10px] text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded">Digital Lab</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">Bundled in SYS-DL-001</p>
          </button>
        </div>
      </div>
    </div>
  );
}
