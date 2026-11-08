import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Vista } from '@/lib/esquemas';
import { SorteoDeOrden } from './SorteoDeOrden';

const nombreDe = (id: string): string => ({ j1: 'Ana', j2: 'Beto', j3: 'Caro' })[id] ?? id;

type Sorteo = Vista['sorteo'];

/** Ana 9, Beto 9 (empatan), Caro 4. Beto y Ana repiten: Beto 11, Ana 6. Orden final: Beto, Ana, Caro. */
const CON_EMPATE: Sorteo = [
  [
    { jugador: 'j1', dados: [4, 5] },
    { jugador: 'j2', dados: [3, 6] },
    { jugador: 'j3', dados: [1, 3] },
  ],
  [
    { jugador: 'j1', dados: [2, 4] },
    { jugador: 'j2', dados: [5, 6] },
  ],
];
const ORDEN = ['j2', 'j1', 'j3'];

const dibujar = (sorteo: Sorteo = CON_EMPATE, onCerrar = vi.fn()) => {
  render(<SorteoDeOrden sorteo={sorteo} orden={ORDEN} nombreDe={nombreDe} onCerrar={onCerrar} />);
  return { onCerrar };
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', undefined);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const avanzar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe('SorteoDeOrden', () => {
  it('es un diálogo con título y empieza sin revelar el resultado', () => {
    dibujar();
    expect(screen.getByRole('dialog', { name: 'Sorteo del orden de turno' })).toBeInTheDocument();
    expect(screen.queryByText('Orden de juego')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '¡A jugar!' })).not.toBeInTheDocument();
  });

  it('con el tiempo van saliendo las tiradas, una a una', () => {
    dibujar();
    const antes = screen.queryAllByTestId('tirada-revelada').length;
    avanzar(2_000);
    expect(screen.getAllByTestId('tirada-revelada').length).toBeGreaterThan(antes);
  });

  it('al terminar muestra el orden de juego de primero a último y el botón para empezar', () => {
    dibujar();
    avanzar(60_000);
    const lista = screen.getByRole('list', { name: 'Orden de juego' });
    const filas = within(lista).getAllByRole('listitem');
    expect(filas.map((f) => f.textContent)).toEqual([
      expect.stringContaining('Beto'),
      expect.stringContaining('Ana'),
      expect.stringContaining('Caro'),
    ]);
    expect(filas[0]).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: '¡A jugar!' })).toBeInTheDocument();
  });

  it('«Saltar» enseña el resultado final de inmediato', () => {
    dibujar();
    fireEvent.click(screen.getByRole('button', { name: 'Saltar' }));
    expect(screen.getByRole('list', { name: 'Orden de juego' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Saltar' })).not.toBeInTheDocument();
  });

  it('«¡A jugar!» cierra el sorteo', () => {
    const { onCerrar } = dibujar();
    fireEvent.click(screen.getByRole('button', { name: 'Saltar' }));
    fireEvent.click(screen.getByRole('button', { name: '¡A jugar!' }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('distingue la primera tirada de los desempates y dice quiénes repiten', () => {
    dibujar();
    avanzar(60_000);
    expect(screen.getByText('Primera tirada')).toBeInTheDocument();
    const desempate = screen.getByText('Desempate').closest('section')!;
    expect(within(desempate).getByText('Ana')).toBeInTheDocument();
    expect(within(desempate).getByText('Beto')).toBeInTheDocument();
    expect(within(desempate).queryByText('Caro')).not.toBeInTheDocument();
  });

  it('cada tirada enseña los dos dados y su suma', () => {
    dibujar();
    avanzar(60_000);
    const primera = screen.getByText('Primera tirada').closest('section')!;
    const filaAna = within(primera).getByText('Ana').closest('li')!;
    expect(filaAna).toHaveTextContent('9');
    expect(within(filaAna).getAllByRole('img')).toHaveLength(2);
  });

  it('sin empates solo hay una ronda y no sale «Desempate»', () => {
    dibujar([CON_EMPATE[0]!]);
    avanzar(60_000);
    expect(screen.queryByText('Desempate')).not.toBeInTheDocument();
  });

  it('con «reducir movimiento» el resultado sale directamente, sin animación', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    dibujar();
    expect(screen.getByRole('list', { name: 'Orden de juego' })).toBeInTheDocument();
  });

  it('el resultado final se anuncia a los lectores de pantalla', () => {
    dibujar();
    avanzar(60_000);
    expect(screen.getByRole('status')).toHaveTextContent('Beto');
  });
});
