import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { V1, V2, mesaDePrueba, vistaDePrueba } from '@/lib/pruebas';
import { Tablero, type Objetivo } from './Tablero';

const nombres: Record<string, string> = { j1: 'Ana', j2: 'Beto', j3: 'Caro' };

function dibujar(opciones: { objetivo?: Objetivo; vista?: ReturnType<typeof vistaDePrueba> } = {}) {
  const alVertice = vi.fn();
  const alArista = vi.fn();
  const alCasilla = vi.fn();
  render(
    <Tablero
      mesa={mesaDePrueba}
      vista={opciones.vista ?? vistaDePrueba()}
      indiceDe={(id) => Number(id.slice(1)) - 1}
      nombreDe={(id) => nombres[id] ?? id}
      objetivo={opciones.objetivo ?? null}
      onVertice={alVertice}
      onArista={alArista}
      onCasilla={alCasilla}
    />,
  );
  return { alVertice, alArista, alCasilla };
}

describe('Tablero', () => {
  it('dibuja las casillas con su terreno, sus fichas y los puertos', () => {
    dibujar();
    expect(screen.getByLabelText('Tablero de juego')).toBeInTheDocument();
    expect(screen.getByText('bosque')).toBeInTheDocument();
    expect(screen.getByText('desierto')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('3:1')).toBeInTheDocument();
  });

  it('marca dónde está el ladrón', () => {
    dibujar();
    expect(screen.getByText('Ladrón')).toBeInTheDocument();
  });

  it('muestra los edificios y los caminos con el nombre de su dueño', () => {
    dibujar({
      vista: vistaDePrueba({
        edificios: {
          [V1]: { dueno: 'j2', tipo: 'POBLADO' },
          [V2]: { dueno: 'j1', tipo: 'CIUDAD' },
        },
        caminos: { a1: 'j2' },
      }),
    });
    expect(screen.getByText('Poblado de Beto')).toBeInTheDocument();
    expect(screen.getByText('Ciudad de Ana')).toBeInTheDocument();
    expect(screen.getByText('Camino de Beto')).toBeInTheDocument();
  });

  it('sin objetivo no hay nada que tocar', () => {
    dibujar();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('para poblados ofrece solo los vértices libres y avisa con el que se toca', async () => {
    const vista = vistaDePrueba({ edificios: { [V1]: { dueno: 'j2', tipo: 'POBLADO' } } });
    const { alVertice } = dibujar({ objetivo: 'POBLADOS', vista });
    expect(screen.getAllByRole('button')).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: `Construir en el vértice ${V2}` }));
    expect(alVertice).toHaveBeenCalledWith(V2);
  });

  it('se puede elegir con el teclado (Enter y Espacio)', async () => {
    const usuario = userEvent.setup();
    const { alVertice } = dibujar({ objetivo: 'POBLADOS' });
    screen.getByRole('button', { name: `Construir en el vértice ${V1}` }).focus();
    await usuario.keyboard('{Enter}');
    await usuario.keyboard(' ');
    await usuario.keyboard('a');
    expect(alVertice).toHaveBeenCalledTimes(2);
  });

  it('para ciudades solo ofrece mis propios poblados', async () => {
    const vista = vistaDePrueba({
      edificios: { [V1]: { dueno: 'j1', tipo: 'POBLADO' }, [V2]: { dueno: 'j2', tipo: 'POBLADO' } },
    });
    const { alVertice } = dibujar({ objetivo: 'CIUDADES', vista });
    const botones = screen.getAllByRole('button');
    expect(botones).toHaveLength(1);
    await userEvent.click(botones[0]!);
    expect(alVertice).toHaveBeenCalledWith(V1);
  });

  it('para caminos ofrece las aristas libres y resalta las ya elegidas', async () => {
    const vista = vistaDePrueba({ caminos: { a2: 'j2' } });
    const { alArista } = dibujar({ objetivo: 'ARISTAS', vista });
    const botones = screen.getAllByRole('button');
    expect(botones).toHaveLength(1);
    expect(botones[0]).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(botones[0]!);
    expect(alArista).toHaveBeenCalledWith('a1');
  });

  it('para el ladrón ofrece todas las casillas', async () => {
    const { alCasilla } = dibujar({ objetivo: 'CASILLAS' });
    const botones = screen.getAllByRole('button');
    expect(botones).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: /casilla 0,0/ }));
    expect(alCasilla).toHaveBeenCalledWith({ q: 0, r: 0, s: 0 });
  });
});
