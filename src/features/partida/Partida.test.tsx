import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AccionDisponible, Vista } from '@/lib/esquemas';
import { V1, V2, mesaDePrueba, vistaDePrueba } from '@/lib/pruebas';
import { Partida } from './Partida';
import { useJuego, type Juego } from './useJuego';

vi.mock('./useJuego');

const credencial = { salaId: 'abcd1234', jugadorId: 'j1', token: 'tok' };
const nombres = { j1: 'Ana', j2: 'Beto', j3: 'Caro' };
const enviar = vi.fn<Juego['enviar']>();

type Opciones = Partial<Juego> & { vista?: Vista; acciones?: AccionDisponible[] };

function juego(parcial: Opciones = {}): Juego {
  const { vista, acciones, ...resto } = parcial;
  return {
    conexion: 'conectado',
    rechazo: null,
    eventos: [],
    enviar,
    datos: {
      mesa: mesaDePrueba,
      vista: vista ?? vistaDePrueba(),
      acciones: acciones ?? [
        { tipo: 'TERMINAR_TURNO', disponible: true },
        { tipo: 'TIRAR_DADOS', disponible: false, motivo: 'FASE_INCORRECTA' },
        { tipo: 'CONSTRUIR_POBLADO', disponible: true },
      ],
    },
    ...resto,
  };
}

function mostrar(j: Juego): void {
  vi.mocked(useJuego).mockReturnValue(j);
  render(<Partida credencial={credencial} nombres={nombres} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  enviar.mockResolvedValue(null);
});

describe('Partida: entrada', () => {
  it('conecta con la sala y el token de la credencial', () => {
    mostrar(juego({ datos: null }));
    expect(useJuego).toHaveBeenCalledWith('abcd1234', 'tok');
    expect(screen.getByText('Conectando con la partida…')).toBeInTheDocument();
  });

  it('si el servidor no deja entrar, lo explica en español', () => {
    mostrar(juego({ datos: null, rechazo: 'NO_AUTORIZADO' }));
    expect(screen.getByRole('alert')).toHaveTextContent('No estás autorizado en esta partida');
  });

  it('avisa si se pierde la conexión', () => {
    mostrar(juego({ conexion: 'reconectando' }));
    expect(screen.getByText(/reconectando/)).toBeInTheDocument();
  });
});

