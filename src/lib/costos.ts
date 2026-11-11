import { RECURSOS, type Cantidades, type Recurso } from './esquemas';

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

/** Lo que cuesta una pieza, recurso por recurso, solo los que lleva (para dibujarlo en orden). */
export function costoDe(pieza: Pieza): readonly { recurso: Recurso; cantidad: number }[] {
  return RECURSOS.flatMap((recurso) => {
    const cantidad = COSTOS[pieza][recurso] ?? 0;
    return cantidad > 0 ? [{ recurso, cantidad }] : [];
  });
}

const NOMBRE_DE_RECURSO: Readonly<Record<Recurso, string>> = {
  MADERA: 'madera',
  LADRILLO: 'ladrillo',
  OVEJA: 'oveja',
  TRIGO: 'trigo',
  MINERAL: 'mineral',
};

/** «1 de madera, 1 de ladrillo y 2 de trigo»: lo que falta, en una frase (vacía si no falta nada). */
export function textoDeFalta(falta: Partial<Record<Recurso, number>>): string {
  const partes = RECURSOS.flatMap((recurso) => {
    const cantidad = falta[recurso] ?? 0;
    return cantidad > 0 ? [`${cantidad} de ${NOMBRE_DE_RECURSO[recurso]}`] : [];
  });
  return partes.length > 1
    ? `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}`
    : (partes[0] ?? '');
}

/**
 * Lo que le falta a una mano para pagar una pieza (solo los recursos que faltan). Con la mano
 * desconocida (`null`, un espectador) falta todo. Es solo para avisar antes de pedirlo: el servidor
 * es quien decide si alcanza.
 */
export function faltaPara(mano: Cantidades | null, pieza: Pieza): Partial<Record<Recurso, number>> {
  const falta: Partial<Record<Recurso, number>> = {};
  for (const { recurso, cantidad } of costoDe(pieza)) {
    const faltan = cantidad - (mano?.[recurso] ?? 0);
    if (faltan > 0) falta[recurso] = faltan;
  }
  return falta;
}
