import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AccionDisponible, Sitios, Vista } from '@/lib/esquemas';
import { SIN_SITIOS, V1, V2, mesaDePrueba, vistaDePrueba } from '@/lib/pruebas';
import { Partida } from './Partida';
import { useJuego, type Juego } from './useJuego';

vi.mock('./useJuego');

const { sonido } = vi.hoisted(() => ({
  sonido: { reproducir: vi.fn(), silenciado: false, alternarSilencio: vi.fn() },
}));
vi.mock('@/lib/sonido', () => ({ sonidoDelJuego: () => sonido }));

const credencial = { salaId: 'abcd1234', jugadorId: 'j1', token: 'tok' };
const nombres = { j1: 'Ana', j2: 'Beto', j3: 'Caro' };
const enviar = vi.fn<Juego['enviar']>();

const ACCIONES: AccionDisponible[] = [
  { tipo: 'TERMINAR_TURNO', disponible: true },
  { tipo: 'TIRAR_DADOS', disponible: false, motivo: 'FASE_INCORRECTA' },
  { tipo: 'CONSTRUIR_POBLADO', disponible: true },
  { tipo: 'CONSTRUIR_CAMINO', disponible: true },
  { tipo: 'PROPONER_TRATO', disponible: true },
  { tipo: 'CAMBIAR_CON_BANCA', disponible: true },
];

interface Opciones extends Partial<Juego> {
  vista?: Vista;
  acciones?: AccionDisponible[];
  sitios?: Partial<Sitios>;
}

function juego({ vista, acciones, sitios, ...resto }: Opciones = {}): Juego {
  return {
    conexion: 'conectado',
    rechazo: null,
    eventos: [],
    ultimos: { numero: 0, eventos: [] },
    tiradas: 0,
    resaltado: null,
    vence: null,
    enviar,
    datos: {
      mesa: mesaDePrueba,
      vista: vista ?? vistaDePrueba(),
      acciones: acciones ?? ACCIONES,
      sitios: { ...SIN_SITIOS, ...sitios },
    },
    ...resto,
  };
}

function mostrar(j: Juego): void {
  vi.mocked(useJuego).mockReturnValue(j);
  render(<Partida credencial={credencial} nombres={nombres} />);
}

/** La vista de prueba, con otra mano para mí. */
function conMano(recursos: Record<string, number>, extra: Partial<Vista> = {}): Vista {
  const base = vistaDePrueba(extra);
  return {
    ...base,
    jugadores: base.jugadores.map((j) =>
      j.id === 'j1'
        ? {
            ...j,
            recursos: { MADERA: 0, LADRILLO: 0, OVEJA: 0, TRIGO: 0, MINERAL: 0, ...recursos },
          }
        : j,
    ),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  enviar.mockResolvedValue(null);
  sonido.silenciado = false;
});

describe('Partida: entrada', () => {
  it('conecta con la sala y el token de la credencial', () => {
    mostrar(juego({ datos: null }));
    expect(useJuego).toHaveBeenCalledWith('abcd1234', 'tok');
    expect(screen.getByText('Conectando con la partida…')).toBeInTheDocument();
  });

  it('si el servidor no deja entrar, lo explica en español y ofrece volver', () => {
    mostrar(juego({ datos: null, rechazo: 'NO_AUTORIZADO' }));
    expect(screen.getByRole('alert')).toHaveTextContent('No estás autorizado en esta partida');
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
  });

  it('avisa si se pierde la conexión', () => {
    mostrar(juego({ conexion: 'reconectando' }));
    expect(screen.getByText('Reconectando…')).toBeInTheDocument();
  });
});

