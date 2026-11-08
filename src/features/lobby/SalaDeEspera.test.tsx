import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { suscribirSala, type SalaEnVivo } from '@/lib/lobby';
import { yo } from '@/lib/cuentas';
import { mapasDePrueba } from '@/lib/pruebas';
import {
  cambiarSala,
  cederAnfitrion,
  empezarSala,
  expulsarDeSala,
  listarMapas,
  salirDeSala,
  unirseASala,
} from '@/lib/salas';
import { guardarCredencial, leerCredencial, olvidarCredencial } from '@/lib/sesion';
import { SalaDeEspera } from './SalaDeEspera';

vi.mock('@/lib/salas');
vi.mock('@/lib/lobby');
vi.mock('@/lib/cuentas');
// enlaceDeSala es lógica pura: se usa la real y solo se falsea lo que toca el almacenamiento.
vi.mock('@/lib/sesion', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('@/lib/sesion')>()),
  guardarCredencial: vi.fn(),
  guardarNombre: vi.fn(),
  leerCredencial: vi.fn(),
  olvidarCredencial: vi.fn(),
}));

const ana = { salaId: 'abcd1234', jugadorId: 'j1', token: 'tok-ana' };
const beto = { salaId: 'abcd1234', jugadorId: 'j2', token: 'tok-beto' };
const sala = (extra: Partial<SalaEnVivo> = {}): SalaEnVivo => ({
  id: 'abcd1234',
  empezada: false,
  anfitrion: 'j1',
  jugadores: [
    { id: 'j1', nombre: 'Ana' },
    { id: 'j2', nombre: 'Beto' },
  ],
  publica: false,
  maximo: 12,
  opciones: {},
  conectados: ['j1', 'j2'],
  ...extra,
});

/** El servidor manda este estado nada más conectarse (y devuelve la baja de la suscripción). */
function servidorMuestra(estado: SalaEnVivo): void {
  vi.mocked(suscribirSala).mockImplementation((_entrada, m) => {
    m.alEstado(estado);
    return vi.fn();
  });
}

