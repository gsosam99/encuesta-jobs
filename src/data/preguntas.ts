import type { Pregunta, PreguntaFiltroJob, JobId } from "@/types";

// ============================================================
// MÓDULO POSICIONAMIENTO (común a todos los colegios)
// ============================================================
export const PREGUNTAS_POSICIONAMIENTO: Pregunta[] = [
  {
    id: "pos_atributo_distintivo",
    tipo: "abierta",
    enunciado:
      "Si tuviera que recomendar este colegio a un amigo, ¿cuál es la característica principal que mencionaría como su mayor fortaleza?",
    requerida: true,
  },
  {
    id: "pos_asociacion_marca",
    tipo: "opciones-list",
    enunciado: "Cuando piensa en este colegio, ¿con qué concepto lo asocia más rápido?",
    requerida: true,
    opciones: [
      { id: "tradicion", texto: "Tradición y Valores" },
      { id: "exigencia", texto: "Exigencia Académica" },
      { id: "familiar", texto: "Ambiente Familiar" },
      { id: "disciplina", texto: "Disciplina Estricta" },
    ],
  },
  {
    id: "pos_cumplimiento",
    tipo: "likert9",
    enunciado:
      "¿Qué tanto siente que el colegio ha cumplido con la razón inicial por la que decidió inscribir a su hijo?",
    subAbierta: "¿Por qué?",
    requerida: true,
  },
  {
    id: "pos_irreemplazable",
    tipo: "abierta",
    enunciado:
      "Si el colegio mañana desapareciera, ¿qué sería lo que más le costaría conseguir en otra institución?",
    requerida: true,
  },
];

// ============================================================
// MÓDULO A — FILTRO DEL JOB
// ============================================================
export const PREGUNTAS_FILTRO: PreguntaFiltroJob[] = [
  {
    id: "filtro_prioridad_exito",
    tipo: "opcion-unica",
    enunciado:
      "Al graduarse, ¿qué es lo más importante que el colegio debe haber garantizado?",
    requerida: true,
    opciones: [
      {
        id: "a",
        texto:
          "Una preparación académica de hierro y disciplina para cualquier universidad nacional o internacional.",
        job: 1,
      },
      {
        id: "b",
        texto:
          "Que sea una persona integral, segura de sí misma y que haya sido realmente feliz en su etapa escolar.",
        job: 3,
      },
      {
        id: "c",
        texto:
          "Que el colegio le haya brindado un entorno seguro, atención personalizada y me haya simplificado la logística diaria.",
        job: 2,
      },
    ],
  },
  {
    id: "filtro_vision_esfuerzo",
    tipo: "opcion-unica",
    enunciado: "Prefiero un colegio que...",
    requerida: true,
    opciones: [
      {
        id: "a",
        texto:
          "Exija el máximo rendimiento académico aunque pueda ser estresante, porque sé que así garantizo su éxito en el futuro.",
        job: 1,
      },
      {
        id: "b",
        texto:
          "Priorice el desarrollo de talentos naturales y la congruencia en valores personales.",
        job: 3,
      },
      {
        id: "c",
        texto:
          "Priorice la seguridad emocional, la calidez y el acompañamiento cercano del alumno.",
        job: 2,
      },
    ],
  },
  {
    id: "filtro_trade_off",
    tipo: "opcion-unica",
    enunciado: "Si tuviera que sacrificar algo en la educación de su hijo, sacrificaría…",
    ayuda: "Pensemos en el escenario menos malo",
    requerida: true,
    opciones: [
      {
        id: "a",
        texto:
          "Algo de cercanía emocional y comunidad, si a cambio obtengo excelencia académica medible.",
        job: 1,
      },
      {
        id: "b",
        texto:
          "Algo de exigencia académica, si a cambio mi hijo es feliz y crece con valores afines a los nuestros.",
        job: 3,
      },
      {
        id: "c",
        texto:
          "Algo de prestigio o ranking, si a cambio mi hijo está seguro, atendido y con todo resuelto en un mismo lugar.",
        job: 2,
      },
    ],
  },
];

