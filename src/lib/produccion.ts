import type { Hex, Mesa, Punto, Recurso, Terreno, Vista } from './esquemas';
import { claveHex } from './tablero';

/** Qué recurso da cada terreno; el desierto no da nada. */
export const RECURSO_DE_TERRENO: Record<Exclude<Terreno, 'DESIERTO'>, Recurso> = {
  BOSQUE: 'MADERA',
  COLINA: 'LADRILLO',
  PASTO: 'OVEJA',
  CAMPO: 'TRIGO',
  MONTANA: 'MINERAL',
};

export interface Entrega {
  readonly clave: string;
  readonly centro: Punto;
  readonly recurso: Recurso;
  readonly cantidad: number;
}

/**
 * Lo que repartiría una tirada: por cada casilla con ese número y algún edificio en sus esquinas,
 * el recurso y cuántas cartas (poblado 1, ciudad 2, sumando todos los edificios de la casilla).
 * La casilla con el ladrón encima no produce.
 */
export function entregasDe(
  mesa: Mesa,
  edificios: Vista['edificios'],
  ladron: Hex | null,
  suma: number,
): Entrega[] {
  const bloqueada = ladron ? claveHex(ladron) : null;
  const entregas: Entrega[] = [];
  for (const casilla of mesa.casillas) {
    const clave = claveHex(casilla.hex);
    if (casilla.ficha !== suma || casilla.terreno === 'DESIERTO' || clave === bloqueada) continue;
    let cantidad = 0;
    for (const [vertice, edificio] of Object.entries(edificios)) {
      if (vertice.split('|').includes(clave)) cantidad += edificio.tipo === 'CIUDAD' ? 2 : 1;
    }
    if (cantidad > 0) {
      entregas.push({
        clave,
        centro: casilla.centro,
        recurso: RECURSO_DE_TERRENO[casilla.terreno],
        cantidad,
      });
    }
  }
  return entregas;
}

/** Las sumas de dados (2 a 12) con las que alguien recibiría algo, de menor a mayor. */
export function sumasQueEntregan(
  mesa: Mesa,
  edificios: Vista['edificios'],
  ladron: Hex | null,
): number[] {
  const sumas: number[] = [];
  for (let suma = 2; suma <= 12; suma += 1) {
    if (entregasDe(mesa, edificios, ladron, suma).length > 0) sumas.push(suma);
  }
  return sumas;
}

/** Dos dados (1 a 6) que suman `suma`; `aleatorio` devuelve un número en [0, 1). */
export function parQueSuma(suma: number, aleatorio: () => number): [number, number] {
  const minimo = Math.max(1, suma - 6);
  const maximo = Math.min(6, suma - 1);
  const primero = minimo + Math.floor(aleatorio() * (maximo - minimo + 1));
  return [primero, suma - primero];
}
