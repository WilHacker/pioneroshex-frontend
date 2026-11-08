import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bitmapDe,
  pedirBitmap,
  reiniciarBitmaps,
  suscribirBitmaps,
  usarRasterizador,
} from './bitmaps';

/** Deja correr las promesas y los turnos pendientes de la cola. */
const esperarCola = async (): Promise<void> => {
  await vi.runAllTimersAsync();
};

beforeEach(() => {
  vi.useFakeTimers();
  reiniciarBitmaps();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('bitmapDe', () => {
  it('mientras no esté listo devuelve el propio SVG, para que la imagen se vea desde el principio', () => {
    expect(bitmapDe('/recursos/madera.svg')).toBe('/recursos/madera.svg');
  });

  it('cuando se convirtió, devuelve el mapa de bits', async () => {
    usarRasterizador(async (src) => `blob:${src}`);
    pedirBitmap('/recursos/madera.svg');
    await esperarCola();
    expect(bitmapDe('/recursos/madera.svg')).toBe('blob:/recursos/madera.svg');
  });
});

describe('pedirBitmap', () => {
  it('convierte cada imagen una sola vez aunque se pida muchas veces', async () => {
    const rasterizar = vi.fn(async (src: string) => `blob:${src}`);
    usarRasterizador(rasterizar);
    for (let i = 0; i < 5; i++) pedirBitmap('/tablero/ladron.svg');
    await esperarCola();
    pedirBitmap('/tablero/ladron.svg');
    await esperarCola();
    expect(rasterizar).toHaveBeenCalledTimes(1);
  });

  it('las convierte de una en una, para no bloquear la pantalla de golpe', async () => {
    let simultaneas = 0;
    let maximo = 0;
    usarRasterizador(async (src) => {
      simultaneas += 1;
      maximo = Math.max(maximo, simultaneas);
      await Promise.resolve();
      simultaneas -= 1;
      return `blob:${src}`;
    });
    for (const src of ['/a.svg', '/b.svg', '/c.svg', '/d.svg']) pedirBitmap(src);
    await esperarCola();
    expect(maximo).toBe(1);
    expect(bitmapDe('/d.svg')).toBe('blob:/d.svg');
  });

  it('si la conversión falla, la imagen sigue siendo el SVG y no se reintenta', async () => {
    const rasterizar = vi.fn(async () => {
      throw new Error('sin canvas');
    });
    usarRasterizador(rasterizar);
    pedirBitmap('/recursos/trigo.svg');
    await esperarCola();
    pedirBitmap('/recursos/trigo.svg');
    await esperarCola();
    expect(bitmapDe('/recursos/trigo.svg')).toBe('/recursos/trigo.svg');
    expect(rasterizar).toHaveBeenCalledTimes(1);
  });

  it('una imagen que falla no impide convertir las siguientes', async () => {
    usarRasterizador(async (src) => {
      if (src === '/mala.svg') throw new Error('rota');
      return `blob:${src}`;
    });
    pedirBitmap('/mala.svg');
    pedirBitmap('/buena.svg');
    await esperarCola();
    expect(bitmapDe('/mala.svg')).toBe('/mala.svg');
    expect(bitmapDe('/buena.svg')).toBe('blob:/buena.svg');
  });
});

describe('suscribirBitmaps', () => {
  it('avisa cuando una imagen queda lista y deja de avisar al darse de baja', async () => {
    usarRasterizador(async (src) => `blob:${src}`);
    const oyente = vi.fn();
    const baja = suscribirBitmaps(oyente);
    pedirBitmap('/a.svg');
    await esperarCola();
    expect(oyente).toHaveBeenCalled();

    oyente.mockClear();
    baja();
    pedirBitmap('/b.svg');
    await esperarCola();
    expect(oyente).not.toHaveBeenCalled();
  });
});

describe('sin navegador (tests, servidor)', () => {
  it('el rasterizador por defecto falla con calma y la imagen queda como SVG', async () => {
    reiniciarBitmaps();
    pedirBitmap('/recursos/oveja.svg');
    await esperarCola();
    expect(bitmapDe('/recursos/oveja.svg')).toBe('/recursos/oveja.svg');
  });
});
