import { z } from 'zod';
import { ErrorApi, llamar } from './http';

// Contrato con el backend (pioneroshex-backend/src/modules/cuentas). La sesión viaja en una
// cookie HttpOnly: el navegador la manda sola y este código nunca la ve ni la guarda.

const esquemaUsuario = z.object({ id: z.string(), nombre: z.string() });
export type Usuario = z.infer<typeof esquemaUsuario>;

const esquemaConUsuario = z.object({ usuario: esquemaUsuario });
const esquemaRegistroRespuesta = z.object({
  usuario: esquemaUsuario,
  codigos: z.array(z.string()),
});
const esquemaRecuperacion = z.object({ usuario: esquemaUsuario, codigosRestantes: z.number() });
const esquemaCodigos = z.object({ codigos: z.array(z.string()) });
const esquemaRestantes = z.object({ restantes: z.number() });

const esquemaEstadisticas = z.object({
  partidas: z.number(),
  victorias: z.number(),
  promedioPuntos: z.number(),
  ultimas: z.array(
    z.object({
      partidaId: z.string(),
      terminadaEn: z.number(),
      puntos: z.number(),
      gano: z.boolean(),
      ganador: z.string(),
      jugadores: z.number(),
    }),
  ),
});
export type Estadisticas = z.infer<typeof esquemaEstadisticas>;

const SIN_SESION = 401;

/** Quién tiene la sesión abierta, o `null` si nadie. Otros fallos (red, servidor) sí lanzan. */
export async function yo(signal?: AbortSignal): Promise<Usuario | null> {
  try {
    return (await llamar('/cuentas/yo', { metodo: 'GET', signal }, esquemaUsuario))!;
  } catch (e: unknown) {
    if (e instanceof ErrorApi && e.estado === SIN_SESION) return null;
    throw e;
  }
}

/** Crea la cuenta y abre sesión. Los códigos de recuperación se entregan solo esta vez. */
export async function registrar(
  nombre: string,
  contrasena: string,
  codigoRegistro?: string,
): Promise<{ usuario: Usuario; codigos: string[] }> {
  const cuerpo = codigoRegistro ? { nombre, contrasena, codigoRegistro } : { nombre, contrasena };
  return (await llamar('/cuentas/registro', { metodo: 'POST', cuerpo }, esquemaRegistroRespuesta))!;
}

export async function entrar(nombre: string, contrasena: string): Promise<Usuario> {
  const r = await llamar(
    '/cuentas/entrar',
    { metodo: 'POST', cuerpo: { nombre, contrasena } },
    esquemaConUsuario,
  );
  return r!.usuario;
}

export async function salir(): Promise<void> {
  await llamar('/cuentas/salir', { metodo: 'POST', cuerpo: {} }, null);
}

export async function recuperar(
  nombre: string,
  codigo: string,
  nuevaContrasena: string,
): Promise<{ usuario: Usuario; codigosRestantes: number }> {
  return (await llamar(
    '/cuentas/recuperar',
    { metodo: 'POST', cuerpo: { nombre, codigo, nuevaContrasena } },
    esquemaRecuperacion,
  ))!;
}

export async function cambiarContrasena(actual: string, nueva: string): Promise<void> {
  await llamar('/cuentas/contrasena', { metodo: 'POST', cuerpo: { actual, nueva } }, null);
}

export async function codigosRestantes(signal?: AbortSignal): Promise<number> {
  const r = await llamar('/cuentas/codigos', { metodo: 'GET', signal }, esquemaRestantes);
  return r!.restantes;
}

/** Ocho códigos nuevos; los anteriores dejan de servir. */
export async function regenerarCodigos(contrasena: string): Promise<string[]> {
  const r = await llamar(
    '/cuentas/codigos',
    { metodo: 'POST', cuerpo: { contrasena } },
    esquemaCodigos,
  );
  return r!.codigos;
}

export async function borrarCuenta(contrasena: string): Promise<void> {
  await llamar('/cuentas/yo', { metodo: 'DELETE', cuerpo: { contrasena } }, null);
}

export async function estadisticas(signal?: AbortSignal): Promise<Estadisticas> {
  return (await llamar(
    '/cuentas/yo/estadisticas',
    { metodo: 'GET', signal },
    esquemaEstadisticas,
  ))!;
}
