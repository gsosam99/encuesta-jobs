import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import type { JobId } from "@/types";
import { ETIQUETAS_JOB } from "@/data/preguntas";

interface RespRow {
  id: string;
  colegio_id: string;
  job_asignado: JobId | null;
  completada: boolean;
}

interface ColRow {
  id: string;
  nombre: string;
}

export default async function DashboardPage() {
  await requireAuth();
  const supabase = await createSupabaseServerClient();

  const [{ data: respuestas }, { data: colegios }] = await Promise.all([
    supabase.from("respuestas").select("id,colegio_id,job_asignado,completada"),
    supabase.from("colegios").select("id,nombre").order("nombre"),
  ]);

  const resp = (respuestas ?? []) as RespRow[];
  const cols = (colegios ?? []) as ColRow[];

  const total = resp.length;
  const completadas = resp.filter((r) => r.completada).length;

  const distribGlobal: Record<string, number> = { "Job 1": 0, "Job 2": 0, "Job 3": 0 };
  const distribPorColegio: Record<
    string,
    { nombre: string; job1: number; job2: number; job3: number; total: number }
  > = {};

  for (const c of cols) {
    distribPorColegio[c.id] = { nombre: c.nombre, job1: 0, job2: 0, job3: 0, total: 0 };
  }
  for (const r of resp) {
    if (!r.job_asignado) continue;
    distribGlobal[`Job ${r.job_asignado}`]++;
    const bucket = distribPorColegio[r.colegio_id];
    if (bucket) {
      bucket[`job${r.job_asignado}` as "job1" | "job2" | "job3"]++;
      bucket.total++;
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPI label="Respuestas totales" value={total} />
        <KPI label="Completadas" value={completadas} />
        <KPI
          label="% completitud"
          value={total ? `${Math.round((completadas / total) * 100)}%` : "—"}
        />
        <KPI label="Colegios activos" value={cols.length} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {(Object.keys(ETIQUETAS_JOB) as unknown as JobId[]).map((j) => {
          const count = distribGlobal[`Job ${j}`];
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={j} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase text-slate-500">Job {j}</p>
              <p className="mt-1 font-semibold">{ETIQUETAS_JOB[j].titulo}</p>
              <p className="mt-2 text-3xl font-bold">{pct}%</p>
              <p className="text-xs text-slate-500">{count} respuestas</p>
            </div>
          );
        })}
      </section>

      <DashboardCharts
        distribGlobal={distribGlobal}
        distribPorColegio={Object.values(distribPorColegio)}
      />
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