// ============================================================
// MÓDULO B — PREGUNTAS POR JOB
// ============================================================

// ---- JOB 1: Disciplina y Excelencia Académica ----
const JOB1_PREGUNTAS: Pregunta[] = [
  {
    id: "job1_ponderacion",
    tipo: "ponderacion-100",
    enunciado:
      "Si tuviera 100 puntos para 'comprar' la excelencia de un colegio, ¿cómo los repartiría entre estos atributos? (la suma debe dar 100)",
    requerida: true,
    atributos: [
      { id: "ingles", etiqueta: "Nivel de Inglés (certificaciones internacionales)" },
      { id: "rigor", etiqueta: "Rigor en evaluación (que el 20 sea de calidad)" },
      { id: "disciplina", etiqueta: "Disciplina y formación de carácter" },
      { id: "marca", etiqueta: "Prestigio de la 'marca' del colegio" },
      { id: "universidades", etiqueta: "Resultados de ingreso a universidades" },
      { id: "tecnologia", etiqueta: "Tecnología/innovación como herramienta de estudio" },
    ],
  },
  {
    id: "job1_atributo_emergente",
    tipo: "abierta",
    enunciado:
      "Más allá de lo anterior, ¿cuál es el estándar de excelencia que más destaca del colegio donde están sus hijos?",
  },
  {
    id: "job1_porque_atributo",
    tipo: "abierta",
    enunciado: "¿Por qué este factor 'mueve la aguja' para usted?",
  },
  {
    id: "job1_calidad_titulo",
    tipo: "likert9",
    enunciado:
      "Estoy seguro que un 20 de este colegio es superior a un 20 de cualquier otro colegio.",
    subAbierta: "¿Por qué?",
    requerida: true,
  },
  {
    id: "job1_bilinguismo",
    tipo: "likert9",
    enunciado:
      "Siento que el nivel de inglés del colegio le permitirá a mi hijo estudiar en el extranjero sin necesidad de cursos adicionales.",
    requerida: true,
  },
  {
    id: "job1_disciplina",
    tipo: "likert9",
    enunciado:
      "El código de conducta del colegio fomenta hábitos de estudio y responsabilidad que mi hijo aplica sin supervisión constante.",
    subAbierta: "¿Por qué?",
    requerida: true,
  },
  {
    id: "job1_red",
    tipo: "likert9",
    enunciado:
      "Siento que el colegio garantiza que mi hijo se relacione con un círculo social que comparte mis estándares de excelencia y ambición.",
    subAbierta: "¿Por qué?",
    requerida: true,
  },
  {
    id: "job1_curricular_externo",
    tipo: "likert9",
    enunciado:
      "El posicionamiento del colegio en actividades como Olimpiadas de Matemáticas o MUN lo hace superior a otras opciones.",
    requerida: true,
  },
  {
    id: "job1_prestigio_universidad",
    tipo: "likert9",
    enunciado:
      "¿Qué tanto considera que el nombre de este colegio facilita el proceso de admisión en las mejores universidades del país?",
    subAbierta: "¿Por qué?",
    requerida: true,
  },
];

