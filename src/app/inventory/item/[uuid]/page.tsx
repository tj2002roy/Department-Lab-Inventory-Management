"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeCard } from "@/components/qr/QRCodeCard";
import { ItemDetailCard } from "@/components/inventory/ItemDetailCard";
import { ItemTimeline } from "@/components/inventory/ItemTimeline";
import { ArrowLeft, Loader2, AlertCircle, RefreshCw, QrCode } from "lucide-react";

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItemData = useCallback(async () => {
    if (!uuid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/items/${uuid}`);
      const json = await res.json();

      if (!json.success || !json.data) {
        throw new Error(json.error || "Instrument not found");
      }

      setItem(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => {
    fetchItemData();
  }, [fetchItemData]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        <p className="text-sm font-mono text-slate-400">Resolving static QR asset ({uuid})...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-2xl">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-100">Asset Resolution Failed</h2>
        <p className="text-xs text-slate-400 font-mono break-all">{uuid}</p>
        <p className="text-xs text-slate-300">
          {error || "No instrument matches this static QR UUID in the laboratory database."}
        </p>
        <div className="pt-2 flex justify-center space-x-3">
          <Link
            href="/"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/scan"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold rounded-lg text-white transition-colors"
          >
            Scan Another
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Navigation breadcrumbs */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors flex items-center space-x-1 text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <div className="text-xs text-slate-400 font-mono">
            <span>Labs</span> / <span className="text-slate-300">{item.lab.name}</span> /{" "}
            <span className="text-cyan-400">{item.name}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchItemData}
            title="Refresh item & timeline"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            href="/scan"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-medium hover:bg-cyan-500/20 transition-colors"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Scan QR</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: QR Tag Card on Left, Item Detail Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: QR Asset Card */}
        <div className="lg:col-span-1">
          <QRCodeCard
            item={item}
            qrDataUrl={item.qrCode.dataUrl}
            targetUrl={item.qrCode.url}
          />
        </div>

        {/* Right Column: Specifications, Condition, and Peer items */}
        <div className="lg:col-span-2">
          <ItemDetailCard item={item} onRefresh={fetchItemData} />
        </div>
      </div>

      {/* Bottom Section: Immutable Audit Trail Timeline */}
      <div className="pt-4">
        <ItemTimeline timeline={item.timeline} itemName={item.name} />
      </div>
    </div>
  );
}
