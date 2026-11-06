import { caminosDemo, edificiosDemo, ladronDemo, mesaDemo } from './demo';
import { sumasQueEntregan } from './produccion';
import { claveHex } from './tablero';

describe('tablero de la portada', () => {
  it('sus edificios y caminos están todos en el tablero', () => {
    const vertices = new Set(mesaDemo.vertices.map((v) => v.id));
    const aristas = new Set(mesaDemo.aristas.map((a) => a.id));

    expect(Object.keys(edificiosDemo).every((id) => vertices.has(id))).toBe(true);
    expect(Object.keys(caminosDemo).every((id) => aristas.has(id))).toBe(true);
  });

  it('el ladrón está en el desierto', () => {
    const casilla = mesaDemo.casillas.find((c) => claveHex(c.hex) === claveHex(ladronDemo));

    expect(casilla?.terreno).toBe('DESIERTO');
  });

  it('hay varias sumas que reparten recursos, para que la tirada siempre sea vistosa', () => {
    expect(sumasQueEntregan(mesaDemo, edificiosDemo, ladronDemo).length).toBeGreaterThanOrEqual(5);
  });
});
