import type { Hex, Mesa, Punto, Vista } from './esquemas';

const RAIZ_DE_3 = Math.sqrt(3);
const MARGEN = 1.7;
/** Cuánto sale un puerto hacia el mar desde el punto medio de su arista. */
const SALIDA_PUERTO = 0.62;

export const claveHex = (h: Pick<Hex, 'q' | 'r'>): string => `${h.q},${h.r}`;

/** Esquinas de una casilla pointy-top de lado 1 con ese centro (y crece hacia abajo). */
export function esquinasDeCasilla(centro: Punto): Punto[] {
  return Array.from({ length: 6 }, (_, k) => {
    const angulo = (Math.PI / 180) * (60 * k - 30);
    return { x: centro.x + Math.cos(angulo), y: centro.y + Math.sin(angulo) };
  });
}

export interface Caja {
  readonly x: number;
  readonly y: number;
  readonly ancho: number;
  readonly alto: number;
}

/** El rectángulo que contiene todo el tablero con sitio para los puertos. */
export function cajaDeMesa(mesa: Mesa): Caja {
  const xs = mesa.casillas.map((c) => c.centro.x);
  const ys = mesa.casillas.map((c) => c.centro.y);
  const minX = Math.min(...xs) - RAIZ_DE_3 / 2 - MARGEN;
  const maxX = Math.max(...xs) + RAIZ_DE_3 / 2 + MARGEN;
  const minY = Math.min(...ys) - 1 - MARGEN;
  const maxY = Math.max(...ys) + 1 + MARGEN;
  return { x: minX, y: minY, ancho: maxX - minX, alto: maxY - minY };
}

export const viewBoxDe = (caja: Caja): string => `${caja.x} ${caja.y} ${caja.ancho} ${caja.alto}`;

export function posicionesDeVertices(mesa: Mesa): ReadonlyMap<string, Punto> {
  return new Map(mesa.vertices.map((v) => [v.id, v.posicion]));
}

/** Dónde dibujar un puerto: el medio de su arista y un punto más afuera, hacia el mar. */
export function posicionDePuerto(
  vertices: readonly [string, string],
  posiciones: ReadonlyMap<string, Punto>,
): { readonly borde: Punto; readonly mar: Punto } | null {
  const a = posiciones.get(vertices[0]);
  const b = posiciones.get(vertices[1]);
  if (!a || !b) return null;
  const borde = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const largo = Math.hypot(borde.x, borde.y) || 1;
  return {
    borde,
    mar: {
      x: borde.x + (borde.x / largo) * SALIDA_PUERTO,
      y: borde.y + (borde.y / largo) * SALIDA_PUERTO,
    },
  };
}

/**
 * A quién se puede robar al poner el ladrón en `destino`: rivales con un edificio en una esquina
 * de esa casilla y al menos una carta. Es solo ayuda para elegir; el servidor decide si vale.
 */
export function victimasEn(mesa: Mesa, vista: Vista, destino: Hex): string[] {
  const clave = claveHex(destino);
  const duenos = new Set<string>();
  for (const vertice of mesa.vertices) {
    if (!vertice.id.split('|').includes(clave)) continue;
    const dueno = vista.edificios[vertice.id]?.dueno;
    if (dueno !== undefined && dueno !== vista.yo) duenos.add(dueno);
  }
  return [...duenos].filter(
    (id) => (vista.jugadores.find((j) => j.id === id)?.totalCartas ?? 0) > 0,
  );
}
