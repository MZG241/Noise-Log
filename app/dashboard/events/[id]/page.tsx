import { db } from "@/app/dbConfig/db";
import { getSession } from "@/app/lib/auth/session";
import {
  events,
  exposureLogs,
  safetyStandards,
  users,
} from "@/app/schema/schema";
import { eq, desc, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Volume2,
  Gauge,
  Waves,
} from "lucide-react";
import Link from "next/link";
import AudioRecorder from "@/app/admin/components/AudioRecorder";


interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  // =========================================
  // 1. EVENT
  // =========================================

  const eventList = await db
    .select({
      id: events.id,
      title: events.title,
      location: events.location,
      standardCodeUsed: events.standardCodeUsed,
      totalDosePercentage: events.totalDosePercentage,
      twaDb: events.twaDb,
      createdAt: events.createdAt,
      userId: events.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(events)
    .leftJoin(users, eq(events.userId, users.id))
    .where(and(eq(events.id, id), eq(events.userId, session.userId)))
    .limit(1);

  const event = eventList[0];

  if (!event) {
    notFound();
  }

  // =========================================
  // 2. SAFETY STANDARD
  // =========================================

  const standardList = await db
    .select()
    .from(safetyStandards)
    .where(
      eq(
        safetyStandards.code,
        event.standardCodeUsed
      )
    )
    .limit(1);

  const standard = standardList[0];

  // =========================================
  // 3. EXPOSURE LOGS
  // =========================================

  const logsList = await db
    .select({
      id: exposureLogs.id,
      eventId: exposureLogs.eventId,
      decibelLevel: exposureLogs.decibelLevel,
      leqDb: exposureLogs.leqDb,
      peakDb: exposureLogs.peakDb,
      durationMinutes:
        exposureLogs.durationMinutes,
      recordedAt: exposureLogs.recordedAt,
    })
    .from(exposureLogs)
    .where(eq(exposureLogs.eventId, id))
    .orderBy(desc(exposureLogs.recordedAt));

  // =========================================
  // 4. GLOBAL VALUES
  // =========================================

  const latestLog = logsList[0];

  const maxPeak =
    logsList.length > 0
      ? Math.max(
          ...logsList.map(
            (log) => Number(log.peakDb ?? log.decibelLevel)
          )
        )
      : 0;

  const totalDuration = logsList.reduce(
    (sum, log) =>
      sum + Number(log.durationMinutes || 0),
    0
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">

      {/* =========================================
          BACK
      ========================================= */}

      <div>
        <Link
          href="/dashboard/events"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>
      </div>

      {/* =========================================
          EVENT HEADER
      ========================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">

          <div className="flex items-center justify-between">

            <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
              {event.standardCodeUsed}

              {standard
                ? ` (${standard.name})`
                : ""}
            </span>

            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />

              {new Date(
                event.createdAt
              ).toLocaleDateString()}
            </span>
          </div>

          <div>

            <h1 className="text-2xl font-bold text-white tracking-tight">
              {event.title}
            </h1>

            {event.location && (
              <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-teal-500" />
                {event.location}
              </p>
            )}

          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center gap-4 text-xs text-slate-300">

            <div className="w-8 h-8 rounded-full bg-teal-950 border border-teal-800 flex items-center justify-center text-xs text-teal-400 font-bold uppercase">
              {(event.userName || "U").substring(0, 2)}
            </div>

            <div>
              <div className="font-semibold text-white">
                {event.userName ||
                  "Unknown Engineer"}
              </div>

              <div className="text-slate-500">
                {event.userEmail}
              </div>
            </div>

          </div>
        </div>

        {/* =========================================
            SUMMARY
        ========================================= */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">

          <div className="space-y-5">

            {/* DOSE */}

            <div>
              <div className="flex items-center justify-between">

                <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  Total Dose
                </span>

                <Activity className="w-5 h-5 text-teal-400" />

              </div>

              <div className="flex items-baseline gap-2 mt-2">

                <span
                  className={`text-4xl font-extrabold ${
                    event.totalDosePercentage >= 100
                      ? "text-rose-400"
                      : "text-white"
                  }`}
                >
                 {event.totalDosePercentage < 0.01
  ? "< 0.01"
  : event.totalDosePercentage.toFixed(2)}
                  %
                </span>

                <span className="text-xs text-slate-500">
                  cumulative
                </span>

              </div>
            </div>

            {/* TWA */}

            <div className="pt-4 border-t border-slate-800">

              <div className="flex items-center justify-between">

                <span className="text-xs text-slate-400">
                  TWA
                </span>

                <span className="font-mono font-bold text-teal-400">
                  {event.twaDb.toFixed(1)} dBA
                </span>

              </div>

            </div>

            {/* PEAK */}

            <div className="pt-4 border-t border-slate-800">

              <div className="flex items-center justify-between">

                <span className="text-xs text-slate-400 flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  Peak
                </span>

                <span className="font-mono font-bold text-rose-400">
                  {maxPeak.toFixed(1)} dBA
                </span>

              </div>

            </div>

            {/* TOTAL TIME */}

            <div className="pt-4 border-t border-slate-800">

              <div className="flex items-center justify-between">

                <span className="text-xs text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Total Exposure
                </span>

                <span className="font-mono font-bold text-white">
                  {totalDuration.toFixed(2)} min
                </span>

              </div>

            </div>

          </div>

          {/* RECORDER */}

          <div className="mt-6 pt-4 border-t border-slate-800">

            <div className="text-xs font-medium text-slate-300 mb-2">
              Live Measurement
            </div>

            <AudioRecorder
              eventId={event.id}
            />

          </div>

        </div>
      </div>

      {/* =========================================
          LOGS
      ========================================= */}

      <div className="space-y-4">

        <div className="flex items-center justify-between">

          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">

            <Volume2 className="w-5 h-5 text-teal-400" />

            Recorded Exposure Logs ({logsList.length})

          </h2>

          <p className="text-xs text-slate-500">
            Chronological measurements
          </p>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm text-slate-300">

              <thead className="border-b border-slate-800 text-xs text-slate-400 uppercase bg-slate-950/40">

                <tr>

                  <th className="py-3 px-4">
                    #
                  </th>

                  <th className="py-3 px-4">
                    Level
                  </th>

                  <th className="py-3 px-4">
                    Leq
                  </th>

                  <th className="py-3 px-4">
                    Peak
                  </th>

                  <th className="py-3 px-4">
                    Duration
                  </th>

                  <th className="py-3 px-4 text-right">
                    Recorded
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-800/60">

                {logsList.map(
                  (log, index) => {

                    const level =
                      Number(
                        log.decibelLevel
                      );

                    const leq =
                      Number(
                        log.leqDb
                      );

                    const peak =
                      Number(
                        log.peakDb ??
                          log.decibelLevel
                      );

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-800/30 transition-colors"
                      >

                        {/* ID */}

                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500">

                          #{logsList.length - index}

                          <div className="text-[10px] mt-1">
                            {log.id.substring(
                              0,
                              8
                            )}
                            ...
                          </div>

                        </td>

                        {/* LEVEL */}

                        <td className="py-3.5 px-4">

                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              level >= 85
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                            }`}
                          >

                            <Volume2 className="w-3 h-3" />

                            {level.toFixed(
                              1
                            )}{" "}
                            dBA

                          </span>

                        </td>

                        {/* LEQ */}

                        <td className="py-3.5 px-4">

                          <span className="inline-flex items-center gap-1.5 text-cyan-400 font-mono">

                            <Waves className="w-3.5 h-3.5" />

                            {leq.toFixed(
                              1
                            )}{" "}
                            dBA

                          </span>

                        </td>

                        {/* PEAK */}

                        <td className="py-3.5 px-4">

                          <span className="text-rose-400 font-mono font-semibold">

                            {peak.toFixed(
                              1
                            )}{" "}
                            dBA

                          </span>

                        </td>

                        {/* DURATION */}

                        <td className="py-3.5 px-4">

                          <span className="inline-flex items-center gap-1.5 text-slate-400">

                            <Clock className="w-3.5 h-3.5 text-slate-500" />

                            {Number(
                              log.durationMinutes
                            ).toFixed(2)}{" "}
                            min

                          </span>

                        </td>

                        {/* DATE */}

                        <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-400">

                          {new Date(
                            log.recordedAt
                          ).toLocaleString()}

                        </td>

                      </tr>
                    );
                  }
                )}

                {logsList.length === 0 && (

                  <tr>

                    <td
                      colSpan={6}
                      className="py-12 text-center text-slate-500"
                    >
                      <div className="flex flex-col items-center gap-2">

                        <Volume2 className="w-8 h-8 opacity-30" />

                        <p>
                          No exposure logs
                          recorded yet.
                        </p>

                        <p className="text-xs">
                          Start a recording
                          using the button
                          above.
                        </p>

                      </div>
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