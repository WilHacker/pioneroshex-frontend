import { render, screen } from '@testing-library/react';
import { yo } from '@/lib/cuentas';
import { ErrorApi, verResumen } from '@/lib/salas';
import { Portada } from './Portada';

vi.mock('@/lib/salas', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('@/lib/salas')>()),
  verResumen: vi.fn(),
}));

vi.mock('@/lib/cuentas');

beforeEach(() => vi.mocked(yo).mockResolvedValue(null));
afterEach(() => vi.resetAllMocks());

describe('Portada', () => {
  it('ofrece entrar como invitado, con amigos o con cuenta', async () => {
    vi.mocked(verResumen).mockReturnValue(new Promise(() => {}));

    render(<Portada tablero={<p>tablero</p>} />);

    expect(screen.getByText('tablero')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Jugar ahora' })).toHaveAttribute('href', '/jugar');
    expect(screen.getByRole('link', { name: /Invitado/ })).toHaveAttribute('href', '/jugar');
    expect(screen.getByRole('link', { name: /Con amigos/ })).toHaveAttribute('href', '/jugar');
    expect(await screen.findByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar');
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '/registro');
    expect(screen.getByRole('link', { name: /Con cuenta/ })).toHaveAttribute('href', '/registro');
  });

  it('muestra cuántas salas abiertas y jugadores hay', async () => {
    vi.mocked(verResumen).mockResolvedValue({ salasAbiertas: 3, partidasEnCurso: 1, jugadores: 7 });

    render(<Portada tablero={null} />);

    expect(await screen.findByText('salas abiertas')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Ahora mismo' })).toHaveTextContent('3');
    expect(screen.getByRole('list', { name: 'Ahora mismo' })).toHaveTextContent('7');
  });

  it('si el servidor no responde, no muestra los contadores y no se rompe', async () => {
    vi.mocked(verResumen).mockRejectedValue(new ErrorApi(0, 'No se pudo conectar'));

    render(<Portada tablero={null} />);

    await screen.findByRole('link', { name: 'Jugar ahora' });
    expect(screen.queryByRole('list', { name: 'Ahora mismo' })).not.toBeInTheDocument();
  });

  it('con sesión iniciada muestra el nombre y lleva al perfil', async () => {
    vi.mocked(verResumen).mockReturnValue(new Promise(() => {}));
    vi.mocked(yo).mockResolvedValue({ id: 'u1', nombre: 'Ana' });

    render(<Portada tablero={null} />);

    expect(await screen.findByRole('link', { name: 'Ana' })).toHaveAttribute('href', '/perfil');
    expect(screen.getByRole('link', { name: /Mi perfil/ })).toHaveAttribute('href', '/perfil');
    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument();
  });
});
