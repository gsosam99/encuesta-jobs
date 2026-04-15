"use client";

import type { Pregunta, RespuestaValor } from "@/types";
import {
  REGLA_ABIERTA_DEFAULT,
  REGLA_SUB_ABIERTA,
  validarTextoAbierto,
} from "@/lib/validacion";

interface Props {
  pregunta: Pregunta;
  valor: RespuestaValor | undefined;
  onChange: (valor: RespuestaValor) => void;
  subValor?: string;
  onSubChange?: (v: string) => void;
}

export function PreguntaRenderer({
  pregunta,
  valor,
  onChange,
  subValor,
  onSubChange,
}: Props) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-slate-900">
          {pregunta.enunciado}
          {pregunta.requerida ? <span className="text-rose-500"> *</span> : null}
        </h3>
        {pregunta.ayuda ? (
          <p className="mt-1 text-sm text-slate-500">{pregunta.ayuda}</p>
        ) : null}
      </div>

      {pregunta.tipo === "abierta" && (
        <TextareaConValidacion
          value={(valor as string) ?? ""}
          onChange={(s) => onChange(s)}
          placeholder={pregunta.placeholder}
          requerida={!!pregunta.requerida}
          regla={REGLA_ABIERTA_DEFAULT}
        />
      )}

      {pregunta.tipo === "likert9" && (
        <LikertEscala
          valor={valor as number | undefined}
          onChange={(n) => onChange(n)}
        />
      )}

      {pregunta.tipo === "opcion-unica" && (
        <div className="space-y-2">
          {pregunta.opciones.map((op) => (
            <label
              key={op.id}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition ${
                valor === op.id
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 hover:border-slate-400"
              }`}
            >
              <input
                type="radio"
                name={pregunta.id}
                value={op.id}
                checked={valor === op.id}
                onChange={() => onChange(op.id)}
                className="mt-0.5"
              />
              <span>{op.texto}</span>
            </label>
          ))}
        </div>
      )}

      {pregunta.tipo === "opciones-list" && (
        <div className="space-y-2">
          {pregunta.opciones.map((op) => (
            <label
              key={op.id}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition ${
                valor === op.id
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 hover:border-slate-400"
              }`}
            >
              <input
                type="radio"
                name={pregunta.id}
                value={op.id}
                checked={valor === op.id}
                onChange={() => onChange(op.id)}
                className="mt-0.5"
              />
              <span>{op.texto}</span>
            </label>
          ))}
        </div>
      )}

      {pregunta.tipo === "ponderacion-100" && (
        <Ponderacion100
          atributos={pregunta.atributos}
          valor={(valor as Record<string, number>) ?? {}}
          onChange={(v) => onChange(v)}
        />
      )}

      {pregunta.tipo === "gabor-granger" && (
        <GaborGranger
          framing={pregunta.framing}
          pasos={pregunta.pasos}
          valor={(valor as Record<string, number>) ?? {}}
          onChange={(v) => onChange(v)}
        />
      )}

      {pregunta.tipo === "likert9" && pregunta.subAbierta && onSubChange && (
        <div className="pt-2">
          <label className="text-sm font-medium text-slate-700">
            {pregunta.subAbierta}
            {pregunta.requerida ? <span className="text-rose-500"> *</span> : null}
          </label>
          <TextareaConValidacion
            value={subValor ?? ""}
            onChange={onSubChange}
            requerida={!!pregunta.requerida}
            regla={REGLA_SUB_ABIERTA}
            rows={2}
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
}

function TextareaConValidacion({
  value,
  onChange,
  placeholder,
  requerida,
  regla,
  rows = 4,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  requerida: boolean;
  regla: { minCaracteres: number; minPalabrasUnicas: number };
  rows?: number;
  className?: string;
}) {
  const trimmed = value.trim();
  const charCount = trimmed.replace(/\s+/g, "").length;
  const validacion = requerida
    ? validarTextoAbierto(value, regla)
    : { ok: true };
  const tocada = trimmed.length > 0;
  const mostrarError = tocada && !validacion.ok;

  return (
    <div className={className}>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-md border bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
          mostrarError
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
            : validacion.ok && tocada
              ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-200"
              : "border-slate-300 focus:border-slate-900 focus:ring-slate-200"
        }`}
      />
      <div className="mt-1 flex items-center justify-between text-xs">
        <span
          className={
            mostrarError
              ? "text-rose-600"
              : validacion.ok && tocada
                ? "text-emerald-600"
                : "text-slate-500"
          }
        >
          {mostrarError
            ? validacion.motivo
            : validacion.ok && tocada
              ? "✓ Respuesta válida"
              : `Mínimo ${regla.minCaracteres} caracteres con detalle concreto.`}
        </span>
        <span className="tabular-nums text-slate-400">
          {charCount}/{regla.minCaracteres}
        </span>
      </div>
    </div>
  );
}

function LikertEscala({
  valor,
  onChange,
}: {
  valor: number | undefined;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-10 w-10 rounded-full border text-sm font-medium transition ${
              valor === n
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>1 — Totalmente en desacuerdo</span>
        <span>9 — Totalmente de acuerdo</span>
      </div>
    </div>
  );
}

function Ponderacion100({
  atributos,
  valor,
  onChange,
}: {
  atributos: { id: string; etiqueta: string }[];
  valor: Record<string, number>;
  onChange: (v: Record<string, number>) => void;
}) {
  const total = atributos.reduce((sum, a) => sum + (valor[a.id] || 0), 0);
  const ok = total === 100;

  return (
    <div className="space-y-2">
      {atributos.map((a) => (
        <div key={a.id} className="flex items-center gap-3">
          <span className="flex-1 text-sm text-slate-700">{a.etiqueta}</span>
          <input
            type="number"
            min={0}
            max={100}
            value={valor[a.id] ?? ""}
            onChange={(e) =>
              onChange({ ...valor, [a.id]: Math.max(0, Number(e.target.value) || 0) })
            }
            className="w-20 rounded-md border border-slate-300 bg-white p-2 text-right text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
      ))}
      <div
        className={`flex items-center justify-between rounded-md p-2 text-sm font-medium ${
          ok
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700"
        }`}
      >
        <span>Total</span>
        <span>{total} / 100</span>
      </div>
    </div>
  );
}

function GaborGranger({
  framing,
  pasos,
  valor,
  onChange,
}: {
  framing: string;
  pasos: number[];
  valor: Record<string, number>;
  onChange: (v: Record<string, number>) => void;
}) {
  // Mostramos todos los precios y para cada uno una intención 1-9
  return (
    <div className="space-y-3">
      <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
        {framing}
      </p>
      {pasos.map((p) => (
        <div key={p} className="rounded-md border border-slate-200 p-3">
          <div className="mb-2 text-sm font-medium">${p} / mes</div>
          <LikertEscala
            valor={valor[String(p)]}
            onChange={(n) => onChange({ ...valor, [String(p)]: n })}
          />
        </div>
      ))}
    </div>
  );
}
