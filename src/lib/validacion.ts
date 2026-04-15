/**
 * Validación heurística para respuestas abiertas.
 * Objetivo: detectar respuestas vagas tipo "bien", "muy bueno", "no me gusta"
 * sin depender de un LLM (cero latencia, cero costo).
 *
 * Reglas combinadas:
 *  - mínimo de caracteres "útiles" (sin contar espacios)
 *  - mínimo de palabras únicas (>= 3 letras cada una)
 *  - rechazo explícito de respuestas que sean SOLO una palabra/expresión común vaga
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

export interface ResultadoValidacion {
  ok: boolean;
  motivo?: string;
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

export function validarTextoAbierto(
  texto: string,
  regla: ReglaTexto = REGLA_ABIERTA_DEFAULT
): ResultadoValidacion {
  const t = (texto ?? "").trim();
  if (!t) return { ok: false, motivo: "Esta respuesta es obligatoria." };

  const sinEspacios = t.replace(/\s+/g, "");
  if (sinEspacios.length < regla.minCaracteres) {
    return {
      ok: false,
      motivo: `Por favor amplía tu respuesta (mínimo ${regla.minCaracteres} caracteres).`,
    };
  }

  const norm = normalizar(t);
  if (VAGAS.has(norm)) {
    return {
      ok: false,
      motivo: "Esa respuesta es muy general. Cuéntanos un poco más en detalle.",
    };
  }

  const palabras = norm.split(" ").filter((w) => w.length >= 3);
  const unicas = new Set(palabras);
  if (unicas.size < regla.minPalabrasUnicas) {
    return {
      ok: false,
      motivo: `Intenta dar más detalle (al menos ${regla.minPalabrasUnicas} palabras distintas).`,
    };
  }

  // Detección de "spam" de un solo carácter o palabra repetida (ej: "nada nada nada nada")
  if (palabras.length >= 4 && unicas.size <= 2) {
    return {
      ok: false,
      motivo: "Parece que la respuesta se repite. Cuéntanos algo más concreto.",
    };
  }

  return { ok: true };
}
