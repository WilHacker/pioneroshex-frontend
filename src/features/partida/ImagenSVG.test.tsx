import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reiniciarBitmaps, usarRasterizador } from '@/lib/bitmaps';
import { ImagenSVG } from './ImagenSVG';

const dibujar = (src = '/recursos/madera.svg') =>
  render(
    <svg>
      <ImagenSVG src={src} centroX={2} centroY={3} ancho={0.5} alto={0.4} />
    </svg>,
  );

beforeEach(() => {
  vi.useFakeTimers();
  reiniciarBitmaps();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('ImagenSVG', () => {
  it('se ve desde el primer momento con su SVG', () => {
    const { container } = dibujar();
    expect(container.querySelector('image')).toHaveAttribute('href', '/recursos/madera.svg');
  });

  it('se centra en su punto y ocupa lo pedido, ampliada para no perderse al rasterizar', () => {
    const { container } = dibujar();
    expect(container.querySelector('g')).toHaveAttribute('transform', 'translate(2 3) scale(0.01)');
    const imagen = container.querySelector('image')!;
    expect(imagen).toHaveAttribute('width', '50');
    expect(imagen).toHaveAttribute('height', '40');
    expect(imagen).toHaveAttribute('x', '-25');
    expect(imagen).toHaveAttribute('y', '-20');
  });

  it('cuando el navegador termina de convertirla, pasa a usar el mapa de bits', async () => {
    usarRasterizador(async (src) => `blob:rapido${src}`);
    const { container } = dibujar();
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(container.querySelector('image')).toHaveAttribute(
      'href',
      'blob:rapido/recursos/madera.svg',
    );
  });

  it('si no puede convertirla, se queda con el SVG y no se rompe', async () => {
    usarRasterizador(async () => {
      throw new Error('sin canvas');
    });
    const { container } = dibujar('/tablero/ladron.svg');
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(container.querySelector('image')).toHaveAttribute('href', '/tablero/ladron.svg');
  });

  it('dos imágenes iguales comparten una sola conversión', async () => {
    const rasterizar = vi.fn(async (src: string) => `blob:${src}`);
    usarRasterizador(rasterizar);
    render(
      <svg>
        <ImagenSVG src="/a.svg" centroX={0} centroY={0} ancho={1} alto={1} />
        <ImagenSVG src="/a.svg" centroX={1} centroY={1} ancho={1} alto={1} />
      </svg>,
    );
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(rasterizar).toHaveBeenCalledTimes(1);
  });
});
