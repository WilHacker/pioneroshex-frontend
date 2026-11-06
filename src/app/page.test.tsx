import { render, screen } from '@testing-library/react';
import Portada from './page';

describe('Portada', () => {
  it('muestra el título y un enlace para entrar a jugar', () => {
    render(<Portada />);

    expect(screen.getByRole('heading', { name: 'PionerosHex' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Jugar ahora' })).toHaveAttribute('href', '/jugar');
  });
});
