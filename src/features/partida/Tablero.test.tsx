import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { V1, V2, mesaDePrueba, vistaDePrueba } from '@/lib/pruebas';
import { Tablero, type Objetivo } from './Tablero';

const nombres: Record<string, string> = { j1: 'Ana', j2: 'Beto', j3: 'Caro' };

interface Opciones {
  objetivo?: Objetivo;
  vista?: ReturnType<typeof vistaDePrueba>;
  sitios?: string[];
  previa?: string | null;
  aristasElegidas?: string[];
  numeroResaltado?: number | null;
}

function dibujar(opciones: Opciones = {}) {
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
      sitios={opciones.sitios ?? []}
      previa={opciones.previa ?? null}
      aristasElegidas={opciones.aristasElegidas}
      numeroResaltado={opciones.numeroResaltado}
      onVertice={alVertice}
      onArista={alArista}
      onCasilla={alCasilla}
    />,
  );
  return { alVertice, alArista, alCasilla };
}

describe('Tablero: dibujo', () => {
  it('dibuja las casillas con su terreno, sus fichas y los puertos', () => {
    dibujar();
    expect(screen.getByLabelText('Tablero de juego')).toBeInTheDocument();
    expect(screen.getByText('bosque')).toBeInTheDocument();
    expect(screen.getByText('desierto')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('3:1')).toBeInTheDocument();
  });

  it('un puerto de un recurso muestra su razón y su icono', () => {
    const mesa = {
      ...mesaDePrueba,
      puertos: [{ arista: 'a2', vertices: [V2, V1] as [string, string], tipo: 'TRIGO' as const }],
    };
    render(
      <Tablero
        mesa={mesa}
        vista={vistaDePrueba()}
        indiceDe={() => 0}
        nombreDe={() => ''}
        objetivo={null}
        sitios={[]}
        previa={null}
        onVertice={vi.fn()}
        onArista={vi.fn()}
        onCasilla={vi.fn()}
      />,
    );
    expect(screen.getByText('2:1')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Trigo' })).toBeInTheDocument();
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
    dibujar({ sitios: [V1, V2] });
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});

describe('Tablero: solo los sitios legales', () => {
  it('para poblados ofrece únicamente los vértices que el servidor marcó', async () => {
    const { alVertice } = dibujar({ objetivo: 'POBLADOS', sitios: [V2] });
    const botones = screen.getAllByRole('button');
    expect(botones).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: `Construir en el vértice ${V2}` }));
    expect(alVertice).toHaveBeenCalledWith(V2);
  });

  it('un vértice ocupado nunca se ofrece, aunque venga en la lista', () => {
    dibujar({
      objetivo: 'POBLADOS',
      sitios: [V1, V2],
      vista: vistaDePrueba({ edificios: { [V1]: { dueno: 'j2', tipo: 'POBLADO' } } }),
    });
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('se puede elegir con el teclado (Enter y Espacio)', async () => {
    const usuario = userEvent.setup();
    const { alVertice } = dibujar({ objetivo: 'POBLADOS', sitios: [V1] });
    screen.getByRole('button', { name: `Construir en el vértice ${V1}` }).focus();
    await usuario.keyboard('{Enter}');
    await usuario.keyboard(' ');
    await usuario.keyboard('a');
    expect(alVertice).toHaveBeenCalledTimes(2);
  });

  it('para ciudades solo ofrece mis propios poblados legales', async () => {
    const vista = vistaDePrueba({
      edificios: { [V1]: { dueno: 'j1', tipo: 'POBLADO' }, [V2]: { dueno: 'j2', tipo: 'POBLADO' } },
    });
    const { alVertice } = dibujar({ objetivo: 'CIUDADES', vista, sitios: [V1, V2] });
    const botones = screen.getAllByRole('button');
    expect(botones).toHaveLength(1);
    await userEvent.click(botones[0]!);
    expect(alVertice).toHaveBeenCalledWith(V1);
  });

  it('para caminos ofrece las aristas legales', async () => {
    const { alArista } = dibujar({ objetivo: 'ARISTAS', sitios: ['a1'] });
    const botones = screen.getAllByRole('button');
    expect(botones).toHaveLength(1);
    expect(botones[0]).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(botones[0]!);
    expect(alArista).toHaveBeenCalledWith('a1');
  });

  it('una arista con camino no se ofrece', () => {
    dibujar({
      objetivo: 'ARISTAS',
      sitios: ['a1', 'a2'],
      vista: vistaDePrueba({ caminos: { a2: 'j2' } }),
    });
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('para el ladrón ofrece las casillas legales', async () => {
    const { alCasilla } = dibujar({ objetivo: 'CASILLAS', sitios: ['0,0'] });
    expect(screen.getAllByRole('button')).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: /casilla 0,0/ }));
    expect(alCasilla).toHaveBeenCalledWith({ q: 0, r: 0, s: 0 });
  });
});

describe('Tablero: vista previa', () => {
  it('el vértice elegido muestra la pieza en fantasma y queda marcado como presionado', () => {
    dibujar({ objetivo: 'POBLADOS', sitios: [V1, V2], previa: V1 });
    expect(screen.getByRole('button', { name: `Construir en el vértice ${V1}` })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: `Construir en el vértice ${V2}` })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('tocar de nuevo el vértice en vista previa avisa para confirmar', async () => {
    const { alVertice } = dibujar({ objetivo: 'POBLADOS', sitios: [V1], previa: V1 });
    await userEvent.click(screen.getByRole('button', { name: `Construir en el vértice ${V1}` }));
    expect(alVertice).toHaveBeenCalledWith(V1);
  });

  it('una arista en vista previa se ofrece para confirmar', async () => {
    const { alArista } = dibujar({ objetivo: 'ARISTAS', sitios: ['a1'], previa: 'a1' });
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar camino en a1' }));
    expect(alArista).toHaveBeenCalledWith('a1');
  });

  it('las aristas elegidas para carreteras se muestran y se pueden quitar', async () => {
    const { alArista } = dibujar({
      objetivo: 'ARISTAS',
      sitios: ['a1', 'a2'],
      aristasElegidas: ['a1'],
    });
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar camino en a1' }));
    expect(alArista).toHaveBeenCalledWith('a1');
    expect(screen.getByRole('button', { name: 'Poner camino en a2' })).toBeInTheDocument();
  });

  it('mejorar un poblado a ciudad también pasa por la vista previa', async () => {
    const vista = vistaDePrueba({ edificios: { [V1]: { dueno: 'j1', tipo: 'POBLADO' } } });
    const { alVertice } = dibujar({ objetivo: 'CIUDADES', vista, sitios: [V1], previa: V1 });
    const boton = screen.getByRole('button', { name: `Mejorar a ciudad el poblado en ${V1}` });
    expect(boton).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(boton);
    expect(alVertice).toHaveBeenCalledWith(V1);
  });
});

describe('Tablero: número que salió', () => {
  it('las casillas con ese número se resaltan', () => {
    dibujar({ numeroResaltado: 8 });
    expect(screen.getByText('Produce con el 8')).toBeInTheDocument();
  });

  it('si ninguna casilla tiene ese número (o es el desierto), no se resalta nada', () => {
    dibujar({ numeroResaltado: 7 });
    expect(screen.queryByText(/Produce con el/)).not.toBeInTheDocument();
  });

  it('sin número no se resalta nada', () => {
    dibujar({ numeroResaltado: null });
    expect(screen.queryByText(/Produce con el/)).not.toBeInTheDocument();
  });
});
