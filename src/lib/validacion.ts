/**
 * Validación heurística para respuestas abiertas.
 *
 * Dos niveles de validación:
 *  - ESTRICTA (requerida: true en preguntas tipo "abierta"): bloquea avance.
 *  - SUAVE (sub-abiertas de Likert): recomienda sin bloquear.
 *
 * Reglas de validación estricta:
 *  - Mínimo de caracteres útiles (sin contar espacios)
 *  - Mínimo de palabras únicas (>= 3 letras cada una)
 *  - Blocklist de respuestas vagas normalizadas
 *  - Anti-spam (palabra repetida)
 *
 * Mensajes: contextuales y amigables. Solo se muestran al perder foco (blur)
 * o al intentar avanzar — no durante la escritura activa.
 */

const VAGAS = new Set([
  "bien",
  "mal",
  "bueno",
  "muy bueno",
  "buena",
  "muy buena",
  "buenisimo",
  "buenísimo",
  "excelente",
  "perfecto",
  "regular",
  "ok",
  "okay",
  "okey",
  "si",
  "sí",
  "no",
  "nada",
  "ninguno",
  "ninguna",
  "todo",
  "todo bien",
  "no se",
  "no sé",
  "no me gusta",
  "me gusta",
  "no aplica",
  "n/a",
  "na",
  "x",
  "asi asi",
  "así así",
  "mas o menos",
  "más o menos",
  "depende",
  "puede ser",
  "tal vez",
  "no opino",
  "sin opinion",
  "sin opinión",
]);

/** Mensajes contextuales amigables para guiar sin imponer */
const MENSAJES_AMIGABLES = [
  "Cuéntanos un poco más sobre esto…",
  "¿Podrías darnos más detalles?",
  "¿A qué te refieres exactamente con eso?",
  "Nos ayuda mucho cuando desarrollas un poco más.",
  "¿Puedes contarnos qué lo hace especial para ti?",
];

export interface ResultadoValidacion {
  ok: boolean;
  /** Mensaje a mostrar cuando el campo tiene foco o se intenta avanzar */
  motivo?: string;
  /** Mensaje suave (recomendación, nunca bloquea) */
  sugerencia?: string;
}

export interface ReglaTexto {
  minCaracteres: number;
  minPalabrasUnicas: number;
}

export const REGLA_ABIERTA_DEFAULT: ReglaTexto = {
  minCaracteres: 40,
  minPalabrasUnicas: 6,
};

export const REGLA_SUB_ABIERTA: ReglaTexto = {
  minCaracteres: 25,
  minPalabrasUnicas: 4,
};

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:"'()\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mensajeAmigable(texto: string): string {
  // Selección determinista basada en la longitud del texto para evitar cambios aleatorios
  return MENSAJES_AMIGABLES[texto.length % MENSAJES_AMIGABLES.length];
}

/**
 * Validación ESTRICTA — bloquea el avance si no pasa.
 * Usar en campos tipo "abierta" con requerida: true.
 */
export function validarTextoAbierto(
  texto: string,
  regla: ReglaTexto = REGLA_ABIERTA_DEFAULT
): ResultadoValidacion {
  const t = (texto ?? "").trim();
  if (!t) return { ok: false, motivo: "Esta respuesta es obligatoria." };

  // BUG FIX: sinEspacios ya es un number, no llamar .length de nuevo
  const sinEspacios = t.replace(/\s+/g, "").length;
  if (sinEspacios < regla.minCaracteres) {
    return {
      ok: false,
      motivo: mensajeAmigable(t),
    };
  }

  const norm = normalizar(t);
  if (VAGAS.has(norm)) {
    return {
      ok: false,
      motivo: "Esa respuesta es muy general. ¿Podrías darnos más detalles?",
    };
  }

  const palabras = norm.split(" ").filter((w) => w.length >= 3);
  const unicas = new Set(palabras);
  if (unicas.size < regla.minPalabrasUnicas) {
    return {
      ok: false,
      motivo: "¿A qué te refieres exactamente? Cuéntanos un poco más.",
    };
  }

  if (palabras.length >= 4 && unicas.size <= 2) {
    return {
      ok: false,
      motivo: "Parece que la respuesta se repite. Cuéntanos algo más concreto.",
    };
  }

  return { ok: true };
}

/**
 * Validación SUAVE — nunca bloquea. Solo devuelve sugerencia si aplica.
 * Usar en sub-abiertas de Likert (el "¿Por qué?" opcional).
 */
export function validarTextoSuave(texto: string): ResultadoValidacion {
  const t = (texto ?? "").trim();
  if (!t) return { ok: true, sugerencia: "Opcional: compartir el motivo nos ayuda a entender mejor." };

  const sinEspacios = t.replace(/\s+/g, "").length;
  if (sinEspacios < REGLA_SUB_ABIERTA.minCaracteres) {
    return {
      ok: true, // SIEMPRE ok — es recomendación
      sugerencia: mensajeAmigable(t),
    };
  }

  const norm = normalizar(t);
  if (VAGAS.has(norm)) {
    return {
      ok: true,
      sugerencia: "¿Podrías ser un poco más específico/a?",
    };
  }

  return { ok: true };
}

/** Cuenta caracteres útiles (sin espacios) para mostrar en el contador */
export function contarCaracteres(texto: string): number {
  return (texto ?? "").replace(/\s+/g, "").length;
}
