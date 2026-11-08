import { COLORES_JUGADOR } from './colores';

/** Las piezas de construcción que tienen arte en `public/piezas/` en el color de cada jugador. */
export type Pieza = 'poblado' | 'ciudad' | 'camino';

const PALETA: readonly string[] = COLORES_JUGADOR;

/**
 * El SVG de una pieza en el color de un jugador (los genera `pnpm piezas`). Un color que no es de
 * la paleta usa la pieza dorada original: mejor una pieza de otro color que un enlace roto.
 */
export function archivoDePieza(pieza: Pieza, color: string): string {
  const minusculas = color.toLowerCase();
  return PALETA.includes(minusculas)
    ? `/piezas/${minusculas.slice(1)}/${pieza}.svg`
    : `/tablero/${pieza}-oro.svg`;
}
