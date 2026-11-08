import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { vistaDePrueba } from '@/lib/pruebas';
import { Jugadores } from './Jugadores';

const nombreDe = (id: string): string => ({ j1: 'Ana', j2: 'Beto', j3: 'Caro' })[id] ?? id;
const indiceDe = (id: string): number => Number(id.slice(1)) - 1;

const ver = (cambios: Parameters<typeof vistaDePrueba>[0] = {}) =>
  render(<Jugadores vista={vistaDePrueba(cambios)} nombreDe={nombreDe} indiceDe={indiceDe} />);

afterEach(() => {
  // @ts-expect-error se quita la simulación para no afectar a otros tests
  delete HTMLElement.prototype.scrollTo;
});

describe('Jugadores: de quién es el turno', () => {
  it('el rival que juega se marca con color y con la palabra «Turno»', () => {
    const { container } = ver({ turnoDe: 'j2' });
    const fila = container.querySelector('[data-jugador-id="j2"]')!;
    expect(fila).toHaveAttribute('data-en-turno', 'true');
    expect(within(fila as HTMLElement).getByText('Turno')).toBeInTheDocument();
    expect(container.querySelector('[data-jugador-id="j3"]')).not.toHaveAttribute('data-en-turno');
  });

  it('mi propia tarjeta también se marca en mi turno', () => {
    const { container } = ver({ turnoDe: 'j1' });
    const mia = container.querySelector('[data-jugador-id="j1"]')!;
    expect(mia).toHaveAttribute('data-en-turno', 'true');
    expect(within(mia as HTMLElement).getByText('Turno')).toBeInTheDocument();
  });

  it('solo hay una marca de turno a la vez', () => {
    const { container } = ver({ turnoDe: 'j3' });
    expect(container.querySelectorAll('[data-en-turno="true"]')).toHaveLength(1);
  });
});

describe('Jugadores: la lista de rivales', () => {
  it('es una zona con scroll, alcanzable con el teclado, y deja mi tarjeta fuera de ella', () => {
    ver();
    const zona = screen.getByRole('region', { name: 'Lista de rivales' });
    expect(zona).toHaveClass('overflow-y-auto');
    expect(zona).toHaveAttribute('tabindex', '0');
    expect(within(zona).queryByText('(tú)')).not.toBeInTheDocument();
    expect(within(zona).getByText('Beto')).toBeInTheDocument();
  });

  it('cada jugador lleva su id para que la entrega de recursos sepa adónde volar', () => {
    const { container } = ver();
    for (const id of ['j1', 'j2', 'j3']) {
      expect(container.querySelector(`[data-jugador-id="${id}"]`)).toBeInTheDocument();
    }
  });

  it('al cambiar el turno la lista se desplaza para mostrar a quien juega', () => {
    const desplazar = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      value: desplazar,
      configurable: true,
    });
    const { rerender } = ver({ turnoDe: 'j2' });
    desplazar.mockClear();
    rerender(
      <Jugadores
        vista={vistaDePrueba({ turnoDe: 'j3' })}
        nombreDe={nombreDe}
        indiceDe={indiceDe}
      />,
    );
    expect(desplazar).toHaveBeenCalledTimes(1);
  });

  it('si el navegador no sabe desplazar, no se rompe', () => {
    expect(() => ver({ turnoDe: 'j2' })).not.toThrow();
  });
});
