import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COLORES_JUGADOR } from './colores';
import { archivoDePieza, type Pieza } from './piezas';

const PIEZAS: readonly Pieza[] = ['poblado', 'ciudad', 'camino'];
const PUBLIC = join(process.cwd(), 'public');

describe('archivoDePieza', () => {
  it('usa la carpeta del color del jugador, sin la almohadilla', () => {
    expect(archivoDePieza('poblado', '#2f6fe0')).toBe('/piezas/2f6fe0/poblado.svg');
    expect(archivoDePieza('ciudad', '#e0344f')).toBe('/piezas/e0344f/ciudad.svg');
    expect(archivoDePieza('camino', '#ee6a4a')).toBe('/piezas/ee6a4a/camino.svg');
  });

  it('un color fuera de la paleta usa la pieza dorada original en vez de un enlace roto', () => {
    expect(archivoDePieza('poblado', '#123456')).toBe('/tablero/poblado-oro.svg');
    expect(archivoDePieza('camino', 'rojo')).toBe('/tablero/camino-oro.svg');
  });

  it('tolera mayúsculas en el color', () => {
    expect(archivoDePieza('ciudad', '#2F6FE0')).toBe('/piezas/2f6fe0/ciudad.svg');
  });
});

describe('las piezas generadas', () => {
  it.each(COLORES_JUGADOR.flatMap((color) => PIEZAS.map((pieza) => [color, pieza] as const)))(
    'existe el archivo del color %s para «%s» (si falta, ejecuta pnpm piezas)',
    (color, pieza) => {
      expect(existsSync(join(PUBLIC, archivoDePieza(pieza, color)))).toBe(true);
    },
  );

  it('también existen las piezas doradas de respaldo', () => {
    for (const pieza of PIEZAS) {
      expect(existsSync(join(PUBLIC, 'tablero', `${pieza}-oro.svg`))).toBe(true);
    }
  });
});
