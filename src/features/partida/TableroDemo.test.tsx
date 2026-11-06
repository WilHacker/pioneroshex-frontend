import { act, fireEvent, render, screen } from '@testing-library/react';
import { TableroDemo } from './TableroDemo';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('TableroDemo', () => {
  it('dibuja el tablero de adorno con sus edificios y sin tirada al principio', () => {
    render(<TableroDemo />);

    expect(screen.getByLabelText('Tablero de juego')).toBeInTheDocument();
    expect(screen.getAllByText(/^(Poblado|Ciudad) de Jugador/).length).toBe(8);
    expect(screen.queryByText('suma de los dados')).not.toBeInTheDocument();
  });

  it('tira los dados solo al cargar y muestra la suma', () => {
    render(<TableroDemo />);

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(screen.getByText('suma de los dados')).toBeInTheDocument();
  });

  it('al tocar los dados vuelven a rodar', () => {
    render(<TableroDemo />);
    act(() => {
      vi.advanceTimersByTime(800);
    });
    const antes = screen.getByRole('button', { name: 'Tirar los dados' });

    fireEvent.click(antes);

    expect(screen.getByText('suma de los dados')).toBeInTheDocument();
  });

  it('el resalte de la casilla se apaga solo y no queda nada pendiente al salir', () => {
    const { unmount } = render(<TableroDemo />);
    act(() => {
      vi.advanceTimersByTime(800);
    });

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
