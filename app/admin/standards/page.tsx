import { db } from "@/app/dbConfig/db";
import { safetyStandards } from "@/app/schema/schema";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import StandardsManagementClient from "../components/StandardsManagementClient";
import { getSession } from "@/app/lib/auth/session";

export const revalidate = 0;

export default async function AcousticStandardsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const standards = await db
    .select()
    .from(safetyStandards)
    .orderBy(desc(safetyStandards.isDefault), safetyStandards.code);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Occupational Acoustic Standards
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure safety criteria, criterion levels ($L_c$), exchange rates ($Q$), and maximum allowable noise exposure thresholds.
        </p>
      </div>

      <StandardsManagementClient initialStandards={standards} />
    </div>
  );
}