import { z } from 'zod';
import { env } from '@/config/env';

const TIEMPO_MAXIMO_MS = 8000;

/** Un fallo al hablar con el backend, con un mensaje apto para mostrar al jugador. */
export class ErrorApi extends Error {
  constructor(
    readonly estado: number,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

const esquemaError = z.object({ message: z.union([z.string(), z.array(z.string())]) });

export async function llamar<T>(
  ruta: string,
  opciones: {
    metodo: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    cuerpo?: unknown;
    token?: string;
    signal?: AbortSignal;
  },
  esquema: z.ZodType<T> | null,
): Promise<T | null> {
  const cabeceras: Record<string, string> = {};
  if (opciones.cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
  if (opciones.token) cabeceras.Authorization = `Bearer ${opciones.token}`;
  const senales = [
    AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    ...(opciones.signal ? [opciones.signal] : []),
  ];

  let respuesta: Response;
  try {
    respuesta = await fetch(`${env.NEXT_PUBLIC_API_URL}${ruta}`, {
      method: opciones.metodo,
      headers: cabeceras,
      body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
      cache: 'no-store',
      // La cookie de sesión de la cuenta viaja con cada petición (el CORS del backend lo admite).
      credentials: 'include',
      signal: AbortSignal.any(senales),
    });
  } catch (error: unknown) {
    if (opciones.signal?.aborted) throw error;
    throw new ErrorApi(0, 'No se pudo conectar con el servidor');
  }

  if (!respuesta.ok) {
    const cuerpo = esquemaError.safeParse(await respuesta.json().catch(() => null));
    const mensaje = cuerpo.success
      ? [cuerpo.data.message].flat().join('; ')
      : `El servidor respondió ${respuesta.status}`;
    throw new ErrorApi(respuesta.status, mensaje);
  }
  if (esquema === null) return null;
  const datos = esquema.safeParse(await respuesta.json().catch(() => null));
  if (!datos.success) throw new ErrorApi(502, 'El servidor respondió con un formato inesperado');
  return datos.data;
}
