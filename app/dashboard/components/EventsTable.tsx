"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Shield, Activity, Search, Trash2, ChevronRight, Plus, Edit2, X, RefreshCw } from "lucide-react";
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
  standardsList?: { id: string; code: string; name: string; isDefault?: boolean }[];
  currentUserId?: string;
  userPreferredStandard?: string;
  isAdmin?: boolean;
}

export default function EventsTable({ 
  initialEvents, 
  usersList = [], 
  standardsList = [], 
  currentUserId,
  userPreferredStandard,
  isAdmin = false 
}: EventsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [events, setEvents] = useState(initialEvents);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  
  const defaultStandard = 
    userPreferredStandard || 
    standardsList.find((s) => s.isDefault)?.code || 
    standardsList[0]?.code || 
    "NIOSH";

  const [formData, setFormData] = useState({
    title: "",
    location: "",
    userId: currentUserId || usersList[0]?.id || "",
    standardCodeUsed: defaultStandard,
  });

  const filteredEvents = events.filter(
    (evt) =>
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.location && evt.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (evt.userName && evt.userName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event and its exposure logs?")) return;
    setLoadingId(id);
    const res = await deleteEventAction(id);
    if (res?.success) {
      setEvents(events.filter((e) => e.id !== id));
      toast.success("Event deleted successfully");
    } else {
      toast.error(res?.error || "Failed to delete event");
    }
    setLoadingId(null);
  };

  const handleOpenCreateModal = () => {
    setFormData({
      title: "",
      location: "",
      userId: currentUserId || usersList[0]?.id || "",
      standardCodeUsed: defaultStandard, 
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
      } else {
        toast.error(res?.error || "Failed to create event");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      } else {
        toast.error(res?.error || "Failed to update event");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title, location..."
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-500 text-slate-950 hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Assessment Event
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 text-xs text-slate-400 uppercase bg-slate-950/40">
              <tr>
                <th className="py-3 px-4">Event Title</th>
                {isAdmin && <th className="py-3 px-4">Engineer</th>}
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
                      href={`/dashboard/events/${evt.id}`}
                      className="hover:text-teal-400 transition-colors flex items-center gap-1.5 font-semibold"
                    >
                      {evt.title}
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-teal-400" />
                    </Link>
                    {evt.location && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {evt.location}
                      </div>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="py-3.5 px-4">
                      <div className="text-white font-medium">{evt.userName || "Unknown"}</div>
                    </td>
                  )}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-500/10 border border-teal-500/20 text-teal-400">
                      <Shield className="w-3 h-3" /> {evt.standardCodeUsed}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white">

                                       {evt.totalDosePercentage < 0.01
  ? "< 0.01"
  : evt.totalDosePercentage.toFixed(2)}%
                  </td>
                  <td className="py-3.5 px-4 font-bold text-teal-400">
                    {evt.twaDb.toFixed(1)} dBA
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEditModal(evt)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Edit Event"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(evt.id)}
                        disabled={loadingId === evt.id}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete Event"
                      >
                        {loadingId === evt.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-slate-500">
                    No exposure events found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(isAddModalOpen || editingEvent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800/90 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingEvent ? "Edit Event" : "Create Exposure Event"}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingEvent(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingEvent ? handleUpdateSubmit : handleCreateSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Event Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Generator Assessment"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Block B"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Acoustic Standard</label>
                <select
                  value={formData.standardCodeUsed}
                  onChange={(e) => setFormData({ ...formData, standardCodeUsed: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-teal-400 font-mono font-bold focus:outline-none focus:border-teal-500"
                >
                  {standardsList.map((std) => (
                    <option key={std.id || std.code} value={std.code}>
                      {std.code} - {std.name} {std.isDefault ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingEvent(null);
                  }}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-500 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {editingEvent ? "Update Event" : "Save Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}