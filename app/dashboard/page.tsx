import { db } from "@/app/dbConfig/db";
import { getSession } from "@/app/lib/auth/session";
import { events } from "@/app/schema/schema";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Activity, Shield, MapPin, ChevronRight } from "lucide-react";
import UserDoseChart from "./components/UserDoseChart";


export default async function UserDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "user") {
    redirect("/login");
  }

  // Récupérer les statistiques et les sessions de l'utilisateur
  const userEvents = await db
    .select()
    .from(events)
    .where(eq(events.userId, session.userId))
    .orderBy(desc(events.createdAt));

  const totalSessions = userEvents.length;
  
  const maxDose = userEvents.length > 0 
    ? Math.max(...userEvents.map(e => e.totalDosePercentage)) 
    : 0;

  const avgTwa = userEvents.length > 0
    ? userEvents.reduce((acc, curr) => acc + curr.twaDb, 0) / userEvents.length
    : 0;

  const recentEvents = userEvents.slice(0, 5);

  // Préparer les données pour le graphique (inversées pour afficher chronologiquement de gauche à droite)
  const chartData = [...userEvents].reverse().map(e => ({
    title: e.title.length > 15 ? e.title.substring(0, 15) + "..." : e.title,
    dose: e.totalDosePercentage,
    twa: e.twaDb,
    date: new Date(e.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* En-tête de bienvenue */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, {session.name || "Engineer"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Here is a summary of your acoustic monitoring activity and exposure dosages.
          </p>
        </div>
      </div>

      {/* Cartes KPI (Indicateurs clés) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-xl">
          <div className="text-xs text-slate-400 font-medium">Total Sessions</div>
          <div className="text-2xl font-bold text-white font-mono">{totalSessions}</div>
          <div className="text-[11px] text-slate-500">Assigned monitoring events</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-xl">
          <div className="text-xs text-slate-400 font-medium">Peak Dose Recorded</div>
          <div className={`text-2xl font-bold font-mono ${maxDose >= 100 ? "text-rose-400" : "text-teal-400"}`}>
            {maxDose.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500">Highest daily acoustic dosage</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-xl">
          <div className="text-xs text-slate-400 font-medium">Average TWA Level</div>
          <div className="text-2xl font-bold text-white font-mono">
            {avgTwa.toFixed(1)} <span className="text-sm text-teal-400 font-normal">dB</span>
          </div>
          <div className="text-[11px] text-slate-500">Time-Weighted Average</div>
        </div>
      </div>

      {/* --- SECTION GRAPHIQUE (CHART) --- */}
      {chartData.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div>
            <h3 className="text-base font-bold text-white">Exposure Dose Trend Over Time</h3>
            <p className="text-xs text-slate-400 mt-0.5">Visual representation of your total noise dose percentage per monitoring session.</p>
          </div>
          <div className="h-72 w-full pt-2">
            <UserDoseChart data={chartData} />
          </div>
        </div>
      )}

      {/* Dernières sessions de l'utilisateur */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Recent Monitoring Sessions</h3>
          <Link
            href="/user/events"
            className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1"
          >
            View all sessions
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 text-xs text-slate-400 uppercase bg-slate-950/40">
                <tr>
                  <th className="py-3 px-4">Event Title</th>
                  <th className="py-3 px-4">Standard</th>
                  <th className="py-3 px-4">Total Dose</th>
                  <th className="py-3 px-4">TWA Level</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white">
                      <div>{evt.title}</div>
                      {evt.location && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-teal-500" />
                          {evt.location}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        <Shield className="w-3 h-3" />
                        {evt.standardCodeUsed}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        evt.totalDosePercentage >= 100 
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}>
                        <Activity className="w-3 h-3" />
                        {evt.totalDosePercentage.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-teal-400">
                      {evt.twaDb.toFixed(1)} dB
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/dashboard/events/${evt.id}`}
                        className="px-3 py-1.5 cursor-pointer rounded-xl text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition-colors inline-flex items-center gap-1"
                      >
                        Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}

                {recentEvents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      You have no recorded exposure sessions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}