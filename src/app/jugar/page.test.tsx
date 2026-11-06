import { render, screen } from '@testing-library/react';
import { consultarSalud } from '@/lib/api';
import { listarSalas } from '@/lib/salas';
import { leerNombre } from '@/lib/sesion';
import Pagina from './page';

vi.mock('@/lib/api');
vi.mock('@/lib/salas');
vi.mock('@/lib/sesion');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe('Página de jugar', () => {
  it('muestra el título, el lobby y el estado del servidor', async () => {
    vi.mocked(consultarSalud).mockReturnValue(new Promise(() => {}));
    vi.mocked(listarSalas).mockResolvedValue([]);
    vi.mocked(leerNombre).mockReturnValue('');

    render(<Pagina />);

    expect(screen.getByRole('heading', { name: 'PionerosHex' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Salas abiertas' })).toBeInTheDocument();
    expect(await screen.findByText('No hay salas abiertas')).toBeInTheDocument();
  });
});
