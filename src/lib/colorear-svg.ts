/**
 * Recolorea un SVG hecho con degradados de un solo color (el arte de las piezas viene en oro) a
 * cualquier color de jugador, conservando su relieve: lo más oscuro sigue siendo el borde y lo más
 * claro el brillo, y el tono medio queda justo en el color pedido. Es lógica pura: la usa el script
 * `scripts/colorear-piezas.mjs` para generar `public/piezas/`.
 */

type Rgb = readonly [number, number, number];

/** Solo se tocan los colores de estos atributos: un id o un `data-*` parecido a un color se queda. */
const ATRIBUTO_DE_COLOR = /(?<![\w-])(fill|stroke|stop-color)="(#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6})"/g;

/** Por debajo de esta saturación el color es un gris (sombras, blancos, negros) y no se recolorea. */
const SATURACION_MINIMA = 0.2;

/** Lo que se oscurece / aclara el color base para sacar el borde y el brillo. */
const OSCURECER = 0.55;
const ACLARAR = 0.6;

function aRgb(color: string): Rgb {
  const largo = color.length === 4 ? color.slice(1).replace(/./g, '$&$&') : color.slice(1);
  return [0, 2, 4].map((i) => Number.parseInt(largo.slice(i, i + 2), 16)) as unknown as Rgb;
}

const aHex = ([r, g, b]: Rgb): string =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

const mezclar = (a: Rgb, b: Rgb, factor: number): Rgb => [
  a[0] + (b[0] - a[0]) * factor,
  a[1] + (b[1] - a[1]) * factor,
  a[2] + (b[2] - a[2]) * factor,
];

function saturacion([r, g, b]: Rgb): number {
  const [max, min] = [Math.max(r, g, b) / 255, Math.min(r, g, b) / 255];
  const claridad = (max + min) / 2;
  const divisor = 1 - Math.abs(2 * claridad - 1);
  return divisor === 0 ? 0 : (max - min) / divisor;
}

/** Luminancia relativa (WCAG): ordena los tonos de más oscuro a más claro. */
function luminancia(rgb: Rgb): number {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as unknown as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Cambia los colores de un SVG de un solo matiz por tonos del `base` (`#rrggbb`). */
export function colorearSvg(svg: string, base: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(base)) throw new Error('El color base debe ser #rrggbb');
  const claro: Rgb = [255, 255, 255];
  const negro: Rgb = [0, 0, 0];
  const centro = aRgb(base);
  const oscuro = mezclar(centro, negro, OSCURECER);
  const brillo = mezclar(centro, claro, ACLARAR);

  const luminancias: number[] = [];
  for (const [, , color] of svg.matchAll(ATRIBUTO_DE_COLOR)) {
    const rgb = aRgb(color!);
    if (saturacion(rgb) >= SATURACION_MINIMA) luminancias.push(luminancia(rgb));
  }
  if (luminancias.length === 0) return svg;

  const ordenadas = [...luminancias].sort((a, b) => a - b);
  const minima = ordenadas[0]!;
  const maxima = ordenadas.at(-1)!;
  // El tono medio del original pasa a ser exactamente el color del jugador.
  const mediana = ordenadas[Math.floor((ordenadas.length - 1) / 2)]!;

  return svg.replace(ATRIBUTO_DE_COLOR, (completo, atributo: string, color: string) => {
    const rgb = aRgb(color);
    if (saturacion(rgb) < SATURACION_MINIMA) return completo;
    const y = luminancia(rgb);
    const nuevo =
      y <= mediana
        ? mezclar(oscuro, centro, mediana === minima ? 1 : (y - minima) / (mediana - minima))
        : mezclar(centro, brillo, (y - mediana) / (maxima - mediana));
    return `${atributo}="${aHex(nuevo)}"`;
  });
}
