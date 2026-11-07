import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { V1, mesaDePrueba, vistaDePrueba } from '@/lib/pruebas';
import { Tablero } from './Tablero';

function dibujar(zoom: boolean) {
  const alVertice = vi.fn();
  render(
    <Tablero
      mesa={mesaDePrueba}
      vista={vistaDePrueba()}
      indiceDe={() => 0}
      nombreDe={() => ''}
      objetivo="POBLADOS"
      sitios={[V1]}
      previa={null}
      zoom={zoom}
      onVertice={alVertice}
      onArista={vi.fn()}
      onCasilla={vi.fn()}
    />,
  );
  const svg = screen.getByLabelText('Tablero de juego');
  // jsdom no calcula tamaños: se le da uno al svg para que las conversiones tengan sentido.
  svg.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 800, height: 400, right: 800, bottom: 400, x: 0, y: 0 }) as DOMRect;
  return { svg, alVertice };
}

const caja = (svg: Element) => {
  const [x, y, ancho, alto] = svg.getAttribute('viewBox')!.split(' ').map(Number) as number[];
  return { x: x!, y: y!, ancho: ancho!, alto: alto! };
};

const SITIO = /Construir en el vértice/;

describe('Tablero: zoom', () => {
  it('sin la opción de zoom (la portada decorativa) no hay botones ni cambia nada', () => {
    const { svg } = dibujar(false);
    expect(screen.queryByRole('button', { name: 'Acercar' })).not.toBeInTheDocument();
    const antes = svg.getAttribute('viewBox');
    fireEvent.wheel(svg, { deltaY: -100 });
    expect(svg.getAttribute('viewBox')).toBe(antes);
  });

  it('con zoom, ofrece acercar, alejar y ver todo; al inicio solo se puede acercar', () => {
    dibujar(true);
    expect(screen.getByRole('button', { name: 'Acercar' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Alejar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Ver todo el tablero' })).toBeDisabled();
  });

  it('acercar achica la vista; alejar y ver todo la devuelven', async () => {
    const usuario = userEvent.setup();
    const { svg } = dibujar(true);
    const inicial = caja(svg);

    await usuario.click(screen.getByRole('button', { name: 'Acercar' }));
    expect(caja(svg).ancho).toBeLessThan(inicial.ancho);
    expect(screen.getByRole('button', { name: 'Alejar' })).toBeEnabled();

    await usuario.click(screen.getByRole('button', { name: 'Ver todo el tablero' }));
    expect(caja(svg)).toEqual(inicial);
    expect(screen.getByRole('button', { name: 'Alejar' })).toBeDisabled();
  });

  it('acercar y alejar con los botones vuelve a la vista completa', async () => {
    const usuario = userEvent.setup();
    const { svg } = dibujar(true);
    const inicial = caja(svg);

    await usuario.click(screen.getByRole('button', { name: 'Acercar' }));
    await usuario.click(screen.getByRole('button', { name: 'Alejar' }));

    expect(caja(svg).ancho).toBeCloseTo(inicial.ancho, 6);
  });

  it('el botón de acercar se desactiva en el zoom máximo', async () => {
    const usuario = userEvent.setup();
    dibujar(true);
    const acercar = screen.getByRole('button', { name: 'Acercar' });
    for (let i = 0; i < 12 && !(acercar as HTMLButtonElement).disabled; i++) {
      await usuario.click(acercar); // eslint-disable-line no-await-in-loop
    }
    expect(acercar).toBeDisabled();
  });

  it('la rueda acerca (hacia arriba) y aleja (hacia abajo), sin mover la página', () => {
    const { svg } = dibujar(true);
    const inicial = caja(svg);

    const noPrevenido = fireEvent.wheel(svg, { deltaY: -100, clientX: 400, clientY: 200 });
    expect(noPrevenido).toBe(false); // preventDefault: la página no se desplaza
    expect(caja(svg).ancho).toBeLessThan(inicial.ancho);

    fireEvent.wheel(svg, { deltaY: 100, clientX: 400, clientY: 200 });
    expect(caja(svg).ancho).toBeCloseTo(inicial.ancho, 6);
  });

  it('arrastrar con la vista completa no mueve nada', () => {
    const { svg } = dibujar(true);
    const inicial = caja(svg);
    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 300, clientY: 100 });
    fireEvent.pointerUp(svg, { pointerId: 1, clientX: 300, clientY: 100 });
    expect(caja(svg)).toEqual(inicial);
  });

  it('arrastrar con la vista acercada la desplaza en sentido contrario al dedo', async () => {
    const usuario = userEvent.setup();
    const { svg } = dibujar(true);
    await usuario.click(screen.getByRole('button', { name: 'Acercar' }));
    await usuario.click(screen.getByRole('button', { name: 'Acercar' }));
    const antes = caja(svg);

    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 400, clientY: 200 });
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 340, clientY: 200 }); // dedo a la izquierda
    fireEvent.pointerUp(svg, { pointerId: 1, clientX: 340, clientY: 200 });

    expect(caja(svg).x).toBeGreaterThan(antes.x); // la vista avanza hacia la derecha
    expect(caja(svg).ancho).toBeCloseTo(antes.ancho, 9);
  });

  it('un toque sin arrastre sigue eligiendo el sitio', () => {
    const { svg, alVertice } = dibujar(true);
    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(svg, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.click(screen.getByRole('button', { name: SITIO }));
    expect(alVertice).toHaveBeenCalledWith(V1);
  });

  it('un arrastre que termina sobre un sitio NO lo elige', async () => {
    const usuario = userEvent.setup();
    const { svg, alVertice } = dibujar(true);
    await usuario.click(screen.getByRole('button', { name: 'Acercar' }));

    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 400, clientY: 200 });
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 300, clientY: 200 });
    fireEvent.pointerUp(svg, { pointerId: 1, clientX: 300, clientY: 200 });
    fireEvent.click(screen.getByRole('button', { name: SITIO }));

    expect(alVertice).not.toHaveBeenCalled();
  });

  it('después de un arrastre, el siguiente toque vuelve a funcionar', async () => {
    const usuario = userEvent.setup();
    const { svg, alVertice } = dibujar(true);
    await usuario.click(screen.getByRole('button', { name: 'Acercar' }));
    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 400, clientY: 200 });
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 300, clientY: 200 });
    fireEvent.pointerUp(svg, { pointerId: 1, clientX: 300, clientY: 200 });

    fireEvent.pointerDown(svg, { pointerId: 2, clientX: 50, clientY: 50 });
    fireEvent.pointerUp(svg, { pointerId: 2, clientX: 50, clientY: 50 });
    fireEvent.click(screen.getByRole('button', { name: SITIO }));

    expect(alVertice).toHaveBeenCalledWith(V1);
  });

  it('pellizcar con dos dedos acerca y juntarlos aleja', () => {
    const { svg } = dibujar(true);
    const inicial = caja(svg);

    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 350, clientY: 200 });
    fireEvent.pointerDown(svg, { pointerId: 2, clientX: 450, clientY: 200 });
    fireEvent.pointerMove(svg, { pointerId: 2, clientX: 650, clientY: 200 }); // se separan
    const acercada = caja(svg);
    expect(acercada.ancho).toBeLessThan(inicial.ancho);

    fireEvent.pointerMove(svg, { pointerId: 2, clientX: 450, clientY: 200 }); // se juntan
    expect(caja(svg).ancho).toBeGreaterThan(acercada.ancho);
  });

  it('cambia el gesto táctil: con la vista completa deja desplazar la página, acercada la captura', async () => {
    const usuario = userEvent.setup();
    const { svg } = dibujar(true);
    expect(svg.style.touchAction).toBe('pan-y');
    await usuario.click(screen.getByRole('button', { name: 'Acercar' }));
    expect(svg.style.touchAction).toBe('none');
  });
});

