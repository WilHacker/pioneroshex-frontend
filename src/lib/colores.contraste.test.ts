import { colorDeJugador } from './colores';

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
  it.each(Array.from({ length: 12 }, (_, i) => i))(
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

  it('los 12 son distintos', () => {
    expect(new Set(Array.from({ length: 12 }, (_, i) => colorDeJugador(i))).size).toBe(12);
  });
});
