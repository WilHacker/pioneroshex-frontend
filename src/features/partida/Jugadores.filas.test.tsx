import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { vistaDePrueba } from '@/lib/pruebas';
import { Jugadores } from './Jugadores';

const nombreDe = (id: string): string => ({ j1: 'Ana', j2: 'Beto', j3: 'Caro' })[id] ?? id;
const indiceDe = (id: string): number => Number(id.slice(1)) - 1;

const ver = (cambios: Parameters<typeof vistaDePrueba>[0] = {}) =>
  render(<Jugadores vista={vistaDePrueba(cambios)} nombreDe={nombreDe} indiceDe={indiceDe} />);

const fila = (container: HTMLElement, id: string): HTMLElement =>
  container.querySelector<HTMLElement>(`[data-jugador-id="${id}"]`)!;

describe('Jugadores: cada jugador es una fila de cartas y contadores', () => {
  it('muestra su nombre, sus puntos y las cuatro cuentas: mano, desarrollo, ejército y caminos', () => {
    const { container } = ver({
      caminos: { a1: 'j2', a2: 'j2', a3: 'j3' },
      jugadores: vistaDePrueba().jugadores.map((j) =>
        j.id === 'j2' ? { ...j, caballerosJugados: 3 } : j,
      ),
    });
    const beto = fila(container, 'j2');
    expect(within(beto).getByText('Beto')).toBeInTheDocument();
    expect(within(beto).getByTitle('cartas en mano')).toHaveTextContent('4');
    expect(within(beto).getByTitle('cartas de desarrollo')).toHaveTextContent('1');
    expect(within(beto).getByTitle('caballeros jugados')).toHaveTextContent('3');
    expect(within(beto).getByTitle('caminos construidos')).toHaveTextContent('2');
    expect(within(beto).getByTitle('Puntos de victoria')).toHaveTextContent('2');
  });

  it('la carta de la mano y la de desarrollo se dibujan con las cartas SVG de reverso', () => {
    const { container } = ver();
    const beto = fila(container, 'j2');
    expect(beto.querySelector('img[src$="/cartas/reverso-recursos.svg"]')).toBeInTheDocument();
    expect(beto.querySelector('img[src$="/cartas/reverso-desarrollo.svg"]')).toBeInTheDocument();
  });

  it('tu fila va abajo del todo, después de la lista de rivales', () => {
    const { container } = ver();
    const lista = screen.getByRole('region', { name: 'Lista de rivales' });
    const mia = fila(container, 'j1');
    expect(lista.compareDocumentPosition(mia) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('quien tiene el gran ejército o la gran ruta lo lleva marcado con texto accesible', () => {
    const { container } = ver({ granEjercito: 'j2', granRuta: 'j3', longitudGranRuta: 6 });
    expect(
      within(fila(container, 'j2')).getByRole('img', { name: 'Gran ejército' }),
    ).toBeInTheDocument();
    expect(
      within(fila(container, 'j3')).getByRole('img', { name: 'Gran ruta' }),
    ).toBeInTheDocument();
    expect(within(fila(container, 'j3')).getByTitle('Gran ruta: 6 caminos')).toBeInTheDocument();
    expect(
      within(fila(container, 'j1')).queryByRole('img', { name: /Gran/ }),
    ).not.toBeInTheDocument();
  });

  it('quien no tiene el turno se ve apagado, quien lo tiene no', () => {
    const { container } = ver({ turnoDe: 'j2' });
    expect(fila(container, 'j2')).not.toHaveAttribute('data-apagado');
    expect(fila(container, 'j3')).toHaveAttribute('data-apagado', 'true');
  });
});