// ---- JOB 2: Seguridad, atención personalizada y simplificación logística ----
const JOB2_PREGUNTAS: Pregunta[] = [
  {
    id: "job2_ponderacion",
    tipo: "ponderacion-100",
    enunciado:
      "Si tuviera 100 puntos para 'comprar' la tranquilidad de un colegio, ¿cómo los repartiría entre estos atributos? (la suma debe dar 100)",
    requerida: true,
    atributos: [
      { id: "atencion", etiqueta: "Atención personalizada (clases pequeñas, conocen a mi hijo)" },
      { id: "seguridad", etiqueta: "Seguridad física y emocional del alumno" },
      { id: "logistica", etiqueta: "Logística integrada (transporte, comedor, extracurriculares)" },
      { id: "comunicacion", etiqueta: "Comunicación cercana familia–colegio" },
      { id: "acompanamiento", etiqueta: "Acompañamiento socioemocional / psicopedagógico" },
      { id: "comunidad", etiqueta: "Comunidad de padres afín y de soporte" },
    ],
  },
  {
    id: "job2_atributo_emergente",
    tipo: "abierta",
    enunciado:
      "Más allá de lo anterior, ¿cuál es el aspecto del colegio que más le da tranquilidad como padre/madre?",
  },
  {
    id: "job2_porque_atributo",
    tipo: "abierta",
    enunciado: "¿Por qué este factor 'mueve la aguja' para usted?",
  },
  {
    id: "job2_conocen_hijo",
    tipo: "likert9",
    enunciado:
      "Siento que en este colegio conocen a mi hijo por su nombre, sus fortalezas y sus necesidades.",
    subAbierta: "¿Por qué?",
    requerida: true,
  },
  {
    id: "job2_resuelve_logistica",
    tipo: "likert9",
    enunciado:
      "El colegio me resuelve la logística diaria (horarios, comidas, actividades, transporte) sin que tenga que estar pendiente.",
    requerida: true,
  },
  {
    id: "job2_actuar_emergencia",
    tipo: "likert9",
    enunciado:
      "Confío plenamente en que el colegio actuará bien si algo le pasa a mi hijo (emocional o físicamente).",
    subAbierta: "¿Por qué?",
    requerida: true,
  },
  {
    id: "job2_feedback",
    tipo: "likert9",
    enunciado:
      "El feedback que recibo del colegio sobre mi hijo es constante, claro y útil.",
    requerida: true,
  },
  {
    id: "job2_comunidad_padres",
    tipo: "likert9",
    enunciado:
      "Me siento parte de una comunidad de padres afín, que valora lo mismo que yo para sus hijos.",
    subAbierta: "¿Por qué?",
    requerida: true,
  },
  {
    id: "job2_preparado_vida",
    tipo: "likert9",
    enunciado:
      "Aun siendo un entorno cercano y protegido, siento que el colegio prepara a mi hijo para defenderse en el mundo real.",
    requerida: true,
  },
];

// ---- JOB 3: Integralidad, valores y felicidad ----
const JOB3_PREGUNTAS: Pregunta[] = [
  {
    id: "job3_ponderacion",
    tipo: "ponderacion-100",
    enunciado:
      "Si tuviera 100 puntos para 'comprar' la integralidad de un colegio, ¿cómo los repartiría entre estos atributos? (la suma debe dar 100)",
    requerida: true,
    atributos: [
      { id: "valores", etiqueta: "Coherencia de valores familia–colegio" },
      { id: "diversidad", etiqueta: "Diversidad de la comunidad y apertura" },
      { id: "artes_deportes", etiqueta: "Oferta artística, deportiva y cultural" },
      { id: "socioemocional", etiqueta: "Desarrollo socioemocional explícito" },
      { id: "talentos", etiqueta: "Detección y potenciación de talentos naturales" },
      { id: "libertad", etiqueta: "Libertad para que mi hijo se exprese y decida" },
    ],
  },
  {
    id: "job3_atributo_emergente",
    tipo: "abierta",
    enunciado:
      "Más allá de lo anterior, ¿cuál es la cualidad del colegio que más celebra como padre/madre?",
  },
  {
    id: "job3_porque_atributo",
    tipo: "abierta",
    enunciado: "¿Por qué este factor 'mueve la aguja' para usted?",
  },
  {
    id: "job3_ser_el_mismo",
    tipo: "likert9",
    enunciado:
      "En este colegio mi hijo puede ser él mismo sin tener que encajar en un molde rígido.",
    subAbierta: "¿Por qué?",
    requerida: true,
  },
  {
    id: "job3_valores",
    tipo: "likert9",
    enunciado:
      "El colegio comparte y refuerza los valores que vivimos en casa.",
    subAbierta: "¿Por qué?",
    requerida: true,
  },
  {
    id: "job3_talentos",
    tipo: "likert9",
    enunciado:
      "El colegio detecta y potencia los talentos naturales de mi hijo, más allá de lo estrictamente académico.",
    requerida: true,
  },
  {
    id: "job3_comunidad",
    tipo: "likert9",
    enunciado:
      "Mi hijo encontró aquí su comunidad y amigos con quienes se siente verdaderamente parte.",
    subAbierta: "¿Por qué?",
    requerida: true,
  },
  {
    id: "job3_felicidad",
    tipo: "likert9",
    enunciado:
      "Mi hijo va al colegio con entusiasmo y se siente feliz allí.",
    requerida: true,
  },
  {
    id: "job3_diversidad",
    tipo: "likert9",
    enunciado:
      "El colegio expone a mi hijo a una diversidad de personas y perspectivas que enriquecen su formación.",
    requerida: true,
  },
];

