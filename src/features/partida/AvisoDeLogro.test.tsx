import { act, render, screen } from '@testing-library/react';
import { AvisoDeLogro } from './AvisoDeLogro';

const nombreDe = (id: string): string => ({ j1: 'Ana', j2: 'Beto' })[id] ?? id;

const ruta = {
  tipo: 'GRAN_RUTA_CAMBIADA',
  titularAnterior: 'j1',
  nuevoTitular: 'j2',
  longitud: 7,
};

describe('AvisoDeLogro', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('no muestra nada si la notificación no trae un logro', () => {
    render(
      <AvisoDeLogro
        ultimos={{ numero: 1, eventos: [{ tipo: 'TURNO_TERMINADO', jugador: 'j1' }] }}
        nombreDe={nombreDe}
      />,
    );
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('avisa a todos de quién se quedó la gran ruta y desaparece solo', () => {
    render(<AvisoDeLogro ultimos={{ numero: 1, eventos: [ruta] }} nombreDe={nombreDe} />);
    expect(screen.getByRole('status').textContent).toContain(
      'Beto le quitó la gran ruta a Ana (7 caminos)',
    );
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(screen.queryByRole('status')).toBeNull();
  });
});
