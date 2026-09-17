"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Shield, Activity, Search, Trash2, ChevronRight, Plus, Edit2 } from "lucide-react";
import { deleteEventAction, createEventAction, updateEventAction } from "@/app/lib/actions/exposure-session";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EventItem {
  id: string;
  title: string;
  location: string | null;
  standardCodeUsed: string;
  totalDosePercentage: number;
  twaDb: number;
  createdAt: Date;
  userId: string;
  userName: string | null;
  userEmail?: string | null;
}

interface EventsTableProps {
  initialEvents: EventItem[];
  usersList?: { id: string; name: string; email: string }[];
  standardsList?: { id: string; code: string; name: string }[];
}

export default function EventsTable({ initialEvents, usersList = [], standardsList = [] }: EventsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [events, setEvents] = useState(initialEvents);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // États pour les modales (Create / Update)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulaire d'état local pour Create / Update
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    userId: usersList[0]?.id || "",
    standardCodeUsed: standardsList[0]?.code || "OSHA",
  });

  const filteredEvents = events.filter(
    (evt) =>
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.location && evt.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (evt.userName && evt.userName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- DELETE ---
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event and its exposure logs?")) return;
    setLoadingId(id);
    const res = await deleteEventAction(id);
    if (res?.success) {
      setEvents(events.filter((e) => e.id !== id));
      toast.success("Event deleted successfully");
      window.location.reload()
    } else {
      toast.error(res?.error || "Failed to delete event");
    }
    setLoadingId(null);
  };

  // --- CREATE ---
  const handleOpenCreateModal = () => {
    setFormData({
      title: "",
      location: "",
      userId: usersList[0]?.id || "",
      standardCodeUsed: standardsList[0]?.code || "OSHA",
    });
    setIsAddModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("location", formData.location);
      data.append("userId", formData.userId);
      data.append("standardCodeUsed", formData.standardCodeUsed);

      const res = await createEventAction(data);
      if (res?.success) {
        toast.success("Event created successfully");
        setIsAddModalOpen(false);
        router.refresh();
        window.location.reload()
      } else {
        toast.error(res?.error || "Failed to create event");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- UPDATE ---
  const handleOpenEditModal = (evt: EventItem) => {
    setEditingEvent(evt);
    setFormData({
      title: evt.title,
      location: evt.location || "",
      userId: evt.userId,
      standardCodeUsed: evt.standardCodeUsed,
    });
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("location", formData.location);
      data.append("userId", formData.userId);
      data.append("standardCodeUsed", formData.standardCodeUsed);

      const res = await updateEventAction(editingEvent.id, data);
      if (res?.success) {
        toast.success("Event updated successfully");
        setEditingEvent(null);
        router.refresh();
        window.location.reload()
      } else {
        toast.error(res?.error || "Failed to update event");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche et Bouton "Add Event" */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title, location, or engineer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4">
          <div className="text-xs text-slate-400 font-medium hidden md:block">
            Showing <span className="text-white font-bold">{filteredEvents.length}</span> events
          </div>
          
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-500 text-slate-950 hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 text-xs text-slate-400 uppercase bg-slate-950/40">
              <tr>
                <th className="py-3 px-4">Event Title</th>
                <th className="py-3 px-4">Engineer</th>
                <th className="py-3 px-4">Standard</th>
                <th className="py-3 px-4">Total Dose</th>
                <th className="py-3 px-4">TWA Level</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-800/35 transition-colors group">
                  <td className="py-3.5 px-4 font-medium text-white">
                    <Link
                      href={`/admin/events/${evt.id}`}
                      className="hover:text-teal-400 transition-colors flex items-center gap-1.5 font-semibold"
                    >
                      {evt.title}
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-teal-400" />
                    </Link>
                    {evt.location && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-teal-500" />
                        {evt.location}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-300 text-xs">
                    <div className="font-medium text-white">{evt.userName || "N/A"}</div>
                    {evt.userEmail && <div className="text-slate-500">{evt.userEmail}</div>}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      <Shield className="w-3 h-3" />
                      {evt.standardCodeUsed}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      evt.totalDosePercentage >= 100 
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}>
                      <Activity className="w-3 h-3" />
                      {evt.totalDosePercentage < 0.01
  ? "< 0.01"
  : evt.totalDosePercentage.toFixed(2)}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-xs font-semibold text-teal-400">
                    {evt.twaDb.toFixed(1)} dB
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/events/${evt.id}`}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition-colors"
                      >
                        View Logs
                      </Link>

                      <button
                        onClick={() => handleOpenEditModal(evt)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 transition-colors"
                        title="Edit event"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(evt.id)}
                        disabled={loadingId === evt.id}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No events found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODALE CRÉATION (CREATE) --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Create New Event</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white text-sm font-semibold">✕</button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Industrial Plant Inspection"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: Sector 4 Factory Floor"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Assigned Engineer / User</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                >
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Safety Standard</label>
                <select
                  value={formData.standardCodeUsed}
                  onChange={(e) => setFormData({ ...formData, standardCodeUsed: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                >
                  {standardsList.map((s) => (
                    <option key={s.id || s.code} value={s.code}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-500 text-slate-950 hover:bg-teal-400 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODALE MODIFICATION (UPDATE) --- */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Edit Event</h3>
              <button onClick={() => setEditingEvent(null)} className="text-slate-400 hover:text-white text-sm font-semibold">✕</button>
            </div>
            
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Assigned Engineer / User</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                >
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Safety Standard</label>
                <select
                  value={formData.standardCodeUsed}
                  onChange={(e) => setFormData({ ...formData, standardCodeUsed: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                >
                  {standardsList.map((s) => (
                    <option key={s.id || s.code} value={s.code}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-500 text-slate-950 hover:bg-teal-400 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}