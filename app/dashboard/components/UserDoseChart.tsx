"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface ChartProps {
  data: {
    title: string;
    dose: number;
    twa: number;
    date: string;
  }[];
}

export default function UserDoseChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorDose" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.4} />
        <XAxis 
          dataKey="date" 
          stroke="#64748b" 
          fontSize={11} 
          tickLine={false} 
        />
        <YAxis 
          stroke="#64748b" 
          fontSize={11} 
          tickLine={false} 
          unit="%" 
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#0f172a",
            borderColor: "#334155",
            borderRadius: "0.75rem",
            color: "#fff",
            fontSize: "12px",
          }}
        />
        <Area
          type="monotone"
          dataKey="dose"
          name="Total Dose"
          stroke="#14b8a6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorDose)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}