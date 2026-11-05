import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { crearSala, unirseASala } from '@/lib/salas';
import { guardarCredencial } from '@/lib/sesion';
import { Inicio } from './Inicio';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/lib/salas');
vi.mock('@/lib/sesion');

const credencial = { salaId: 'abcd1234', jugadorId: 'j1', token: 'secreto' };

beforeEach(() => vi.clearAllMocks());

describe('Inicio', () => {
  it('sin nombre no se puede crear ni unirse', () => {
    render(<Inicio />);
    expect(screen.getByRole('button', { name: 'Crear una sala nueva' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Unirme' })).toBeDisabled();
  });

  it('crea la sala, guarda la credencial y entra a ella', async () => {
    vi.mocked(crearSala).mockResolvedValue(credencial);
    const usuario = userEvent.setup();
    render(<Inicio />);

    await usuario.type(screen.getByLabelText('Tu nombre'), '  Ana ');
    await usuario.click(screen.getByRole('button', { name: 'Crear una sala nueva' }));

    expect(crearSala).toHaveBeenCalledWith('Ana');
    expect(guardarCredencial).toHaveBeenCalledWith(credencial);
    expect(push).toHaveBeenCalledWith('/sala/abcd1234');
  });

  it('para unirse hace falta el código, que se normaliza', async () => {
    vi.mocked(unirseASala).mockResolvedValue({ ...credencial, jugadorId: 'j2' });
    const usuario = userEvent.setup();
    render(<Inicio />);

    await usuario.type(screen.getByLabelText('Tu nombre'), 'Beto');
    expect(screen.getByRole('button', { name: 'Unirme' })).toBeDisabled();
    await usuario.type(screen.getByLabelText('Código de la sala'), ' ABCD1234 ');
    await usuario.click(screen.getByRole('button', { name: 'Unirme' }));

    expect(unirseASala).toHaveBeenCalledWith('abcd1234', 'Beto');
    expect(push).toHaveBeenCalledWith('/sala/abcd1234');
  });

  it('si el servidor rechaza, muestra el motivo y no navega', async () => {
    vi.mocked(unirseASala).mockRejectedValue(new Error('La sala no existe'));
    const usuario = userEvent.setup();
    render(<Inicio />);

    await usuario.type(screen.getByLabelText('Tu nombre'), 'Beto');
    await usuario.type(screen.getByLabelText('Código de la sala'), 'zzzz');
    await usuario.click(screen.getByRole('button', { name: 'Unirme' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La sala no existe');
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Unirme' })).toBeEnabled();
  });

  it('un error que no es un Error se muestra con un mensaje genérico', async () => {
    vi.mocked(crearSala).mockRejectedValue('raro');
    const usuario = userEvent.setup();
    render(<Inicio />);

    await usuario.type(screen.getByLabelText('Tu nombre'), 'Ana');
    await usuario.click(screen.getByRole('button', { name: 'Crear una sala nueva' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Algo salió mal');
  });
});
