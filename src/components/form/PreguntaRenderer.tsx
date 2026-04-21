"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Pregunta, RespuestaValor, OpcionFiltro } from "@/types";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
//
// Estrategia de debounce:
//  - El contador de caracteres se actualiza en tiempo real (feedback positivo).
//  - La validación (mensajes de error/ok) solo se dispara después de que el
//    usuario deja de escribir por DEBOUNCE_MS ms, o inmediatamente al perder
//    el foco (onBlur) o al intentar avanzar (forceValidate).
// ─────────────────────────────────────────────
const DEBOUNCE_MS = 700;

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

  // `debouncedValue` es el valor sobre el que se calcula la validación mostrada.
  // Se actualiza con retraso mientras el usuario escribe, inmediatamente en blur.
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref que siempre tiene el valor más reciente (para usar dentro del timeout)
  const latestValueRef = useRef(value);

  // Sincronizar ref con prop en cada render
  latestValueRef.current = value;

  // Cuando forceValidate se activa, sincronizar inmediatamente para mostrar errores
  useEffect(() => {
    if (forceValidate) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setDebouncedValue(latestValueRef.current);
    }
  }, [forceValidate]);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    // Resetear timer — la validación espera a que el usuario pause
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedValue(latestValueRef.current);
    }, DEBOUNCE_MS);
  };

  const handleBlur = () => {
    // Al perder el foco: sincronizar inmediatamente y marcar como tocado
    if (timerRef.current) clearTimeout(timerRef.current);
    setDebouncedValue(latestValueRef.current);
    setTouched(true);
  };

  // El contador de caracteres se lee del valor en vivo (no debounced)
  const charCount = contarCaracteres(value);

  // La validación se calcula sobre el valor debounced
  const validacion = requerida
    ? validarTextoAbierto(debouncedValue, regla)
    : { ok: true };
  const mostrarError = (touched || forceValidate) && !validacion.ok;
  const mostrarOk = validacion.ok && debouncedValue.trim().length > 0;

  return (
    <div className={className}>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder ?? "Escribe tu respuesta aquí…"}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
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
// Muestra sugerencias amigables solo cuando el usuario para de escribir
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
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef(value);
  latestRef.current = value;

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedValue(latestRef.current);
    }, DEBOUNCE_MS);
  };

  const handleBlur = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDebouncedValue(latestRef.current);
    setFocused(false);
  };

  // La sugerencia se calcula sobre el valor debounced para no cambiar mientras escribe
  const resultado = validarTextoSuave(debouncedValue);

  return (
    <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
      <label className="text-sm font-medium text-slate-600">{label}</label>
      <p className="mb-2 text-xs text-slate-400">Opcional — nos ayuda a entender mejor</p>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        placeholder="Opcional…"
        className="w-full rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200"
      />
      {(focused || debouncedValue.length > 0) && resultado.sugerencia && (
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
// Ordenamiento por prioridad — drag & drop con @dnd-kit
//
// UX:
//  - Las tarjetas se arrastran (mouse y touch).
//  - Teclado: Tab para enfocar, Espacio para agarrar, flechas para mover, Espacio/Enter para soltar.
//  - Badge numérico muestra la posición actual.
//  - Ícono de handle (⠿) indica arrastrable.
//  - Estado completado cuando todas están ordenadas.
// ─────────────────────────────────────────────

/** Ítem individual sortable */
function SortableItem({
  id,
  posicion,
  texto,
}: {
  id: string;
  posicion: number;
  texto: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-white p-3 transition-shadow ${
        isDragging
          ? "border-slate-400 shadow-lg opacity-80 z-10"
          : "border-slate-200 shadow-sm hover:border-slate-300"
      }`}
    >
      {/* Badge de posición */}
      <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white select-none">
        {posicion}
      </span>

      {/* Texto */}
      <span className="flex-1 text-sm text-slate-800 leading-snug select-none">
        {texto}
      </span>

      {/* Handle de arrastre */}
      <button
        type="button"
        className={`shrink-0 cursor-grab touch-none rounded p-1 text-slate-400 hover:text-slate-600 active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-slate-300 ${
          isDragging ? "cursor-grabbing" : ""
        }`}
        aria-label="Arrastrar para reordenar"
        {...attributes}
        {...listeners}
      >
        {/* Ícono de 6 puntos (grip vertical) */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
          <circle cx="4" cy="2" r="1.5" />
          <circle cx="10" cy="2" r="1.5" />
          <circle cx="4" cy="7" r="1.5" />
          <circle cx="10" cy="7" r="1.5" />
          <circle cx="4" cy="12" r="1.5" />
          <circle cx="10" cy="12" r="1.5" />
        </svg>
      </button>
    </div>
  );
}

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
  // Si aún no hay orden establecido, inicializar con el orden original
  const ordenActual = valor.length === opciones.length
    ? valor
    : opciones.map((o) => o.id);

  // Sincronizar estado interno cuando el padre aún no tiene orden
  useEffect(() => {
    if (valor.length !== opciones.length) {
      onChange(opciones.map((o) => o.id));
    }
    // Solo en mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Requiere mover 8px antes de iniciar drag (evita clicks accidentales)
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ordenActual.indexOf(String(active.id));
    const newIndex = ordenActual.indexOf(String(over.id));
    onChange(arrayMove(ordenActual, oldIndex, newIndex));
  };

  const textoDeId = (id: string) =>
    opciones.find((o) => o.id === id)?.texto ?? id;

  return (
    <div className="space-y-3">
      {ayudaOrden && (
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {ayudaOrden}
        </p>
      )}

      <p className="text-sm text-slate-500">
        Arrastra las opciones para ordenarlas de{" "}
        <strong className="text-slate-700">más importante</strong> (arriba) a{" "}
        <strong className="text-slate-700">menos importante</strong> (abajo).
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={ordenActual}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {ordenActual.map((id, idx) => (
              <SortableItem
                key={id}
                id={id}
                posicion={idx + 1}
                texto={textoDeId(id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
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

  const [visible, setVisible] = useState(true);

  // `revisando` permite mostrar la tarjeta aunque `completado` sea true.
  // Se activa con "Revisar última respuesta" y se desactiva al volver al resumen.
  const [revisando, setRevisando] = useState(false);

  const precio = pasos[currentStep];
  const respuestaActual = valor[String(precio)];
  const totalRespondidos = pasos.filter((p) => valor[String(p)] !== undefined).length;
  const completado = totalRespondidos === pasos.length;

  const irA = useCallback(
    (nextIdx: number) => {
      setVisible(false);
      setTimeout(() => {
        setCurrentStep(nextIdx);
        setVisible(true);
      }, 200);
    },
    []
  );

  const seleccionarRespuesta = (n: number) => {
    const nuevo = { ...valor, [String(precio)]: n };
    onChange(nuevo);
    // Avanzar automáticamente al siguiente paso (solo si no hemos terminado aún)
    if (currentStep < pasos.length - 1) {
      setTimeout(() => irA(currentStep + 1), 350);
    } else {
      // Último paso respondido: salir del modo revisión y mostrar resumen
      setRevisando(false);
    }
  };

  if (completado && !revisando) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 space-y-2">
        <p className="font-semibold">✓ Sección completada</p>
        <p className="text-xs">Has respondido los {pasos.length} escalones de precio.</p>
        <button
          type="button"
          onClick={() => {
            setRevisando(true);
            irA(pasos.length - 1);
          }}
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
        {/* ← Anterior: siempre visible, deshabilitado en el primer paso */}
        <button
          type="button"
          onClick={() => irA(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="text-sm text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Anterior
        </button>

        {/* Siguiente → solo visible en modo revisión.
            En el último paso va al resumen; en los demás avanza una tarjeta. */}
        {revisando && (
          <button
            type="button"
            onClick={() =>
              currentStep === pasos.length - 1
                ? setRevisando(false)
                : irA(currentStep + 1)
            }
            className="text-sm text-slate-700 font-medium hover:text-slate-900"
          >
            {currentStep === pasos.length - 1 ? "Ver resumen →" : "Siguiente →"}
          </button>
        )}
      </div>
    </div>
  );
}

// export explícito por si se necesita referenciar desde tests
export { TextareaValidada };
