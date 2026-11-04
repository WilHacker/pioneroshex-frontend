import { render, screen } from '@testing-library/react';
import { consultarSalud } from '@/lib/api';
import Inicio from './page';

vi.mock('@/lib/api');

describe('Página de inicio', () => {
  it('muestra el título del juego', () => {
    vi.mocked(consultarSalud).mockReturnValue(new Promise(() => {}));

    render(<Inicio />);

    expect(screen.getByRole('heading', { name: 'PionerosHex' })).toBeInTheDocument();
  });
});
