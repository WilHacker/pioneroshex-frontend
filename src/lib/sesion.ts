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
