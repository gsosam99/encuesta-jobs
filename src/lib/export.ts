import * as XLSX from "xlsx";
import type { JobId, RespuestaCompleta, RespuestaValor } from "@/types";
import {
  PREGUNTAS_POSICIONAMIENTO,
  PREGUNTAS_FILTRO,
  PREGUNTAS_POR_JOB,
  PREGUNTA_PRECIO_POR_JOB,
} from "@/data/preguntas";

type Fila = Record<string, string | number | null>;

function flatten(v: RespuestaValor | undefined): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return v.join(", ");
  return Object.entries(v)
    .map(([k, n]) => `${k}:${n}`)
    .join(" | ");
}

function filaBaseRespuesta(r: RespuestaCompleta, colegioNombre: string): Fila {
  const fila: Fila = {
    id: r.id,
    fecha: new Date(r.created_at).toISOString(),
    colegio: colegioNombre,
    nombre: r.nombre ?? "",
    email: r.email ?? "",
    job_asignado: r.job_asignado ?? "",
    score_job1: r.scores?.job1 ?? 0,
    score_job2: r.scores?.job2 ?? 0,
    score_job3: r.scores?.job3 ?? 0,
    completada: r.completada ? "sí" : "no",
  };
  // Posicionamiento + filtro
  const pos = (r.posicionamiento ?? {}) as Record<string, RespuestaValor> & {
    _sub?: Record<string, string>;
  };
  for (const p of PREGUNTAS_POSICIONAMIENTO) {
    fila[`pos__${p.id}`] = flatten(pos[p.id]);
    if ("subAbierta" in p && pos._sub?.[p.id]) {
      fila[`pos__${p.id}__sub`] = pos._sub[p.id];
    }
  }
  const filtro = (r.filtro ?? {}) as Record<string, RespuestaValor>;
  for (const p of PREGUNTAS_FILTRO) {
    fila[`filtro__${p.id}`] = flatten(filtro[p.id]);
  }
  return fila;
}

function filaJobEspecifico(r: RespuestaCompleta): Fila {
  if (!r.job_asignado) return {};
  const fila: Fila = {};
  const jobResp = (r.job_especifico ?? {}) as Record<string, RespuestaValor> & {
    _sub?: Record<string, string>;
  };
  for (const p of PREGUNTAS_POR_JOB[r.job_asignado as JobId]) {
    fila[`job__${p.id}`] = flatten(jobResp[p.id]);
    if ("subAbierta" in p && jobResp._sub?.[p.id]) {
      fila[`job__${p.id}__sub`] = jobResp._sub[p.id];
    }
  }
  const precio = (r.precio ?? {}) as Record<string, RespuestaValor>;
  const preguntaPrecio = PREGUNTA_PRECIO_POR_JOB[r.job_asignado as JobId];
  fila[`precio__${preguntaPrecio.id}`] = flatten(precio[preguntaPrecio.id]);
  return fila;
}

export function exportarExcel(
  respuestas: RespuestaCompleta[],
  colegioMap: Record<string, string>
) {
  const wb = XLSX.utils.book_new();

  // Hoja resumen (todas las respuestas, columnas comunes + por job juntos)
  const resumen = respuestas.map((r) => ({
    ...filaBaseRespuesta(r, colegioMap[r.colegio_id] ?? ""),
    ...filaJobEspecifico(r),
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(resumen),
    "Resumen"
  );

  // Una hoja por Job
  for (const job of [1, 2, 3] as JobId[]) {
    const rows = respuestas
      .filter((r) => r.job_asignado === job)
      .map((r) => ({
        ...filaBaseRespuesta(r, colegioMap[r.colegio_id] ?? ""),
        ...filaJobEspecifico(r),
      }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(rows.length ? rows : [{ vacio: "sin respuestas" }]),
      `Job ${job}`
    );
  }

  // Hoja por colegio (resumen agregado)
  const porColegio: Record<string, { colegio: string; job1: number; job2: number; job3: number; total: number }> = {};
  for (const r of respuestas) {
    const nombre = colegioMap[r.colegio_id] ?? "—";
    porColegio[nombre] ??= { colegio: nombre, job1: 0, job2: 0, job3: 0, total: 0 };
    porColegio[nombre].total++;
    if (r.job_asignado) {
      porColegio[nombre][`job${r.job_asignado}` as "job1" | "job2" | "job3"]++;
    }
  }
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(Object.values(porColegio)),
    "Por Colegio"
  );

  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `encuesta-jtbd-${fecha}.xlsx`);
}
