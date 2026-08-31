"use client";

import { Download, BarChart2, PieChart as PieIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface EventReport {
  id: string;
  title: string;
  location: string | null;
  standardCodeUsed: string;
  totalDosePercentage: number;
  twaDb: number;
  createdAt: Date;
  userName: string | null;
  userEmail: string | null;
}

export default function AdminReportsContent({
  reportsData,
  totalUsersCount,
}: {
  reportsData: EventReport[];
  totalUsersCount: number;
}) {
  // Données pour les graphiques de la page
  const standardsCountMap: { [key: string]: number } = {};
  reportsData.forEach((evt) => {
    standardsCountMap[evt.standardCodeUsed] =
      (standardsCountMap[evt.standardCodeUsed] || 0) + 1;
  });
  const standardChartData = Object.keys(standardsCountMap).map((key) => ({
    name: key,
    count: standardsCountMap[key],
  }));

  const criticalCount = reportsData.filter(
    (e) => e.totalDosePercentage >= 100
  ).length;
  const safeCount = reportsData.length - criticalCount;
  const exposurePieData = [
    { name: "Safe (< 100%)", value: safeCount, color: "#0d9488" },
    { name: "Critical (>= 100%)", value: criticalCount, color: "#f43f5e" },
  ];

  // Génération du PDF propre (uniquement texte, en-tête stylisé et tableau de données)
  const exportPdf = () => {
    const doc = new jsPDF();

    // En-tête du document
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text("System Compliance & Exposure Report", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 24);
    doc.text(
      `Overview: ${totalUsersCount} Total Users | ${reportsData.length} Total Sessions | ${criticalCount} Critical Exposures`,
      14,
      30
    );

    // Tableau des données
    const tableColumn = [
      "Event Title",
      "User",
      "Standard",
      "Total Dose",
      "TWA",
      "Date",
    ];
    const tableRows = reportsData.map((evt) => [
      evt.title,
      evt.userName ? `${evt.userName}` : "Unknown",
      evt.standardCodeUsed,
      `${
        evt.totalDosePercentage < 0.01
          ? "< 0.01"
          : evt.totalDosePercentage.toFixed(2)
      }%`,
      `${evt.twaDb.toFixed(1)} dBA`,
      new Date(evt.createdAt).toLocaleDateString(),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 38,
      styles: { fontSize: 8, cellPadding: 3, font: "helvetica" },
      headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        3: { fontStyle: "bold" },
      },
    });

    doc.save(
      `admin-compliance-report-${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  return (
    <div className="space-y-8">
      {/* Bouton d'export PDF en haut */}
      <div className="flex justify-end">
        <button
          onClick={exportPdf}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-teal-900/20 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Export PDF Report
        </button>
      </div>

      {/* Section des Graphiques (Visibles uniquement sur la page web) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <BarChart2 className="w-4 h-4 text-teal-400" />
            Sessions by Safety Standard
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={standardChartData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "0.75rem",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <PieIcon className="w-4 h-4 text-teal-400" />
            Exposure Status Distribution (&ge; 100% Critical)
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={exposurePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {exposurePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "0.75rem",
                    color: "#fff",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}