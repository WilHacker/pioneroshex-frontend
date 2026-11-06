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
