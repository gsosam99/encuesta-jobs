import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EncuestaForm } from "@/components/form/EncuestaForm";
import type { Colegio } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EncuestaPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("colegios")
    .select("*")
    .eq("slug", slug)
    .eq("activo", true)
    .maybeSingle();

  if (error || !data) return notFound();

  return (
    <main className="min-h-screen bg-slate-50">
      <EncuestaForm colegio={data as Colegio} />
    </main>
  );
}
