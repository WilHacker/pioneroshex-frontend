import { COLORES_JUGADOR, colorDeJugador } from './colores';

/** Luminancia relativa de WCAG para un color `#rrggbb`. */
function luminancia(color: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => Number.parseInt(color.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

const contrasteConBlanco = (color: string): number => 1.05 / (luminancia(color) + 0.05);

/** El peor color heredado (el naranja, 2,48:1): los nuevos no deben empeorarlo. */
const PEOR_CONTRASTE_HEREDADO = 2.4;

describe('colorDeJugador: las iniciales van en blanco sobre el color', () => {
  it.each(Array.from({ length: 16 }, (_, i) => i))(
    'el color del jugador %i tiene al menos el contraste del peor color heredado',
    (indice) => {
      expect(contrasteConBlanco(colorDeJugador(indice))).toBeGreaterThanOrEqual(
        PEOR_CONTRASTE_HEREDADO,
      );
    },
  );

  it('los dos colores añadidos para 11 y 12 jugadores superan los 3,5:1', () => {
    expect(contrasteConBlanco(colorDeJugador(10))).toBeGreaterThan(3.5);
    expect(contrasteConBlanco(colorDeJugador(11))).toBeGreaterThan(3.5);
  });

  it('los 16 son distintos', () => {
    expect(new Set(Array.from({ length: 16 }, (_, i) => colorDeJugador(i))).size).toBe(16);
  });

  it('la paleta tiene exactamente 16 colores, uno por jugador de una mesa llena', () => {
    expect(COLORES_JUGADOR).toHaveLength(16);
  });
});

const canales = (color: string): number[] =>
  [1, 3, 5].map((i) => Number.parseInt(color.slice(i, i + 2), 16));

describe('COLORES_JUGADOR: se distinguen a simple vista', () => {
  it('ningún par está demasiado cerca (distancia RGB mínima)', () => {
    const DISTANCIA_MINIMA = 40;
    const cercanos: string[] = [];
    COLORES_JUGADOR.forEach((a, i) =>
      COLORES_JUGADOR.slice(i + 1).forEach((b) => {
        const [ra, ga, ba] = canales(a) as [number, number, number];
        const [rb, gb, bb] = canales(b) as [number, number, number];
        const distancia = Math.hypot(ra - rb, ga - gb, ba - bb);
        if (distancia < DISTANCIA_MINIMA) cercanos.push(`${a} ~ ${b} (${distancia.toFixed(0)})`);
      }),
    );
    expect(cercanos).toEqual([]);
  });

  it('todos son #rrggbb en minúsculas, porque nombran la carpeta de sus piezas', () => {
    for (const color of COLORES_JUGADOR) expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });
});
