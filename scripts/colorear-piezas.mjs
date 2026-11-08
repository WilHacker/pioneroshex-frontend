// Genera las piezas del tablero (poblado, ciudad y camino) en el color de cada jugador.
// Parte del arte en oro de `public/tablero/` y escribe `public/piezas/<color>/<pieza>.svg`.
// Uso: `pnpm piezas`. Se vuelve a ejecutar si cambia la paleta de `src/lib/colores.ts`.
// Node 24 lee los `.ts` directamente, por eso se importa la paleta y el recoloreo sin compilar.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { colorearSvg } from '../src/lib/colorear-svg.ts';
import { COLORES_JUGADOR } from '../src/lib/colores.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const PIEZAS = ['poblado', 'ciudad', 'camino'];

for (const pieza of PIEZAS) {
  const origen = readFileSync(join(RAIZ, 'tablero', `${pieza}-oro.svg`), 'utf8');
  for (const color of COLORES_JUGADOR) {
    const carpeta = join(RAIZ, 'piezas', color.slice(1));
    mkdirSync(carpeta, { recursive: true });
    writeFileSync(join(carpeta, `${pieza}.svg`), colorearSvg(origen, color));
  }
}
console.log(`Listo: ${PIEZAS.length} piezas × ${COLORES_JUGADOR.length} colores en public/piezas/`);