// ---- GABOR-GRANGER (precio) por Job ----
const PASOS_PRECIO = [250, 300, 350, 400, 450, 500, 550, 600, 650, 700];

const GABOR_BY_JOB: Record<JobId, Pregunta> = {
  1: {
    id: "precio_job1",
    tipo: "gabor-granger",
    enunciado: "Disposición a pagar (mensualidad)",
    framing:
      "Considerando una institución que garantice una preparación académica de hierro, bilingüismo real y una disciplina que forme el carácter para el éxito universitario, ¿qué tan dispuesto está a pagar este monto?",
    inicio: 250,
    pasos: PASOS_PRECIO,
    requerida: true,
  },
  2: {
    id: "precio_job2",
    tipo: "gabor-granger",
    enunciado: "Disposición a pagar (mensualidad)",
    framing:
      "Considerando una institución que ofrezca atención personalizada, un entorno seguro y cálido, y resuelva la logística diaria de su familia, ¿qué tan dispuesto está a pagar este monto?",
    inicio: 250,
    pasos: PASOS_PRECIO,
    requerida: true,
  },
  3: {
    id: "precio_job3",
    tipo: "gabor-granger",
    enunciado: "Disposición a pagar (mensualidad)",
    framing:
      "Considerando una institución que ofrezca una educación integral, coherente con los valores de su familia, donde su hijo pueda desarrollar sus talentos y ser realmente feliz, ¿qué tan dispuesto está a pagar este monto?",
    inicio: 250,
    pasos: PASOS_PRECIO,
    requerida: true,
  },
};

export const PREGUNTAS_POR_JOB: Record<JobId, Pregunta[]> = {
  1: JOB1_PREGUNTAS,
  2: JOB2_PREGUNTAS,
  3: JOB3_PREGUNTAS,
};

export const PREGUNTA_PRECIO_POR_JOB = GABOR_BY_JOB;

export const ETIQUETAS_JOB: Record<JobId, { titulo: string; descripcion: string }> = {
  1: {
    titulo: "Disciplina y Excelencia Académica",
    descripcion:
      "Cuando priorizo la disciplina y la excelencia académica, quiero una institución que garantice una preparación superior para mis hijos, de modo que tengan las herramientas necesarias para prosperar y asegurar su éxito futuro.",
  },
  2: {
    titulo: "Seguridad, Atención y Logística",
    descripcion:
      "Cuando me abruma la logística diaria y me preocupa que el mundo sea un reto para mis hijos, busco un colegio que los prepare para la vida en un entorno seguro y especializado.",
  },
  3: {
    titulo: "Integralidad, Valores y Felicidad",
    descripcion:
      "Cuando busco que la educación de mi hijo sea coherente con nuestros valores, quiero un entorno integral y diverso donde él pueda ser él mismo y crecer con una comunidad que lo haga realmente feliz.",
  },
};
