import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { V1, V2, V3, mesaDePrueba, vistaDePrueba } from '@/lib/pruebas';
import { Tablero, type Objetivo, type SitioRapido } from './Tablero';

const nombres: Record<string, string> = { j1: 'Ana', j2: 'Beto', j3: 'Caro' };

interface Opciones {
  objetivo?: Objetivo;
  vista?: ReturnType<typeof vistaDePrueba>;
  sitios?: string[];
  previa?: string | null;
  aristasElegidas?: string[];
  numeroResaltado?: number | null;
  entregas?: ReadonlyMap<string, number>;
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
      entregas={opciones.entregas}
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

describe('Tablero: puertos y bordes', () => {
  it('un puerto se conecta por el muelle donde tengo una casa', () => {
    dibujar({ vista: vistaDePrueba({ edificios: { [V2]: { dueno: 'j1', tipo: 'POBLADO' } } }) });
    const conectados = document.querySelectorAll('[data-muelle][data-conectado="true"]');
    expect(conectados).toHaveLength(1);
  });

  it('la casa de otro jugador no conecta mi puerto', () => {
    dibujar({ vista: vistaDePrueba({ edificios: { [V2]: { dueno: 'j2', tipo: 'POBLADO' } } }) });
    expect(document.querySelector('[data-conectado="true"]')).not.toBeInTheDocument();
  });

  it('la isla lleva un borde de playa y otro de mar, una capa por casilla', () => {
    dibujar();
    expect(document.querySelectorAll('[data-borde="mar"] polygon')).toHaveLength(2);
    expect(document.querySelectorAll('[data-borde="playa"] polygon')).toHaveLength(2);
  });

  it('los bordes van debajo de las casillas: primero el mar, luego la playa, luego el terreno', () => {
    dibujar();
    const mar = document.querySelector('[data-borde="mar"]')!;
    const playa = document.querySelector('[data-borde="playa"]')!;
    const terreno = document.querySelector('title')!.closest('g')!;
    const antes = (a: Node, b: Node): boolean =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(antes(mar, playa)).toBe(true);
    expect(antes(playa, terreno)).toBe(true);
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

describe('Tablero: doble clic para construir', () => {
  // Con el reloj congelado los dos clics de `dblClick` siempre caen dentro del plazo del doble toque.
  beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  function conDobleClic(opciones: Opciones & { fantasma?: SitioRapido } = {}) {
    const alDoble = vi.fn();
    const alApuntar = vi.fn();
    const alConfirmar = vi.fn();
    const { container } = render(
      <Tablero
        mesa={mesaDePrueba}
        vista={opciones.vista ?? vistaDePrueba()}
        indiceDe={(id) => Number(id.slice(1)) - 1}
        nombreDe={(id) => nombres[id] ?? id}
        objetivo={opciones.objetivo ?? null}
        sitios={[]}
        previa={null}
        onVertice={vi.fn()}
        onArista={vi.fn()}
        onCasilla={vi.fn()}
        onDoble={alDoble}
        onApuntar={alApuntar}
        onConfirmarFantasma={alConfirmar}
        fantasma={opciones.fantasma ?? null}
      />,
    );
    return { alDoble, alApuntar, alConfirmar, container };
  }
  const zona = (atributo: string, id: string): Element =>
    document.querySelector(`[${atributo}="${id}"]`)!;

  it('dos clics seguidos en un vértice libre piden construir un poblado ahí', async () => {
    const { alDoble } = conDobleClic();
    await userEvent.dblClick(zona('data-doble-vertice', V1));
    expect(alDoble).toHaveBeenCalledExactlyOnceWith({ tipo: 'POBLADO', id: V1 });
  });

  it('un solo clic no pide construir nada, pero sí apunta al sitio (para ver su costo)', async () => {
    const { alDoble, alApuntar } = conDobleClic();
    await userEvent.click(zona('data-doble-vertice', V1));
    await userEvent.click(zona('data-doble-arista', 'a1'));
    expect(alDoble).not.toHaveBeenCalled();
    expect(alApuntar).toHaveBeenCalledWith({ tipo: 'POBLADO', id: V1 }, true);
    expect(alApuntar).toHaveBeenCalledWith({ tipo: 'CAMINO', id: 'a1' }, true);
  });

  it('con el ratón encima se apunta al sitio y al salir se deja de apuntar', async () => {
    const { alApuntar } = conDobleClic();
    await userEvent.hover(zona('data-doble-vertice', V1));
    expect(alApuntar).toHaveBeenLastCalledWith({ tipo: 'POBLADO', id: V1 });
    await userEvent.unhover(zona('data-doble-vertice', V1));
    expect(alApuntar).toHaveBeenLastCalledWith(null);
  });

  it('un clic en un sitio y otro en uno distinto no cuentan como doble clic', async () => {
    const { alDoble } = conDobleClic();
    await userEvent.click(zona('data-doble-vertice', V1));
    await userEvent.click(zona('data-doble-vertice', V2));
    expect(alDoble).not.toHaveBeenCalled();
  });

  it('dos clics muy separados en el tiempo tampoco', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      const { alDoble } = conDobleClic();
      await userEvent.click(zona('data-doble-vertice', V1));
      vi.setSystemTime(Date.now() + 1000);
      await userEvent.click(zona('data-doble-vertice', V1));
      expect(alDoble).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('dos clics en una arista libre piden un camino', async () => {
    const { alDoble } = conDobleClic();
    await userEvent.dblClick(zona('data-doble-arista', 'a2'));
    expect(alDoble).toHaveBeenCalledExactlyOnceWith({ tipo: 'CAMINO', id: 'a2' });
  });

  it('en mi poblado pide mejorarlo; en el de otro o en una ciudad mía no hay zona', async () => {
    const { alDoble } = conDobleClic({
      vista: vistaDePrueba({
        edificios: {
          [V1]: { dueno: 'j1', tipo: 'POBLADO' },
          [V2]: { dueno: 'j2', tipo: 'POBLADO' },
          [V3]: { dueno: 'j1', tipo: 'CIUDAD' },
        },
      }),
    });
    await userEvent.dblClick(zona('data-doble-vertice', V1));
    expect(alDoble).toHaveBeenCalledExactlyOnceWith({ tipo: 'CIUDAD', id: V1 });
    expect(document.querySelector(`[data-doble-vertice="${V2}"]`)).toBeNull();
    expect(document.querySelector(`[data-doble-vertice="${V3}"]`)).toBeNull();
  });

  it.each([
    [{ tipo: 'POBLADO', id: V1 }, 'Confirmar poblado'],
    [{ tipo: 'CIUDAD', id: V1 }, 'Confirmar mejora a ciudad'],
    [{ tipo: 'CAMINO', id: 'a1' }, 'Confirmar camino'],
  ] as const)('el fantasma de %j lleva la marca verde de confirmar «%s»', (fantasma, nombre) => {
    conDobleClic({ fantasma });
    expect(screen.getByRole('button', { name: nombre })).toHaveAttribute('aria-pressed', 'true');
  });

  it('sin fantasma no hay marca de confirmar', () => {
    conDobleClic();
    expect(screen.queryByRole('button', { name: /^Confirmar/ })).not.toBeInTheDocument();
  });

  it('un clic en la marca construye, pero no en los primeros instantes (un tercer clic seguido)', async () => {
    const { alConfirmar } = conDobleClic({ fantasma: { tipo: 'POBLADO', id: V1 } });
    const marca = screen.getByRole('button', { name: 'Confirmar poblado' });
    await userEvent.click(marca);
    expect(alConfirmar).not.toHaveBeenCalled();
    vi.setSystemTime(Date.now() + 1000);
    await userEvent.click(marca);
    expect(alConfirmar).toHaveBeenCalledOnce();
  });

  it('con teclado la marca de confirmar también se activa (Enter)', async () => {
    const { alConfirmar } = conDobleClic({ fantasma: { tipo: 'CAMINO', id: 'a1' } });
    vi.setSystemTime(Date.now() + 1000);
    screen.getByRole('button', { name: 'Confirmar camino' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(alConfirmar).toHaveBeenCalledOnce();
  });

  it('una arista que ya tiene camino no tiene zona', () => {
    conDobleClic({ vista: vistaDePrueba({ caminos: { a1: 'j2' } }) });
    expect(document.querySelector('[data-doble-arista="a1"]')).toBeNull();
    expect(zona('data-doble-arista', 'a2')).toBeInTheDocument();
  });

  it('con una herramienta elegida no hay zonas de doble clic (ahí manda el toque de confirmar)', () => {
    conDobleClic({ objetivo: 'POBLADOS' });
    expect(document.querySelector('[data-doble-vertice]')).toBeNull();
    expect(document.querySelector('[data-doble-arista]')).toBeNull();
  });
});

describe('Tablero: número que salió', () => {
  it('la casilla con ese número de la que salieron cartas se resalta y dice cuántas', () => {
    dibujar({ numeroResaltado: 8, entregas: new Map([['0,0', 2]]) });
    expect(screen.getByText('Produce con el 8: salen 2 cartas')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('si salió el número pero no salió nada, solo se marca el contorno', () => {
    dibujar({ numeroResaltado: 8 });
    expect(screen.getByText('Salió el 8, pero aquí nadie cobra')).toBeInTheDocument();
    expect(screen.queryByText(/Produce con el/)).not.toBeInTheDocument();
  });

  it('si ninguna casilla tiene ese número (o es el desierto), no se resalta nada', () => {
    dibujar({ numeroResaltado: 7 });
    expect(screen.queryByText(/Produce con el/)).not.toBeInTheDocument();
    expect(screen.queryByText(/nadie cobra/)).not.toBeInTheDocument();
  });

  it('sin número no se resalta nada', () => {
    dibujar({ numeroResaltado: null });
    expect(screen.queryByText(/Produce con el/)).not.toBeInTheDocument();
  });
});
