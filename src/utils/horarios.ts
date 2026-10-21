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

function formatearRangoDias(diaInicio: number, diaFin: number): string {
  // Si abarca toda la semana (de Domingo 0 a Sábado 6)
  if (diaInicio === 0 && diaFin === 6) {
    return "Todos los días";
  }

  if (diaInicio === diaFin) {
    return DIAS_SEMANA[diaInicio];
  }
  if (diaFin === diaInicio + 1) {
    return `${DIAS_SEMANA[diaInicio]} y ${DIAS_SEMANA[diaFin]}`;
  }
  return `${DIAS_SEMANA[diaInicio]} a ${DIAS_SEMANA[diaFin]}`;
}

export function agruparHorarios(horarios: HorarioItem[]): HorarioAgrupado[] {
  if (!horarios || horarios.length === 0) return [];

  const ordenados = [...horarios].sort((a, b) => a.dia - b.dia);
  const agrupados: HorarioAgrupado[] = [];

  let inicioGrupo = ordenados[0];
  let finGrupo = ordenados[0];
  let horaActual = `${ordenados[0].abre} a ${ordenados[0].cierra} hs`;

  for (let i = 1; i < ordenados.length; i++) {
    const actual = ordenados[i];
    const horaActualStr = `${actual.abre} a ${actual.cierra} hs`;

    if (actual.dia === finGrupo.dia + 1 && horaActualStr === horaActual) {
      finGrupo = actual;
    } else {
      agrupados.push({
        textoDias: formatearRangoDias(inicioGrupo.dia, finGrupo.dia),
        hora: horaActual,
      });
      inicioGrupo = actual;
      finGrupo = actual;
      horaActual = horaActualStr;
    }
  }

  agrupados.push({
    textoDias: formatearRangoDias(inicioGrupo.dia, finGrupo.dia),
    hora: horaActual,
  });

  return agrupados;
}