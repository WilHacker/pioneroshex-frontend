import { act, render, screen } from '@testing-library/react';
import { comoReloj, Reloj, segundosQueFaltan } from './Reloj';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('formato del reloj', () => {
  it('da minutos y segundos con dos cifras y nunca baja de cero', () => {
    expect(comoReloj(65)).toBe('1:05');
    expect(comoReloj(9)).toBe('0:09');
    expect(comoReloj(0)).toBe('0:00');
    expect(segundosQueFaltan(10_500, 10_000)).toBe(1);
    expect(segundosQueFaltan(10_000, 99_999)).toBe(0);
  });
});

describe('Reloj', () => {
  it('sin límite no dibuja nada', () => {
    const { container } = render(<Reloj vence={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('cuenta atrás cada segundo', () => {
    render(<Reloj vence={Date.now() + 65_000} />);
    expect(screen.getByRole('timer', { name: 'Tiempo del turno' })).toHaveTextContent('1:05');

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(screen.getByRole('timer')).toHaveTextContent('1:00');
  });

  it('con poco tiempo cambia de aspecto (rojo y más grande) y se detiene en cero', () => {
    render(<Reloj vence={Date.now() + 12_000} />);
    expect(screen.getByRole('timer').className).not.toContain('bg-coral');

    act(() => {
      vi.advanceTimersByTime(3_000);
    });
    expect(screen.getByRole('timer').className).toContain('bg-coral');

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByRole('timer')).toHaveTextContent('0:00');
  });

  it('al desmontarse no deja temporizadores sueltos', () => {
    const { unmount } = render(<Reloj vence={Date.now() + 30_000} />);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
