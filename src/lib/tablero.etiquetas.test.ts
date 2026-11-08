import { describe, expect, it } from 'vitest';
import { separarEtiquetas, type EtiquetaPorColocar } from './tablero';

const etiqueta = (x: number, y: number, ancho = 1, alto = 0.4): EtiquetaPorColocar => ({
  centro: { x, y },
  ancho,
  alto,
});

const SEPARACION_MINIMA = 1e-6;

/** Cuánto se pisan dos etiquetas (0 si no se tocan). */
function solape(a: EtiquetaPorColocar, b: EtiquetaPorColocar): number {
  const x = (a.ancho + b.ancho) / 2 - Math.abs(a.centro.x - b.centro.x);
  const y = (a.alto + b.alto) / 2 - Math.abs(a.centro.y - b.centro.y);
  return x > SEPARACION_MINIMA && y > SEPARACION_MINIMA ? Math.min(x, y) : 0;
}

const colocadas = (
  originales: readonly EtiquetaPorColocar[],
  puntos: ReturnType<typeof separarEtiquetas>,
): EtiquetaPorColocar[] => originales.map((e, i) => ({ ...e, centro: puntos[i]! }));

const hayChoques = (lista: readonly EtiquetaPorColocar[]): boolean =>
  lista.some((a, i) => lista.slice(i + 1).some((b) => solape(a, b) > 0));

describe('separarEtiquetas', () => {
  it('devuelve un punto por etiqueta y en el mismo orden', () => {
    const entrada = [etiqueta(0, 0), etiqueta(10, 0), etiqueta(20, 5)];
    const salida = separarEtiquetas(entrada);
    expect(salida).toHaveLength(3);
    expect(salida[0]).toEqual({ x: 0, y: 0 });
    expect(salida[2]).toEqual({ x: 20, y: 5 });
  });

  it('las que no se tocan se quedan exactamente donde estaban', () => {
    const entrada = [etiqueta(0, 0), etiqueta(3, 0), etiqueta(0, 3)];
    expect(separarEtiquetas(entrada)).toEqual(entrada.map((e) => e.centro));
  });

  it('dos etiquetas que se pisan de lado se alejan en horizontal, la mitad cada una', () => {
    const entrada = [etiqueta(0, 0), etiqueta(0.6, 0)];
    const salida = separarEtiquetas(entrada);
    expect(hayChoques(colocadas(entrada, salida))).toBe(false);
    expect(salida[0]!.y).toBeCloseTo(0);
    expect(salida[1]!.y).toBeCloseTo(0);
    expect(salida[0]!.x).toBeLessThan(0);
    expect(salida[1]!.x).toBeGreaterThan(0.6);
    // Se repartieron el movimiento: el punto medio no cambió.
    expect((salida[0]!.x + salida[1]!.x) / 2).toBeCloseTo(0.3);
  });

  it('dos que se pisan casi en vertical se alejan en vertical', () => {
    const entrada = [etiqueta(0, 0), etiqueta(0.1, 0.15)];
    const salida = separarEtiquetas(entrada);
    expect(hayChoques(colocadas(entrada, salida))).toBe(false);
    expect(salida[0]!.y).toBeLessThan(0);
    expect(salida[1]!.y).toBeGreaterThan(0.15);
    expect(salida[0]!.x).toBeCloseTo(0);
  });

  it('dos exactamente en el mismo punto también se separan, sin números raros', () => {
    const entrada = [etiqueta(2, 2), etiqueta(2, 2)];
    const salida = separarEtiquetas(entrada);
    for (const p of salida) {
      expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
    }
    expect(hayChoques(colocadas(entrada, salida))).toBe(false);
  });

  it('una fila de etiquetas amontonadas acaba sin choques', () => {
    const entrada = Array.from({ length: 6 }, (_, i) => etiqueta(i * 0.3, 0));
    const salida = separarEtiquetas(entrada);
    expect(hayChoques(colocadas(entrada, salida))).toBe(false);
  });

  it('un racimo en cruz también se resuelve', () => {
    const entrada = [etiqueta(0, 0), etiqueta(0.4, 0.1), etiqueta(-0.3, 0.2), etiqueta(0.1, -0.2)];
    expect(hayChoques(colocadas(entrada, separarEtiquetas(entrada)))).toBe(false);
  });

  it('ninguna se aleja mucho de su sitio: sigue junto a su barco', () => {
    const entrada = Array.from({ length: 5 }, (_, i) => etiqueta(i * 0.2, 0));
    const salida = separarEtiquetas(entrada);
    salida.forEach((p, i) => {
      expect(
        Math.hypot(p.x - entrada[i]!.centro.x, p.y - entrada[i]!.centro.y),
      ).toBeLessThanOrEqual(1.5);
    });
  });

  it('no modifica lo que recibe', () => {
    const entrada = [etiqueta(0, 0), etiqueta(0.2, 0)];
    const copia = JSON.parse(JSON.stringify(entrada));
    separarEtiquetas(entrada);
    expect(entrada).toEqual(copia);
  });

  it('con una sola etiqueta, o ninguna, no hace nada', () => {
    expect(separarEtiquetas([])).toEqual([]);
    expect(separarEtiquetas([etiqueta(1, 1)])).toEqual([{ x: 1, y: 1 }]);
  });

  it('respeta el tamaño de cada una: una ancha necesita más sitio que una estrecha', () => {
    const entrada = [etiqueta(0, 0, 1.2), etiqueta(0.9, 0, 0.74)];
    const salida = separarEtiquetas(entrada);
    expect(hayChoques(colocadas(entrada, salida))).toBe(false);
  });
});
