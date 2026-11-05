import type { Terreno } from '@/lib/esquemas';

export const COLOR_TERRENO: Record<Terreno, string> = {
  BOSQUE: '#2f7d3b',
  PASTO: '#9bd36b',
  CAMPO: '#f2d45c',
  COLINA: '#d1743c',
  MONTANA: '#8b95a3',
  DESIERTO: '#e8d9a8',
};

export const NOMBRE_TERRENO: Record<Terreno, string> = {
  BOSQUE: 'bosque',
  PASTO: 'pasto',
  CAMPO: 'campo',
  COLINA: 'colina',
  MONTANA: 'montaña',
  DESIERTO: 'desierto',
};

const COLORES_JUGADOR = [
  '#e11d48',
  '#2563eb',
  '#16a34a',
  '#f59e0b',
  '#9333ea',
  '#0891b2',
  '#be185d',
  '#4d7c0f',
  '#475569',
  '#c2410c',
];

/** Color de un jugador según su lugar en el orden. Siempre va acompañado de su nombre o número. */
export const colorDeJugador = (indice: number): string =>
  COLORES_JUGADOR[indice % COLORES_JUGADOR.length] ?? '#475569';
