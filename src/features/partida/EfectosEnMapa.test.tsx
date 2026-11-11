import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { V1, V2, mesaDePrueba } from '@/lib/pruebas';
import { EfectosEnMapa } from './EfectosEnMapa';
import type { Juego } from './useJuego';

const indiceDe = (id: string): number => Number(id.slice(1)) - 1;
const nombreDe = (id: string): string => ({ j1: 'Ana', j2: 'Beto' })[id] ?? id;

const reparto = (jugador: string, recurso: string, cantidad: number, vertice: string) => ({
  tipo: 'RECURSOS_REPARTIDOS',
  jugador,
  recurso,
  cantidad,
  causa: { tipo: 'PRODUCCION', tirada: 8, fuentes: [{ casilla: '0,0', vertice, cantidad }] },
});

function dibujar(ultimos: Juego['ultimos'], yo: string | null = 'j1') {
  const vista = (u: Juego['ultimos']) => (
    <svg>
      <EfectosEnMapa
        ultimos={u}
        mesa={mesaDePrueba}
        indiceDe={indiceDe}
        nombreDe={nombreDe}
        yo={yo}
      />
    </svg>
  );
  const resultado = render(vista(ultimos));
  return {
    ...resultado,
    nuevas: (u: Juego['ultimos']) => resultado.rerender(vista(u)),
  };
}

describe('EfectosEnMapa', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('sin eventos de interés no dibuja nada', () => {
    const { container } = dibujar({
      numero: 1,
      eventos: [{ tipo: 'TURNO_TERMINADO', jugador: 'j1' }],
    });
    expect(container.querySelector('title')).toBeNull();
  });

  it('muestra sobre cada edificio el recurso que recibe, de cualquier jugador', () => {
    const { container } = dibujar({
      numero: 1,
      eventos: [reparto('j1', 'OVEJA', 2, V1), reparto('j2', 'MADERA', 1, V2)],
    });
    const titulos = [...container.querySelectorAll('title')].map((t) => t.textContent);
    expect(titulos).toEqual(['Ana recibe 2 de oveja', 'Beto recibe 1 de madera']);
    expect(container.textContent).toContain('+2');
    expect(container.textContent).toContain('+1');
  });

  it('marca con un aro dorado lo que recibe el jugador de esta pantalla, y a los demás no', () => {
    const { container } = dibujar({
      numero: 1,
      eventos: [reparto('j1', 'OVEJA', 1, V1), reparto('j2', 'MADERA', 1, V2)],
    });
    const chips = container.querySelectorAll('g.entrega');
    expect(chips[0]!.querySelector('circle[stroke="#ffc95c"]')).not.toBeNull();
    expect(chips[1]!.querySelector('circle[stroke="#ffc95c"]')).toBeNull();
  });

  it('un poblado o una ciudad nuevos muestran el punto que valen sobre su vértice', () => {
    const { container } = dibujar({
      numero: 1,
      eventos: [
        { tipo: 'POBLADO_COLOCADO', jugador: 'j2', vertice: V1 },
        { tipo: 'CIUDAD_COLOCADA', jugador: 'j1', vertice: V2 },
      ],
    });
    const titulos = [...container.querySelectorAll('g.punto-sube title')].map((t) => t.textContent);
    expect(titulos).toEqual(['Beto gana 1 punto', 'Ana gana 1 punto']);
    expect(container.textContent).toContain('+1 ★');
  });

  it('dos recursos sobre el mismo edificio se reparten en fila, sin taparse', () => {
    const { container } = dibujar({
      numero: 1,
      eventos: [reparto('j1', 'OVEJA', 1, V1), reparto('j1', 'MADERA', 1, V1)],
    });
    const x = [...container.querySelectorAll('g.entrega')].map(
      (g) => g.parentElement!.getAttribute('transform')!.split('(')[1]!.split(' ')[0],
    );
    expect(x).toHaveLength(2);
    expect(x[0]).not.toBe(x[1]);
  });

  it('se quitan solos pasados unos segundos', () => {
    const { container } = dibujar({ numero: 1, eventos: [reparto('j1', 'OVEJA', 1, V1)] });
    expect(container.querySelector('g.entrega')).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(container.querySelector('g.entrega')).toBeNull();
  });

  it('cada notificación nueva añade los suyos; la misma no se repite', () => {
    const { container, nuevas } = dibujar({ numero: 1, eventos: [reparto('j1', 'OVEJA', 1, V1)] });
    nuevas({ numero: 1, eventos: [reparto('j1', 'OVEJA', 1, V1)] });
    expect(container.querySelectorAll('g.entrega')).toHaveLength(1);
    nuevas({ numero: 2, eventos: [reparto('j2', 'MADERA', 1, V2)] });
    expect(container.querySelectorAll('g.entrega')).toHaveLength(2);
  });

  it('ignora un vértice que el tablero no conoce', () => {
    const { container } = dibujar({ numero: 1, eventos: [reparto('j1', 'OVEJA', 1, 'no-existe')] });
    expect(container.querySelector('g.entrega')).toBeNull();
  });

  it('no recibe toques ni lo leen los lectores de pantalla', () => {
    const { container } = dibujar({ numero: 1, eventos: [reparto('j1', 'OVEJA', 1, V1)] });
    const capa = container.querySelector('[data-efectos-mapa]')!;
    expect(capa).toHaveAttribute('pointer-events', 'none');
    expect(capa).toHaveAttribute('aria-hidden', 'true');
  });
});
