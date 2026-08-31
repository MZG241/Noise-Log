import { db } from "@/app/dbConfig/db";
import { getSession } from "@/app/lib/auth/session";
import { users, safetyStandards } from "@/app/schema/schema";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import UserManagementTable from "../components/UserManagementTable";

export default async function UserManagementPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const [allUsers, availableStandards] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        preferredStandardCode: users.preferredStandardCode,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt)),
    db
      .select({
        code: safetyStandards.code,
        name: safetyStandards.name,
      })
      .from(safetyStandards),
  ]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          User & Engineer Management
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor live sound engineer accounts, manage access roles, and assign default occupational noise standards (NIOSH/OSHA).
        </p>
      </div>

      <UserManagementTable
        initialUsers={allUsers}
        availableStandards={availableStandards}
        currentUserId={session.userId}
      />
    </div>
  );
}