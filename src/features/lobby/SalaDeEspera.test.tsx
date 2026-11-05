import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SalaPublica } from '@/lib/esquemas';
import { empezarSala, unirseASala, verSala } from '@/lib/salas';
import { guardarCredencial, leerCredencial } from '@/lib/sesion';
import { SalaDeEspera } from './SalaDeEspera';

vi.mock('@/lib/salas');
vi.mock('@/lib/sesion');

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
  ...extra,
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(leerCredencial).mockReturnValue(null);
});

describe('SalaDeEspera', () => {
  it('muestra los jugadores y quién es el anfitrión', async () => {
    vi.mocked(leerCredencial).mockReturnValue(ana);
    vi.mocked(verSala).mockResolvedValue(sala());
    render(<SalaDeEspera salaId="abcd1234" onEmpezada={vi.fn()} />);

    expect(await screen.findByText(/Ana \(anfitrión\)/)).toBeInTheDocument();
    expect(screen.getByText(/Beto/)).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent('abcd1234');
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
    expect(onEmpezada).toHaveBeenCalledWith({
      credencial: beto,
      nombres: { j1: 'Ana', j2: 'Beto' },
    });
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
});
