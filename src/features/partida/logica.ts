import type { AccionDisponible, Hex, Sitios, Vista } from '@/lib/esquemas';
import type { Objetivo, SitioRapido } from './Tablero';

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

/** Los sitios que hay que resaltar en el tablero para lo que se está haciendo. */
export function sitiosDe(modo: Modo | null, sitios: Sitios): readonly string[] {
  switch (modo) {
    case 'POBLADO':
      return sitios.poblados;
    case 'CIUDAD':
      return sitios.ciudades;
    case 'CAMINO':
      return sitios.caminos;
    case 'CARRETERAS':
      return sitios.carreteras;
    case 'LADRON':
      return sitios.ladron;
    case 'CABALLERO':
      return sitios.caballero;
    default:
      return [];
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

/**
 * El doble clic para construir directo en el mapa solo vale en tu turno, en la fase principal (o en
 * la construcción especial) y sin haber elegido otra herramienta: con una elegida, tocar dos veces
 * el mismo sitio ya confirma. En la preparación y al mover el ladrón manda la fase.
 */
export function puedeConstruirAlDobleClic(vista: Vista, modo: Modo | null): boolean {
  return (
    modo === null &&
    esMiTurno(vista) &&
    (vista.fase === 'FASE_PRINCIPAL' || vista.fase === 'CONSTRUCCION_ESPECIAL')
  );
}

/** Cómo se llama cada construcción rápida en los carteles: el título y la pieza en un aviso. */
export const TEXTO_DE_SITIO: Readonly<
  Record<SitioRapido['tipo'], { titulo: string; pieza: string }>
> = {
  POBLADO: { titulo: 'Poner un poblado', pieza: 'un poblado' },
  CIUDAD: { titulo: 'Mejorar a ciudad', pieza: 'una ciudad' },
  CAMINO: { titulo: 'Poner un camino', pieza: 'un camino' },
};

/** La jugada que se envía al confirmar una construcción rápida. */
export function accionDeSitioRapido(sitio: SitioRapido): object {
  switch (sitio.tipo) {
    case 'POBLADO':
      return { tipo: 'CONSTRUIR_POBLADO', vertice: sitio.id };
    case 'CIUDAD':
      return { tipo: 'CONSTRUIR_CIUDAD', vertice: sitio.id };
    case 'CAMINO':
      return { tipo: 'CONSTRUIR_CAMINO', arista: sitio.id };
  }
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

/** Dos o tres palabras que dicen qué toca hacer ahora. */
export function mensajeDeFase(vista: Vista, nombreDe: (id: string) => string): string {
  if (vista.fase === 'FIN') {
    return vista.ganador === null ? 'La partida terminó' : `¡Ganó ${nombreDe(vista.ganador)}!`;
  }
  if (vista.fase === 'DESCARTE') {
    const mio = vista.yo === null ? 0 : (vista.descartesPendientes[vista.yo] ?? 0);
    return mio > 0 ? `Descarta ${mio}` : 'Esperando descartes';
  }
  if (!esMiTurno(vista)) {
    const enTurno = vista.fase === 'CONSTRUCCION_ESPECIAL' ? vista.turnoEspecialDe : vista.turnoDe;
    return `Turno de ${enTurno === null ? '…' : nombreDe(enTurno)}`;
  }
  switch (vista.fase) {
    case 'PREPARACION_POBLADO':
      return 'Pon tu poblado';
    case 'PREPARACION_CAMINO':
      return 'Pon tu camino';
    case 'PRE_TIRADA':
      return 'Tira los dados';
    case 'MOVER_LADRON':
      return 'Mueve el ladrón';
    case 'CONSTRUCCION_ESPECIAL':
      return 'Construcción especial';
    default:
      return 'Tu turno';
  }
}
