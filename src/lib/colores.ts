import type { Terreno } from './esquemas';

/** Color base de cada terreno (propio). El tablero le saca un degradado y un borde. */
export const COLOR_TERRENO: Record<Terreno, string> = {
  BOSQUE: '#3c8a4d',
  PASTO: '#9acb6a',
  CAMPO: '#eec84e',
  COLINA: '#cf7345',
  MONTANA: '#8593a6',
  DESIERTO: '#e6d6a4',
};

export const NOMBRE_TERRENO: Record<Terreno, string> = {
  BOSQUE: 'bosque',
  PASTO: 'pasto',
  CAMPO: 'campo',
  COLINA: 'colina',
  MONTANA: 'montaña',
  DESIERTO: 'desierto',
};

/**
 * Un color por jugador para una mesa de hasta 16. Son `#rrggbb` en minúsculas porque nombran la
 * carpeta de sus piezas en `public/piezas/` (se generan con `pnpm piezas`).
 */
export const COLORES_JUGADOR = [
  '#e0344f',
  '#2f6fe0',
  '#2fa84f',
  '#f08c1a',
  '#8a4fd6',
  '#14a3b8',
  '#d6339a',
  '#6f9a1c',
  '#5b6678',
  '#b8541c',
  '#9a7d0a',
  '#7a2e4d',
  '#2a3f9e',
  '#00846b',
  '#ee6a4a',
  '#3a424d',
] as const;

/** Color de un jugador según su lugar en el orden. Siempre va acompañado de su nombre o número. */
export const colorDeJugador = (indice: number): string =>
  COLORES_JUGADOR[indice % COLORES_JUGADOR.length] ?? '#5b6678';

/** Mezcla un color `#rrggbb` con blanco: `factor` 0 lo deja igual, 1 lo vuelve blanco. */
export function aclarar(color: string, factor: number): string {
  const canal = (i: number): string => {
    const valor = parseInt(color.slice(1 + i * 2, 3 + i * 2), 16);
    return Math.round(valor + (255 - valor) * factor)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${canal(0)}${canal(1)}${canal(2)}`;
}
