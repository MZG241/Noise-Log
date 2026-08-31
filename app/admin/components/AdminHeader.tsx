"use client";

import { Shield } from "lucide-react";

export default function AdminHeader({ userName }: { userName: string }) {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        ADMINISTRATION 
      </div>

      <div className="flex items-center gap-4">
       

        <div className="h-5 w-[1px] bg-slate-800" />

        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-white leading-tight">{userName}</div>
            <div className="text-[10px] text-emerald-400 font-mono">Administor</div>
          </div>
        </div>
      </div>
    </header>
  );
}