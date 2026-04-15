import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RespuestasTable } from "@/components/admin/RespuestasTable";
import type { Colegio, RespuestaCompleta } from "@/types";

export default async function RespuestasPage() {
  await requireAuth();
  const supabase = await createSupabaseServerClient();
  const [{ data: respuestas }, { data: colegios }] = await Promise.all([
    supabase
      .from("respuestas")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("colegios").select("*").order("nombre"),
  ]);
  return (
    <RespuestasTable
      respuestas={(respuestas ?? []) as RespuestaCompleta[]}
      colegios={(colegios ?? []) as Colegio[]}
    />
  );
}
