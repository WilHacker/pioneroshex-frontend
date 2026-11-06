import { render, screen } from '@testing-library/react';
import { verResumen } from '@/lib/salas';
import PaginaInicio from './page';

vi.mock('@/lib/salas');

describe('Página de inicio', () => {
  it('junta la portada con el tablero de demostración', () => {
    vi.mocked(verResumen).mockReturnValue(new Promise(() => {}));

    render(<PaginaInicio />);

    expect(screen.getByRole('link', { name: 'Jugar ahora' })).toHaveAttribute('href', '/jugar');
    expect(screen.getByLabelText('Tablero de juego')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tirar los dados' })).toBeInTheDocument();
  });
});
