export type JobId = 1 | 2 | 3;

export interface Colegio {
  id: string;
  nombre: string;
  slug: string;
  activo: boolean;
  created_at: string;
}

export type RespuestaValor = string | number | string[] | Record<string, number>;

export interface RespuestaPayload {
  posicionamiento: Record<string, RespuestaValor>;
  filtro: Record<string, RespuestaValor>;
  job_especifico: Record<string, RespuestaValor>;
  precio: Record<string, RespuestaValor>;
}

export interface RespuestaCompleta extends RespuestaPayload {
  id: string;
  colegio_id: string;
  nombre: string | null;
  email: string | null;
  job_asignado: JobId | null;
  scores: { job1: number; job2: number; job3: number };
  completada: boolean;
  created_at: string;
}

export type TipoPregunta =
  | "likert9"          // escala 1-9 con sub-abierta opcional
  | "abierta"          // texto libre con validación mínima
  | "opcion-unica"     // radio con opciones que mapean a Job (filtro Q1)
  | "ordenamiento"     // ordenar opciones por prioridad (filtro Q2, Q3)
  | "opciones-list"    // selección simple sin scoring de Job
  | "ponderacion-100"  // distribuir 100 puntos entre N atributos
  | "gabor-granger";   // precio escalonado — visualización secuencial

export interface OpcionFiltro {
  id: string;
  texto: string;
  job: JobId;
}

export interface PreguntaBase {
  id: string;
  tipo: TipoPregunta;
  enunciado: string;
  ayuda?: string;
  requerida?: boolean;
}

export interface PreguntaLikert extends PreguntaBase {
  tipo: "likert9";
  /** Texto de la sub-pregunta abierta. Si existe, se muestra pero no es obligatoria. */
  subAbierta?: string;
}

export interface PreguntaAbierta extends PreguntaBase {
  tipo: "abierta";
  placeholder?: string;
}

export interface PreguntaFiltroJob extends PreguntaBase {
  tipo: "opcion-unica";
  opciones: OpcionFiltro[];
}

/**
 * El usuario ordena las opciones de mayor a menor importancia.
 * El valor almacenado es string[] con los IDs en el orden elegido.
 * Para scoring solo se usa el primer elemento (posición 1).
 */
export interface PreguntaOrdenamiento extends PreguntaBase {
  tipo: "ordenamiento";
  opciones: OpcionFiltro[];
  ayudaOrden?: string;
}

export interface PreguntaOpciones extends PreguntaBase {
  tipo: "opciones-list";
  opciones: { id: string; texto: string }[];
}

export interface PreguntaPonderacion extends PreguntaBase {
  tipo: "ponderacion-100";
  atributos: { id: string; etiqueta: string }[];
}

export interface PreguntaGaborGranger extends PreguntaBase {
  tipo: "gabor-granger";
  framing: string;
  inicio: number;
  pasos: number[];
}

export type Pregunta =
  | PreguntaLikert
  | PreguntaAbierta
  | PreguntaFiltroJob
  | PreguntaOrdenamiento
  | PreguntaOpciones
  | PreguntaPonderacion
  | PreguntaGaborGranger;

export type PreguntaFiltro = PreguntaFiltroJob | PreguntaOrdenamiento;
