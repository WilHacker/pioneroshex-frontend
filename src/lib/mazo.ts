import type { Carta } from './esquemas';

/**
 * Cuántas cartas de cada tipo lleva el mazo de desarrollo. Es la misma cuenta que hace el servidor
 * (`core/reglas/mazo.ts`): aquí solo sirve para explicarla al jugador, no para decidir nada.
 */

/** El mazo base de 25 cartas, el de 3 a 4 jugadores. */
export const CARTAS_BASE: Readonly<Record<Carta, number>> = Object.freeze({
  CABALLERO: 14,
  PUNTO_VICTORIA: 5,
  CONSTRUCCION_CARRETERAS: 2,
  ABUNDANCIA: 2,
  MONOPOLIO: 2,
});

const JUGADORES_POR_MAZO = 4;

/** El mazo base multiplicado por `ceil(jugadores / 4)`; con uno o ninguno cuenta como un mazo base. */
export function composicionDelMazo(jugadores: number): Record<Carta, number> {
  const veces = Math.max(1, Math.ceil(jugadores / JUGADORES_POR_MAZO));
  return {
    CABALLERO: CARTAS_BASE.CABALLERO * veces,
    PUNTO_VICTORIA: CARTAS_BASE.PUNTO_VICTORIA * veces,
    CONSTRUCCION_CARRETERAS: CARTAS_BASE.CONSTRUCCION_CARRETERAS * veces,
    ABUNDANCIA: CARTAS_BASE.ABUNDANCIA * veces,
    MONOPOLIO: CARTAS_BASE.MONOPOLIO * veces,
  };
}