describe('Partida: mi turno', () => {
  it('dice qué toca hacer, con los dados', () => {
    mostrar(juego());
    expect(screen.getByText(/Tu turno: puedes construir/)).toHaveTextContent('Dados: 3 + 4');
  });

  it('los botones siguen lo que el servidor permite y explican por qué no', () => {
    mostrar(juego());
    expect(screen.getByRole('button', { name: 'Tirar dados' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tirar dados' })).toHaveAttribute(
      'title',
      'Eso no se puede hacer en esta fase',
    );
    expect(screen.getByRole('button', { name: 'Terminar turno' })).toBeEnabled();
  });

  it('terminar el turno manda la acción sin jugador (lo pone el servidor)', async () => {
    mostrar(juego());
    await userEvent.click(screen.getByRole('button', { name: 'Terminar turno' }));
    expect(enviar).toHaveBeenCalledWith({ tipo: 'TERMINAR_TURNO' });
  });

  it('si el servidor rechaza una jugada, muestra el motivo', async () => {
    enviar.mockResolvedValue('No tienes recursos suficientes');
    mostrar(juego());
    await userEvent.click(screen.getByRole('button', { name: 'Terminar turno' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes recursos suficientes');
  });

  it('elegir "Poblado" y tocar un vértice construye ahí', async () => {
    mostrar(juego());
    await userEvent.click(screen.getByRole('button', { name: 'Poblado' }));
    await userEvent.click(screen.getByRole('button', { name: `Construir en el vértice ${V1}` }));
    expect(enviar).toHaveBeenCalledWith({ tipo: 'CONSTRUIR_POBLADO', vertice: V1 });
  });

  it('volver a pulsar el modo lo desactiva', async () => {
    mostrar(juego());
    const poblado = screen.getByRole('button', { name: 'Poblado' });
    await userEvent.click(poblado);
    expect(poblado).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(poblado);
    expect(
      screen.queryByRole('button', { name: /Construir en el vértice/ }),
    ).not.toBeInTheDocument();
  });

  it('el cambio con la banca manda los recursos elegidos', async () => {
    mostrar(juego({ acciones: [{ tipo: 'CAMBIAR_CON_BANCA', disponible: true }] }));
    await userEvent.selectOptions(screen.getByLabelText('Entrego'), 'OVEJA');
    await userEvent.selectOptions(screen.getByLabelText('Recibo'), 'MINERAL');
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar' }));
    expect(enviar).toHaveBeenCalledWith({
      tipo: 'CAMBIAR_CON_BANCA',
      entrega: 'OVEJA',
      recibe: 'MINERAL',
    });
  });
});

describe('Partida: preparación', () => {
  it('el modo lo fija la fase: tocar un vértice coloca el poblado inicial', async () => {
    mostrar(juego({ vista: vistaDePrueba({ fase: 'PREPARACION_POBLADO', dados: null }) }));
    await userEvent.click(screen.getByRole('button', { name: `Construir en el vértice ${V2}` }));
    expect(enviar).toHaveBeenCalledWith({ tipo: 'COLOCAR_POBLADO_INICIAL', vertice: V2 });
  });

  it('en la fase del camino se tocan aristas', async () => {
    mostrar(juego({ vista: vistaDePrueba({ fase: 'PREPARACION_CAMINO', dados: null }) }));
    await userEvent.click(screen.getByRole('button', { name: 'Poner camino en a1' }));
    expect(enviar).toHaveBeenCalledWith({ tipo: 'COLOCAR_CAMINO_INICIAL', arista: 'a1' });
  });
});

describe('Partida: no es mi turno', () => {
  it('no hay botones de acción ni nada que tocar en el tablero', () => {
    mostrar(juego({ vista: vistaDePrueba({ turnoDe: 'j2' }) }));
    expect(screen.getByText(/Turno de Beto/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Terminar turno' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /vértice/ })).not.toBeInTheDocument();
  });
});

describe('Partida: ladrón', () => {
  const rivales = (jugadoresConCartas: string[]): Vista => {
    const base = vistaDePrueba({
      fase: 'MOVER_LADRON',
      dados: [3, 4],
      edificios: { [V1]: { dueno: 'j2', tipo: 'POBLADO' }, [V2]: { dueno: 'j3', tipo: 'POBLADO' } },
    });
    return {
      ...base,
      jugadores: base.jugadores.map((j) => ({
        ...j,
        totalCartas: jugadoresConCartas.includes(j.id) ? 3 : 0,
      })),
    };
  };

  it('con un solo rival al que robar, mueve el ladrón y le roba a él directamente', async () => {
    mostrar(juego({ vista: rivales(['j2']) }));
    await userEvent.click(screen.getByRole('button', { name: /casilla 0,0/ }));
    expect(enviar).toHaveBeenCalledWith({
      tipo: 'MOVER_LADRON',
      destino: { q: 0, r: 0, s: 0 },
      victima: 'j2',
    });
  });

  it('sin nadie a quien robar, manda víctima nula', async () => {
    mostrar(juego({ vista: rivales([]) }));
    await userEvent.click(screen.getByRole('button', { name: /casilla 0,0/ }));
    expect(enviar).toHaveBeenCalledWith(expect.objectContaining({ victima: null }));
  });

  it('con varios rivales pregunta a quién robar antes de mandar', async () => {
    mostrar(juego({ vista: rivales(['j2', 'j3']) }));
    await userEvent.click(screen.getByRole('button', { name: /casilla 0,0/ }));
    expect(enviar).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Caro' }));
    expect(enviar).toHaveBeenCalledWith({
      tipo: 'MOVER_LADRON',
      destino: { q: 0, r: 0, s: 0 },
      victima: 'j3',
    });
  });
});

describe('Partida: descarte y fin', () => {
  it('si tengo que descartar, aparece el panel de descarte', () => {
    mostrar(juego({ vista: vistaDePrueba({ fase: 'DESCARTE', descartesPendientes: { j1: 2 } }) }));
    expect(screen.getByRole('heading', { name: /descarta 2 cartas/ })).toBeInTheDocument();
  });

  it('al terminar, anuncia al ganador', () => {
    mostrar(juego({ vista: vistaDePrueba({ fase: 'FIN', turnoDe: null, ganador: 'j2' }) }));
    expect(screen.getByText('¡Ganó Beto!')).toBeInTheDocument();
  });
});

describe('Partida: cartas de desarrollo', () => {
  function conCartas(
    cartas: ('CABALLERO' | 'CONSTRUCCION_CARRETERAS' | 'MONOPOLIO' | 'ABUNDANCIA')[],
  ): Vista {
    const base = vistaDePrueba();
    return {
      ...base,
      jugadores: base.jugadores.map((j) =>
        j.id === 'j1' ? { ...j, cartasDesarrollo: cartas } : j,
      ),
    };
  }

  it('el monopolio manda el recurso elegido', async () => {
    mostrar(juego({ vista: conCartas(['MONOPOLIO']) }));
    await userEvent.selectOptions(screen.getByLabelText('Recurso del monopolio'), 'OVEJA');
    await userEvent.click(screen.getByRole('button', { name: 'Jugar' }));
    expect(enviar).toHaveBeenCalledWith({ tipo: 'JUGAR_MONOPOLIO', recurso: 'OVEJA' });
  });

  it('la abundancia manda los dos recursos', async () => {
    mostrar(juego({ vista: conCartas(['ABUNDANCIA']) }));
    await userEvent.selectOptions(
      screen.getByLabelText('Segundo recurso de la abundancia'),
      'MINERAL',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Jugar' }));
    expect(enviar).toHaveBeenCalledWith({
      tipo: 'JUGAR_ABUNDANCIA',
      recursos: ['MADERA', 'MINERAL'],
    });
  });

  it('el caballero pide elegir una casilla', async () => {
    mostrar(juego({ vista: conCartas(['CABALLERO']) }));
    await userEvent.click(screen.getByRole('button', { name: 'Jugar' }));
    await userEvent.click(screen.getByRole('button', { name: /casilla 1,0/ }));
    expect(enviar).toHaveBeenCalledWith({
      tipo: 'JUGAR_CABALLERO',
      destino: { q: 1, r: 0, s: -1 },
      victima: null,
    });
  });

  it('construcción de carreteras junta hasta dos aristas y las manda juntas', async () => {
    mostrar(juego({ vista: conCartas(['CONSTRUCCION_CARRETERAS']) }));
    await userEvent.click(screen.getByRole('button', { name: 'Jugar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Poner camino en a1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Poner camino en a2' }));
    await userEvent.click(screen.getByRole('button', { name: /Construir 2 caminos/ }));
    expect(enviar).toHaveBeenCalledWith({
      tipo: 'JUGAR_CONSTRUCCION_CARRETERAS',
      aristas: ['a1', 'a2'],
    });
  });

  it('tocar de nuevo una arista elegida la quita', async () => {
    mostrar(juego({ vista: conCartas(['CONSTRUCCION_CARRETERAS']) }));
    await userEvent.click(screen.getByRole('button', { name: 'Jugar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Poner camino en a1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Poner camino en a1' }));
    expect(screen.getByRole('button', { name: /Construir 0 caminos/ })).toBeDisabled();
  });
});
