import { describe, expect, it } from 'vitest';
import { colorearSvg } from './colorear-svg';

/** Una pieza de ejemplo en tonos oro: oscuro para el borde, uno medio y uno claro. */
const ORO = `<svg viewBox="0 0 10 10">
  <linearGradient id="a"><stop offset="0" stop-color="#ffff00"/><stop offset="1" stop-color="#f89400"/></linearGradient>
  <path d="M0 0h10v10z" fill="url(#a)" stroke="#b25900"/>
  <path d="M1 1h2v2z" fill="#ffd800"/>
  <path d="M2 2h2v2z" fill="#ffba00"/>
  <path d="M3 3h2v2z" fill="#000" stroke="#ffffff"/>
  <path d="M4 4h2v2z" fill="none"/>
</svg>`;

const COLORES = /#[0-9a-f]{6}/g;

const canales = (color: string): [number, number, number] => [
  Number.parseInt(color.slice(1, 3), 16),
  Number.parseInt(color.slice(3, 5), 16),
  Number.parseInt(color.slice(5, 7), 16),
];

/** Matiz en grados (0 a 360) de un `#rrggbb`. */
function matiz(color: string): number {
  const [r, g, b] = canales(color).map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  if (delta === 0) return 0;
  const h =
    max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return (h * 60 + 360) % 360;
}

const brillo = (color: string): number => {
  const [r, g, b] = canales(color);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const AZUL = '#2f6fe0';

describe('colorearSvg', () => {
  it('ya no queda ningún color oro: todo se vuelve del color pedido', () => {
    const resultado = colorearSvg(ORO, AZUL);
    for (const oro of ['#ffff00', '#f89400', '#b25900', '#ffd800', '#ffba00']) {
      expect(resultado).not.toContain(oro);
    }
  });

  it('los tonos nuevos son del mismo matiz que el color pedido', () => {
    const tonos = colorearSvg(ORO, AZUL).match(COLORES)!;
    const matizAzul = matiz(AZUL);
    for (const tono of tonos) {
      if (tono === '#000000' || tono === '#ffffff') continue;
      expect(Math.abs(matiz(tono) - matizAzul)).toBeLessThan(3);
    }
  });

  it('respeta el negro, el blanco, «none» y los degradados por referencia', () => {
    const resultado = colorearSvg(ORO, AZUL);
    expect(resultado).toContain('fill="#000"');
    expect(resultado).toContain('stroke="#ffffff"');
    expect(resultado).toContain('fill="none"');
    expect(resultado).toContain('fill="url(#a)"');
    expect(resultado).toContain('<linearGradient id="a">');
  });

  it('conserva el orden de claridad: lo más oscuro del original sigue siendo lo más oscuro', () => {
    const resultado = colorearSvg(ORO, AZUL);
    const borde = /stroke="(#[0-9a-f]{6})"/.exec(resultado)![1]!;
    const claro = /stop-color="(#[0-9a-f]{6})"/.exec(resultado)![1]!;
    expect(brillo(borde)).toBeLessThan(brillo(claro));
  });

  it('el tono medio del original queda justo en el color del jugador', () => {
    // De los cuatro tonos oro, el de la mediana de claridad (#ffba00) es el color base.
    const resultado = colorearSvg(ORO, AZUL);
    expect(resultado).toContain(`fill="${AZUL}"`);
  });

  it('entiende los colores cortos (#e00) y no deja ninguno sin tocar', () => {
    const resultado = colorearSvg(
      '<path fill="#e00"/><path fill="#a00"/><path fill="#f55"/>',
      AZUL,
    );
    expect(resultado).not.toMatch(/#[ea5f]{3}"/);
    expect(resultado.match(COLORES)).toHaveLength(3);
  });

  it('solo toca los atributos de color: ids y referencias parecidas a un color se quedan', () => {
    const resultado = colorearSvg('<g id="#abc" data-x="#ffba00"/><path fill="#ffba00"/>', AZUL);
    expect(resultado).toContain('id="#abc"');
    expect(resultado).toContain('data-x="#ffba00"');
    expect(resultado).toContain(`fill="${AZUL}"`);
  });

  it('un svg sin colores se queda igual', () => {
    const sin = '<svg><path d="M0 0h1v1z" fill="none"/></svg>';
    expect(colorearSvg(sin, AZUL)).toBe(sin);
  });

  it('con un solo color distinto lo deja en el color pedido', () => {
    expect(colorearSvg('<path fill="#ffba00"/><path stroke="#ffba00"/>', AZUL)).toBe(
      `<path fill="${AZUL}"/><path stroke="${AZUL}"/>`,
    );
  });

  it('rechaza un color base que no sea #rrggbb', () => {
    expect(() => colorearSvg(ORO, 'azul')).toThrow(/#rrggbb/);
  });
});
