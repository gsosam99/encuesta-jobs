import type { JobId, OpcionFiltro } from "@/types";
import { PREGUNTAS_FILTRO } from "@/data/preguntas";

export interface JobScores {
  job1: number;
  job2: number;
  job3: number;
}

/**
 * Calcula los scores de cada Job a partir de las respuestas del filtro.
 * Cada selección suma 1 punto al Job asociado a esa opción.
 */
export function calcularScores(
  respuestasFiltro: Record<string, string>
): JobScores {
  const scores: JobScores = { job1: 0, job2: 0, job3: 0 };
  for (const pregunta of PREGUNTAS_FILTRO) {
    const opcionId = respuestasFiltro[pregunta.id];
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
 * Determina el Job ganador. En caso de empate, prioriza Job 1 > Job 3 > Job 2
 * (el orden refleja el peso estratégico definido por el cliente).
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
