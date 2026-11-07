import type { InfoDeMapa } from './esquemas';
import { esquinasDeCasilla } from './tablero';

const RAIZ_DE_3 = Math.sqrt(3);
/** Aire alrededor de la forma en la vista previa. */
const MARGEN = 0.35;
const DECIMALES = 2;

export type Aptitud = 'RECOMENDADO' | 'JUSTO' | 'NO';

/**
 * Qué tal le va un mapa a `jugadores` personas: RECOMENDADO en su rango cómodo, JUSTO si se puede
 * pero sobra o falta espacio, y NO si no caben los poblados iniciales. Es solo para avisar: el
 * servidor es quien decide si la sala admite el mapa.
 */
export function aptitudDeMapa(
  mapa: Pick<InfoDeMapa, 'maximoTecnico' | 'maximoRecomendado' | 'minimoRecomendado'>,
  jugadores: number,
): Aptitud {
  if (jugadores > mapa.maximoTecnico) return 'NO';
  const comodo = jugadores >= mapa.minimoRecomendado && jugadores <= mapa.maximoRecomendado;
  return comodo ? 'RECOMENDADO' : 'JUSTO';
}

export interface Contorno {
  /** El atributo `points` de un `<polygon>` por casilla. */
  readonly poligonos: readonly string[];
  readonly viewBox: string;
}

const punto = (x: number, y: number): string => `${x.toFixed(DECIMALES)},${y.toFixed(DECIMALES)}`;

/** Dibuja una forma de mapa (`[q, r]` por casilla) como polígonos de lado 1, listos para un `<svg>`. */
export function contornoDeForma(forma: readonly (readonly [number, number])[]): Contorno {
  if (forma.length === 0) return { poligonos: [], viewBox: '0 0 1 1' };
  const esquinas = forma.map(([q, r]) =>
    esquinasDeCasilla({ x: RAIZ_DE_3 * (q + r / 2), y: 1.5 * r }),
  );
  const xs = esquinas.flatMap((c) => c.map((p) => p.x));
  const ys = esquinas.flatMap((c) => c.map((p) => p.y));
  const minX = Math.min(...xs) - MARGEN;
  const minY = Math.min(...ys) - MARGEN;
  const ancho = Math.max(...xs) + MARGEN - minX;
  const alto = Math.max(...ys) + MARGEN - minY;
  return {
    poligonos: esquinas.map((c) => c.map((p) => punto(p.x, p.y)).join(' ')),
    viewBox: `${minX.toFixed(DECIMALES)} ${minY.toFixed(DECIMALES)} ${ancho.toFixed(DECIMALES)} ${alto.toFixed(DECIMALES)}`,
  };
}
