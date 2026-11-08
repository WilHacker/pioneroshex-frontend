import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { Camino, Ciudad, Ladron, Poblado, Puerto } from './PiezasSVG';

const enSvg = (hijos: ReactNode) => render(<svg>{hijos}</svg>);

describe('Poblado y Ciudad', () => {
  it('dibujan su SVG en el color del jugador', () => {
    const { container } = enSvg(
      <>
        <Poblado posicion={{ x: 1, y: 2 }} color="#2f6fe0" />
        <Ciudad posicion={{ x: 3, y: 4 }} color="#e0344f" />
      </>,
    );
    const imagenes = [...container.querySelectorAll('image')].map((i) => i.getAttribute('href'));
    expect(imagenes).toEqual(['/piezas/2f6fe0/poblado.svg', '/piezas/e0344f/ciudad.svg']);
  });

  it('se colocan sobre su vértice', () => {
    const { container } = enSvg(<Poblado posicion={{ x: 5, y: 7 }} color="#2f6fe0" />);
    expect(container.querySelector('g[transform^="translate(5 "]')).toBeInTheDocument();
  });

  it('en vista previa (fantasma) se ven más transparentes', () => {
    const { container } = enSvg(
      <>
        <Poblado posicion={{ x: 0, y: 0 }} color="#2f6fe0" fantasma />
        <Ciudad posicion={{ x: 1, y: 1 }} color="#2f6fe0" />
      </>,
    );
    const [fantasma, normal] = [...container.querySelectorAll('image')];
    expect(Number(fantasma!.parentElement!.parentElement!.getAttribute('opacity'))).toBeLessThan(1);
    expect(normal!.parentElement!.parentElement!.getAttribute('opacity')).toBe('1');
  });
});

describe('Camino', () => {
  const giro = (container: HTMLElement): number => {
    const transformacion = container
      .querySelector('g[transform*="rotate"]')!
      .getAttribute('transform')!;
    return Number(/rotate\((-?[\d.]+)\)/.exec(transformacion)![1]);
  };

  it('dibuja el SVG del camino en el color del jugador', () => {
    const { container } = enSvg(
      <Camino desde={{ x: 0, y: 0 }} hasta={{ x: 0, y: 1 }} color="#00846b" />,
    );
    expect(container.querySelector('image')).toHaveAttribute('href', '/piezas/00846b/camino.svg');
  });

  it('un camino vertical no se gira', () => {
    const { container } = enSvg(
      <Camino desde={{ x: 0, y: 0 }} hasta={{ x: 0, y: 1 }} color="#00846b" />,
    );
    expect(Math.abs(giro(container))).toBeCloseTo(0);
  });

  it('un camino horizontal se gira 90 grados', () => {
    const { container } = enSvg(
      <Camino desde={{ x: 0, y: 0 }} hasta={{ x: 1, y: 0 }} color="#00846b" />,
    );
    expect(Math.abs(giro(container))).toBeCloseTo(90);
  });

  it('se coloca en el punto medio de sus dos vértices', () => {
    const { container } = enSvg(
      <Camino desde={{ x: 2, y: 4 }} hasta={{ x: 4, y: 8 }} color="#00846b" />,
    );
    expect(container.querySelector('g[transform^="translate(3 6)"]')).toBeInTheDocument();
  });

  it('crece con el largo del segmento', () => {
    const ancho = (hasta: number): number => {
      const { container } = enSvg(
        <Camino desde={{ x: 0, y: 0 }} hasta={{ x: 0, y: hasta }} color="#00846b" />,
      );
      return Number(container.querySelector('image')!.getAttribute('height'));
    };
    expect(ancho(2)).toBeGreaterThan(ancho(1));
  });
});

describe('Ladron', () => {
  it('dibuja el SVG del ladrón y conserva su título accesible', () => {
    const { container } = enSvg(<Ladron posicion={{ x: 1, y: 1 }} />);
    expect(container.querySelector('image')).toHaveAttribute('href', '/tablero/ladron.svg');
    expect(container.querySelector('title')).toHaveTextContent('Ladrón');
  });
});

describe('Puerto: los muelles que uso', () => {
  const dibujarPuerto = (conectados?: readonly [boolean, boolean]) =>
    enSvg(
      <Puerto
        vertices={[
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ]}
        mar={{ x: 0.5, y: -1.2 }}
        afuera={{ x: 0, y: -1 }}
        tipo="MADERA"
        {...(conectados && { conectados })}
      />,
    );

  it('cada puerto tiene un muelle por vértice, ninguno resaltado si no tengo casa', () => {
    const { container } = dibujarPuerto();
    expect(container.querySelectorAll('[data-muelle]')).toHaveLength(2);
    expect(container.querySelector('[data-conectado="true"]')).not.toBeInTheDocument();
  });

  it('el muelle del vértice donde tengo casa se resalta, el otro no', () => {
    const { container } = dibujarPuerto([true, false]);
    const [primero, segundo] = [...container.querySelectorAll('[data-muelle]')];
    expect(primero).toHaveAttribute('data-conectado', 'true');
    expect(segundo).not.toHaveAttribute('data-conectado');
  });

  it('un puerto conectado lo dice en su título y su etiqueta se marca', () => {
    const { container } = dibujarPuerto([false, true]);
    expect(container.querySelector('title')!.textContent).toContain('conectado');
    expect(container.querySelector('[data-etiqueta-puerto]')).toHaveAttribute(
      'data-conectado',
      'true',
    );
  });

  it('un puerto sin conectar no dice que lo esté', () => {
    const { container } = dibujarPuerto();
    expect(container.querySelector('title')!.textContent).not.toContain('conectado');
  });
});

describe('Puerto: dónde va la etiqueta', () => {
  const posicionDeEtiqueta = (afuera: { x: number; y: number }) => {
    const mar = { x: 3, y: 5 };
    const { container } = enSvg(
      <Puerto
        vertices={[
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ]}
        mar={mar}
        afuera={afuera}
        tipo="GENERICO"
      />,
    );
    const etiqueta = container.querySelector('[data-etiqueta-puerto]')!.parentElement!;
    const [, x, y] = /translate\((-?[\d.]+) (-?[\d.]+)\)/.exec(
      etiqueta.getAttribute('transform')!,
    )!;
    return { mar, x: Number(x), y: Number(y) };
  };

  it('en un puerto que mira hacia arriba la etiqueta va sobre el barco', () => {
    const { mar, x, y } = posicionDeEtiqueta({ x: 0, y: -1 });
    expect(x).toBeCloseTo(mar.x);
    expect(y).toBeLessThan(mar.y);
  });

  it('en un puerto que mira hacia abajo la etiqueta va debajo del barco', () => {
    const { mar, x, y } = posicionDeEtiqueta({ x: 0, y: 1 });
    expect(x).toBeCloseTo(mar.x);
    expect(y).toBeGreaterThan(mar.y);
  });

  it('en un puerto que mira a un lado (derecha o izquierda) también va debajo, centrada', () => {
    for (const lado of [-1, 1]) {
      const { mar, x, y } = posicionDeEtiqueta({ x: lado, y: 0 });
      expect(x).toBeCloseTo(mar.x);
      expect(y).toBeGreaterThan(mar.y);
    }
  });
});
