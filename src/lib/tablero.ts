import type { Hex, Mesa, Punto, Vista } from './esquemas';

const RAIZ_DE_3 = Math.sqrt(3);
/** Sitio alrededor de las casillas para el borde de mar, los barcos y sus etiquetas. */
const MARGEN = 2;
/** Lo más que sale el barco de un puerto hacia el mar desde el punto medio de su arista. */
export const SALIDA_PUERTO = 1.25;
/** Lo menos: en un canal estrecho el barco se acerca a la costa hasta aquí para no pisar la otra orilla. */
export const SALIDA_PUERTO_MINIMA = 0.7;
const PASO_DE_SALIDA = 0.05;
/** El barco debe quedar al menos a esta distancia del centro de cualquier casilla (radio de una casilla + margen). */
const HOLGURA_CON_TIERRA = 1.16;
/** Tolerancia al decidir si un vértice es una esquina de una casilla (el radio de una casilla es 1). */
const TOLERANCIA_DE_ESQUINA = 0.05;

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

type ConCentro = { readonly centro: Punto };

const distanciaEntre = (a: Punto, b: Punto): number => Math.hypot(a.x - b.x, a.y - b.y);

/** El centro de la casilla de la que cuelga una arista de costa: la que tiene ambos vértices por esquinas. */
function centroDeLaCasillaDeLaArista(
  a: Punto,
  b: Punto,
  casillas: readonly ConCentro[],
): Punto | undefined {
  const esEsquina = (centro: Punto, vertice: Punto): boolean =>
    Math.abs(distanciaEntre(centro, vertice) - 1) < TOLERANCIA_DE_ESQUINA;
  return casillas.find(({ centro }) => esEsquina(centro, a) && esEsquina(centro, b))?.centro;
}

/**
 * Cuánto se aleja el barco de la costa: lo máximo si el mar está libre; si al otro lado hay otra
 * casilla (un canal, una bahía, un puente) se acerca hasta que deje de pisarla, y si ni así cabe
 * elige la distancia con más holgura. Nunca baja de `SALIDA_PUERTO_MINIMA`.
 */
function salidaSegura(borde: Punto, afuera: Punto, casillas: readonly ConCentro[]): number {
  let mejorSalida = SALIDA_PUERTO;
  let mejorHolgura = -Infinity;
  for (
    let salida = SALIDA_PUERTO;
    salida >= SALIDA_PUERTO_MINIMA - 1e-9;
    salida -= PASO_DE_SALIDA
  ) {
    const barco = { x: borde.x + afuera.x * salida, y: borde.y + afuera.y * salida };
    const holgura = Math.min(...casillas.map(({ centro }) => distanciaEntre(barco, centro)));
    if (holgura >= HOLGURA_CON_TIERRA) return salida;
    if (holgura > mejorHolgura) {
      mejorHolgura = holgura;
      mejorSalida = salida;
    }
  }
  return Math.max(SALIDA_PUERTO_MINIMA, mejorSalida);
}

/**
 * Dónde dibujar un puerto: los dos vértices que protege, el medio de su arista y el barco más
 * afuera, hacia el mar. `afuera` es el vector unitario del borde al barco: sale de la casilla de la
 * que cuelga la arista (así también apunta bien en costas cóncavas, lagos y canales). Sin la lista
 * de `casillas`, o si no encuentra la del puerto, sale desde el centro del tablero.
 */
export function posicionDePuerto(
  vertices: readonly [string, string],
  posiciones: ReadonlyMap<string, Punto>,
  casillas: readonly ConCentro[] = [],
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
  const origen = centroDeLaCasillaDeLaArista(a, b, casillas) ?? { x: 0, y: 0 };
  const dx = borde.x - origen.x;
  const dy = borde.y - origen.y;
  const largo = Math.hypot(dx, dy);
  // Un borde justo en el origen no tiene "afuera": se elige arriba para no dividir entre cero.
  const afuera = largo > 0 ? { x: dx / largo, y: dy / largo } : { x: 0, y: -1 };
  const salida = salidaSegura(borde, afuera, casillas);
  return {
    vertices: [a, b],
    borde,
    mar: { x: borde.x + afuera.x * salida, y: borde.y + afuera.y * salida },
    afuera,
  };
}

/**
 * A quién se puede robar al poner el ladrón en `destino`: rivales con un edificio en una esquina
 * de esa casilla y al menos una carta (y, con «ladrón amistoso», con 3 puntos o más). Es solo ayuda
 * para elegir; el servidor decide si vale (la regla está repetida en `core/estado/victimas.ts`).
 */
export function victimasEn(mesa: Mesa, vista: Vista, destino: Hex): string[] {
  const clave = claveHex(destino);
  const duenos = new Set<string>();
  for (const vertice of mesa.vertices) {
    if (!vertice.id.split('|').includes(clave)) continue;
    const dueno = vista.edificios[vertice.id]?.dueno;
    if (dueno !== undefined && dueno !== vista.yo) duenos.add(dueno);
  }
  const amistoso = vista.config.ladronAmistoso === true;
  return [...duenos].filter((id) => {
    const rival = vista.jugadores.find((j) => j.id === id);
    if ((rival?.totalCartas ?? 0) === 0) return false;
    return !amistoso || (rival?.puntos ?? 0) >= PUNTOS_LADRON_AMISTOSO;
  });
}

/** Con «ladrón amistoso» solo se roba a quien tiene al menos estos puntos (igual que en el servidor). */
export const PUNTOS_LADRON_AMISTOSO = 3;

export interface EtiquetaPorColocar {
  centro: Punto;
  ancho: number;
  alto: number;
}

const MAX_PASADAS_ETIQUETAS = 60;
/** Margen extra al separar, para que no queden rozándose. */
const AIRE_ENTRE_ETIQUETAS = 0.02;

/**
 * Aleja entre sí las etiquetas que se pisan (rectángulos centrados en `centro`), empujando cada
 * pareja por el eje donde menos se solapan. Devuelve un punto por etiqueta, en el mismo orden;
 * las que no chocan no se mueven. No modifica la entrada.
 */
export function separarEtiquetas(etiquetas: readonly EtiquetaPorColocar[]): Punto[] {
  const puntos = etiquetas.map((e) => ({ ...e.centro }));
  for (let pasada = 0; pasada < MAX_PASADAS_ETIQUETAS; pasada++) {
    let huboChoque = false;
    for (let i = 0; i < etiquetas.length; i++) {
      for (let j = i + 1; j < etiquetas.length; j++) {
        const dx = puntos[j]!.x - puntos[i]!.x;
        const dy = puntos[j]!.y - puntos[i]!.y;
        const solapeX = (etiquetas[i]!.ancho + etiquetas[j]!.ancho) / 2 - Math.abs(dx);
        const solapeY = (etiquetas[i]!.alto + etiquetas[j]!.alto) / 2 - Math.abs(dy);
        if (solapeX <= 1e-6 || solapeY <= 1e-6) continue;
        huboChoque = true;
        const empujeEnX = solapeX <= solapeY;
        const mitad = ((empujeEnX ? solapeX : solapeY) + AIRE_ENTRE_ETIQUETAS) / 2;
        const signo = (empujeEnX ? dx : dy) >= 0 ? 1 : -1;
        const eje = empujeEnX ? 'x' : 'y';
        puntos[i]![eje] -= signo * mitad;
        puntos[j]![eje] += signo * mitad;
      }
    }
    if (!huboChoque) break;
  }
  return puntos;
}
