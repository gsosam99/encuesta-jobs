"use client";

import { useMemo, useState } from "react";
import type { Colegio, JobId, RespuestaCompleta } from "@/types";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { exportarExcel } from "@/lib/export";

interface Props {
  respuestas: RespuestaCompleta[];
  colegios: Colegio[];
}

export function RespuestasTable({ respuestas, colegios }: Props) {
  const [colegioId, setColegioId] = useState<string>("");
  const [job, setJob] = useState<string>("");

  const colegioMap = useMemo(
    () => Object.fromEntries(colegios.map((c) => [c.id, c.nombre])),
    [colegios]
  );

  const filtradas = useMemo(
    () =>
      respuestas.filter(
        (r) =>
          (!colegioId || r.colegio_id === colegioId) &&
          (!job || r.job_asignado === Number(job))
      ),
    [respuestas, colegioId, job]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Respuestas</h1>
        <Button
          onClick={() => exportarExcel(filtradas, colegioMap)}
          disabled={filtradas.length === 0}
        >
          Exportar a Excel
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={colegioId}
          onChange={(e) => setColegioId(e.target.value)}
          className="w-auto min-w-48"
        >
          <option value="">Todos los colegios</option>
          {colegios.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
        <Select
          value={job}
          onChange={(e) => setJob(e.target.value)}
          className="w-auto min-w-32"
        >
          <option value="">Todos los Jobs</option>
          <option value="1">Job 1</option>
          <option value="2">Job 2</option>
          <option value="3">Job 3</option>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Colegio</th>
              <th className="p-3">Job</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Email</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="p-3 text-xs text-slate-500">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="p-3">{colegioMap[r.colegio_id] ?? "—"}</td>
                <td className="p-3">
                  {r.job_asignado ? (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                      Job {r.job_asignado as JobId}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3">{r.nombre ?? "—"}</td>
                <td className="p-3">{r.email ?? "—"}</td>
                <td className="p-3">
                  {r.completada ? "✓ Completa" : "⏳ Parcial"}
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-sm text-slate-500">
                  Sin respuestas para los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
