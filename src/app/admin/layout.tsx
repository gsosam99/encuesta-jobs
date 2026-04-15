import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const isAuthed = !!data.user;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href={isAuthed ? "/admin/dashboard" : "/admin/login"}
            className="font-semibold"
          >
            JTBD Admin
          </Link>
          {isAuthed && (
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin/dashboard" className="hover:underline">Dashboard</Link>
              <Link href="/admin/colegios" className="hover:underline">Colegios</Link>
              <Link href="/admin/respuestas" className="hover:underline">Respuestas</Link>
              <LogoutButton />
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
