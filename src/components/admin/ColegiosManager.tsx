"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import type { Colegio } from "@/types";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ColegiosManager({ initial }: { initial: Colegio[] }) {
  const supabase = createSupabaseBrowserClient();
  const [colegios, setColegios] = useState(initial);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  const crear = async () => {
    if (!nombre.trim()) return;
    setCreando(true);
    setError(null);
    const slug = slugify(nombre);
    const { data, error } = await supabase
      .from("colegios")
      .insert({ nombre: nombre.trim(), slug })
      .select()
      .single();
    setCreando(false);
    if (error) {
      setError(error.message);
      return;
    }
    setColegios((c) => [data as Colegio, ...c]);
    setNombre("");
  };

  const toggleActivo = async (col: Colegio) => {
    const { error } = await supabase
      .from("colegios")
      .update({ activo: !col.activo })
      .eq("id", col.id);
    if (error) {
      setError(error.message);
      return;
    }
    setColegios((cs) =>
      cs.map((c) => (c.id === col.id ? { ...c, activo: !c.activo } : c))
    );
  };

  const eliminar = async (col: Colegio) => {
    if (!confirm(`¿Eliminar ${col.nombre}? También se borrarán sus respuestas.`)) return;
    const { error } = await supabase.from("colegios").delete().eq("id", col.id);
    if (error) return setError(error.message);
    setColegios((cs) => cs.filter((c) => c.id !== col.id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Colegios</h1>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Nuevo colegio</h2>
        <div className="mt-3 flex gap-2">
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del colegio"
            className="flex-1"
          />
          <Button onClick={crear} disabled={creando || !nombre.trim()}>
            {creando ? "Creando..." : "Crear"}
          </Button>
        </div>
        {nombre && (
          <p className="mt-2 text-xs text-slate-500">
            Slug previsto: <code>{slugify(nombre)}</code>
          </p>
        )}
        {error && (
          <p className="mt-2 rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Link encuesta</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {colegios.map((c) => {
              const url = `${baseUrl}/encuesta/${c.slug}`;
              return (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="p-3 font-medium">{c.nombre}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-slate-100 px-2 py-1 text-xs">
                        {url}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(url)}
                        className="text-xs text-slate-600 hover:underline"
                      >
                        copiar
                      </button>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        c.activo
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {c.activo ? "Activo" : "Pausado"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => toggleActivo(c)}>
                        {c.activo ? "Pausar" : "Activar"}
                      </Button>
                      <Button variant="ghost" onClick={() => eliminar(c)}>
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {colegios.length === 0 && (
              <tr>
                <td className="p-6 text-center text-sm text-slate-500" colSpan={4}>
                  Aún no hay colegios. Crea el primero arriba.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
