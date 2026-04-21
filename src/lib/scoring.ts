import type { JobId, OpcionFiltro, PreguntaFiltro } from "@/types";
import { PREGUNTAS_FILTRO } from "@/data/preguntas";

export interface JobScores {
  job1: number;
  job2: number;
  job3: number;
}

/**
 * Calcula los scores de cada Job a partir de las respuestas del módulo filtro.
 *
 * Lógica por tipo de pregunta:
 * - "opcion-unica": la opción seleccionada suma 1 punto al Job mapeado.
 * - "ordenamiento": la opción en posición 1 (más importante) suma 1 punto.
 *   Las posiciones 2 y 3 se guardan para análisis pero no afectan el score.
 */
export function calcularScores(
  respuestasFiltro: Record<string, string | string[]>
): JobScores {
  const scores: JobScores = { job1: 0, job2: 0, job3: 0 };

  for (const pregunta of PREGUNTAS_FILTRO as PreguntaFiltro[]) {
    const valor = respuestasFiltro[pregunta.id];
    if (!valor) continue;

    let opcionId: string | undefined;

    if (pregunta.tipo === "opcion-unica") {
      opcionId = valor as string;
    } else if (pregunta.tipo === "ordenamiento") {
      const ordenada = valor as string[];
      opcionId = ordenada[0]; // solo la primera posición suma al score
    }

    if (!opcionId) continue;

    const opcion: OpcionFiltro | undefined = pregunta.opciones.find(
      (o) => o.id === opcionId
    );
    if (!opcion) continue;

    const key = `job${opcion.job}` as keyof JobScores;
    scores[key] += 1;
  }

  return scores;
}

/**
 * Determina el Job ganador. Empate: prioriza Job 1 > Job 3 > Job 2.
 */
export function determinarJob(scores: JobScores): JobId {
  const ordenado: { job: JobId; score: number; prioridad: number }[] = [
    { job: 1, score: scores.job1, prioridad: 0 },
    { job: 3, score: scores.job3, prioridad: 1 },
    { job: 2, score: scores.job2, prioridad: 2 },
  ];
  ordenado.sort((a, b) => b.score - a.score || a.prioridad - b.prioridad);
  return ordenado[0].job;
}
