import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SalaPublica } from '@/lib/esquemas';
import { yo } from '@/lib/cuentas';
import { mapasDePrueba } from '@/lib/pruebas';
import { cambiarSala, empezarSala, listarMapas, unirseASala, verSala } from '@/lib/salas';
import { guardarCredencial, leerCredencial } from '@/lib/sesion';
import { SalaDeEspera } from './SalaDeEspera';

vi.mock('@/lib/salas');
vi.mock('@/lib/cuentas');
// enlaceDeSala es lógica pura: se usa la real y solo se falsea lo que toca el almacenamiento.
vi.mock('@/lib/sesion', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('@/lib/sesion')>()),
  guardarCredencial: vi.fn(),
  guardarNombre: vi.fn(),
  leerCredencial: vi.fn(),
}));

const ana = { salaId: 'abcd1234', jugadorId: 'j1', token: 'tok-ana' };
const beto = { salaId: 'abcd1234', jugadorId: 'j2', token: 'tok-beto' };
const sala = (extra: Partial<SalaPublica> = {}): SalaPublica => ({
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
  ...extra,
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(leerCredencial).mockReturnValue(null);
  vi.mocked(yo).mockResolvedValue(null);
  vi.mocked(listarMapas).mockResolvedValue(mapasDePrueba);
});

