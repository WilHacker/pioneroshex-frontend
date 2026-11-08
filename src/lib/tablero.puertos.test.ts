import { describe, expect, it } from 'vitest';
import { SALIDA_PUERTO, SALIDA_PUERTO_MINIMA, posicionDePuerto } from './tablero';

const RAIZ_DE_3 = Math.sqrt(3);

/** Los seis vértices de una casilla pointy-top de lado 1 con ese centro, como un mapa id → punto. */
function vertices(centro: { x: number; y: number }): Map<string, { x: number; y: number }> {
  return new Map(
    Array.from({ length: 6 }, (_, k) => {
      const angulo = (Math.PI / 180) * (60 * k - 30);
      return [
        `${centro.x},${centro.y}#${k}`,
        { x: centro.x + Math.cos(angulo), y: centro.y + Math.sin(angulo) },
      ] as const;
    }),
  );
}

const idDe = (centro: { x: number; y: number }, k: number): string =>
  `${centro.x},${centro.y}#${k}`;

describe('posicionDePuerto: hacia dónde mira el barco', () => {
  it('sale hacia afuera de la casilla de la que cuelga, aunque ese lado mire al centro del tablero', () => {
    // Una casilla lejos del origen cuya costa (su lado izquierdo, k=3 y k=4) mira hacia el origen.
    const centro = { x: 10, y: 0 };
    const posiciones = vertices(centro);
    const p = posicionDePuerto([idDe(centro, 3), idDe(centro, 4)], posiciones, [{ centro }])!;
    expect(p.afuera.x).toBeCloseTo(-1);
    expect(p.afuera.y).toBeCloseTo(0);
    expect(p.mar.x).toBeLessThan(p.borde.x);
  });

  it('en un lado que mira a un costado, sale en horizontal', () => {
    const centro = { x: 0, y: 0 };
    const posiciones = vertices(centro);
    // k=0 (-30°, arriba a la derecha) y k=1 (30°, abajo a la derecha): el lado derecho.
    const p = posicionDePuerto([idDe(centro, 0), idDe(centro, 1)], posiciones, [{ centro }])!;
    expect(p.afuera.x).toBeCloseTo(1);
    expect(p.afuera.y).toBeCloseTo(0);
    expect(p.borde.x).toBeCloseTo(RAIZ_DE_3 / 2);
  });

  it('sin la lista de casillas usa el rumbo desde el centro del tablero, como antes', () => {
    const centro = { x: 10, y: 0 };
    const posiciones = vertices(centro);
    const p = posicionDePuerto([idDe(centro, 3), idDe(centro, 4)], posiciones)!;
    expect(p.afuera.x).toBeCloseTo(1);
  });

  it('si ninguna casilla tiene esos dos vértices, usa también el rumbo desde el centro', () => {
    const centro = { x: 10, y: 0 };
    const posiciones = vertices(centro);
    const otra = { x: -50, y: 40 };
    const p = posicionDePuerto([idDe(centro, 3), idDe(centro, 4)], posiciones, [{ centro: otra }])!;
    expect(p.afuera.x).toBeCloseTo(1);
  });

  it('el vector «afuera» es unitario y el barco queda justo en esa dirección', () => {
    const centro = { x: 4, y: 3 };
    const posiciones = vertices(centro);
    const p = posicionDePuerto([idDe(centro, 1), idDe(centro, 2)], posiciones, [{ centro }])!;
    expect(Math.hypot(p.afuera.x, p.afuera.y)).toBeCloseTo(1);
    const largo = Math.hypot(p.mar.x - p.borde.x, p.mar.y - p.borde.y);
    expect(p.mar.x).toBeCloseTo(p.borde.x + p.afuera.x * largo);
    expect(p.mar.y).toBeCloseTo(p.borde.y + p.afuera.y * largo);
  });
});

describe('posicionDePuerto: cuánto se aleja el barco', () => {
  const centro = { x: 0, y: 0 };
  const posiciones = vertices(centro);
  const lado = (casillas: readonly { centro: { x: number; y: number } }[]) =>
    posicionDePuerto([idDe(centro, 0), idDe(centro, 1)], posiciones, casillas)!;
  const salida = (p: ReturnType<typeof lado>): number =>
    Math.hypot(p.mar.x - p.borde.x, p.mar.y - p.borde.y);

  it('en mar abierto se aleja lo máximo', () => {
    expect(salida(lado([{ centro }]))).toBeCloseTo(SALIDA_PUERTO);
  });

  it('con otra casilla al otro lado de un canal estrecho se acerca a la costa para no pisarla', () => {
    // Otra casilla a 2,6 de distancia: queda un canal de menos de una casilla de ancho.
    const frente = { x: 2.6, y: 0 };
    const p = lado([{ centro }, { centro: frente }]);
    expect(salida(p)).toBeLessThan(SALIDA_PUERTO);
    expect(salida(p)).toBeGreaterThanOrEqual(SALIDA_PUERTO_MINIMA - 1e-9);
  });

  it('nunca se acerca más que el mínimo, ni siquiera en un canal imposible', () => {
    const pegada = { x: 1.8, y: 0 };
    expect(salida(lado([{ centro }, { centro: pegada }]))).toBeGreaterThanOrEqual(
      SALIDA_PUERTO_MINIMA - 1e-9,
    );
  });

  it('una casilla lejana no le quita sitio', () => {
    const lejos = { x: 9, y: 0 };
    expect(salida(lado([{ centro }, { centro: lejos }]))).toBeCloseTo(SALIDA_PUERTO);
  });

  it('un canal ancho (dos casillas de mar) deja el barco en su sitio habitual', () => {
    const lejos = { x: 5.2, y: 0 };
    expect(salida(lado([{ centro }, { centro: lejos }]))).toBeCloseTo(SALIDA_PUERTO);
  });
});
