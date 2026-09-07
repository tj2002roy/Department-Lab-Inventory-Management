"use client";

import { History, ArrowRightLeft, Edit3, MessageSquare, Shield, Clock } from "lucide-react";
import { FormattedAuditEntry } from "@/services/audit.service";

interface ItemTimelineProps {
  timeline: FormattedAuditEntry[];
  itemName: string;
}

export function ItemTimeline({ timeline, itemName }: ItemTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center">
        <History className="h-8 w-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm text-slate-300 font-medium">No audit entries recorded yet.</p>
        <p className="text-xs text-slate-500 mt-1">
          All relocations, spec updates, and user comments are logged immutably.
        </p>
      </div>
    );
  }

  const getActionBadge = (type: string) => {
    switch (type) {
      case "MOVE":
        return {
          icon: <ArrowRightLeft className="h-3.5 w-3.5 text-cyan-400" />,
          label: "RELOCATION",
          bg: "bg-cyan-950/80 text-cyan-300 border-cyan-800/60",
          dot: "bg-cyan-400 ring-cyan-400/30",
        };
      case "COMMENT":
        return {
          icon: <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />,
          label: "AUDIT NOTE",
          bg: "bg-emerald-950/80 text-emerald-300 border-emerald-800/60",
          dot: "bg-emerald-400 ring-emerald-400/30",
        };
      case "UPDATE":
      default:
        return {
          icon: <Edit3 className="h-3.5 w-3.5 text-amber-400" />,
          label: "MODIFICATION",
          bg: "bg-amber-950/80 text-amber-300 border-amber-800/60",
          dot: "bg-amber-400 ring-amber-400/30",
        };
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Immutable Audit Trail</h3>
            <p className="text-xs text-slate-400">Append-only compliance log for {itemName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
          <Shield className="h-3 w-3 text-cyan-400" />
          <span>Verified Log Integrity</span>
        </div>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {timeline.map((entry) => {
          const badge = getActionBadge(entry.actionType);

          return (
            <div key={entry.id} className="relative group">
              {/* Timeline marker */}
              <div
                className={`absolute -left-6 mt-1 h-4 w-4 rounded-full border-2 border-slate-900 ${badge.dot} ring-4 transition-transform group-hover:scale-125`}
              />

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4 transition-colors hover:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${badge.bg}`}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>

                    <span className="text-xs font-semibold text-slate-200">{entry.user.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      ({entry.user.role})
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>{entry.timestamp}</span>
                  </div>
                </div>

                {/* Primary Human-Readable Audit Message Required by Specification */}
                <p className="text-sm text-slate-200 font-medium leading-relaxed">
                  {entry.primaryText}
                </p>

                {/* Additional Comment or Specification Delta */}
                {entry.commentText && (
                  <div className="mt-2.5 p-2.5 rounded bg-slate-900/90 border-l-2 border-cyan-500 text-xs text-slate-300 font-mono">
                    <span className="text-slate-500 select-none block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                      Log Note
                    </span>
                    {entry.commentText}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
