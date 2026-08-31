import { db } from "@/app/dbConfig/db";
import { getSession } from "@/app/lib/auth/session";
import { events, users } from "@/app/schema/schema";
import { redirect } from "next/navigation";
import { eq, desc, sql } from "drizzle-orm";
import { FileText } from "lucide-react";
import AdminReportsContent from "../components/AdminReportsContent";


export default async function AdminReportsPage() {
  const session = await getSession();
  
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  // 1. Récupération de tous les événements avec les informations utilisateur associées
  const allEvents = await db
    .select({
      id: events.id,
      title: events.title,
      location: events.location,
      standardCodeUsed: events.standardCodeUsed,
      totalDosePercentage: events.totalDosePercentage,
      twaDb: events.twaDb,
      createdAt: events.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(events)
    .leftJoin(users, eq(events.userId, users.id))
    .orderBy(desc(events.createdAt));

  // 2. Calcul des statistiques globales pour les cartes de résumé
  const totalEventsCount = allEvents.length;
  
  const totalUsersResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);
  const totalUsersCount = totalUsersResult[0]?.count || 0;

  const criticalEventsCount = allEvents.filter(
    (e) => e.totalDosePercentage >= 100
  ).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      
      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-400" />
            System Compliance Reports & Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global audit logs, acoustic exposure analytics, and platform metrics.
          </p>
        </div>
      </div>

      {/* Cartes de statistiques globales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="text-xs font-medium text-slate-400">Total Users</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">{totalUsersCount}</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="text-xs font-medium text-slate-400">Total Recorded Sessions</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">{totalEventsCount}</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="text-xs font-medium text-slate-400">Critical Exposures (&ge; 100%)</div>
          <div className="text-2xl font-bold text-rose-400 mt-1 font-mono">{criticalEventsCount}</div>
        </div>
      </div>

      {/* Section interactive (Graphiques + Bouton d'export PDF textuel) */}
      <AdminReportsContent reportsData={allEvents} totalUsersCount={totalUsersCount} />

      {/* Tableau détaillé de tous les événements système */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            All System Events & Exposures Log
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {allEvents.length} entries found
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 text-xs text-slate-400 uppercase bg-slate-950/40">
              <tr>
                <th className="py-3 px-4">Event / Location</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Standard</th>
                <th className="py-3 px-4">Total Dose</th>
                <th className="py-3 px-4">TWA</th>
                <th className="py-3 px-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {allEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{evt.title}</div>
                    <div className="text-xs text-slate-500">{evt.location || "No location specified"}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-white text-xs font-medium">{evt.userName || "Unknown"}</div>
                    <div className="text-[10px] text-slate-500">{evt.userEmail}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      {evt.standardCodeUsed}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`font-mono font-bold ${evt.totalDosePercentage >= 100 ? "text-rose-400" : "text-white"}`}>
                      {evt.totalDosePercentage < 0.01 ? "< 0.01" : evt.totalDosePercentage.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-cyan-400">
                    {evt.twaDb.toFixed(1)} dBA
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-400">
                    {new Date(evt.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}

              {allEvents.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No reports or events recorded in the system yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}