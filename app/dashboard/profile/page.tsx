import { db } from "@/app/dbConfig/db";
import { getSession } from "@/app/lib/auth/session";
import { users } from "@/app/schema/schema";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { User, Mail, Lock, Shield, Save } from "lucide-react";
import { updateUserProfile } from "@/app/lib/actions/auth";


export default async function UserProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const currentUserList = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  const user = currentUserList[0];
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-teal-400" />
          User Profile & Security
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Update your personal details, email address, and account password.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Aperçu du profil */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 text-2xl font-bold font-mono">
            {user.name ? user.name.substring(0, 2).toUpperCase() : "US"}
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{user.name || "User"}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20 capitalize">
              <Shield className="w-3.5 h-3.5" />
              {user.role} Account
            </span>
          </div>
        </div>

        {/* Formulaire lié à l'action externe */}
        <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <form action={updateUserProfile} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide border-b border-slate-800 pb-3">
                Account Information
              </h3>

              {/* Nom */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-500" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={user.name || ""}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-teal-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={user.email}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>

              {/* Mot de passe optionnel */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-teal-500" />
                  New Password (optional)
                </label>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="Leave blank to keep current password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 font-medium placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-teal-900/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}