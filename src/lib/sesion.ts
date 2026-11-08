import { z } from 'zod';
import type { Credencial } from './esquemas';

const CLAVE = 'pioneroshex:sesiones';

/** Lo mínimo de `Storage` que se usa: permite probar sin navegador. */
export type Almacen = Pick<Storage, 'getItem' | 'setItem'>;

const esquemaSesiones = z.record(
  z.string(),
  z.object({ jugadorId: z.string(), token: z.string() }),
);

function almacenDelNavegador(): Almacen | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    // Navegadores con el almacenamiento bloqueado lanzan al solo acceder a él.
    return null;
  }
}

function leerTodas(almacen: Almacen): z.infer<typeof esquemaSesiones> {
  try {
    const crudo = almacen.getItem(CLAVE);
    const sesiones = esquemaSesiones.safeParse(crudo === null ? {} : JSON.parse(crudo));
    return sesiones.success ? sesiones.data : {};
  } catch {
    return {};
  }
}

/**
 * Recuerda quién eres en cada sala para poder recargar la página sin perder tu lugar. Va en
 * `sessionStorage` (solo esta pestaña) y no en `localStorage`: el token es tu identidad en la sala.
 */
export function guardarCredencial(
  credencial: Credencial,
  almacen: Almacen | null = almacenDelNavegador(),
): void {
  if (!almacen) return;
  const { salaId, ...resto } = credencial;
  try {
    almacen.setItem(CLAVE, JSON.stringify({ ...leerTodas(almacen), [salaId]: resto }));
  } catch {
    // Sin almacenamiento disponible solo se pierde la recarga: se vuelve a entrar con el enlace.
  }
}

export function leerCredencial(
  salaId: string,
  almacen: Almacen | null = almacenDelNavegador(),
): Credencial | null {
  if (!almacen) return null;
  const guardada = leerTodas(almacen)[salaId];
  return guardada ? { salaId, ...guardada } : null;
}

/** Olvida quién eras en esa sala (al salir de ella o si te sacan). */
export function olvidarCredencial(
  salaId: string,
  almacen: Almacen | null = almacenDelNavegador(),
): void {
  if (!almacen) return;
  const { [salaId]: _olvidada, ...resto } = leerTodas(almacen);
  try {
    almacen.setItem(CLAVE, JSON.stringify(resto));
  } catch {
    // Sin almacenamiento no hay nada que olvidar.
  }
}

const CLAVE_SORTEO = 'pioneroshex:sorteo-visto';

function salasConSorteoVisto(almacen: Almacen): readonly string[] {
  try {
    const crudo = almacen.getItem(CLAVE_SORTEO);
    const lista: unknown = crudo === null ? [] : JSON.parse(crudo);
    return Array.isArray(lista) ? lista.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** ¿Ya se enseñó en esta pestaña el sorteo del orden de turno de esa partida? */
export function yaVioElSorteo(
  salaId: string,
  almacen: Almacen | null = almacenDelNavegador(),
): boolean {
  return almacen !== null && salasConSorteoVisto(almacen).includes(salaId);
}

/** Recuerda que ya se vio, para no repetirlo al recargar la pantalla. */
export function marcarSorteoVisto(
  salaId: string,
  almacen: Almacen | null = almacenDelNavegador(),
): void {
  if (!almacen) return;
  try {
    const vistas = salasConSorteoVisto(almacen);
    if (!vistas.includes(salaId))
      almacen.setItem(CLAVE_SORTEO, JSON.stringify([...vistas, salaId]));
  } catch {
    // Sin almacenamiento solo se vuelve a ver el sorteo al recargar: no es grave.
  }
}

const CLAVE_NOMBRE = 'pioneroshex:nombre';

function almacenPersistente(): Almacen | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** El nombre sí se recuerda entre visitas (`localStorage`): no es un secreto. */
export function leerNombre(almacen: Almacen | null = almacenPersistente()): string {
  if (!almacen) return '';
  try {
    return almacen.getItem(CLAVE_NOMBRE) ?? '';
  } catch {
    return '';
  }
}

export function guardarNombre(
  nombre: string,
  almacen: Almacen | null = almacenPersistente(),
): void {
  if (!almacen) return;
  try {
    almacen.setItem(CLAVE_NOMBRE, nombre.trim());
  } catch {
    // Sin almacenamiento solo se pierde la comodidad de no volver a escribirlo.
  }
}

/** La dirección que se le pasa a un amigo para que entre a la sala. */
export const enlaceDeSala = (origen: string, salaId: string): string =>
  `${origen}/sala/${encodeURIComponent(salaId)}`;
