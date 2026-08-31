"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck,Users,FileText, Sliders, LayoutDashboard, LogOut ,Activity } from "lucide-react";
import { logoutAction } from "@/app/lib/actions/auth";

export default function AdminSidebar() {
  const pathname = usePathname();

 const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Acoustic Standards", href: "/admin/standards", icon: Sliders },
  { label: "User Management", href: "/admin/users", icon: Users },
  { label: "Exposure Sessions", href: "/admin/events", icon: Activity },
  { label: "Reports", href: "/admin/reports", icon: FileText },
  { label: "Profile", href: "/admin/profile", icon: Users }
];

  return (
    <aside className="w-64 bg-slate-900/80 border-r border-slate-800/80 flex flex-col justify-between h-screen sticky top-0 backdrop-blur-md hidden md:flex">
      <div>
        {/* Logo Admin */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight leading-tight">
              NoiseLog <span className="text-emerald-400">HSE</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Console Admin</span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="p-4 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Administration
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer & Logout */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        <button
          onClick={() => logoutAction()}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}