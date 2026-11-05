import type { AccionDisponible, Hex, Vista } from '@/lib/esquemas';
import type { Objetivo } from './Tablero';

/** Lo que el jugador está haciendo con el tablero: qué pasará al tocar un vértice, arista o casilla. */
export type Modo = 'POBLADO' | 'CIUDAD' | 'CAMINO' | 'CARRETERAS' | 'LADRON' | 'CABALLERO';

/** Si me toca actuar (en la construcción especial manda otro campo que en el turno normal). */
export function esMiTurno(vista: Vista): boolean {
  if (vista.yo === null || vista.fase === 'FIN') return false;
  return vista.fase === 'CONSTRUCCION_ESPECIAL'
    ? vista.turnoEspecialDe === vista.yo
    : vista.turnoDe === vista.yo;
}

/**
 * En la preparación y al mover el ladrón la fase decide qué se hace; el resto del tiempo lo elige
 * el jugador. Sin turno no hay modo.
 */
export function modoEfectivo(vista: Vista, elegido: Modo | null): Modo | null {
  if (!esMiTurno(vista)) return null;
  if (vista.fase === 'PREPARACION_POBLADO') return 'POBLADO';
  if (vista.fase === 'PREPARACION_CAMINO') return 'CAMINO';
  if (vista.fase === 'MOVER_LADRON') return 'LADRON';
  return elegido;
}

export function objetivoDe(modo: Modo | null): Objetivo {
  switch (modo) {
    case 'POBLADO':
      return 'POBLADOS';
    case 'CIUDAD':
      return 'CIUDADES';
    case 'CAMINO':
    case 'CARRETERAS':
      return 'ARISTAS';
    case 'LADRON':
    case 'CABALLERO':
      return 'CASILLAS';
    default:
      return null;
  }
}

export function accionDeVertice(vista: Vista, modo: Modo | null, vertice: string): object | null {
  if (modo === 'POBLADO') {
    const tipo =
      vista.fase === 'PREPARACION_POBLADO' ? 'COLOCAR_POBLADO_INICIAL' : 'CONSTRUIR_POBLADO';
    return { tipo, vertice };
  }
  return modo === 'CIUDAD' ? { tipo: 'CONSTRUIR_CIUDAD', vertice } : null;
}

export function accionDeArista(vista: Vista, modo: Modo | null, arista: string): object | null {
  if (modo !== 'CAMINO') return null;
  const tipo = vista.fase === 'PREPARACION_CAMINO' ? 'COLOCAR_CAMINO_INICIAL' : 'CONSTRUIR_CAMINO';
  return { tipo, arista };
}

export function accionDeLadron(
  modo: Modo | null,
  destino: Hex,
  victima: string | null,
): object | null {
  if (modo === 'LADRON') return { tipo: 'MOVER_LADRON', destino, victima };
  return modo === 'CABALLERO' ? { tipo: 'JUGAR_CABALLERO', destino, victima } : null;
}

/** El servidor marca cada tipo de acción como disponible o no; esto lo consulta. */
export function disponible(acciones: readonly AccionDisponible[], tipo: string): boolean {
  return acciones.some((a) => a.tipo === tipo && a.disponible);
}

/** Una línea que dice qué toca hacer ahora. */
export function mensajeDeFase(vista: Vista, nombreDe: (id: string) => string): string {
  if (vista.fase === 'FIN') {
    return vista.ganador === null ? 'La partida terminó' : `¡Ganó ${nombreDe(vista.ganador)}!`;
  }
  if (vista.fase === 'DESCARTE') {
    const mio = vista.yo === null ? 0 : (vista.descartesPendientes[vista.yo] ?? 0);
    return mio > 0 ? `Debes descartar ${mio} cartas` : 'Esperando los descartes de los demás';
  }
  if (!esMiTurno(vista)) {
    const enTurno = vista.fase === 'CONSTRUCCION_ESPECIAL' ? vista.turnoEspecialDe : vista.turnoDe;
    return `Turno de ${enTurno === null ? '…' : nombreDe(enTurno)}`;
  }
  switch (vista.fase) {
    case 'PREPARACION_POBLADO':
      return 'Tu turno: toca un vértice libre para poner tu poblado';
    case 'PREPARACION_CAMINO':
      return 'Tu turno: toca una arista junto a tu poblado para poner un camino';
    case 'PRE_TIRADA':
      return 'Tu turno: tira los dados';
    case 'MOVER_LADRON':
      return 'Mueve el ladrón: toca una casilla';
    case 'CONSTRUCCION_ESPECIAL':
      return 'Construcción especial: puedes construir o pasar';
    default:
      return 'Tu turno: puedes construir, comerciar o terminar el turno';
  }
}
