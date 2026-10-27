// src/utils/horarios.ts

const DIAS_SEMANA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

interface HorarioItem {
  dia: number;
  abre: string;
  cierra: string;
}

export interface HorarioAgrupado {
  textoDias: string;
  hora: string;
}

export function agruparHorarios(horarios: HorarioItem[]): HorarioAgrupado[] {
  if (!horarios || horarios.length === 0) {
    return [{ textoDias: "Todos los días", hora: "Cerrado" }];
  }

  // 1. Mapeamos los 7 días de la semana (0 a 6)
  const mapaDias: { [dia: number]: string[] } = {};
  for (let d = 0; d <= 6; d++) {
    mapaDias[d] = [];
  }

  horarios.forEach((h) => {
    const rangoStr = `${h.abre} a ${h.cierra} hs`;
    if (mapaDias[h.dia]) {
      mapaDias[h.dia].push(rangoStr);
    }
  });

  // Definimos explícitamente la interfaz o tipo para el array
  interface DiaProcesado {
    dia: number;
    horasTexto: string;
  }

  const diasProcesados: DiaProcesado[] = [];
  for (let d = 0; d <= 6; d++) {
    const turnos = mapaDias[d];
    let horasTexto = "Cerrado";
    if (turnos.length > 0) {
      horasTexto = turnos.join(" y ");
    }
    diasProcesados.push({ dia: d, horasTexto });
  }

  // 2. Reordenamos el array para que empiece desde el Lunes (1) hasta el Domingo (0)
  const ordenLogico = [1, 2, 3, 4, 5, 6, 0];
  const diasOrdenados: DiaProcesado[] = ordenLogico.map(
    (d) => diasProcesados.find((item) => item.dia === d)!
  );

  // 3. Agrupamos días consecutivos que comparten exactamente los mismos horarios
  const agrupados: HorarioAgrupado[] = [];
  let inicioGrupo = diasOrdenados[0].dia;
  let finGrupo = diasOrdenados[0].dia;
  let horaActual = diasOrdenados[0].horasTexto;

  const esDiaSiguiente = (diaAnterior: number, diaSiguiente: number) => {
    if (diaAnterior === 6 && diaSiguiente === 0) return true; // Sábado -> Domingo
    return diaSiguiente === diaAnterior + 1;
  };

  for (let i = 1; i < diasOrdenados.length; i++) {
    const actual = diasOrdenados[i];

    if (actual.horasTexto === horaActual && esDiaSiguiente(finGrupo, actual.dia)) {
      finGrupo = actual.dia;
    } else {
      agrupados.push({
        textoDias: formatearRangoDiasSecuencia(inicioGrupo, finGrupo),
        hora: horaActual,
      });
      inicioGrupo = actual.dia;
      finGrupo = actual.dia;
      horaActual = actual.horasTexto;
    }
  }

  // Añadir el último grupo pendiente
  agrupados.push({
    textoDias: formatearRangoDiasSecuencia(inicioGrupo, finGrupo),
    hora: horaActual,
  });

  return agrupados;
}

function formatearRangoDiasSecuencia(inicio: number, fin: number): string {
  if (inicio === 1 && fin === 0) {
    return "Todos los días";
  }
  if (inicio === fin) {
    return DIAS_SEMANA[inicio];
  }
  return `${DIAS_SEMANA[inicio]} a ${DIAS_SEMANA[fin]}`;
}