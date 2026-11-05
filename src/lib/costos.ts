import type { Cantidades } from './esquemas';

export type Pieza = 'CAMINO' | 'POBLADO' | 'CIUDAD' | 'CARTA';

/**
 * Lo que cuesta cada cosa. Es solo para mostrarlo en pantalla: quien decide si alcanza es el
 * servidor. Debe coincidir con `COSTOS` de `pioneroshex-backend/src/core/reglas/costos.ts`.
 */
export const COSTOS: Readonly<Record<Pieza, Readonly<Partial<Cantidades>>>> = {
  CAMINO: { MADERA: 1, LADRILLO: 1 },
  POBLADO: { MADERA: 1, LADRILLO: 1, OVEJA: 1, TRIGO: 1 },
  CIUDAD: { TRIGO: 2, MINERAL: 3 },
  CARTA: { OVEJA: 1, TRIGO: 1, MINERAL: 1 },
};