/** El servidor rechaza la conexión con ese motivo. */
function servidorRechaza(motivo: string): void {
  vi.mocked(suscribirSala).mockImplementation((_entrada, m) => {
    m.alRechazar(motivo);
    return vi.fn();
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(leerCredencial).mockReturnValue(null);
  vi.mocked(yo).mockResolvedValue(null);
  vi.mocked(listarMapas).mockResolvedValue(mapasDePrueba);
});

describe('SalaDeEspera', () => {
  it('muestra los jugadores y quién es el anfitrión', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    servidorMuestra(sala());
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    expect(await screen.findByText('Ana ★')).toBeInTheDocument();
    expect(screen.getByText('Beto')).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent('abcd1234');
    expect(screen.getByRole('list', { name: 'Jugadores (2 de 12)' })).toBeInTheDocument();
  });

  it('el anfitrión empieza la partida con su token', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    servidorMuestra(sala());
    vi.mocked(empezarSala).mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    await usuario.click(await screen.findByRole('button', { name: 'Empezar la partida' }));

    expect(empezarSala).toHaveBeenCalledWith('abcd1234', 'tok-ana');
  });

  it('con un solo jugador no se puede empezar', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    servidorMuestra(sala({ jugadores: [{ id: 'j1', nombre: 'Ana' }] }));
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    expect(await screen.findByRole('button', { name: /Faltan jugadores/ })).toBeDisabled();
  });

  it('quien no es anfitrión espera', async () => {
    vi.mocked(leerCredencial).mockReturnValue(beto);
    servidorMuestra(sala());
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    expect(await screen.findByText(/Esperando a que el anfitrión/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Empezar/ })).not.toBeInTheDocument();
  });

  it('sin credencial ofrece unirse con un nombre y la guarda', async () => {
    servidorMuestra(sala());
    vi.mocked(unirseASala).mockResolvedValue(beto);
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    await usuario.type(await screen.findByLabelText('Tu nombre'), 'Beto');
    await usuario.click(screen.getByRole('button', { name: 'Unirme a esta sala' }));

    expect(unirseASala).toHaveBeenCalledWith('abcd1234', 'Beto');
    expect(guardarCredencial).toHaveBeenCalledWith(beto);
    expect(await screen.findByText(/Esperando a que el anfitrión/)).toBeInTheDocument();
  });

  it('cuando la sala empieza y soy jugador, avisa con mi credencial y los nombres', async () => {
    vi.mocked(leerCredencial).mockReturnValue(beto);
    servidorMuestra(sala({ empezada: true }));
    const onEmpezada = vi.fn();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={onEmpezada} />);

    await screen.findByRole('heading');
    // El aviso sale en un efecto posterior a pintar la sala: se espera, no se supone.
    await waitFor(() =>
      expect(onEmpezada).toHaveBeenCalledWith({
        credencial: beto,
        nombres: { j1: 'Ana', j2: 'Beto' },
      }),
    );
  });

  it('si ya empezó y no estoy en ella, lo dice en lugar de entrar', async () => {
    servidorMuestra(sala({ empezada: true }));
    const onEmpezada = vi.fn();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={onEmpezada} />);

    expect(await screen.findByText('La partida ya empezó y no estás en ella.')).toBeInTheDocument();
    expect(onEmpezada).not.toHaveBeenCalled();
  });

  it('si la sala no existe, muestra el error', async () => {
    servidorRechaza('SALA_NO_EXISTE');
    render(<SalaDeEspera salaId="zzzz" onEmpezada={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('La sala no existe');
  });

  it('si empezar falla (faltan jugadores en el servidor), muestra el motivo', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    servidorMuestra(sala());
    vi.mocked(empezarSala).mockRejectedValue(new Error('Hacen falta al menos 2 jugadores'));
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    await usuario.click(await screen.findByRole('button', { name: 'Empezar la partida' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Hacen falta al menos 2 jugadores');
  });

  it('el anfitrión cambia una regla: se ve al instante y se manda con su token', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    servidorMuestra(sala());
    vi.mocked(cambiarSala).mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    await usuario.click(await screen.findByRole('button', { name: '12' }));

    expect(cambiarSala).toHaveBeenCalledWith('abcd1234', 'tok-ana', { puntosVictoria: 12 });
    expect(screen.getByRole('button', { name: '12' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('si el servidor rechaza el cambio, vuelve a lo anterior y dice por qué', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    servidorMuestra(sala());
    vi.mocked(cambiarSala).mockRejectedValue(new Error('La partida ya empezó'));
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    await usuario.click(await screen.findByRole('button', { name: '12' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La partida ya empezó');
    expect(screen.getByRole('button', { name: '10' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('quien no es anfitrión ve las reglas elegidas pero no puede cambiarlas', async () => {
    vi.mocked(leerCredencial).mockReturnValue(beto);
    servidorMuestra(sala({ opciones: { puntosVictoria: 15 } }));
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    const quince = await screen.findByRole('button', { name: '15' });

    expect(quince).toHaveAttribute('aria-pressed', 'true');
    expect(quince).toBeDisabled();
  });

  it('copia el enlace de invitación con la dirección actual', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    servidorMuestra(sala());
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);
    const escribir = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await usuario.click(await screen.findByRole('button', { name: 'Copiar enlace' }));

    expect(escribir).toHaveBeenCalledWith(`${window.location.origin}/sala/abcd1234`);
    expect(await screen.findByRole('button', { name: '¡Copiado!' })).toBeInTheDocument();
  });

  it('copia solo el código de la sala, sin la dirección', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    servidorMuestra(sala());
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);
    const escribir = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await usuario.click(await screen.findByRole('button', { name: 'Copiar código' }));

    expect(escribir).toHaveBeenCalledWith('abcd1234');
    expect(await screen.findByRole('button', { name: '¡Código copiado!' })).toBeInTheDocument();
    // El aviso es solo de ese botón: el del enlace no cambia.
    expect(screen.getByRole('button', { name: 'Copiar enlace' })).toBeInTheDocument();
  });

  it('si no se puede copiar, no se rompe y el código sigue a la vista', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    servidorMuestra(sala());
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denegado'));

    await usuario.click(await screen.findByRole('button', { name: 'Copiar enlace' }));

    expect(screen.getByRole('button', { name: 'Copiar enlace' })).toBeInTheDocument();
    expect(screen.getByText('abcd1234')).toBeInTheDocument();
  });

  it('con sesión iniciada, unirse usa el nombre de la cuenta', async () => {
    vi.mocked(yo).mockResolvedValue({ id: 'u9', nombre: 'Zoe' });
    servidorMuestra(sala());
    vi.mocked(unirseASala).mockResolvedValue(beto);
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    await usuario.click(await screen.findByRole('button', { name: 'Unirme a esta sala' }));

    expect(unirseASala).toHaveBeenCalledWith('abcd1234', 'Zoe');
  });
});

describe('SalaDeEspera: mapa', () => {
  it('muestra el selector de mapa con el catálogo del servidor', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    servidorMuestra(sala());
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    expect(await screen.findByRole('button', { name: /Grande/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Automático/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('marca el mapa que ya eligió el anfitrión', async () => {
    vi.mocked(leerCredencial).mockReturnValue(beto);
    servidorMuestra(sala({ opciones: { mapa: 'grande' } }));
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    expect(await screen.findByRole('button', { name: /Grande/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('el anfitrión elige un mapa: se ve al instante y se manda su id con su token', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    servidorMuestra(sala());
    vi.mocked(cambiarSala).mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    await usuario.click(await screen.findByRole('button', { name: /Grande/ }));

    expect(cambiarSala).toHaveBeenCalledWith('abcd1234', 'tok-ana', { mapa: 'grande' });
    expect(screen.getByRole('button', { name: /Grande/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('elegir el automático manda null', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    servidorMuestra(sala({ opciones: { mapa: 'grande' } }));
    vi.mocked(cambiarSala).mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    await usuario.click(await screen.findByRole('button', { name: /Automático/ }));

    expect(cambiarSala).toHaveBeenCalledWith('abcd1234', 'tok-ana', { mapa: null });
  });

  it('quien no es anfitrión no puede cambiar el mapa', async () => {
    vi.mocked(leerCredencial).mockReturnValue(beto);
    servidorMuestra(sala());
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    expect(await screen.findByRole('button', { name: /Grande/ })).toBeDisabled();
  });

  it('si el servidor rechaza el mapa (no caben), vuelve al anterior y dice por qué', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    servidorMuestra(sala());
    vi.mocked(cambiarSala).mockRejectedValue(
      new Error('El mapa «Grande» admite hasta 12 jugadores y la sala ya tiene 13'),
    );
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    await usuario.click(await screen.findByRole('button', { name: /Grande/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('admite hasta 12');
    expect(screen.getByRole('button', { name: /Automático/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('el máximo de jugadores lo manda el servidor (el del mapa elegido), no una constante', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    servidorMuestra(sala({ maximo: 7, opciones: { mapa: 'clasico' } }));
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    expect(await screen.findByRole('list', { name: 'Jugadores (2 de 7)' })).toBeInTheDocument();
  });

  it('si el catálogo no carga, la sala sigue funcionando y lo dice', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    servidorMuestra(sala());
    vi.mocked(listarMapas).mockRejectedValue(new Error('sin red'));
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    expect(await screen.findByText(/No se pudo cargar la lista de mapas/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Automático/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Empezar la partida' })).toBeEnabled();
  });

  it('el aviso de mapa que «no cabe» usa los jugadores que hay en la sala', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    servidorMuestra(
      sala({
        jugadores: Array.from({ length: 8 }, (_, i) => ({ id: `j${i + 1}`, nombre: `P${i + 1}` })),
      }),
    );
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    const clasico = await screen.findByRole('button', { name: /Clásico/ });
    expect(clasico).toBeDisabled();
    expect(clasico).toHaveTextContent('No cabe');
  });

  describe('salir, expulsar y ceder el anfitrión', () => {
    const dibujar = async (credencial = ana) => {
      vi.mocked(leerCredencial).mockReturnValue(credencial);
      servidorMuestra(sala());
      const usuario = userEvent.setup();
      render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);
      await screen.findByText('Beto');
      return usuario;
    };

    it('el anfitrión ve «Expulsar» y «Hacer anfitrión» en los demás, no en sí mismo', async () => {
      await dibujar();
      expect(screen.getByRole('button', { name: 'Expulsar a Beto' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Hacer anfitrión a Beto' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Expulsar a Ana/ })).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Hacer anfitrión a Ana/ }),
      ).not.toBeInTheDocument();
    });

    it('quien no es anfitrión no ve esos botones', async () => {
      await dibujar(beto);
      expect(screen.queryByRole('button', { name: /Expulsar/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Hacer anfitrión/ })).not.toBeInTheDocument();
    });

    it('expulsar manda el id del jugador con el token del anfitrión', async () => {
      vi.mocked(expulsarDeSala).mockResolvedValue(undefined);
      const usuario = await dibujar();
      await usuario.click(screen.getByRole('button', { name: 'Expulsar a Beto' }));
      expect(expulsarDeSala).toHaveBeenCalledWith('abcd1234', 'tok-ana', 'j2');
    });

    it('si expulsar falla, lo avisa', async () => {
      vi.mocked(expulsarDeSala).mockRejectedValue(new Error('Ese jugador no está en la sala'));
      const usuario = await dibujar();
      await usuario.click(screen.getByRole('button', { name: 'Expulsar a Beto' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('Ese jugador no está en la sala');
    });

    it('ceder el anfitrión manda el id del nuevo anfitrión', async () => {
      vi.mocked(cederAnfitrion).mockResolvedValue(undefined);
      const usuario = await dibujar();
      await usuario.click(screen.getByRole('button', { name: 'Hacer anfitrión a Beto' }));
      expect(cederAnfitrion).toHaveBeenCalledWith('abcd1234', 'tok-ana', 'j2');
    });

    it('salir avisa al servidor, olvida la credencial y despide', async () => {
      vi.mocked(salirDeSala).mockResolvedValue(undefined);
      const usuario = await dibujar(beto);
      await usuario.click(screen.getByRole('button', { name: 'Salir de la sala' }));

      expect(salirDeSala).toHaveBeenCalledWith('abcd1234', 'tok-beto');
      expect(olvidarCredencial).toHaveBeenCalledWith('abcd1234');
      expect(await screen.findByText('Saliste de la sala')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Volver a jugar' })).toHaveAttribute(
        'href',
        '/jugar',
      );
    });

    it('si salir falla, sigues en la sala y se avisa', async () => {
      vi.mocked(salirDeSala).mockRejectedValue(new Error('La partida ya empezó'));
      const usuario = await dibujar(beto);
      await usuario.click(screen.getByRole('button', { name: 'Salir de la sala' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('La partida ya empezó');
      expect(olvidarCredencial).not.toHaveBeenCalled();
      expect(screen.queryByText('Saliste de la sala')).not.toBeInTheDocument();
    });

    it('sin haber entrado, «Salir» es solo un enlace y no llama al servidor', async () => {
      servidorMuestra(sala());
      render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);
      await screen.findByText('Beto');
      expect(screen.getByRole('link', { name: 'Salir' })).toHaveAttribute('href', '/jugar');
      expect(salirDeSala).not.toHaveBeenCalled();
    });

    it('si el anfitrión te saca, lo ves y se olvida tu credencial', async () => {
      vi.mocked(leerCredencial).mockReturnValue(beto);
      servidorMuestra(sala({ jugadores: [{ id: 'j1', nombre: 'Ana' }] }));
      render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

      expect(await screen.findByText('Te sacaron de la sala')).toBeInTheDocument();
      expect(olvidarCredencial).toHaveBeenCalledWith('abcd1234');
      expect(screen.queryByText(/Esperando a que el anfitrión/)).not.toBeInTheDocument();
    });

    it('el aviso de que te sacaron no sale con la partida ya empezada', async () => {
      vi.mocked(leerCredencial).mockReturnValue(beto);
      servidorMuestra(sala({ empezada: true, jugadores: [{ id: 'j1', nombre: 'Ana' }] }));
      render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);
      await screen.findByText('Ana ★');
      expect(screen.queryByText('Te sacaron de la sala')).not.toBeInTheDocument();
    });
  });
});

describe('SalaDeEspera: en vivo por socket', () => {
  it('mira la sala con mi token y no vuelve a preguntar por HTTP', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    servidorMuestra(sala());
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);
    await screen.findByText('Ana ★');
    expect(suscribirSala).toHaveBeenCalledWith(
      { salaId: 'abcd1234', token: 'tok-ana' },
      expect.any(Object),
    );
    expect(suscribirSala).toHaveBeenCalledTimes(1);
  });

  it('sin credencial mira la sala sin token', async () => {
    servidorMuestra(sala());
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);
    await screen.findByText('Ana ★');
    expect(suscribirSala).toHaveBeenCalledWith(
      { salaId: 'abcd1234', token: undefined },
      expect.any(Object),
    );
  });

  it('marca «Desconectado» a quien no tiene pestaña abierta, con texto y no solo con color', async () => {
    servidorMuestra(sala({ conectados: ['j1'] }));
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);
    await screen.findByText('Ana ★');
    expect(screen.getAllByText('Desconectado')).toHaveLength(1);
    expect(screen.getByText('Beto').closest('li')).toHaveTextContent('Desconectado');
    expect(screen.getByText('Ana ★').closest('li')).not.toHaveTextContent('Desconectado');
  });

  it('cuando llega un estado nuevo (alguien entra), la lista se actualiza sola', async () => {
    let enviar: ((estado: SalaEnVivo) => void) | undefined;
    vi.mocked(suscribirSala).mockImplementation((_entrada, m) => {
      m.alEstado(sala({ jugadores: [{ id: 'j1', nombre: 'Ana' }], conectados: ['j1'] }));
      enviar = m.alEstado;
      return vi.fn();
    });
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);
    await screen.findByText('Ana ★');
    expect(screen.queryByText('Beto')).not.toBeInTheDocument();

    act(() => enviar?.(sala()));

    expect(await screen.findByText('Beto')).toBeInTheDocument();
  });

  it('si la sala se cierra, lo dice', async () => {
    vi.mocked(suscribirSala).mockImplementation((_entrada, m) => {
      m.alCerrarse();
      return vi.fn();
    });
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('La sala no existe');
  });

  it('si el servidor manda algo ilegible, avisa de que se perdió la conexión', async () => {
    servidorRechaza('RESPUESTA_INVALIDA');
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo mantener la conexión');
  });

  it('al salir de la pantalla da de baja la suscripción', async () => {
    const baja = vi.fn();
    vi.mocked(suscribirSala).mockImplementation((_entrada, m) => {
      m.alEstado(sala());
      return baja;
    });
    const { unmount } = render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);
    await screen.findByText('Ana ★');
    unmount();
    expect(baja).toHaveBeenCalled();
  });

  it('al unirme se vuelve a mirar la sala ya con mi token', async () => {
    servidorMuestra(sala({ jugadores: [{ id: 'j1', nombre: 'Ana' }], conectados: ['j1'] }));
    vi.mocked(unirseASala).mockResolvedValue(beto);
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);
    await usuario.type(await screen.findByLabelText('Tu nombre'), 'Beto');
    await usuario.click(screen.getByRole('button', { name: 'Unirme a esta sala' }));
    await waitFor(() =>
      expect(suscribirSala).toHaveBeenLastCalledWith(
        { salaId: 'abcd1234', token: 'tok-beto' },
        expect.any(Object),
      ),
    );
  });
});
