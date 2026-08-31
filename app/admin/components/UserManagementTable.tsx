"use client";

import { useState, useTransition } from "react";
import {
  Search,
  ShieldAlert,
  Trash2,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  Plus,
  Edit2,
  X,
  UserPlus,
  KeyRound,
} from "lucide-react";
import {
  deleteUserAction,
  updateUserRoleAction,
  createUserAction,
  updateUserAction,
} from "@/app/lib/actions/admin";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  preferredStandardCode: string;
  createdAt: Date;
}

interface StandardOption {
  code: string;
  name: string;
}

export default function UserManagementTable({
  initialUsers,
  availableStandards,
  currentUserId,
}: {
  initialUsers: UserItem[];
  availableStandards: StandardOption[];
  currentUserId: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  // States pour la création / édition
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const [isPending, startTransition] = useTransition();

  const filteredUsers = initialUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.preferredStandardCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setIsFormModalOpen(true);
  };

  const handleToggleRole = (userId: string, currentRole: "user" | "admin") => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    setLoadingId(userId);

    startTransition(async () => {
      const res = await updateUserRoleAction(userId, newRole);
      if (res.error) alert(res.error);
      setLoadingId(null);
    });
  };

  const handleDeleteUser = (userId: string) => {
    setLoadingId(userId);

    startTransition(async () => {
      const res = await deleteUserAction(userId);
      if (res.success) {
        setDeleteModalId(null);
      } else if (res.error) {
        alert(res.error);
      }
      setLoadingId(null);
    });
  };

  const handleFormSubmit = async (formData: FormData) => {
    startTransition(async () => {
      let res;
      if (editingUser) {
        res = await updateUserAction(editingUser.id, formData);
      } else {
        res = await createUserAction(formData);
      }

      if (res.error) {
        alert(res.error);
      } else {
        setIsFormModalOpen(false);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche & Bouton Ajouter */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or standard..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-xs text-slate-400">
            Showing <span className="font-semibold text-white">{filteredUsers.length}</span> of {initialUsers.length} users
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 cursor-pointer bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-xl text-sm flex items-center gap-2 transition-all shadow-lg shadow-teal-950/40 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      {/* Table des utilisateurs */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 text-xs text-slate-400 uppercase bg-slate-950/40">
              <tr>
                <th className="py-3 px-4">Engineer / User</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Preferred Standard</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((u) => {
                const isLoading = loadingId === u.id && isPending;
                const isSelf = u.id === currentUserId;

                return (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-950 border border-teal-800 flex items-center justify-center text-xs text-teal-400 font-bold uppercase">
                        {u.name.substring(0, 2)}
                      </div>
                      <div>
                        <div>{u.name}</div>
                        {isSelf && <span className="text-[10px] text-teal-400">(You)</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          u.role === "admin"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {u.role === "admin" ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-teal-400 font-semibold">
                      {u.preferredStandardCode}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleToggleRole(u.id, u.role)}
                        disabled={isLoading || isSelf}
                        className="px-3 py-1.5 cursor-pointer text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-40"
                        title="Toggle Role"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin inline" />
                        ) : u.role === "admin" ? (
                          "Demote"
                        ) : (
                          "Promote"
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenEdit(u)}
                        disabled={isLoading}
                        className="p-1.5 cursor-pointer text-slate-400 hover:text-white rounded-lg transition-colors inline-block"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteModalId(u.id)}
                        disabled={isLoading || isSelf}
                        className="p-1.5 cursor-pointer text-slate-500 hover:text-rose-400 rounded-lg transition-colors disabled:opacity-40 inline-block"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale Formulaire (Create & Edit) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingUser ? "Edit User Account" : "Create New Sound Engineer"}
                </h3>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={handleFormSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Full Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editingUser?.name ?? ""}
                  placeholder="John Doe"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={editingUser?.email ?? ""}
                  placeholder="john@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Champ Password dynamiquement requis/optionnel */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Password
                  </label>
                  {editingUser && (
                    <span className="text-[10px] text-slate-500">Leave blank to keep current</span>
                  )}
                </div>
                <input
                  name="password"
                  type="password"
                  required={!editingUser}
                  minLength={6}
                  placeholder={editingUser ? "••••••••" : "Min. 6 characters"}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Role</label>
                  <select
                    name="role"
                    defaultValue={editingUser?.role ?? "user"}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Preferred Standard</label>
                  <select
                    name="preferredStandardCode"
                    defaultValue={editingUser?.preferredStandardCode ?? "NIOSH_REL"}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
                  >
                    {availableStandards.map((std) => (
                      <option key={std.code} value={std.code}>
                        {std.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 cursor-pointer text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 cursor-pointer text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-2"
                >
                  {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {editingUser ? "Save Changes" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale de confirmation de suppression */}
      {deleteModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Delete User Account</h3>
            </div>
            <p className="text-sm text-slate-400">
              Are you sure you want to delete this sound engineer account? All recorded noise exposure logs and event sessions linked to this user will be permanently deleted.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteModalId(null)}
                className="px-4 py-2 cursor-pointer text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteModalId)}
                disabled={isPending}
                className="px-4 py-2 cursor-pointer text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-2"
              >
                {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}