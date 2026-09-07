import React from "react";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md py-8 mt-auto text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Department & University Rights */}
        <div className="flex items-center space-x-3 text-center md:text-left">
          <div className="h-9 w-9 rounded-full bg-white border border-slate-700/80 p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
            <img
              src="/uem-logo.png"
              alt="UEM Logo"
              className="h-full w-full object-contain rounded-full"
            />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-slate-200">
              Rights reserved to Department of Computer Applications
            </p>
            <p className="text-xs text-cyan-400/90 font-medium">
              University of Engineering &amp; Management Jaipur
            </p>
          </div>
        </div>

        {/* Badge: A2228 with beating red heart */}
        <div className="flex items-center space-x-3">
          <a
            href="https://github.com/tj2002roy"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub: tj2002roy"
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-slate-900 to-slate-850 border border-slate-700/80 shadow-inner text-xs hover:border-cyan-500/50 hover:shadow-cyan-500/10 transition-all group"
          >
            <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 animate-pulse group-hover:scale-110 transition-transform" />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 font-mono tracking-wider group-hover:underline">
              A2228
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
