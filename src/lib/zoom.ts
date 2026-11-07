import type { Punto } from './esquemas';
import type { Caja } from './tablero';

/** Cuántas veces se puede acercar respecto de la vista completa. */
export const ZOOM_MAX = 5;

const acotar = (valor: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, valor));

/** Recoloca la vista para que no se salga de la caja base. */
function dentroDeLaBase(base: Caja, vista: Caja): Caja {
  return {
    ...vista,
    x: acotar(vista.x, base.x, base.x + base.ancho - vista.ancho),
    y: acotar(vista.y, base.y, base.y + base.alto - vista.alto),
  };
}

/** Cuántas veces está acercada la vista: 1 es el tablero entero. */
export const nivelDeZoom = (base: Caja, actual: Caja): number => base.ancho / actual.ancho;

/**
 * Acerca (`factor` > 1) o aleja (`factor` < 1) la vista dejando **fijo** el punto `foco` (en
 * unidades del tablero): lo que está bajo el cursor o entre los dedos no se mueve. Nunca pasa de
 * `ZOOM_MAX` ni de la vista completa, y nunca se sale de la caja base. Devuelve una caja nueva.
 */
export function acercarEn(base: Caja, actual: Caja, factor: number, foco: Punto): Caja {
  if (!Number.isFinite(factor) || factor <= 0) return actual;
  const ancho = acotar(actual.ancho / factor, base.ancho / ZOOM_MAX, base.ancho);
  const alto = ancho * (base.alto / base.ancho);
  const rx = (foco.x - actual.x) / actual.ancho;
  const ry = (foco.y - actual.y) / actual.alto;
  return dentroDeLaBase(base, { x: foco.x - rx * ancho, y: foco.y - ry * alto, ancho, alto });
}

/** Mueve la vista `dx`, `dy` unidades del tablero, sin salirse de la caja base. */
export function desplazar(base: Caja, actual: Caja, dx: number, dy: number): Caja {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return actual;
  return dentroDeLaBase(base, { ...actual, x: actual.x + dx, y: actual.y + dy });
}

/**
 * Pasa una posición de pantalla (píxeles) a unidades del tablero. El `<svg>` muestra la caja
 * centrada y entera ("meet"), así que si su forma no coincide quedan franjas a los lados que hay
 * que descontar. Con un svg sin tamaño (aún sin dibujar) devuelve el centro de la vista.
 */
export function puntoDeSvg(
  rect: { left: number; top: number; width: number; height: number },
  caja: Caja,
  clientX: number,
  clientY: number,
): Punto {
  if (rect.width <= 0 || rect.height <= 0) {
    return { x: caja.x + caja.ancho / 2, y: caja.y + caja.alto / 2 };
  }
  const pxPorUnidad = Math.min(rect.width / caja.ancho, rect.height / caja.alto);
  const franjaX = (rect.width - caja.ancho * pxPorUnidad) / 2;
  const franjaY = (rect.height - caja.alto * pxPorUnidad) / 2;
  return {
    x: caja.x + (clientX - rect.left - franjaX) / pxPorUnidad,
    y: caja.y + (clientY - rect.top - franjaY) / pxPorUnidad,
  };
}

/**
 * Cuántas unidades del tablero se mueve la vista cuando el dedo recorre `dxPx`, `dyPx` píxeles.
 * Es el movimiento de la vista (sentido contrario al del dedo): arrastrar a la izquierda avanza
 * hacia la derecha del tablero.
 */
export function desplazamientoDeArrastre(
  rect: { width: number; height: number },
  caja: Caja,
  dxPx: number,
  dyPx: number,
): { dx: number; dy: number } {
  if (rect.width <= 0 || rect.height <= 0) return { dx: 0, dy: 0 };
  const pxPorUnidad = Math.min(rect.width / caja.ancho, rect.height / caja.alto);
  return { dx: -dxPx / pxPorUnidad, dy: -dyPx / pxPorUnidad };
}
