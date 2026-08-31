import { db } from "@/app/dbConfig/db";
import { getSession } from "@/app/lib/auth/session";
import { users, safetyStandards, events } from "@/app/schema/schema";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import EventsTable from "../components/EventsTable";

export default async function EventsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Récupération des événements depuis la table "events", des utilisateurs et des normes (avec l'id inclus)
  const [allEvents, allUsers, availableStandards] = await Promise.all([
    db
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
      })
      .from(events)
      .leftJoin(users, eq(events.userId, users.id))
      .orderBy(desc(events.createdAt)),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .orderBy(desc(users.createdAt)),
    db
      .select({
        id: safetyStandards.id,
        code: safetyStandards.code,
        name: safetyStandards.name,
      })
      .from(safetyStandards),
  ]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Sound Events & Exposure Sessions
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor noise exposure events, assign sound engineers, track acoustic dosages, and manage compliance standards.
        </p>
      </div>

      <EventsTable
        initialEvents={allEvents}
        usersList={allUsers}
        standardsList={availableStandards}
      />
    </div>
  );
}