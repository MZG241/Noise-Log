import { getSession } from "@/app/lib/auth/session";
import { redirect } from "next/navigation";
import UserHeader from "./components/UserHeader";
import UserSidebar from "./components/UserSidebar";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <UserSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <UserHeader userName={session.name} />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}