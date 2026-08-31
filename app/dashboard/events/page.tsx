import { redirect } from "next/navigation";
import { Activity } from "lucide-react";
import { getSession } from "@/app/lib/auth/session";
import { db } from "@/app/dbConfig/db"; // Ajustez selon votre chemin d'import Drizzle
import { eq, desc } from "drizzle-orm";
import { events, safetyStandards, users } from "@/app/schema/schema";
import EventsTable from "../components/EventsTable";


export default async function UserEventsPage() {
  const session = await getSession();
  if (!session || session.role !== "user") {
    redirect("/login");
  }

  // Récupérer uniquement les événements de l'utilisateur connecté
  const userEvents = await db
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
    .where(eq(events.userId, session.userId))
    .orderBy(desc(events.createdAt));

  // Récupérer les standards de sécurité disponibles pour le formulaire de création/édition
  const standards = await db
    .select({
      id: safetyStandards.id,
      code: safetyStandards.code,
      name: safetyStandards.name,
    })
    .from(safetyStandards);

  const formattedEvents = userEvents.map((evt) => ({
    id: evt.id,
    title: evt.title,
    location: evt.location,
    standardCodeUsed: evt.standardCodeUsed,
    totalDosePercentage: evt.totalDosePercentage,
    twaDb: evt.twaDb,
    createdAt: evt.createdAt,
    userId: evt.userId,
    userName: evt.userName,
    userEmail: evt.userEmail,
  }));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5 text-teal-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Activity className="w-4 h-4" /> Noise Exposure Logbook
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            My Noise Assessment Events
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your daily noise exposure sessions, logging logs, and calculation metrics.
          </p>
        </div>
      </div>

      <EventsTable 
        initialEvents={formattedEvents} 
        standardsList={standards}
        currentUserId={session.userId}
        isAdmin={false}
      />
    </div>
  );
}