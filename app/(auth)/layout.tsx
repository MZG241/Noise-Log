import React from "react";
import { Activity, ShieldCheck, BarChart3, Music } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-slate-950 flex text-slate-100">
      {/* Colonne Gauche: Branding & Marketing */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-slate-900/50 border-r border-slate-800/80 relative overflow-hidden">
        {/* Glow Effects Decorative */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header / Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            DecibelLog<span className="text-emerald-400">.</span>
          </span>
        </div>

        {/* Marketing Text Content */}
        <div className="space-y-6 relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Music className="w-3.5 h-3.5" /> Noise Exposure Platform
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Monitor, calculate, and comply with noise safety standards.
          </h1>

          <p className="text-slate-400 text-base leading-relaxed">
            Track workplace noise exposure doses, compute OSHA & NIOSH daily TWAs automatically, and safeguard operational health compliance.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Regulatory Compliance</h4>
                <p className="text-xs text-slate-400">Automated calculations for OSHA PEL & NIOSH REL limits.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Real-time Analytics</h4>
                <p className="text-xs text-slate-400">Instant dose accumulation feedback and historical logbooks.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 relative z-10">
          © {new Date().getFullYear()} DecibelLog Inc. All rights reserved.
        </div>
      </div>

      {/* Colonne Droite: Formulaires */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}