import { render, screen } from '@testing-library/react';
import Inicio from './page';

describe('Página de inicio', () => {
  it('muestra el título del juego', () => {
    render(<Inicio />);

    expect(screen.getByRole('heading', { name: 'PionerosHex' })).toBeInTheDocument();
  });
});
