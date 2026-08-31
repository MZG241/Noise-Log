import { db } from "@/app/dbConfig/db";
import { getSession } from "@/app/lib/auth/session";
import { safetyStandards, users } from "@/app/schema/schema";
import { redirect } from "next/navigation";
import { ShieldCheck, Sliders, Clock, Gauge, CheckCircle2 } from "lucide-react";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";

export default async function UserStandardsPage() {
  const session = await getSession();
  if (!session || session.role !== "user") {
    redirect("/login");
  }

  // Server Action pour mettre à jour la norme préférée de l'utilisateur
  async function handleSelectStandard(formData: FormData) {
    "use server";
    const standardCode = formData.get("standardCode") as string;
    const currentSession = await getSession();

    if (!currentSession) return;

    await db
      .update(users)
      .set({ preferredStandardCode: standardCode })
      .where(eq(users.id, currentSession.userId));

    revalidatePath("/dashboard/standards"); 
  }

  // Récupérer la norme préférée de l'utilisateur actuel
  const currentUser = await db
    .select({ preferredStandardCode: users.preferredStandardCode })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  const preferredCode = currentUser[0]?.preferredStandardCode;

  const standards = await db.select().from(safetyStandards);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Safety & Compliance Standards
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Reference acoustic standards, criterion levels, and exchange rates used for exposure calculations. Select your preferred default standard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {standards.map((std) => {
          const isSelected = preferredCode
            ? preferredCode === std.code
            : std.isDefault;

          return (
            <div
              key={std.id}
              className={`bg-slate-900/65 border rounded-2xl p-6 space-y-6 shadow-xl flex flex-col justify-between transition-all ${
                isSelected ? "border-teal-500/50 shadow-teal-500/5" : "border-slate-800"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {std.code}
                  </span>

                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Active Preference
                    </span>
                  ) : std.isDefault ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      System Default
                    </span>
                  ) : null}
                </div>

                <div>
                  <h3 className="text-base font-semibold text-white">{std.name}</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <Gauge className="w-3.5 h-3.5 text-teal-500" />
                      Criterion Level
                    </div>
                    <div className="text-sm font-mono font-bold text-white">
                      {std.criterionLevelDb} <span className="text-xs font-normal text-slate-400">dB</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <Sliders className="w-3.5 h-3.5 text-teal-500" />
                      Exchange Rate
                    </div>
                    <div className="text-sm font-mono font-bold text-white">
                      {std.exchangeRateDb} <span className="text-xs font-normal text-slate-400">dB</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-500" />
                    Ref. Duration
                  </span>
                  <span className="font-mono font-semibold text-slate-200">
                    {std.referenceDurationHours} hours
                  </span>
                </div>

                <form action={handleSelectStandard}>
                  <input type="hidden" name="standardCode" value={std.code} />
                  <button
                    type="submit"
                    disabled={isSelected}
                    className={`w-full cursor-pointer py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                      isSelected
                        ? "bg-teal-500/10 text-teal-400 border border-teal-500/20 cursor-default"
                        : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Selected Standard
                      </>
                    ) : (
                      "Set as Preferred"
                    )}
                  </button>
                </form>
              </div>
            </div>
          );
        })}

        {standards.length === 0 && (
          <div className="col-span-full bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            No safety standards available in the system.
          </div>
        )}
      </div>
    </div>
  );
}