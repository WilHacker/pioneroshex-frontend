import { aptitudDeMapa, contornoDeForma } from './mapas';
import { formaHexagonal, mapasDePrueba } from './pruebas';

const [clasico, grande] = mapasDePrueba;

describe('aptitudDeMapa', () => {
  it('RECOMENDADO dentro del rango cómodo del mapa', () => {
    expect(aptitudDeMapa(grande!, 4)).toBe('RECOMENDADO');
    expect(aptitudDeMapa(grande!, 8)).toBe('RECOMENDADO');
  });

  it('JUSTO si sobra espacio (pocos jugadores) o se aprieta (más del recomendado)', () => {
    expect(aptitudDeMapa(grande!, 2)).toBe('JUSTO');
    expect(aptitudDeMapa(grande!, 9)).toBe('JUSTO');
  });

  it('NO si no caben los poblados iniciales', () => {
    expect(aptitudDeMapa(clasico!, 8)).toBe('NO');
    expect(aptitudDeMapa(clasico!, 7)).toBe('JUSTO');
  });

  it('con 1 jugador no es NO: aún falta gente, no sobra', () => {
    expect(aptitudDeMapa(clasico!, 1)).toBe('JUSTO');
  });
});

describe('contornoDeForma', () => {
  it('dibuja un polígono de 6 puntos por casilla', () => {
    const { poligonos } = contornoDeForma(formaHexagonal(2));
    expect(poligonos).toHaveLength(19);
    for (const puntos of poligonos) expect(puntos.split(' ')).toHaveLength(6);
  });

  it('una casilla ocupa unos 1,73 de ancho; el viewBox la contiene con margen', () => {
    const { viewBox } = contornoDeForma([[0, 0]]);
    const [x, y, ancho, alto] = viewBox.split(' ').map(Number);
    expect(x).toBeLessThan(-Math.sqrt(3) / 2);
    expect(y).toBeLessThan(-1);
    expect(ancho).toBeGreaterThan(Math.sqrt(3));
    expect(alto).toBeGreaterThan(2);
  });

  it('el viewBox contiene todos los puntos de todos los polígonos', () => {
    const { poligonos, viewBox } = contornoDeForma(formaHexagonal(3));
    const [x, y, ancho, alto] = viewBox.split(' ').map(Number) as [number, number, number, number];
    for (const puntos of poligonos) {
      for (const punto of puntos.split(' ')) {
        const [px, py] = punto.split(',').map(Number) as [number, number];
        expect(px).toBeGreaterThanOrEqual(x);
        expect(px).toBeLessThanOrEqual(x + ancho);
        expect(py).toBeGreaterThanOrEqual(y);
        expect(py).toBeLessThanOrEqual(y + alto);
      }
    }
  });

  it('un mapa más ancho que alto da un viewBox más ancho que alto', () => {
    const fila: [number, number][] = [0, 1, 2, 3, 4, 5].map((q) => [q, 0]);
    const [, , ancho, alto] = contornoDeForma(fila).viewBox.split(' ').map(Number) as number[];
    expect(ancho!).toBeGreaterThan(alto! * 2);
  });

  it('es determinista', () => {
    expect(contornoDeForma(formaHexagonal(2))).toEqual(contornoDeForma(formaHexagonal(2)));
  });

  it('una forma vacía no rompe: viewBox mínimo y sin polígonos', () => {
    expect(contornoDeForma([]).poligonos).toEqual([]);
    expect(contornoDeForma([]).viewBox.split(' ')).toHaveLength(4);
  });
});
