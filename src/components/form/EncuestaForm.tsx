"use client";

import { useMemo, useState } from "react";
import type { Colegio, JobId, Pregunta, RespuestaValor } from "@/types";
import {
  PREGUNTAS_POSICIONAMIENTO,
  PREGUNTAS_FILTRO,
  PREGUNTAS_POR_JOB,
  PREGUNTA_PRECIO_POR_JOB,
  ETIQUETAS_JOB,
} from "@/data/preguntas";
import { calcularScores, determinarJob } from "@/lib/scoring";
import {
  REGLA_ABIERTA_DEFAULT,
  REGLA_SUB_ABIERTA,
  validarTextoAbierto,
} from "@/lib/validacion";
import { PreguntaRenderer } from "./PreguntaRenderer";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Props {
  colegio: Colegio;
}

type Etapa =
  | "intro"
  | "datos"
  | "posicionamiento"
  | "filtro"
  | "calculando"
  | "job"
  | "precio"
  | "enviado";

export function EncuestaForm({ colegio }: Props) {
  const [etapa, setEtapa] = useState<Etapa>("intro");
  const [datos, setDatos] = useState({ nombre: "", email: "" });
  const [posicionamiento, setPosicionamiento] = useState<
    Record<string, RespuestaValor>
  >({});
  const [posicionamientoSub, setPosicionamientoSub] = useState<Record<string, string>>({});
  const [filtro, setFiltro] = useState<Record<string, string>>({});
  const [jobAsignado, setJobAsignado] = useState<JobId | null>(null);
  const [jobResp, setJobResp] = useState<Record<string, RespuestaValor>>({});
  const [jobSub, setJobSub] = useState<Record<string, string>>({});
  const [precio, setPrecio] = useState<Record<string, RespuestaValor>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const totalEtapas = 6;
  const idxEtapa: Record<Etapa, number> = {
    intro: 0,
    datos: 1,
    posicionamiento: 2,
    filtro: 3,
    calculando: 4,
    job: 4,
    precio: 5,
    enviado: 6,
  };

  // ---------- helpers ----------
  const setRespPos = (id: string) => (v: RespuestaValor) =>
    setPosicionamiento((s) => ({ ...s, [id]: v }));
  const setSubPos = (id: string) => (v: string) =>
    setPosicionamientoSub((s) => ({ ...s, [id]: v }));

  const setRespJob = (id: string) => (v: RespuestaValor) =>
    setJobResp((s) => ({ ...s, [id]: v }));
  const setSubJob = (id: string) => (v: string) =>
    setJobSub((s) => ({ ...s, [id]: v }));

  const validarRequeridas = (
    preguntas: Pregunta[],
    resp: Record<string, RespuestaValor>,
    sub: Record<string, string> = {}
  ) => {
    return preguntas
      .filter((p) => p.requerida)
      .every((p) => {
        const v = resp[p.id];
        if (v === undefined || v === null || v === "") return false;
        if (p.tipo === "abierta") {
          return validarTextoAbierto(v as string, REGLA_ABIERTA_DEFAULT).ok;
        }
        if (p.tipo === "ponderacion-100") {
          const obj = v as Record<string, number>;
          const total = Object.values(obj).reduce((s, n) => s + (n || 0), 0);
          return total === 100;
        }
        if (p.tipo === "gabor-granger") {
          return Object.keys(v as object).length > 0;
        }
        if (p.tipo === "likert9" && p.subAbierta) {
          return validarTextoAbierto(sub[p.id] ?? "", REGLA_SUB_ABIERTA).ok;
        }
        return true;
      });
  };

  const irACalcularJob = () => {
    const scores = calcularScores(filtro);
    const job = determinarJob(scores);
    setJobAsignado(job);
    setEtapa("job");
  };

  const enviar = async () => {
    if (!jobAsignado) return;
    setEnviando(true);
    setError(null);
    const scores = calcularScores(filtro);
    // mezcla sub-respuestas dentro del payload de cada bloque para conservar todo
    const payloadPos = { ...posicionamiento, _sub: posicionamientoSub };
    const payloadJob = { ...jobResp, _sub: jobSub };
    const { error } = await supabase.from("respuestas").insert({
      colegio_id: colegio.id,
      nombre: datos.nombre || null,
      email: datos.email || null,
      job_asignado: jobAsignado,
      scores,
      posicionamiento: payloadPos,
      filtro,
      job_especifico: payloadJob,
      precio,
      completada: true,
    });
    setEnviando(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEtapa("enviado");
  };

  // ---------- render por etapa ----------
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Encuesta
        </p>
        <h1 className="text-2xl font-bold text-slate-900">{colegio.nombre}</h1>
        <ProgressBar
          value={idxEtapa[etapa] / totalEtapas}
          label={`Paso ${Math.min(idxEtapa[etapa] + 1, totalEtapas)} de ${totalEtapas}`}
        />
      </header>

      {etapa === "intro" && (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
          <p className="text-slate-700">
            Gracias por su tiempo. Esta encuesta nos ayudará a entender mejor lo
            que las familias buscan en {colegio.nombre}. Sus respuestas son
            confidenciales y se usarán solo para fines analíticos.
          </p>
          <p className="text-sm text-slate-500">Tiempo estimado: 8–12 min.</p>
          <Button onClick={() => setEtapa("datos")}>Comenzar</Button>
        </section>
      )}

      {etapa === "datos" && (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Datos opcionales</h2>
          <p className="text-sm text-slate-500">
            Si desea, déjenos su nombre y correo. No es obligatorio.
          </p>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={datos.nombre}
                onChange={(e) =>
                  setDatos((s) => ({ ...s, nombre: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={datos.email}
                onChange={(e) =>
                  setDatos((s) => ({ ...s, email: e.target.value }))
                }
              />
            </div>
          </div>
          <NavBotones
            onAtras={() => setEtapa("intro")}
            onSiguiente={() => setEtapa("posicionamiento")}
          />
        </section>
      )}

      {etapa === "posicionamiento" && (
        <BloquePreguntas
          titulo="Posicionamiento del colegio"
          preguntas={PREGUNTAS_POSICIONAMIENTO}
          respuestas={posicionamiento}
          subRespuestas={posicionamientoSub}
          onChange={setRespPos}
          onSubChange={setSubPos}
          onAtras={() => setEtapa("datos")}
          onSiguiente={() => setEtapa("filtro")}
          puedeAvanzar={validarRequeridas(
            PREGUNTAS_POSICIONAMIENTO,
            posicionamiento,
            posicionamientoSub
          )}
        />
      )}

      {etapa === "filtro" && (
        <BloquePreguntas
          titulo="Sus prioridades como familia"
          preguntas={PREGUNTAS_FILTRO}
          respuestas={filtro as unknown as Record<string, RespuestaValor>}
          subRespuestas={{}}
          onChange={(id) => (v) =>
            setFiltro((s) => ({ ...s, [id]: v as string }))
          }
          onSubChange={() => () => undefined}
          onAtras={() => setEtapa("posicionamiento")}
          onSiguiente={irACalcularJob}
          puedeAvanzar={PREGUNTAS_FILTRO.every((p) => filtro[p.id])}
        />
      )}

      {etapa === "job" && jobAsignado && (
        <section className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-medium">
              Su perfil predominante: {ETIQUETAS_JOB[jobAsignado].titulo}
            </p>
            <p className="mt-1 text-emerald-800">
              {ETIQUETAS_JOB[jobAsignado].descripcion}
            </p>
          </div>
          <BloquePreguntas
            titulo="Sobre su experiencia con el colegio"
            preguntas={PREGUNTAS_POR_JOB[jobAsignado]}
            respuestas={jobResp}
            subRespuestas={jobSub}
            onChange={setRespJob}
            onSubChange={setSubJob}
            onAtras={() => setEtapa("filtro")}
            onSiguiente={() => setEtapa("precio")}
            puedeAvanzar={validarRequeridas(
              PREGUNTAS_POR_JOB[jobAsignado],
              jobResp,
              jobSub
            )}
          />
        </section>
      )}

      {etapa === "precio" && jobAsignado && (
        <BloquePreguntas
          titulo="Disposición a pagar"
          preguntas={[PREGUNTA_PRECIO_POR_JOB[jobAsignado]]}
          respuestas={precio}
          subRespuestas={{}}
          onChange={(id) => (v) => setPrecio((s) => ({ ...s, [id]: v }))}
          onSubChange={() => () => undefined}
          onAtras={() => setEtapa("job")}
          onSiguiente={enviar}
          puedeAvanzar={
            !enviando &&
            !!precio[PREGUNTA_PRECIO_POR_JOB[jobAsignado].id]
          }
          textoSiguiente={enviando ? "Enviando..." : "Enviar respuestas"}
        />
      )}

      {etapa === "enviado" && (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
          <h2 className="text-lg font-semibold">¡Gracias por participar!</h2>
          <p className="mt-2 text-sm">
            Sus respuestas fueron registradas correctamente. Sus aportes nos
            ayudarán a entender mejor lo que las familias buscan en un colegio.
          </p>
        </section>
      )}

      {error && (
        <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
      )}
    </div>
  );
}

function NavBotones({
  onAtras,
  onSiguiente,
  puedeAvanzar = true,
  textoSiguiente = "Siguiente",
}: {
  onAtras?: () => void;
  onSiguiente: () => void;
  puedeAvanzar?: boolean;
  textoSiguiente?: string;
}) {
  return (
    <div className="flex justify-between pt-2">
      {onAtras ? (
        <Button variant="ghost" onClick={onAtras}>
          ← Atrás
        </Button>
      ) : (
        <span />
      )}
      <Button onClick={onSiguiente} disabled={!puedeAvanzar}>
        {textoSiguiente}
      </Button>
    </div>
  );
}

function BloquePreguntas({
  titulo,
  preguntas,
  respuestas,
  subRespuestas,
  onChange,
  onSubChange,
  onAtras,
  onSiguiente,
  puedeAvanzar,
  textoSiguiente,
}: {
  titulo: string;
  preguntas: Pregunta[];
  respuestas: Record<string, RespuestaValor>;
  subRespuestas: Record<string, string>;
  onChange: (id: string) => (v: RespuestaValor) => void;
  onSubChange: (id: string) => (v: string) => void;
  onAtras?: () => void;
  onSiguiente: () => void;
  puedeAvanzar: boolean;
  textoSiguiente?: string;
}) {
  return (
    <section className="space-y-6 rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
      {preguntas.map((p) => (
        <div key={p.id} className="border-t border-slate-100 pt-5 first:border-t-0 first:pt-0">
          <PreguntaRenderer
            pregunta={p}
            valor={respuestas[p.id]}
            onChange={onChange(p.id)}
            subValor={subRespuestas[p.id]}
            onSubChange={onSubChange(p.id)}
          />
        </div>
      ))}
      <NavBotones
        onAtras={onAtras}
        onSiguiente={onSiguiente}
        puedeAvanzar={puedeAvanzar}
        textoSiguiente={textoSiguiente}
      />
    </section>
  );
}
