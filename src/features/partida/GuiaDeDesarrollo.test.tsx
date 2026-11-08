import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GuiaDeDesarrollo } from './GuiaDeDesarrollo';

const ver = (jugadores = 4, puntosVictoria = 10) =>
  render(<GuiaDeDesarrollo jugadores={jugadores} puntosVictoria={puntosVictoria} />);

const fila = (nombre: RegExp): HTMLElement => screen.getByRole('listitem', { name: nombre });

describe('GuiaDeDesarrollo', () => {
  it('lista los cinco tipos de carta con cuántas lleva el mazo de 4 jugadores', () => {
    ver(4);
    expect(fila(/Caballero/)).toHaveTextContent('14 cartas');
    expect(fila(/Carreteras/)).toHaveTextContent('2 cartas');
    expect(fila(/Abundancia/)).toHaveTextContent('2 cartas');
    expect(fila(/Monopolio/)).toHaveTextContent('2 cartas');
    expect(fila(/Punto de victoria/)).toHaveTextContent('5 cartas');
  });

  it('con más jugadores el mazo es más grande y la guía lo cuenta', () => {
    ver(6);
    expect(fila(/Caballero/)).toHaveTextContent('28 cartas');
    expect(fila(/Punto de victoria/)).toHaveTextContent('10 cartas');
  });

  it('cada carta tiene su dibujo SVG y su explicación', () => {
    const { container } = ver();
    for (const archivo of [
      'caballero',
      'carreteras',
      'abundancia',
      'monopolio',
      'punto-victoria',
    ]) {
      expect(container.querySelector(`img[src$="/cartas/${archivo}.svg"]`)).toBeInTheDocument();
    }
    expect(within(fila(/Caballero/)).getByText(/Mueve al ladrón/)).toBeInTheDocument();
    expect(within(fila(/Carreteras/)).getByText(/2 caminos gratis/)).toBeInTheDocument();
    expect(within(fila(/Abundancia/)).getByText(/2 cartas de recursos/)).toBeInTheDocument();
    expect(within(fila(/Monopolio/)).getByText(/todos los demás/)).toBeInTheDocument();
  });

  it('el punto de victoria avisa de que se revela al llegar a los puntos de la partida', () => {
    ver(4, 12);
    expect(within(fila(/Punto de victoria/)).getByText(/12 puntos/)).toBeInTheDocument();
  });

  it('con un solo jugador o menos no se rompe: cuenta como un mazo base', () => {
    ver(1);
    expect(fila(/Caballero/)).toHaveTextContent('14 cartas');
  });
});
