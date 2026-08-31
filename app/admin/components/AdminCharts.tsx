"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface EventData {
  id: string;
  twaDb: number;
  totalDosePercentage: number;
  createdAt: string;
}

export default function AdminCharts({ events }: { events: EventData[] }) {
  // 1. Dynamic Daily Trend Aggregation (groups multi-event readings on the same date)
  const aggregatedDailyTrends = Object.values(
    events.reduce((acc, current) => {
      if (!acc[current.createdAt]) {
        acc[current.createdAt] = {
          createdAt: current.createdAt,
          totalTwa: current.twaDb,
          count: 1,
        };
      } else {
        acc[current.createdAt].totalTwa += current.twaDb;
        acc[current.createdAt].count += 1;
      }
      return acc;
    }, {} as Record<string, { createdAt: string; totalTwa: number; count: number }>)
  ).map((item) => ({
    createdAt: item.createdAt,
    avgTwaDb: parseFloat((item.totalTwa / item.count).toFixed(1)),
  }));

  // 2. Dynamic Exposure Severity Breakdown
  const twaRanges = [
    {
      range: "< 80 dBA",
      count: events.filter((e) => e.twaDb < 80).length,
      color: "#10b981", // Safe Green
    },
    {
      range: "80-85 dBA",
      count: events.filter((e) => e.twaDb >= 80 && e.twaDb <= 85).length,
      color: "#f59e0b", // Warning Yellow
    },
    {
      range: "85-90 dBA",
      count: events.filter((e) => e.twaDb > 85 && e.twaDb <= 90).length,
      color: "#f97316", // Danger Orange
    },
    {
      range: "> 90 dBA",
      count: events.filter((e) => e.twaDb > 90).length,
      color: "#f43f5e", // Critical Red
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Dynamic Area Chart: Daily TWA Exposure Levels */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white">Daily Average TWA Level Trend</h3>
          <p className="text-xs text-slate-400">
            Equivalent continuous noise exposure level averaged per day
          </p>
        </div>
        <div className="h-64 w-full">
          {aggregatedDailyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aggregatedDailyTrends}>
                <defs>
                  <linearGradient id="twaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="createdAt" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} unit=" dBA" domain={[50, 110]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                  itemStyle={{ color: "#14b8a6" }}
                />
                <Area
                  type="monotone"
                  dataKey="avgTwaDb"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#twaGradient)"
                  name="Avg TWA Level"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              No exposure session logs recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Bar Chart: Acoustic Exposure Severity Distribution */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white">Exposure Severity Distribution</h3>
          <p className="text-xs text-slate-400">
            Categorization of live sound sessions by decibel risk threshold
          </p>
        </div>
        <div className="h-64 w-full">
          {events.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={twaRanges}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Bar dataKey="count" name="Logged Sessions" radius={[6, 6, 0, 0]}>
                  {twaRanges.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              No distribution data available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}