describe('Partida: mi turno', () => {
  it('dice en pocas palabras qué toca', () => {
    mostrar(juego());
    expect(screen.getByText('Tu turno')).toBeInTheDocument();
  });

  it('muestra mi mano, el banco y a los jugadores', () => {
    mostrar(juego());
    expect(screen.getByLabelText('Tu mano')).toBeInTheDocument();
    expect(screen.getByLabelText('Banco')).toBeInTheDocument();
    expect(screen.getByLabelText('Jugadores')).toBeInTheDocument();
  });

  it('los dados se pulsan cuando me toca tirar', async () => {
    mostrar(
      juego({
        vista: vistaDePrueba({ fase: 'PRE_TIRADA', dados: null }),
        acciones: [{ tipo: 'TIRAR_DADOS', disponible: true }],
      }),
    );
    expect(screen.getByText('Tira los dados')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Tirar dados/ }));
    expect(enviar).toHaveBeenCalledWith({ tipo: 'TIRAR_DADOS' });
  });

  it('terminar el turno manda la acción sin jugador (lo pone el servidor)', async () => {
    mostrar(juego());
    await userEvent.click(screen.getByRole('button', { name: 'Terminar turno' }));
    expect(enviar).toHaveBeenCalledWith({ tipo: 'TERMINAR_TURNO' });
  });

  it('si el servidor rechaza una jugada, muestra el motivo y suena el error', async () => {
    enviar.mockResolvedValue('No tienes recursos suficientes');
    mostrar(juego());
    await userEvent.click(screen.getByRole('button', { name: 'Terminar turno' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes recursos suficientes');
    expect(sonido.reproducir).toHaveBeenCalledWith('error');
  });
});

describe('Partida: construir con vista previa', () => {
  it('elegir poblado resalta solo los sitios legales', async () => {
    mostrar(juego({ sitios: { poblados: [V2] } }));
    await userEvent.click(screen.getByRole('button', { name: /Poblado/ }));
    expect(screen.getAllByRole('button', { name: /Construir en el vértice/ })).toHaveLength(1);
  });

  it('el primer toque solo muestra la vista previa; el segundo confirma', async () => {
    mostrar(juego({ sitios: { poblados: [V1, V2] } }));
    await userEvent.click(screen.getByRole('button', { name: /Poblado/ }));
    const vertice = screen.getByRole('button', { name: `Construir en el vértice ${V1}` });

    await userEvent.click(vertice);
    expect(enviar).not.toHaveBeenCalled();
    expect(vertice).toHaveAttribute('aria-pressed', 'true');
    expect(sonido.reproducir).toHaveBeenCalledWith('clic');

    await userEvent.click(vertice);
    expect(enviar).toHaveBeenCalledWith({ tipo: 'CONSTRUIR_POBLADO', vertice: V1 });
  });

  it('tocar otro sitio cambia la vista previa en lugar de construir', async () => {
    mostrar(juego({ sitios: { poblados: [V1, V2] } }));
    await userEvent.click(screen.getByRole('button', { name: /Poblado/ }));
    await userEvent.click(screen.getByRole('button', { name: `Construir en el vértice ${V1}` }));
    await userEvent.click(screen.getByRole('button', { name: `Construir en el vértice ${V2}` }));
    expect(enviar).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: `Construir en el vértice ${V2}` })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('un camino también se confirma con dos toques', async () => {
    mostrar(juego({ sitios: { caminos: ['a1'] } }));
    await userEvent.click(screen.getByRole('button', { name: /Camino/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Poner camino en a1' }));
    expect(enviar).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar camino en a1' }));
    expect(enviar).toHaveBeenCalledWith({ tipo: 'CONSTRUIR_CAMINO', arista: 'a1' });
  });

  it('volver a pulsar la pieza cancela el modo y quita los sitios', async () => {
    mostrar(juego({ sitios: { poblados: [V1] } }));
    const poblado = screen.getByRole('button', { name: /Poblado/ });
    await userEvent.click(poblado);
    await userEvent.click(poblado);
    expect(
      screen.queryByRole('button', { name: /Construir en el vértice/ }),
    ).not.toBeInTheDocument();
  });
});

describe('Partida: preparación', () => {
  it('el modo lo fija la fase: poblado inicial con dos toques', async () => {
    mostrar(
      juego({
        vista: vistaDePrueba({ fase: 'PREPARACION_POBLADO', dados: null }),
        sitios: { poblados: [V1, V2] },
      }),
    );
    expect(screen.getByText('Pon tu poblado')).toBeInTheDocument();
    const vertice = screen.getByRole('button', { name: `Construir en el vértice ${V2}` });
    await userEvent.click(vertice);
    await userEvent.click(vertice);
    expect(enviar).toHaveBeenCalledWith({ tipo: 'COLOCAR_POBLADO_INICIAL', vertice: V2 });
  });

  it('con una vista previa aparece un botón grande para colocar, que no tapa el tablero', async () => {
    mostrar(
      juego({
        vista: vistaDePrueba({ fase: 'PREPARACION_POBLADO', dados: null }),
        sitios: { poblados: [V1, V2] },
      }),
    );
    expect(screen.queryByRole('button', { name: 'Colocar aquí' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: `Construir en el vértice ${V2}` }));
    await userEvent.click(screen.getByRole('button', { name: 'Colocar aquí' }));
    expect(enviar).toHaveBeenCalledWith({ tipo: 'COLOCAR_POBLADO_INICIAL', vertice: V2 });
  });

  it('el botón grande también coloca un camino', async () => {
    mostrar(
      juego({
        vista: vistaDePrueba({ fase: 'PREPARACION_CAMINO', dados: null }),
        sitios: { caminos: ['a1'] },
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Poner camino en a1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Colocar aquí' }));
    expect(enviar).toHaveBeenCalledWith({ tipo: 'COLOCAR_CAMINO_INICIAL', arista: 'a1' });
  });

  it('en la fase del camino se tocan aristas', async () => {
    mostrar(
      juego({
        vista: vistaDePrueba({ fase: 'PREPARACION_CAMINO', dados: null }),
        sitios: { caminos: ['a1'] },
      }),
    );
    expect(screen.getByText('Pon tu camino')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Poner camino en a1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar camino en a1' }));
    expect(enviar).toHaveBeenCalledWith({ tipo: 'COLOCAR_CAMINO_INICIAL', arista: 'a1' });
  });
});

describe('Partida: no es mi turno', () => {
  it('no hay nada que tocar en el tablero y las piezas están deshabilitadas', () => {
    mostrar(
      juego({
        vista: vistaDePrueba({ turnoDe: 'j2' }),
        acciones: ACCIONES.map((a) => ({ ...a, disponible: false })),
      }),
    );
    expect(screen.getByText('Turno de Beto')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /vértice/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Poblado/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Comerciar' })).toBeDisabled();
  });
});

describe('Partida: comercio con cartas', () => {
  it('el botón abre el panel, se arma la oferta con cartas y se manda', async () => {
    mostrar(juego({ vista: conMano({ MADERA: 3 }) }));
    expect(screen.queryByRole('region', { name: 'Comerciar' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Comerciar' }));
    expect(screen.getByRole('region', { name: 'Comerciar' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Doy: añadir madera' }));
    await userEvent.click(screen.getByRole('button', { name: 'Pido: añadir trigo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Enviar oferta' }));

    expect(enviar).toHaveBeenCalledWith({
      tipo: 'PROPONER_TRATO',
      entrega: { MADERA: 1 },
      pide: { TRIGO: 1 },
    });
    expect(screen.queryByRole('region', { name: 'Comerciar' })).not.toBeInTheDocument();
  });

  it('volver a pulsar el botón cierra el panel', async () => {
    mostrar(juego());
    await userEvent.click(screen.getByRole('button', { name: 'Comerciar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Comerciar' }));
    expect(screen.queryByRole('region', { name: 'Comerciar' })).not.toBeInTheDocument();
  });

  it('una oferta abierta aparece sobre el tablero y se acepta con un icono', async () => {
    const trato = {
      id: 't1',
      proponente: 'j2',
      destinatario: null,
      entrega: { MADERA: 1, LADRILLO: 0, OVEJA: 0, TRIGO: 0, MINERAL: 0 },
      pide: { MADERA: 0, LADRILLO: 0, OVEJA: 0, TRIGO: 1, MINERAL: 0 },
      rechazadoPor: [],
    };
    mostrar(juego({ vista: vistaDePrueba({ turnoDe: 'j2', tratos: [trato] }) }));
    await userEvent.click(screen.getByRole('button', { name: 'Aceptar' }));
    expect(enviar).toHaveBeenCalledWith({ tipo: 'ACEPTAR_TRATO', tratoId: 't1' });
  });
});

describe('Partida: ladrón', () => {
  const rivales = (conCartas: string[]): Vista => {
    const base = vistaDePrueba({
      fase: 'MOVER_LADRON',
      edificios: { [V1]: { dueno: 'j2', tipo: 'POBLADO' }, [V2]: { dueno: 'j3', tipo: 'POBLADO' } },
    });
    return {
      ...base,
      jugadores: base.jugadores.map((j) => ({
        ...j,
        totalCartas: conCartas.includes(j.id) ? 3 : 0,
      })),
    };
  };
  const sitios = { ladron: ['0,0', '1,0'] };

  it('con un solo rival al que robar, le roba a él directamente', async () => {
    mostrar(juego({ vista: rivales(['j2']), sitios }));
    expect(screen.getByText('Mueve el ladrón')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /casilla 0,0/ }));
    expect(enviar).toHaveBeenCalledWith({
      tipo: 'MOVER_LADRON',
      destino: { q: 0, r: 0, s: 0 },
      victima: 'j2',
    });
  });

  it('sin nadie a quien robar, manda víctima nula', async () => {
    mostrar(juego({ vista: rivales([]), sitios }));
    await userEvent.click(screen.getByRole('button', { name: /casilla 0,0/ }));
    expect(enviar).toHaveBeenCalledWith(expect.objectContaining({ victima: null }));
  });

  it('con varios rivales se elige a quién robar tocando su círculo', async () => {
    mostrar(juego({ vista: rivales(['j2', 'j3']), sitios }));
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
  it('si tengo que descartar, aparece el descarte con mis cartas sobre el tablero', async () => {
    mostrar(
      juego({
        vista: conMano({ MADERA: 3 }, { fase: 'DESCARTE', descartesPendientes: { j1: 2 } }),
      }),
    );
    expect(screen.getByRole('heading', { name: 'Descarta 2' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Añadir madera' }));
    await userEvent.click(screen.getByRole('button', { name: 'Añadir madera' }));
    await userEvent.click(screen.getByRole('button', { name: /Descartar \(/ }));
    expect(enviar).toHaveBeenCalledWith({ tipo: 'DESCARTAR_RECURSOS', recursos: { MADERA: 2 } });
  });

  it('al terminar, anuncia al ganador y ofrece volver al inicio', () => {
    mostrar(juego({ vista: vistaDePrueba({ fase: 'FIN', turnoDe: null, ganador: 'j2' }) }));
    expect(screen.getAllByText('¡Ganó Beto!').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toBeInTheDocument();
  });
});

describe('Partida: cartas de desarrollo', () => {
  function conCartas(cartas: ('CABALLERO' | 'CONSTRUCCION_CARRETERAS' | 'MONOPOLIO')[]): Vista {
    const base = vistaDePrueba();
    return {
      ...base,
      jugadores: base.jugadores.map((j) =>
        j.id === 'j1' ? { ...j, cartasDesarrollo: cartas } : j,
      ),
    };
  }

  it('el caballero pide elegir una casilla legal', async () => {
    mostrar(juego({ vista: conCartas(['CABALLERO']), sitios: { caballero: ['1,0'] } }));
    await userEvent.click(screen.getByRole('button', { name: /Jugar Caballero/ }));
    expect(screen.getAllByRole('button', { name: /casilla/ })).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: /casilla 1,0/ }));
    expect(enviar).toHaveBeenCalledWith({
      tipo: 'JUGAR_CABALLERO',
      destino: { q: 1, r: 0, s: -1 },
      victima: null,
    });
  });

  it('el monopolio se juega eligiendo un recurso con una carta', async () => {
    mostrar(juego({ vista: conCartas(['MONOPOLIO']) }));
    await userEvent.click(screen.getByRole('button', { name: /Jugar Monopolio/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Elegir trigo' }));
    expect(enviar).toHaveBeenCalledWith({ tipo: 'JUGAR_MONOPOLIO', recurso: 'TRIGO' });
  });

  it('construcción de carreteras junta hasta dos aristas y las manda juntas', async () => {
    mostrar(
      juego({
        vista: conCartas(['CONSTRUCCION_CARRETERAS']),
        sitios: { carreteras: ['a1', 'a2'] },
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: /Jugar Construcción de carreteras/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Poner camino en a1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Poner camino en a2' }));
    await userEvent.click(screen.getByRole('button', { name: 'Construir 2 caminos' }));
    expect(enviar).toHaveBeenCalledWith({
      tipo: 'JUGAR_CONSTRUCCION_CARRETERAS',
      aristas: ['a1', 'a2'],
    });
  });

  it('tocar de nuevo una arista elegida la quita', async () => {
    mostrar(
      juego({ vista: conCartas(['CONSTRUCCION_CARRETERAS']), sitios: { carreteras: ['a1'] } }),
    );
    await userEvent.click(screen.getByRole('button', { name: /Jugar Construcción de carreteras/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Poner camino en a1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar camino en a1' }));
    expect(screen.getByRole('button', { name: 'Construir 0 caminos' })).toBeDisabled();
  });
});

describe('Partida: dados', () => {
  it('muestra la suma de la última tirada', () => {
    mostrar(juego({ vista: vistaDePrueba({ dados: [3, 4] }) }));
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('las casillas del número que salió laten en el tablero unos segundos', () => {
    mostrar(juego({ resaltado: 8 }));
    expect(screen.getByText('Produce con el 8')).toBeInTheDocument();
  });

  it('pasado ese tiempo, o si salió un número sin casillas, no se resalta nada', () => {
    mostrar(juego({ resaltado: null }));
    expect(screen.queryByText(/Produce con el/)).not.toBeInTheDocument();
  });
});

describe('Partida: sonido', () => {
  it('al pasar a ser mi turno suena el aviso', () => {
    mostrar(juego());
    expect(sonido.reproducir).toHaveBeenCalledWith('turno');
  });

  it('si no es mi turno no suena el aviso', () => {
    mostrar(juego({ vista: vistaDePrueba({ turnoDe: 'j2' }) }));
    expect(sonido.reproducir).not.toHaveBeenCalledWith('turno');
  });

  it('reproduce el sonido de cada tipo de evento nuevo, una vez aunque haya varios', () => {
    mostrar(
      juego({
        vista: vistaDePrueba({ turnoDe: 'j2' }),
        ultimos: {
          numero: 1,
          eventos: [
            { tipo: 'DADOS_TIRADOS' },
            { tipo: 'RECURSOS_REPARTIDOS', jugador: 'j1' },
            { tipo: 'RECURSOS_REPARTIDOS', jugador: 'j1' },
            { tipo: 'FASE_CAMBIADA' },
          ],
        },
      }),
    );
    const llamadas = sonido.reproducir.mock.calls.map(([efecto]) => efecto);
    expect(llamadas.toSorted()).toEqual(['dados', 'ganar']);
  });

  it('el botón de sonido lo apaga y lo enciende', async () => {
    sonido.alternarSilencio.mockReturnValueOnce(true).mockReturnValueOnce(false);
    mostrar(juego());
    await userEvent.click(screen.getByRole('button', { name: 'Sonido activado' }));
    expect(screen.getByRole('button', { name: 'Sonido apagado' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sonido apagado' }));
    expect(screen.getByRole('button', { name: 'Sonido activado' })).toBeInTheDocument();
  });

  it('arranca apagado si así se dejó la última vez', () => {
    sonido.silenciado = true;
    mostrar(juego());
    expect(screen.getByRole('button', { name: 'Sonido apagado' })).toBeInTheDocument();
  });
});

describe('Partida: reloj de turno', () => {
  it('muestra la cuenta atrás cuando la sala tiene límite de tiempo', () => {
    mostrar(juego({ vence: Date.now() + 45_000 }));

    expect(screen.getByRole('timer', { name: 'Tiempo del turno' })).toHaveTextContent('0:45');
  });

  it('sin límite de tiempo no hay reloj', () => {
    mostrar(juego({ vence: null }));

    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  });
});
