import { render, screen, within } from '@testing-library/react';
import { colorDeJugador } from '@/lib/colores';
import { vistaDePrueba } from '@/lib/pruebas';
import { Jugadores } from './Jugadores';

const base = vistaDePrueba();
const modelo = base.jugadores[0]!;

/** Una mesa de `n` jugadores (j1 a jn); tú eres j1. */
const mesaDe = (n: number, cambios = {}) =>
  vistaDePrueba({
    jugadores: Array.from({ length: n }, (_, i) => ({ ...modelo, id: `j${i + 1}` })),
    ...cambios,
  });

const nombreDe = (id: string): string => `Jugador ${id.slice(1)}`;
const indiceDe = (id: string): number => Number(id.slice(1)) - 1;

describe('Jugadores con una mesa grande', () => {
  it('muestra a los 10 jugadores: tú y los 9 rivales en orden de turno', () => {
    render(<Jugadores vista={mesaDe(10)} nombreDe={nombreDe} indiceDe={indiceDe} />);

    const region = screen.getByRole('region', { name: 'Jugadores' });
    const rivales = within(region).getAllByRole('listitem');
    expect(rivales).toHaveLength(9);
    expect(within(region).getByText('(tú)')).toBeInTheDocument();
    expect(within(rivales[0]!).getByText('Jugador 2')).toBeInTheDocument();
    expect(within(rivales[8]!).getByText('Jugador 10')).toBeInTheDocument();
  });

  it('en la construcción especial resalta a quien construye, no al del turno normal', () => {
    const vista = mesaDe(6, {
      fase: 'CONSTRUCCION_ESPECIAL',
      turnoDe: 'j2',
      turnoEspecialDe: 'j5',
    });
    render(<Jugadores vista={vista} nombreDe={nombreDe} indiceDe={indiceDe} />);

    const region = screen.getByRole('region', { name: 'Jugadores' });
    const enTurno = within(region)
      .getAllByRole('listitem')
      .filter((li) => li.getAttribute('aria-current') === 'true');
    expect(enTurno).toHaveLength(1);
    expect(within(enTurno[0]!).getByText(/Jugador 5/)).toBeInTheDocument();
  });

  it('cada uno de los 12 tiene un color distinto', () => {
    const colores = new Set(Array.from({ length: 12 }, (_, i) => colorDeJugador(i)));

    expect(colores.size).toBe(12);
  });
});
