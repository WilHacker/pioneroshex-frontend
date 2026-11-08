import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { yo } from '@/lib/cuentas';
import { mapasDePrueba } from '@/lib/pruebas';
import { suscribirPortada, type PortadaEnVivo } from '@/lib/lobby';
import { crearSala, listarMapas, unirseASala, verRecomendado } from '@/lib/salas';
import { guardarCredencial, guardarNombre, leerNombre } from '@/lib/sesion';
import { Lobby } from './Lobby';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/lib/salas');
vi.mock('@/lib/lobby');
vi.mock('@/lib/cuentas');
vi.mock('@/lib/sesion');

const credencial = { salaId: 'abcd1234', jugadorId: 'j1', token: 'secreto' };
const fila = { id: 'abcd1234', anfitrion: 'Beto', jugadores: 2, maximo: 10 };

/** El servidor manda estas salas abiertas nada más conectarse. */
function salasAbiertas(salas: PortadaEnVivo['salas']): void {
  vi.mocked(suscribirPortada).mockImplementation((m) => {
    m.alDatos({
      salas,
      resumen: { salasAbiertas: salas.length, partidasEnCurso: 0, jugadores: 0 },
    });
    return vi.fn();
  });
}

/** No se puede conectar con el servidor. */
function portadaFalla(): void {
  vi.mocked(suscribirPortada).mockImplementation((m) => {
    m.alFallar();
    return vi.fn();
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(leerNombre).mockReturnValue('');
  salasAbiertas([fila]);
  vi.mocked(yo).mockResolvedValue(null);
  vi.mocked(listarMapas).mockResolvedValue(mapasDePrueba);
  vi.mocked(verRecomendado).mockResolvedValue({
    puntosVictoria: 10,
    turnoSegundos: 90,
    robberHandLimit: 7,
    turnRuleMode: 'A',
    modoDados: 'AZAR',
  });
});

describe('Lobby', () => {
  it('muestra las salas abiertas, pero sin nombre no deja entrar', async () => {
    render(<Lobby />);

    expect(await screen.findByText('Beto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled();
  });

  it('recuerda el nombre de otras visitas', async () => {
    vi.mocked(leerNombre).mockReturnValue('Ana');
    render(<Lobby />);

    expect(await screen.findByLabelText('Tu nombre')).toHaveValue('Ana');
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  });

  it('entrar a una sala abierta guarda el nombre y la credencial y va a la sala', async () => {
    vi.mocked(unirseASala).mockResolvedValue({ ...credencial, jugadorId: 'j3' });
    const usuario = userEvent.setup();
    render(<Lobby />);

    await usuario.type(screen.getByLabelText('Tu nombre'), '  Ana ');
    await usuario.click(await screen.findByRole('button', { name: 'Entrar' }));

    expect(unirseASala).toHaveBeenCalledWith('abcd1234', 'Ana');
    expect(guardarNombre).toHaveBeenCalledWith('  Ana ');
    expect(guardarCredencial).toHaveBeenCalledWith({ ...credencial, jugadorId: 'j3' });
    expect(push).toHaveBeenCalledWith('/sala/abcd1234');
  });

  it('una sala llena no se puede elegir', async () => {
    vi.mocked(leerNombre).mockReturnValue('Ana');
    salasAbiertas([{ ...fila, jugadores: 10 }]);
    render(<Lobby />);

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeDisabled();
  });

  it('sin salas abiertas lo dice, y si no carga la lista también', async () => {
    salasAbiertas([]);
    const { unmount } = render(<Lobby />);
    expect(await screen.findByText('No hay salas abiertas')).toBeInTheDocument();
    unmount();

    portadaFalla();
    render(<Lobby />);
    expect(await screen.findByText('No se pudo cargar la lista')).toBeInTheDocument();
  });

  it('crear una sala pública manda la visibilidad y entra a ella', async () => {
    vi.mocked(leerNombre).mockReturnValue('Ana');
    vi.mocked(crearSala).mockResolvedValue(credencial);
    const usuario = userEvent.setup();
    render(<Lobby />);

    await usuario.click(screen.getByRole('tab', { name: 'Crear' }));
    await usuario.click(screen.getByRole('button', { name: 'Pública' }));
    await usuario.click(screen.getByRole('button', { name: 'Crear sala' }));

    expect(crearSala).toHaveBeenCalledWith(
      'Ana',
      true,
      expect.objectContaining({ maxJugadores: 4 }),
    );
    expect(push).toHaveBeenCalledWith('/sala/abcd1234');
  });

  it('por defecto la sala que se crea es privada', async () => {
    vi.mocked(leerNombre).mockReturnValue('Ana');
    vi.mocked(crearSala).mockResolvedValue(credencial);
    const usuario = userEvent.setup();
    render(<Lobby />);

    await usuario.click(screen.getByRole('tab', { name: 'Crear' }));
    await usuario.click(screen.getByRole('button', { name: 'Crear sala' }));

    expect(crearSala).toHaveBeenCalledWith(
      'Ana',
      false,
      expect.objectContaining({ maxJugadores: 4, puntosVictoria: 10 }),
    );
  });

  it('con un código, lo normaliza para unirse', async () => {
    vi.mocked(leerNombre).mockReturnValue('Ana');
    vi.mocked(unirseASala).mockResolvedValue({ ...credencial, jugadorId: 'j2' });
    const usuario = userEvent.setup();
    render(<Lobby />);

    await usuario.click(screen.getByRole('tab', { name: 'Tengo un código' }));
    expect(screen.getByRole('button', { name: 'Unirme' })).toBeDisabled();
    await usuario.type(screen.getByLabelText('Código de la sala'), '  ABCD1234 ');
    await usuario.click(screen.getByRole('button', { name: 'Unirme' }));

    expect(unirseASala).toHaveBeenCalledWith('abcd1234', 'Ana');
    expect(push).toHaveBeenCalledWith('/sala/abcd1234');
  });

  it('si el servidor rechaza, muestra el motivo y deja volver a intentar', async () => {
    vi.mocked(leerNombre).mockReturnValue('Ana');
    vi.mocked(unirseASala).mockRejectedValue(new Error('La sala está llena'));
    const usuario = userEvent.setup();
    render(<Lobby />);

    await usuario.click(await screen.findByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La sala está llena');
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
    expect(push).not.toHaveBeenCalled();
  });

  it('con sesión iniciada se juega como la cuenta: no pide nombre y entra con el de la cuenta', async () => {
    vi.mocked(yo).mockResolvedValue({ id: 'u1', nombre: 'Zoe' });
    vi.mocked(unirseASala).mockResolvedValue({ ...credencial, jugadorId: 'j2' });
    const usuario = userEvent.setup();
    render(<Lobby />);

    expect(await screen.findByText('Zoe')).toBeInTheDocument();
    expect(screen.queryByLabelText('Tu nombre')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toHaveAttribute('href', '/perfil');
    await usuario.click(await screen.findByRole('button', { name: 'Entrar' }));

    expect(unirseASala).toHaveBeenCalledWith('abcd1234', 'Zoe');
  });

  it('como invitado ofrece entrar o crear una cuenta para guardar las partidas', async () => {
    render(<Lobby />);

    expect(await screen.findByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar');
    expect(screen.getByRole('link', { name: 'crear cuenta' })).toHaveAttribute('href', '/registro');
  });
});
