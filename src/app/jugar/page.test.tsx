import { render, screen } from '@testing-library/react';
import { consultarSalud } from '@/lib/api';
import Pagina from './page';

vi.mock('@/lib/api');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe('Página de jugar', () => {
  it('muestra el título del juego y cómo entrar a una sala', () => {
    vi.mocked(consultarSalud).mockReturnValue(new Promise(() => {}));

    render(<Pagina />);

    expect(screen.getByRole('heading', { name: 'PionerosHex' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear una sala nueva' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unirme' })).toBeInTheDocument();
  });
});
