import {
  cajaDeMesa,
  claveHex,
  esquinasDeCasilla,
  posicionDePuerto,
  posicionesDeVertices,
  victimasEn,
  viewBoxDe,
} from './tablero';
import { V1, V2, V3, mesaDePrueba, vistaDePrueba } from './pruebas';

describe('esquinasDeCasilla', () => {
  it('da 6 esquinas a distancia 1 del centro, con una arriba y otra abajo', () => {
    const esquinas = esquinasDeCasilla({ x: 2, y: 3 });
    expect(esquinas).toHaveLength(6);
    for (const e of esquinas) expect(Math.hypot(e.x - 2, e.y - 3)).toBeCloseTo(1);
    expect(esquinas.some((e) => Math.abs(e.x - 2) < 1e-9 && e.y < 3)).toBe(true);
    expect(esquinas.some((e) => Math.abs(e.x - 2) < 1e-9 && e.y > 3)).toBe(true);
  });
});

describe('cajaDeMesa y viewBoxDe', () => {
  it('contiene todas las casillas con margen para los puertos', () => {
    const caja = cajaDeMesa(mesaDePrueba);
    for (const c of mesaDePrueba.casillas) {
      for (const e of esquinasDeCasilla(c.centro)) {
        expect(e.x).toBeGreaterThan(caja.x);
        expect(e.x).toBeLessThan(caja.x + caja.ancho);
        expect(e.y).toBeGreaterThan(caja.y);
        expect(e.y).toBeLessThan(caja.y + caja.alto);
      }
    }
  });

  it('el viewBox son cuatro números separados por espacios', () => {
    expect(viewBoxDe({ x: 1, y: 2, ancho: 3, alto: 4 })).toBe('1 2 3 4');
  });
});

describe('posicionDePuerto', () => {
  const posiciones = posicionesDeVertices(mesaDePrueba);

  it('el borde es el punto medio de la arista y el mar queda más lejos del centro', () => {
    const p = posicionDePuerto([V2, V3], posiciones)!;
    const a = posiciones.get(V2)!;
    const b = posiciones.get(V3)!;
    expect(p.borde.x).toBeCloseTo((a.x + b.x) / 2);
    expect(p.borde.y).toBeCloseTo((a.y + b.y) / 2);
    expect(Math.hypot(p.mar.x, p.mar.y)).toBeGreaterThan(Math.hypot(p.borde.x, p.borde.y));
  });

  it('devuelve null si un vértice no existe', () => {
    expect(posicionDePuerto([V1, 'no-existe'], posiciones)).toBeNull();
  });

  it('no se rompe si el punto medio cae justo en el origen', () => {
    const p = posicionDePuerto(
      ['a', 'b'],
      new Map([
        ['a', { x: -1, y: 0 }],
        ['b', { x: 1, y: 0 }],
      ]),
    )!;
    expect(Number.isFinite(p.mar.x)).toBe(true);
  });
});

describe('victimasEn', () => {
  const hex0 = { q: 0, r: 0, s: 0 };

  it('da los rivales con edificio en una esquina de la casilla y cartas en mano', () => {
    const vista = vistaDePrueba({ edificios: { [V1]: { dueno: 'j2', tipo: 'POBLADO' } } });
    expect(victimasEn(mesaDePrueba, vista, hex0)).toEqual(['j2']);
  });

  it('no incluye al propio jugador ni a quien no tiene cartas', () => {
    const vista = vistaDePrueba({
      edificios: {
        [V1]: { dueno: 'j1', tipo: 'POBLADO' },
        [V2]: { dueno: 'j3', tipo: 'CIUDAD' },
      },
    });
    expect(victimasEn(mesaDePrueba, vista, hex0)).toEqual([]);
  });

  it('no repite al rival que tiene varios edificios en la misma casilla', () => {
    const vista = vistaDePrueba({
      edificios: { [V1]: { dueno: 'j2', tipo: 'POBLADO' }, [V2]: { dueno: 'j2', tipo: 'CIUDAD' } },
    });
    expect(victimasEn(mesaDePrueba, vista, hex0)).toEqual(['j2']);
  });

  it('ignora los edificios de otras casillas', () => {
    const vista = vistaDePrueba({ edificios: { [V3]: { dueno: 'j2', tipo: 'POBLADO' } } });
    expect(victimasEn(mesaDePrueba, vista, hex0)).toEqual([]);
  });
});

describe('claveHex', () => {
  it('usa el mismo formato que los ids de vértice del servidor', () => {
    expect(claveHex({ q: -1, r: 2 })).toBe('-1,2');
  });
});
