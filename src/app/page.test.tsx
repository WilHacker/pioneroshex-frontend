import { render, screen } from '@testing-library/react';
import { yo } from '@/lib/cuentas';
import { suscribirPortada } from '@/lib/lobby';
import PaginaInicio from './page';

vi.mock('@/lib/lobby');
vi.mock('@/lib/cuentas');

describe('Página de inicio', () => {
  it('junta la portada con el tablero de demostración', () => {
    vi.mocked(suscribirPortada).mockReturnValue(vi.fn());
    vi.mocked(yo).mockResolvedValue(null);

    render(<PaginaInicio />);

    expect(screen.getByRole('link', { name: 'Jugar ahora' })).toHaveAttribute('href', '/jugar');
    expect(screen.getByLabelText('Tablero de juego')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tirar los dados' })).toBeInTheDocument();
  });
});
