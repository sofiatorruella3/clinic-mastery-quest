export type Dificultad = "baja" | "moderada" | "dificil";

export type Aparato = {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
};

export const APARATOS: Aparato[] = [
  {
    id: "cardiovascular",
    nombre: "Cardiovascular",
    descripcion: "Dolor torácico, insuficiencia cardíaca, arritmias, HTA",
    icono: "heart",
  },
  {
    id: "respiratorio",
    nombre: "Respiratorio",
    descripcion: "Disnea, tos, EPOC, neumonías, asma",
    icono: "wind",
  },
  {
    id: "digestivo",
    nombre: "Digestivo",
    descripcion: "Abdomen agudo, hepatopatías, hemorragia digestiva",
    icono: "utensils",
  },
  {
    id: "nefrourologico",
    nombre: "Nefrourológico",
    descripcion: "IRA/IRC, litiasis, infecciones urinarias, edemas",
    icono: "droplet",
  },
  {
    id: "neurologico",
    nombre: "Neurológico",
    descripcion: "ACV, cefaleas, convulsiones, síndromes medulares",
    icono: "brain",
  },
  {
    id: "endocrino",
    nombre: "Endocrino-metabólico",
    descripcion: "Diabetes, tiroides, dislipemias, trastornos del medio interno",
    icono: "activity",
  },
  {
    id: "hematologico",
    nombre: "Hematológico",
    descripcion: "Anemias, síndromes purpúricos, adenopatías, trombosis",
    icono: "test-tube",
  },
  {
    id: "infectologia",
    nombre: "Infectología",
    descripcion: "Síndrome febril, sepsis, VIH, infecciones prevalentes",
    icono: "bug",
  },
  {
    id: "reumatologico",
    nombre: "Reumatológico / Osteoarticular",
    descripcion: "Poliartritis, lumbalgia, enfermedades autoinmunes",
    icono: "bone",
  },
  {
    id: "ginecoobstetrico",
    nombre: "Ginecoobstétrico",
    descripcion: "Control prenatal, metrorragia, dolor pelviano",
    icono: "baby",
  },
];

export const DIFICULTADES: { id: Dificultad; nombre: string; detalle: string }[] = [
  {
    id: "baja",
    nombre: "Baja",
    detalle: "Presentación típica, paciente colaborador, diagnóstico prevalente",
  },
  {
    id: "moderada",
    nombre: "Moderada",
    detalle: "Datos incompletos, comorbilidades, diagnósticos diferenciales cercanos",
  },
  {
    id: "dificil",
    nombre: "Difícil",
    detalle: "Presentación atípica, paciente poco confiable, urgencia o rareza",
  },
];

export type Caso = {
  bancoId?: string;
  titulo: string;
  ambito: string;
  motivoConsulta: string;
  paciente: {
    nombre: string;
    edad: string;
    sexo: string;
    ocupacion: string;
    apariencia: string;
  };
  signosVitales: string;
  guionOculto: {
    diagnosticoFinal: string;
    historiaCompleta: string;
    hallazgosExamenFisico: string;
    resultadosEstudios: string;
    conductaEsperada: string;
    diferenciales: string;
    personalidad: string;
  };
};

export type SolicitudEtapa = { pedido: string; hallazgo: string };

export type RespuestasSimulacion = {
  anamnesis: string;
  examenFisico: SolicitudEtapa[];
  estudios: SolicitudEtapa[];
  diagnostico: string;
  tratamiento: string;
  seguimiento: string;
};

export type EtapaId =
  | "anamnesis"
  | "examen"
  | "estudios"
  | "diagnostico"
  | "tratamiento"
  | "seguimiento"
  | "feedback";

export const ETAPAS: { id: EtapaId; nombre: string }[] = [
  { id: "anamnesis", nombre: "Anamnesis" },
  { id: "examen", nombre: "Examen físico" },
  { id: "estudios", nombre: "Estudios complementarios" },
  { id: "diagnostico", nombre: "Diagnóstico presuntivo" },
  { id: "tratamiento", nombre: "Tratamiento" },
  { id: "seguimiento", nombre: "Seguimiento" },
  { id: "feedback", nombre: "Devolución" },
];

export type FeedbackEtapa = {
  etapa: string;
  puntaje: number;
  bienHecho: string[];
  errores: string[];
  faltoRealizar: string[];
  aEvitar: string[];
  comentario: string;
};

export type Feedback = {
  puntajeGlobal: number;
  diagnosticoCorrecto: string;
  resumenGlobal: string;
  etapas: FeedbackEtapa[];
  guiasUtilizadas: string[];
  proximosPasos: string[];
};
