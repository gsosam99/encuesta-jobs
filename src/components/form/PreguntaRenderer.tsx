"use client";

import { useCallback, useRef, useState } from "react";
import type { Pregunta, RespuestaValor, OpcionFiltro } from "@/types";
import {
  REGLA_ABIERTA_DEFAULT,
  validarTextoAbierto,
  validarTextoSuave,
  contarCaracteres,
} from "@/lib/validacion";

interface Props {
  pregunta: Pregunta;
  valor: RespuestaValor | undefined;
  onChange: (valor: RespuestaValor) => void;
  subValor?: string;
  onSubChange?: (v: string) => void;
  /** Si true, muestra error incluso sin haber hecho blur (cuando el usuario intenta avanzar) */
  forceValidate?: boolean;
}

export function PreguntaRenderer({
  pregunta,
  valor,
  onChange,
  subValor,
  onSubChange,
  forceValidate = false,
}: Props) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-slate-900 leading-snug">
          {pregunta.enunciado}
          {pregunta.requerida ? <span className="text-rose-500"> *</span> : null}
        </h3>
        {pregunta.ayuda ? (
          <p className="mt-1 text-sm text-slate-500">{pregunta.ayuda}</p>
        ) : null}
      </div>

      {pregunta.tipo === "abierta" && (
        <TextareaValidada
          value={(valor as string) ?? ""}
          onChange={(s) => onChange(s)}
          placeholder={pregunta.placeholder}
          requerida={!!pregunta.requerida}
          forceValidate={forceValidate}
          regla={REGLA_ABIERTA_DEFAULT}
        />
      )}

      {pregunta.tipo === "likert9" && (
        <>
          <LikertEscala
            valor={valor as number | undefined}
            onChange={(n) => onChange(n)}
          />
          {pregunta.subAbierta && onSubChange && (
            <TextareaSubAbierta
              label={pregunta.subAbierta}
              value={subValor ?? ""}
              onChange={onSubChange}
            />
          )}
        </>
      )}

      {pregunta.tipo === "opcion-unica" && (
        <div className="space-y-2">
          {pregunta.opciones.map((op) => (
            <label
              key={op.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                valor === op.id
                  ? "border-slate-900 bg-slate-50 font-medium text-slate-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              <input
                type="radio"
                name={pregunta.id}
                value={op.id}
                checked={valor === op.id}
                onChange={() => onChange(op.id)}
                className="mt-0.5 shrink-0"
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
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                valor === op.id
                  ? "border-slate-900 bg-slate-50 font-medium text-slate-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              <input
                type="radio"
                name={pregunta.id}
                value={op.id}
                checked={valor === op.id}
                onChange={() => onChange(op.id)}
                className="mt-0.5 shrink-0"
              />
              <span>{op.texto}</span>
            </label>
          ))}
        </div>
      )}

      {pregunta.tipo === "ordenamiento" && (
        <OrdenamientoPrioridad
          opciones={pregunta.opciones}
          ayudaOrden={pregunta.ayudaOrden}
          valor={(valor as string[]) ?? []}
          onChange={(v) => onChange(v)}
        />
      )}

      {pregunta.tipo === "ponderacion-100" && (
        <Ponderacion100
          atributos={pregunta.atributos}
          valor={(valor as Record<string, number>) ?? {}}
          onChange={(v) => onChange(v)}
        />
      )}

      {pregunta.tipo === "gabor-granger" && (
        <GaborGrangerSecuencial
          framing={pregunta.framing}
          pasos={pregunta.pasos}
          valor={(valor as Record<string, number>) ?? {}}
          onChange={(v) => onChange(v)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Textarea con validación estricta (campo abierto requerido)
// El error solo se muestra tras perder el foco o al intentar avanzar
// ─────────────────────────────────────────────
function TextareaValidada({
  value,
  onChange,
  placeholder,
  requerida,
  forceValidate,
  regla,
  rows = 4,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  requerida: boolean;
  forceValidate: boolean;
  regla: { minCaracteres: number; minPalabrasUnicas: number };
  rows?: number;
  className?: string;
}) {
  const [touched, setTouched] = useState(false);
  const charCount = contarCaracteres(value);
  const validacion = requerida
    ? validarTextoAbierto(value, regla)
    : { ok: true };
  const mostrarError = (touched || forceValidate) && !validacion.ok;
  const mostrarOk = validacion.ok && value.trim().length > 0;

  return (
    <div className={className}>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder ?? "Escribe tu respuesta aquí…"}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        className={`w-full rounded-lg border bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
          mostrarError
            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
            : mostrarOk
              ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100"
              : "border-slate-300 focus:border-slate-500 focus:ring-slate-100"
        }`}
      />
      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span
          className={
            mostrarError
              ? "text-rose-600"
              : mostrarOk
                ? "text-emerald-600"
                : "text-slate-400"
          }
        >
          {mostrarError
            ? validacion.motivo
            : mostrarOk
              ? "✓ Gracias por los detalles"
              : requerida
                ? "Cuéntanos con algo de detalle"
                : ""}
        </span>
        <span
          className={`tabular-nums font-medium ${
            charCount >= regla.minCaracteres
              ? "text-emerald-600"
              : charCount > 0
                ? "text-slate-500"
                : "text-slate-300"
          }`}
        >
          {charCount}
          <span className="text-slate-300">/{regla.minCaracteres}</span>
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-abierta de Likert — SIEMPRE opcional, nunca bloquea
// Muestra sugerencias amigables, nunca errores bloqueantes
// ─────────────────────────────────────────────
function TextareaSubAbierta({
  label,
  value,
  onChange,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  const resultado = validarTextoSuave(value);

  return (
    <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
      <label className="text-sm font-medium text-slate-600">{label}</label>
      <p className="mb-2 text-xs text-slate-400">Opcional — nos ayuda a entender mejor</p>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Opcional…"
        className="w-full rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200"
      />
      {(focused || value.length > 0) && resultado.sugerencia && (
        <p className="mt-1 text-xs text-slate-400 italic">{resultado.sugerencia}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Escala Likert 1-9
// ─────────────────────────────────────────────
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
            className={`h-10 w-10 rounded-full border text-sm font-medium transition-all ${
              valor === n
                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-500 hover:bg-slate-50"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-400">
        <span>1 — Totalmente en desacuerdo</span>
        <span>9 — Totalmente de acuerdo</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Ordenamiento por prioridad
// El usuario toca las opciones en el orden de importancia.
// Primer toque = más importante. Se puede resetear.
// ─────────────────────────────────────────────
function OrdenamientoPrioridad({
  opciones,
  ayudaOrden,
  valor,
  onChange,
}: {
  opciones: OpcionFiltro[];
  ayudaOrden?: string;
  valor: string[];
  onChange: (v: string[]) => void;
}) {
  const posicionDe = (id: string) => {
    const idx = valor.indexOf(id);
    return idx === -1 ? null : idx + 1;
  };

  const toggleOpcion = (id: string) => {
    if (valor.includes(id)) {
      // Quitar del orden
      onChange(valor.filter((v) => v !== id));
    } else {
      // Agregar al final del orden
      onChange([...valor, id]);
    }
  };

  const moverArriba = (id: string) => {
    const idx = valor.indexOf(id);
    if (idx <= 0) return;
    const next = [...valor];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  };

  const moverAbajo = (id: string) => {
    const idx = valor.indexOf(id);
    if (idx === -1 || idx >= valor.length - 1) return;
    const next = [...valor];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  };

  const todosSeleccionados = valor.length === opciones.length;

  return (
    <div className="space-y-3">
      {ayudaOrden && (
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {ayudaOrden}
        </p>
      )}

      {/* Instrucción contextual */}
      {!todosSeleccionados && (
        <p className="text-sm text-slate-500">
          Toca cada afirmación en el orden de importancia (
          <strong className="text-slate-700">primero la más importante</strong>).
        </p>
      )}
      {todosSeleccionados && (
        <p className="text-sm text-emerald-700 font-medium">
          ✓ Ordenadas. Usa las flechas si quieres ajustar el orden.
        </p>
      )}

      <div className="space-y-2">
        {opciones.map((op) => {
          const pos = posicionDe(op.id);
          const seleccionada = pos !== null;

          return (
            <div
              key={op.id}
              className={`flex items-start gap-3 rounded-lg border p-3 transition-all ${
                seleccionada
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {/* Badge de posición */}
              <button
                type="button"
                onClick={() => toggleOpcion(op.id)}
                className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                  seleccionada
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-400 hover:border-slate-500"
                }`}
                title={seleccionada ? "Quitar del orden" : "Seleccionar"}
              >
                {seleccionada ? pos : "·"}
              </button>

              {/* Texto */}
              <span className={`flex-1 text-sm leading-snug ${seleccionada ? "text-slate-900" : "text-slate-600"}`}>
                {op.texto}
              </span>

              {/* Flechas de ajuste (solo si seleccionada) */}
              {seleccionada && (
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moverArriba(op.id)}
                    disabled={pos === 1}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-20"
                    title="Más importante"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moverAbajo(op.id)}
                    disabled={pos === valor.length}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-20"
                    title="Menos importante"
                  >
                    ▼
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {valor.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-xs text-slate-400 hover:text-slate-600 underline"
        >
          Reiniciar orden
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Ponderación 100 puntos
// ─────────────────────────────────────────────
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
        className={`flex items-center justify-between rounded-md p-2 text-sm font-medium transition-colors ${
          ok
            ? "bg-emerald-50 text-emerald-700"
            : total > 0
              ? "bg-amber-50 text-amber-700"
              : "bg-slate-50 text-slate-500"
        }`}
      >
        <span>Total</span>
        <span>
          {total}
          <span className="text-xs font-normal opacity-70"> / 100</span>
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Gabor-Granger — visualización secuencial
// Una tarjeta de precio a la vez, animación de entrada, botón ← Anterior
// ─────────────────────────────────────────────
function GaborGrangerSecuencial({
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
  // currentStep: índice del paso que estamos mostrando
  const [currentStep, setCurrentStep] = useState(() => {
    // Reanuda donde el usuario dejó
    const respondidos = pasos.filter((p) => valor[String(p)] !== undefined).length;
    return Math.min(respondidos, pasos.length - 1);
  });

  const [animDir, setAnimDir] = useState<"in" | "out">("in");
  const [visible, setVisible] = useState(true);

  const precio = pasos[currentStep];
  const respuestaActual = valor[String(precio)];
  const totalRespondidos = pasos.filter((p) => valor[String(p)] !== undefined).length;
  const completado = totalRespondidos === pasos.length;

  const irA = useCallback(
    (nextIdx: number, dir: "in" | "out") => {
      setVisible(false);
      setAnimDir(dir);
      setTimeout(() => {
        setCurrentStep(nextIdx);
        setAnimDir(dir === "in" ? "out" : "in");
        setVisible(true);
      }, 200);
    },
    []
  );

  const seleccionarRespuesta = (n: number) => {
    const nuevo = { ...valor, [String(precio)]: n };
    onChange(nuevo);
    // Avanzar automáticamente al siguiente paso
    if (currentStep < pasos.length - 1) {
      setTimeout(() => irA(currentStep + 1, "in"), 350);
    }
  };

  if (completado) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 space-y-2">
        <p className="font-semibold">✓ Sección completada</p>
        <p className="text-xs">Has respondido los {pasos.length} escalones de precio.</p>
        <button
          type="button"
          onClick={() => irA(pasos.length - 1, "out")}
          className="text-xs text-emerald-700 underline hover:text-emerald-900"
        >
          Revisar última respuesta
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Framing */}
      <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-sm text-slate-700">
        {framing}
      </div>

      {/* Progreso */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-slate-900 transition-all duration-300"
            style={{ width: `${(totalRespondidos / pasos.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 shrink-0">
          {totalRespondidos}/{pasos.length}
        </span>
      </div>

      {/* Tarjeta de precio — animación */}
      <div
        className={`transition-all duration-200 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <div className="rounded-xl border-2 border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-center">
            <span className="text-xs uppercase tracking-widest text-slate-400">
              Mensualidad
            </span>
            <p className="mt-1 text-4xl font-bold text-slate-900">
              ${precio}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Paso {currentStep + 1} de {pasos.length}
            </p>
          </div>

          <p className="mb-3 text-center text-sm font-medium text-slate-700">
            ¿Qué tan dispuesto está a pagar este monto?
          </p>

          {/* Escala 1-9 */}
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => seleccionarRespuesta(n)}
                className={`h-11 w-11 rounded-full border-2 text-sm font-semibold transition-all ${
                  respuestaActual === n
                    ? "border-slate-900 bg-slate-900 text-white scale-110 shadow"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-500 hover:scale-105"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>1 — Nada dispuesto</span>
            <span>9 — Muy dispuesto</span>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => irA(Math.max(0, currentStep - 1), "out")}
          disabled={currentStep === 0}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Anterior
        </button>

        {respuestaActual !== undefined && currentStep < pasos.length - 1 && (
          <button
            type="button"
            onClick={() => irA(currentStep + 1, "in")}
            className="flex items-center gap-1 text-sm text-slate-700 font-medium hover:text-slate-900"
          >
            Siguiente →
          </button>
        )}
      </div>
    </div>
  );
}

// export explícito por si se necesita referenciar desde tests
export { TextareaValidada };
