import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ColegiosManager } from "@/components/admin/ColegiosManager";
import type { Colegio } from "@/types";

export default async function ColegiosPage() {
  await requireAuth();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("colegios")
    .select("*")
    .order("created_at", { ascending: false });
  return <ColegiosManager initial={(data ?? []) as Colegio[]} />;
}
