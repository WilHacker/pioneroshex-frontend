/**
 * Convierte las imágenes SVG del tablero en mapas de bits, una sola vez cada una.
 *
 * Una `<image>` con un SVG dentro obliga al navegador a volver a dibujar ese SVG en cada paso del
 * zoom (con ~40 imágenes a la vez es lo que más pesa). Un mapa de bits, en cambio, lo escala la
 * tarjeta gráfica casi sin coste. Mientras la conversión no esté lista (o si el navegador no puede
 * hacerla) la imagen se sigue viendo con su SVG: esto solo acelera, nunca quita nada.
 */

/** Lado mayor del mapa de bits, en píxeles: aguanta el zoom máximo en pantallas de alta densidad. */
const LADO_PX = 512;

export type Rasterizador = (src: string) => Promise<string>;

/** Dibuja el SVG en un canvas y devuelve la dirección de un PNG; falla si no hay navegador. */
async function rasterizarEnCanvas(src: string): Promise<string> {
  if (typeof Image === 'undefined' || typeof document === 'undefined') {
    throw new Error('Sin navegador: no se puede rasterizar');
  }
  const imagen = new Image();
  imagen.src = src;
  await imagen.decode();
  const { naturalWidth: ancho, naturalHeight: alto } = imagen;
  if (!ancho || !alto) throw new Error(`La imagen ${src} no tiene tamaño`);
  const escala = LADO_PX / Math.max(ancho, alto);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(ancho * escala));
  canvas.height = Math.max(1, Math.round(alto * escala));
  const contexto = canvas.getContext('2d');
  if (!contexto) throw new Error('Sin contexto 2D');
  contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);
  const png = await new Promise<Blob | null>((listo) => canvas.toBlob(listo, 'image/png'));
  if (!png) throw new Error(`No se pudo convertir ${src}`);
  return URL.createObjectURL(png);
}

const listos = new Map<string, string>();
/** Las que ya se pidieron (listas, en curso o fallidas): cada imagen se intenta una sola vez. */
const pedidas = new Set<string>();
const oyentes = new Set<() => void>();
let rasterizador: Rasterizador = rasterizarEnCanvas;
/** Una cola: las conversiones van una tras otra, cediendo el turno entre una y otra. */
let cola: Promise<void> = Promise.resolve();

const avisar = (): void => {
  for (const oyente of oyentes) oyente();
};

/** El mapa de bits de `src` si ya está listo; si no, el propio `src`. */
export const bitmapDe = (src: string): string => listos.get(src) ?? src;

/** Se avisa cada vez que una imagen termina de convertirse. Devuelve la función para darse de baja. */
export function suscribirBitmaps(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => void oyentes.delete(oyente);
}

/** Empieza a convertir `src` (si no se había pedido ya). No espera ni lanza errores. */
export function pedirBitmap(src: string): void {
  if (pedidas.has(src)) return;
  pedidas.add(src);
  cola = cola
    .then(async () => {
      // Se cede el turno antes de cada una para que el navegador pueda pintar y atender al usuario.
      await new Promise<void>((seguir) => setTimeout(seguir, 0));
      try {
        listos.set(src, await rasterizador(src));
        avisar();
      } catch {
        // Sin conversión la imagen sigue siendo el SVG: no hace falta avisar a nadie.
      }
    })
    .catch(() => undefined);
}

/** Para los tests: cambia cómo se convierte (por defecto, con un canvas). */
export function usarRasterizador(nuevo: Rasterizador): void {
  rasterizador = nuevo;
}

/** Para los tests: vuelve al estado inicial. */
export function reiniciarBitmaps(): void {
  listos.clear();
  pedidas.clear();
  oyentes.clear();
  rasterizador = rasterizarEnCanvas;
  cola = Promise.resolve();
}
