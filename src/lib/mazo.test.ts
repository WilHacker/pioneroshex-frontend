import { describe, expect, it } from 'vitest';
import { CARTAS_BASE, composicionDelMazo } from './mazo';

describe('composicionDelMazo (igual que el servidor)', () => {
  it('el mazo base de 25 cartas sirve para 3 y 4 jugadores', () => {
    expect(CARTAS_BASE).toEqual({
      CABALLERO: 14,
      PUNTO_VICTORIA: 5,
      CONSTRUCCION_CARRETERAS: 2,
      ABUNDANCIA: 2,
      MONOPOLIO: 2,
    });
    expect(composicionDelMazo(3)).toEqual(CARTAS_BASE);
    expect(composicionDelMazo(4)).toEqual(CARTAS_BASE);
  });

  it.each([
    [5, 2],
    [8, 2],
    [9, 3],
    [12, 3],
  ])('con %i jugadores el mazo se multiplica por %i', (jugadores, veces) => {
    expect(composicionDelMazo(jugadores).CABALLERO).toBe(14 * veces);
    expect(composicionDelMazo(jugadores).PUNTO_VICTORIA).toBe(5 * veces);
  });

  it('el mazo completo suma 25 cartas por cada vez', () => {
    const suma = (n: number): number =>
      Object.values(composicionDelMazo(n)).reduce((a, b) => a + b);
    expect(suma(4)).toBe(25);
    expect(suma(6)).toBe(50);
    expect(suma(12)).toBe(75);
  });

  it('con un solo jugador o ninguno cuenta como un mazo base, sin romperse', () => {
    expect(composicionDelMazo(1)).toEqual(CARTAS_BASE);
    expect(composicionDelMazo(0)).toEqual(CARTAS_BASE);
  });
});
