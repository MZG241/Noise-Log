import { db } from "@/app/dbConfig/db";
import { users, events } from "@/app/schema/schema";
import { desc, count, avg, sql, gt } from "drizzle-orm";
import { Users, AlertTriangle, Activity, ShieldCheck } from "lucide-react";
import AdminCharts from "./components/AdminCharts";
import { redirect } from "next/navigation";
import { getSession } from "../lib/auth/session";

export const revalidate = 0; // Ensures fresh dynamic data on every request

export default async function AdminDashboardPage() {
  // 1. Session & Role Verification
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  // 2. Optimized Parallel Database Aggregations
  const [
    [{ totalUsers }],
    [{ totalEvents, criticalExposures, avgGlobalTwa }],
    recentUsers,
    rawEvents,
  ] = await Promise.all([
    // Aggregate Total Users
    db.select({ totalUsers: count(users.id) }).from(users),

    // Aggregate Noise Session Statistics
    db
      .select({
        totalEvents: count(events.id),
        criticalExposures: count(
          sql`CASE WHEN ${events.totalDosePercentage} > 100 THEN 1 END`
        ),
        avgGlobalTwa: avg(events.twaDb),
      })
      .from(events),

    // Fetch 5 Most Recent Registered Users
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        preferredStandardCode: users.preferredStandardCode,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5),

    // Fetch Events for Dynamic Chart Generation
    db
      .select({
        id: events.id,
        twaDb: events.twaDb,
        totalDosePercentage: events.totalDosePercentage,
        createdAt: events.createdAt,
      })
      .from(events)
      .orderBy(events.createdAt),
  ]);

  // 3. Dynamic Calculation Metrics
  const totalEventCount = Number(totalEvents) || 0;
  const criticalCount = Number(criticalExposures) || 0;
  const parsedAvgTwa = avgGlobalTwa ? Number(avgGlobalTwa).toFixed(1) : "0.0";
  const complianceRate =
    totalEventCount > 0
      ? (((totalEventCount - criticalCount) / totalEventCount) * 100).toFixed(0)
      : "100";

  // 4. Format & Aggregate Daily Events for Dynamic Charting
  const formattedEvents = rawEvents.map((e) => ({
    id: e.id,
    twaDb: Number(e.twaDb),
    totalDosePercentage: Number(e.totalDosePercentage),
    createdAt: new Date(e.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          HSE & Acoustic Compliance Overview
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Analytical monitoring of sound engineer occupational noise risks and dosage thresholds.
        </p>
      </div>

      {/* KPI Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered Engineers */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Engineers / Operators
            </span>
            <Users className="w-5 h-5" />
          </div>
          <div className="text-3xl font-extrabold text-white">{totalUsers}</div>
          <div className="text-xs text-slate-400">Active system accounts</div>
        </div>

        {/* Critical Dose Exceedances */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-rose-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Exceedances (&gt;100% Dose)
            </span>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400">{criticalCount}</div>
          <div className="text-xs text-rose-400/80">Hazardous exposure sessions</div>
        </div>

        {/* Global Site Average TWA */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Average Global TWA
            </span>
            <Activity className="w-5 h-5" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {parsedAvgTwa} <span className="text-base font-normal text-slate-400">dBA</span>
          </div>
          <div className="text-xs text-slate-400">8-hour equivalent continuous level</div>
        </div>

        {/* Safety Compliance Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-teal-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Compliance Rate
            </span>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">{complianceRate}%</div>
          <div className="text-xs text-slate-400">Sessions within safe dosage limits</div>
        </div>
      </div>

      {/* Interactive Charts Component */}
      <AdminCharts events={formattedEvents} />

      {/* Recent Engineers Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-base font-semibold text-white">Recently Registered Engineers</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 text-xs text-slate-400 uppercase bg-slate-950/40">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Preferred Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-white">{u.name}</td>
                  <td className="py-3.5 px-4 text-slate-400">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        u.role === "admin"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-teal-400 font-semibold">
                    {u.preferredStandardCode}
                  </td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No registered user accounts found.
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