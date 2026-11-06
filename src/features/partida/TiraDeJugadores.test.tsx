import { render, screen, within } from '@testing-library/react';
import { vistaDePrueba } from '@/lib/pruebas';
import { TiraDeJugadores } from './TiraDeJugadores';

const base = vistaDePrueba();
const nombreDe = (id: string): string => `Jugador ${id.slice(1)}`;
const indiceDe = (id: string): number => Number(id.slice(1)) - 1;

describe('TiraDeJugadores', () => {
  it('muestra a cada jugador con sus puntos y sus cartas, y marca de quién es el turno', () => {
    const vista = vistaDePrueba({ turnoDe: 'j2' });
    render(<TiraDeJugadores vista={vista} nombreDe={nombreDe} indiceDe={indiceDe} />);

    const tira = screen.getByRole('list', { name: 'Resumen de jugadores' });
    const filas = within(tira).getAllByRole('listitem');
    expect(filas).toHaveLength(base.jugadores.length);
    expect(within(filas[0]!).getByText(/Jugador 1 \(tú\)/)).toBeInTheDocument();
    expect(filas[1]).toHaveAttribute('aria-current', 'true');
    expect(within(filas[1]!).getByText(/en turno/)).toBeInTheDocument();
    expect(filas[0]).not.toHaveAttribute('aria-current');
  });

  it('en la construcción especial marca a quien construye', () => {
    const vista = vistaDePrueba({
      fase: 'CONSTRUCCION_ESPECIAL',
      turnoDe: 'j1',
      turnoEspecialDe: 'j2',
    });
    render(<TiraDeJugadores vista={vista} nombreDe={nombreDe} indiceDe={indiceDe} />);

    const filas = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(filas[1]).toHaveAttribute('aria-current', 'true');
    expect(filas[0]).not.toHaveAttribute('aria-current');
  });
});