describe('SalaDeEspera', () => {
  it('muestra los jugadores y quién es el anfitrión', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    vi.mocked(verSala).mockResolvedValue(sala());
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    expect(await screen.findByText('Ana ★')).toBeInTheDocument();
    expect(screen.getByText('Beto')).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent('abcd1234');
    expect(screen.getByRole('list', { name: 'Jugadores (2 de 12)' })).toBeInTheDocument();
  });

  it('el anfitrión empieza la partida con su token', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    vi.mocked(verSala).mockResolvedValue(sala());
    vi.mocked(empezarSala).mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    await usuario.click(await screen.findByRole('button', { name: 'Empezar la partida' }));

    expect(empezarSala).toHaveBeenCalledWith('abcd1234', 'tok-ana');
  });

  it('con un solo jugador no se puede empezar', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    vi.mocked(verSala).mockResolvedValue(sala({ jugadores: [{ id: 'j1', nombre: 'Ana' }] }));
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    expect(await screen.findByRole('button', { name: /Faltan jugadores/ })).toBeDisabled();
  });

  it('quien no es anfitrión espera', async () => {
    vi.mocked(leerCredencial).mockReturnValue(beto);
    vi.mocked(verSala).mockResolvedValue(sala());
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    expect(await screen.findByText(/Esperando a que el anfitrión/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Empezar/ })).not.toBeInTheDocument();
  });

  it('sin credencial ofrece unirse con un nombre y la guarda', async () => {
    vi.mocked(verSala).mockResolvedValue(sala());
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
    vi.mocked(verSala).mockResolvedValue(sala({ empezada: true }));
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
    vi.mocked(verSala).mockResolvedValue(sala({ empezada: true }));
    const onEmpezada = vi.fn();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={onEmpezada} />);

    expect(await screen.findByText('La partida ya empezó y no estás en ella.')).toBeInTheDocument();
    expect(onEmpezada).not.toHaveBeenCalled();
  });

  it('si la sala no existe, muestra el error', async () => {
    vi.mocked(verSala).mockRejectedValue(new Error('La sala no existe'));
    render(<SalaDeEspera salaId="zzzz" onEmpezada={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('La sala no existe');
  });

  it('si empezar falla (faltan jugadores en el servidor), muestra el motivo', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    vi.mocked(verSala).mockResolvedValue(sala());
    vi.mocked(empezarSala).mockRejectedValue(new Error('Hacen falta al menos 2 jugadores'));
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    await usuario.click(await screen.findByRole('button', { name: 'Empezar la partida' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Hacen falta al menos 2 jugadores');
  });

  it('el anfitrión cambia una regla: se ve al instante y se manda con su token', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    vi.mocked(verSala).mockResolvedValue(sala());
    vi.mocked(cambiarSala).mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    await usuario.click(await screen.findByRole('button', { name: '12' }));

    expect(cambiarSala).toHaveBeenCalledWith('abcd1234', 'tok-ana', { puntosVictoria: 12 });
    expect(screen.getByRole('button', { name: '12' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('si el servidor rechaza el cambio, vuelve a lo anterior y dice por qué', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    vi.mocked(verSala).mockResolvedValue(sala());
    vi.mocked(cambiarSala).mockRejectedValue(new Error('La partida ya empezó'));
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    await usuario.click(await screen.findByRole('button', { name: '12' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La partida ya empezó');
    expect(screen.getByRole('button', { name: '10' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('quien no es anfitrión ve las reglas elegidas pero no puede cambiarlas', async () => {
    vi.mocked(leerCredencial).mockReturnValue(beto);
    vi.mocked(verSala).mockResolvedValue(sala({ opciones: { puntosVictoria: 15 } }));
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    const quince = await screen.findByRole('button', { name: '15' });

    expect(quince).toHaveAttribute('aria-pressed', 'true');
    expect(quince).toBeDisabled();
  });

  it('copia el enlace de invitación con la dirección actual', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    vi.mocked(verSala).mockResolvedValue(sala());
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);
    const escribir = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await usuario.click(await screen.findByRole('button', { name: 'Copiar enlace' }));

    expect(escribir).toHaveBeenCalledWith(`${window.location.origin}/sala/abcd1234`);
    expect(await screen.findByRole('button', { name: '¡Copiado!' })).toBeInTheDocument();
  });

  it('si no se puede copiar, no se rompe y el código sigue a la vista', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    vi.mocked(verSala).mockResolvedValue(sala());
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denegado'));

    await usuario.click(await screen.findByRole('button', { name: 'Copiar enlace' }));

    expect(screen.getByRole('button', { name: 'Copiar enlace' })).toBeInTheDocument();
    expect(screen.getByText('abcd1234')).toBeInTheDocument();
  });

  it('con sesión iniciada, unirse usa el nombre de la cuenta', async () => {
    vi.mocked(yo).mockResolvedValue({ id: 'u9', nombre: 'Zoe' });
    vi.mocked(verSala).mockResolvedValue(sala());
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
    vi.mocked(verSala).mockResolvedValue(sala());
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    expect(await screen.findByRole('button', { name: /Grande/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Automático/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('marca el mapa que ya eligió el anfitrión', async () => {
    vi.mocked(leerCredencial).mockReturnValue(beto);
    vi.mocked(verSala).mockResolvedValue(sala({ opciones: { mapa: 'grande' } }));
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    expect(await screen.findByRole('button', { name: /Grande/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('el anfitrión elige un mapa: se ve al instante y se manda su id con su token', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    vi.mocked(verSala).mockResolvedValue(sala());
    vi.mocked(cambiarSala).mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    await usuario.click(await screen.findByRole('button', { name: /Grande/ }));

    expect(cambiarSala).toHaveBeenCalledWith('abcd1234', 'tok-ana', { mapa: 'grande' });
    expect(screen.getByRole('button', { name: /Grande/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('elegir el automático manda null', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    vi.mocked(verSala).mockResolvedValue(sala({ opciones: { mapa: 'grande' } }));
    vi.mocked(cambiarSala).mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    await usuario.click(await screen.findByRole('button', { name: /Automático/ }));

    expect(cambiarSala).toHaveBeenCalledWith('abcd1234', 'tok-ana', { mapa: null });
  });

  it('quien no es anfitrión no puede cambiar el mapa', async () => {
    vi.mocked(leerCredencial).mockReturnValue(beto);
    vi.mocked(verSala).mockResolvedValue(sala());
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    expect(await screen.findByRole('button', { name: /Grande/ })).toBeDisabled();
  });

  it('si el servidor rechaza el mapa (no caben), vuelve al anterior y dice por qué', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    vi.mocked(verSala).mockResolvedValue(sala());
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
    vi.mocked(verSala).mockResolvedValue(sala({ maximo: 7, opciones: { mapa: 'clasico' } }));
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    expect(await screen.findByRole('list', { name: 'Jugadores (2 de 7)' })).toBeInTheDocument();
  });

  it('si el catálogo no carga, la sala sigue funcionando y lo dice', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    vi.mocked(verSala).mockResolvedValue(sala());
    vi.mocked(listarMapas).mockRejectedValue(new Error('sin red'));
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    expect(await screen.findByText(/No se pudo cargar la lista de mapas/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Automático/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Empezar la partida' })).toBeEnabled();
  });

  it('el aviso de mapa que «no cabe» usa los jugadores que hay en la sala', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    vi.mocked(verSala).mockResolvedValue(
      sala({
        jugadores: Array.from({ length: 8 }, (_, i) => ({ id: `j${i + 1}`, nombre: `P${i + 1}` })),
      }),
    );
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    const clasico = await screen.findByRole('button', { name: /Clásico/ });
    expect(clasico).toBeDisabled();
    expect(clasico).toHaveTextContent('No cabe');
  });
});
