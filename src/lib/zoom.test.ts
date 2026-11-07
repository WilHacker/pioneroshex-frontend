import type { Caja } from './tablero';
import {
  ZOOM_MAX,
  acercarEn,
  desplazamientoDeArrastre,
  desplazar,
  nivelDeZoom,
  puntoDeSvg,
} from './zoom';

const BASE: Caja = { x: -10, y: -8, ancho: 20, alto: 16 };
const centro = (c: Caja) => ({ x: c.x + c.ancho / 2, y: c.y + c.alto / 2 });
const cerca = (a: number, b: number) => expect(a).toBeCloseTo(b, 9);

describe('acercarEn', () => {
  it('con factor 2 la vista mide la mitad y conserva la proporción', () => {
    const v = acercarEn(BASE, BASE, 2, centro(BASE));
    cerca(v.ancho, 10);
    cerca(v.alto, 8);
  });

  it('mantiene fijo el punto bajo el cursor (su posición relativa en la vista no cambia)', () => {
    const foco = { x: 5, y: -3 };
    const antes = { rx: (foco.x - BASE.x) / BASE.ancho, ry: (foco.y - BASE.y) / BASE.alto };
    const v = acercarEn(BASE, BASE, 2, foco);
    cerca((foco.x - v.x) / v.ancho, antes.rx);
    cerca((foco.y - v.y) / v.alto, antes.ry);
  });

  it('nunca pasa del zoom máximo', () => {
    let v = BASE;
    for (let i = 0; i < 40; i++) v = acercarEn(BASE, v, 2, centro(v));
    cerca(nivelDeZoom(BASE, v), ZOOM_MAX);
  });

  it('nunca se aleja más que la vista completa', () => {
    expect(acercarEn(BASE, BASE, 0.5, centro(BASE))).toEqual(BASE);
  });

  it('acercar y alejar con el mismo foco vuelve a la vista completa', () => {
    const foco = { x: 8, y: 6 }; // cerca de una esquina
    const acercada = acercarEn(BASE, BASE, 3, foco);
    const de_vuelta = acercarEn(BASE, acercada, 1 / 3, foco);
    cerca(de_vuelta.x, BASE.x);
    cerca(de_vuelta.y, BASE.y);
    cerca(de_vuelta.ancho, BASE.ancho);
  });

  it('la vista siempre queda dentro de la caja base, incluso con el foco en la esquina', () => {
    for (const foco of [
      { x: -10, y: -8 },
      { x: 10, y: 8 },
      { x: 10, y: -8 },
    ]) {
      const v = acercarEn(BASE, BASE, 4, foco);
      expect(v.x).toBeGreaterThanOrEqual(BASE.x - 1e-9);
      expect(v.y).toBeGreaterThanOrEqual(BASE.y - 1e-9);
      expect(v.x + v.ancho).toBeLessThanOrEqual(BASE.x + BASE.ancho + 1e-9);
      expect(v.y + v.alto).toBeLessThanOrEqual(BASE.y + BASE.alto + 1e-9);
    }
  });

  it('un factor inválido no rompe nada', () => {
    for (const f of [0, -2, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(acercarEn(BASE, BASE, f, centro(BASE))).toEqual(BASE);
    }
  });

  it('no muta las cajas recibidas', () => {
    const base = { ...BASE };
    const actual = { ...BASE };
    acercarEn(base, actual, 2, { x: 0, y: 0 });
    expect(base).toEqual(BASE);
    expect(actual).toEqual(BASE);
  });
});

describe('desplazar', () => {
  const ACERCADA = acercarEn(BASE, BASE, 2, centro(BASE));

  it('mueve la vista las unidades pedidas', () => {
    const v = desplazar(BASE, ACERCADA, 2, 1);
    cerca(v.x, ACERCADA.x + 2);
    cerca(v.y, ACERCADA.y + 1);
    cerca(v.ancho, ACERCADA.ancho);
  });

  it('no se sale de la caja base por ningún lado', () => {
    const derecha = desplazar(BASE, ACERCADA, 999, 0);
    cerca(derecha.x + derecha.ancho, BASE.x + BASE.ancho);
    const arriba = desplazar(BASE, ACERCADA, 0, -999);
    cerca(arriba.y, BASE.y);
  });

  it('con la vista completa no hay nada que mover', () => {
    expect(desplazar(BASE, BASE, 5, 5)).toEqual(BASE);
  });

  it('un desplazamiento inválido no rompe nada', () => {
    expect(desplazar(BASE, ACERCADA, Number.NaN, Number.POSITIVE_INFINITY)).toEqual(ACERCADA);
  });
});

describe('nivelDeZoom', () => {
  it('es 1 con la vista completa y crece al acercar', () => {
    expect(nivelDeZoom(BASE, BASE)).toBe(1);
    cerca(nivelDeZoom(BASE, acercarEn(BASE, BASE, 2, centro(BASE))), 2);
  });
});

describe('puntoDeSvg: de píxeles de pantalla a unidades del tablero', () => {
  // Un svg de 400 × 320 píxeles que muestra la caja de 20 × 16 unidades: 20 píxeles por unidad.
  const rect = { left: 100, top: 50, width: 400, height: 320 };

  it('la esquina de arriba a la izquierda es el origen de la caja', () => {
    expect(puntoDeSvg(rect, BASE, 100, 50)).toEqual({ x: -10, y: -8 });
  });

  it('el centro del svg es el centro de la caja', () => {
    expect(puntoDeSvg(rect, BASE, 300, 210)).toEqual(centro(BASE));
  });

  it('con franjas (el svg es más ancho que la caja), el dibujo queda centrado', () => {
    // 800 de ancho: la caja ocupa 400 (20 px por unidad) y sobran 200 a cada lado.
    const ancho = { left: 0, top: 0, width: 800, height: 320 };
    expect(puntoDeSvg(ancho, BASE, 400, 160)).toEqual(centro(BASE));
    expect(puntoDeSvg(ancho, BASE, 200, 0)).toEqual({ x: -10, y: -8 });
  });

  it('un svg sin tamaño (aún sin dibujar) da el centro de la vista', () => {
    expect(puntoDeSvg({ left: 0, top: 0, width: 0, height: 0 }, BASE, 5, 5)).toEqual(centro(BASE));
  });
});

describe('desplazamientoDeArrastre', () => {
  const rect = { width: 400, height: 320 }; // 20 píxeles por unidad con la caja base

  it('arrastrar a la izquierda avanza la vista hacia la derecha', () => {
    expect(desplazamientoDeArrastre(rect, BASE, -40, 0)).toEqual({ dx: 2, dy: -0 });
  });

  it('con la vista acercada, el mismo arrastre mueve menos unidades', () => {
    const acercada = acercarEn(BASE, BASE, 2, { x: 0, y: 0 });
    expect(desplazamientoDeArrastre(rect, acercada, -40, 0).dx).toBeCloseTo(1, 9);
  });

  it('un svg sin tamaño no mueve nada', () => {
    expect(desplazamientoDeArrastre({ width: 0, height: 0 }, BASE, 30, 30)).toEqual({
      dx: 0,
      dy: 0,
    });
  });
});
