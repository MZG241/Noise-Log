"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Shield,
  Plus,
  Star,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  AlertTriangle,
  Sliders,
  Search,
} from "lucide-react";
import {
  createSafetyStandardAction,
  updateSafetyStandardAction,
  deleteSafetyStandardAction,
  setDefaultStandardAction,
} from "@/app/lib/actions/admin";

interface StandardItem {
  code: string;
  name: string;
  criterionLevelDb: number;
  exchangeRateDb: number;
  referenceDurationHours: number;
  isDefault: boolean;
}

// Fonction avec suffixe aléatoire pour garantir l'unicité du code
function generateCode(name: string): string {
  const baseSlug = name
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9\s_]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 12);

  // Suffixe aléatoire de 4 caractères alphanumériques
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return baseSlug ? `${baseSlug}_${randomSuffix}` : `STD_${randomSuffix}`;
}

export default function StandardsManagementClient({
  initialStandards,
}: {
  initialStandards: StandardItem[];
}) {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStandard, setEditingStandard] = useState<StandardItem | null>(null);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  // Form states
  const [nameInput, setNameInput] = useState("");
  const [codeForm, setCodeForm] = useState("");

  const [loadingCode, setLoadingCode] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Normes filtrées selon la recherche
  const filteredStandards = useMemo(() => {
    if (!searchQuery.trim()) return initialStandards;
    const query = searchQuery.toLowerCase().trim();
    return initialStandards.filter(
      (std) =>
        std.code.toLowerCase().includes(query) ||
        std.name.toLowerCase().includes(query)
    );
  }, [initialStandards, searchQuery]);

  const handleOpenCreate = () => {
    setEditingStandard(null);
    setNameInput("");
    setCodeForm("");
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (std: StandardItem) => {
    setEditingStandard(std);
    setNameInput(std.name);
    setCodeForm(std.code);
    setIsFormModalOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setNameInput(newName);
    if (!editingStandard) {
      setCodeForm(generateCode(newName));
    }
  };

  const handleRegenerateCode = () => {
    if (!editingStandard && nameInput) {
      setCodeForm(generateCode(nameInput));
    }
  };

  const handleSetDefault = (code: string) => {
    setLoadingCode(code);
    setStatusMsg(null);

    startTransition(async () => {
      const res = await setDefaultStandardAction(code);
      if (res.error) setStatusMsg({ type: "error", text: res.error });
      if (res.success) setStatusMsg({ type: "success", text: res.success });
      setLoadingCode(null);
    });
  };

  const handleConfirmDelete = () => {
    if (!deletingCode) return;

    setLoadingCode(deletingCode);
    setStatusMsg(null);

    startTransition(async () => {
      const res = await deleteSafetyStandardAction(deletingCode);
      if (res.error) setStatusMsg({ type: "error", text: res.error });
      if (res.success) setStatusMsg({ type: "success", text: res.success });
      setLoadingCode(null);
      setDeletingCode(null);
    });
  };

  const handleSubmit = async (formData: FormData) => {
    setStatusMsg(null);
    startTransition(async () => {
      let res;
      if (editingStandard) {
        res = await updateSafetyStandardAction(editingStandard.code, formData);
      } else {
        res = await createSafetyStandardAction(null, formData);
      }

      if (res.error) {
        setStatusMsg({ type: "error", text: res.error });
      } else if (res.success) {
        setStatusMsg({ type: "success", text: res.success });
        setIsFormModalOpen(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between transition-all duration-200 ${
            statusMsg.type === "success"
              ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-400"
              : "bg-rose-950/40 border-rose-800/60 text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-xs cursor-pointer text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Bar with Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search standard code or name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 cursor-pointer top-2.5 text-xs text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-xs text-slate-400">
            Showing:{" "}
            <span className="font-bold text-white">
              {filteredStandards.length}
            </span>{" "}
            / {initialStandards.length}
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 cursor-pointer bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-xl text-sm flex items-center gap-2 transition-all shadow-lg shadow-teal-950/40 active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Standard
          </button>
        </div>
      </div>

      {/* Grid des cartes */}
      {filteredStandards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStandards.map((std) => {
            const isLoading = loadingCode === std.code && isPending;

            return (
              <div
                key={std.code}
                className={`p-6 rounded-2xl bg-slate-900/60 border transition-all relative flex flex-col justify-between space-y-4 ${
                  std.isDefault
                    ? "border-teal-500/50 shadow-lg shadow-teal-950/30"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-teal-400">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white tracking-wide">
                          {std.code}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {std.name}
                        </p>
                      </div>
                    </div>
                    {std.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 border border-teal-500/20 text-teal-400">
                        <Star className="w-3 h-3 fill-teal-400" /> 
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center">
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 font-medium">
                        Criterion
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {std.criterionLevelDb} dBA
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 font-medium">
                        Exchange ($Q$)
                      </div>
                      <div className="text-sm font-bold text-teal-400 mt-0.5">
                        +{std.exchangeRateDb} dBA
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 font-medium">
                        Ref Duration
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {std.referenceDurationHours} hrs
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  {!std.isDefault ? (
                    <button
                      onClick={() => handleSetDefault(std.code)}
                      disabled={isLoading}
                      className="text-xs cursor-pointer text-slate-400 hover:text-teal-400 font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Star className="w-3.5 h-3.5" />
                      )}
                      Set Default
                    </button>
                  ) : (
                    <span className="text-xs text-teal-400 font-medium">
                      Active System Default
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(std)}
                      disabled={isLoading}
                      className="p-1.5 cursor-pointer text-slate-400 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                      title="Edit Standard"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {!std.isDefault && (
                      <button
                        onClick={() => setDeletingCode(std.code)}
                        disabled={isLoading}
                        className="p-1.5 cursor-pointer text-slate-500 hover:text-rose-400 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Standard"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <p className="text-sm text-slate-400">
            No standards found matching &quot;{searchQuery}&quot;.
          </p>
        </div>
      )}

      {/* Modal: Creation & Edition */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800/90 rounded-2xl shadow-2xl shadow-slate-950/80 max-w-lg w-full overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingStandard
                      ? `Edit Standard (${editingStandard.code})`
                      : "Create Acoustic Safety Standard"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure exposure limits and exchange rates.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 cursor-pointer text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form action={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Full Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    value={nameInput}
                    onChange={handleNameChange}
                    placeholder="e.g. NIOSH REL Standard"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>System Code</span>
                    {!editingStandard && (
                      <button
                        type="button"
                        onClick={handleRegenerateCode}
                        className="text-[10px] cursor-pointer text-teal-400 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> New Code
                      </button>
                    )}
                  </label>
                  <input
                    name="code"
                    type="text"
                    required
                    readOnly={Boolean(editingStandard)}
                    value={codeForm}
                    onChange={(e) => setCodeForm(e.target.value.toUpperCase())}
                    placeholder="NIOSH_A1B2"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono transition-all ${
                      editingStandard
                        ? "bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-slate-950 border-slate-800 text-teal-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Criterion ($L_c$)
                  </label>
                  <div className="relative">
                    <input
                      name="criterionLevelDb"
                      type="number"
                      step="0.1"
                      required
                      defaultValue={editingStandard?.criterionLevelDb ?? 85}
                      placeholder="85"
                      className="w-full pl-3.5 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-medium">
                      dBA
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Exchange ($Q$)
                  </label>
                  <div className="relative">
                    <input
                      name="exchangeRateDb"
                      type="number"
                      step="0.1"
                      required
                      defaultValue={editingStandard?.exchangeRateDb ?? 3}
                      placeholder="3"
                      className="w-full pl-3.5 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-medium">
                      dBA
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Ref Duration
                  </label>
                  <div className="relative">
                    <input
                      name="referenceDurationHours"
                      type="number"
                      step="0.5"
                      required
                      defaultValue={editingStandard?.referenceDurationHours ?? 8}
                      className="w-full pl-3.5 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-medium">
                      hrs
                    </span>
                  </div>
                </div>
              </div>

              {!editingStandard && (
                <div className="flex items-center gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    name="isDefault"
                    value="true"
                    className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-teal-600 focus:ring-teal-500 focus:ring-offset-slate-900"
                  />
                  <label
                    htmlFor="isDefault"
                    className="text-xs text-slate-300 cursor-pointer select-none"
                  >
                    Set as default system standard
                  </label>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 cursor-pointer text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 cursor-pointer text-xs font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-500 flex items-center gap-2 transition-all shadow-lg shadow-teal-950/50 disabled:opacity-50 active:scale-95"
                >
                  {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {editingStandard ? "Update Standard" : "Save Standard"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-6 max-w-sm w-full space-y-5 text-center shadow-2xl shadow-slate-950/80 transform transition-all animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Delete Standard</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to remove{" "}
                <span className="text-rose-400 font-mono font-bold">
                  {deletingCode}
                </span>
                ? This action cannot be reversed.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCode(null)}
                className="w-full py-2.5 cursor-pointer text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isPending}
                className="w-full py-2.5 cursor-pointer text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-500 flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-950/50 disabled:opacity-50 active:scale-95"
              >
                {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}