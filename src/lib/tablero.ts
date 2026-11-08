import type { Hex, Mesa, Punto, Vista } from './esquemas';

const RAIZ_DE_3 = Math.sqrt(3);
/** Sitio alrededor de las casillas para el borde de mar, los barcos y sus etiquetas. */
const MARGEN = 2;
/** Cuánto sale el barco de un puerto hacia el mar desde el punto medio de su arista. */
const SALIDA_PUERTO = 1.25;

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

/**
 * Dónde dibujar un puerto: los dos vértices que protege, el medio de su arista y el barco más
 * afuera, hacia el mar. `afuera` es el vector unitario del borde al barco.
 */
export function posicionDePuerto(
  vertices: readonly [string, string],
  posiciones: ReadonlyMap<string, Punto>,
): {
  readonly vertices: readonly [Punto, Punto];
  readonly borde: Punto;
  readonly mar: Punto;
  readonly afuera: Punto;
} | null {
  const a = posiciones.get(vertices[0]);
  const b = posiciones.get(vertices[1]);
  if (!a || !b) return null;
  const borde = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const largo = Math.hypot(borde.x, borde.y);
  // Un borde justo en el centro no tiene "afuera": se elige arriba para no dividir entre cero.
  const afuera = largo > 0 ? { x: borde.x / largo, y: borde.y / largo } : { x: 0, y: -1 };
  return {
    vertices: [a, b],
    borde,
    mar: { x: borde.x + afuera.x * SALIDA_PUERTO, y: borde.y + afuera.y * SALIDA_PUERTO },
    afuera,
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
