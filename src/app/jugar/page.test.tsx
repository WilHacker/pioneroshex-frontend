import { render, screen } from '@testing-library/react';
import { consultarSalud } from '@/lib/api';
import { yo } from '@/lib/cuentas';
import { suscribirPortada } from '@/lib/lobby';
import { leerNombre } from '@/lib/sesion';
import Pagina from './page';

vi.mock('@/lib/api');
vi.mock('@/lib/salas');
vi.mock('@/lib/lobby');
vi.mock('@/lib/cuentas');
vi.mock('@/lib/sesion');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe('Página de jugar', () => {
  it('muestra el título, el lobby y el estado del servidor', async () => {
    vi.mocked(consultarSalud).mockReturnValue(new Promise(() => {}));
    vi.mocked(suscribirPortada).mockImplementation((m) => {
      m.alDatos({ salas: [], resumen: { salasAbiertas: 0, partidasEnCurso: 0, jugadores: 0 } });
      return vi.fn();
    });
    vi.mocked(yo).mockResolvedValue(null);
    vi.mocked(leerNombre).mockReturnValue('');

    render(<Pagina />);

    expect(screen.getByRole('heading', { name: 'PionerosHex' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Salas abiertas' })).toBeInTheDocument();
    expect(await screen.findByText('No hay salas abiertas')).toBeInTheDocument();
  });
});