describe('Tablero: captura del puntero al arrastrar', () => {
  it('captura el puntero al empezar a arrastrar, para seguir aunque salga del tablero', async () => {
    const usuario = userEvent.setup();
    const { svg } = dibujar(true);
    const capturar = vi.fn();
    svg.setPointerCapture = capturar;
    await usuario.click(screen.getByRole('button', { name: 'Acercar' }));

    fireEvent.pointerDown(svg, { pointerId: 7, clientX: 400, clientY: 200 });
    expect(capturar).not.toHaveBeenCalled(); // un toque suelto no captura nada
    fireEvent.pointerMove(svg, { pointerId: 7, clientX: 300, clientY: 200 });
    expect(capturar).toHaveBeenCalledWith(7);
    fireEvent.pointerMove(svg, { pointerId: 7, clientX: 250, clientY: 200 });
    expect(capturar).toHaveBeenCalledTimes(1); // solo una vez por arrastre
  });

  it('un toque suelto no captura el puntero (así el clic llega al sitio)', () => {
    const { svg } = dibujar(true);
    const capturar = vi.fn();
    svg.setPointerCapture = capturar;
    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(svg, { pointerId: 1, clientX: 100, clientY: 100 });
    expect(capturar).not.toHaveBeenCalled();
  });
});
