import { z } from 'zod';
import { env } from '@/config/env';
import {
  esquemaCredencial,
  esquemaSalaAbierta,
  esquemaSalaPublica,
  type Credencial,
  type OpcionesDeSala,
  type SalaAbierta,
  type SalaPublica,
} from './esquemas';

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

export interface OpcionesPartida extends OpcionesDeSala {
  semillaMapa?: string;
}

const esquemaError = z.object({ message: z.union([z.string(), z.array(z.string())]) });

async function llamar<T>(
  ruta: string,
  opciones: {
    metodo: 'GET' | 'POST' | 'PATCH';
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

export async function crearSala(nombre: string, publica = false): Promise<Credencial> {
  // `publica` solo viaja cuando es true: el servidor la toma como falsa por defecto.
  const cuerpo = publica ? { nombre, publica } : { nombre };
  return (await llamar('/salas', { metodo: 'POST', cuerpo }, esquemaCredencial))!;
}

/** Las salas públicas que esperan jugadores. */
export async function listarSalas(signal?: AbortSignal): Promise<SalaAbierta[]> {
  return (await llamar('/salas', { metodo: 'GET', signal }, z.array(esquemaSalaAbierta)))!;
}

/** El anfitrión cambia la visibilidad o las reglas de su sala antes de empezar. */
export async function cambiarSala(
  salaId: string,
  token: string,
  cambios: OpcionesDeSala & { publica?: boolean },
): Promise<void> {
  const ruta = `/salas/${encodeURIComponent(salaId)}`;
  await llamar(ruta, { metodo: 'PATCH', cuerpo: cambios, token }, null);
}

export async function unirseASala(salaId: string, nombre: string): Promise<Credencial> {
  const ruta = `/salas/${encodeURIComponent(salaId)}/unirse`;
  return (await llamar(ruta, { metodo: 'POST', cuerpo: { nombre } }, esquemaCredencial))!;
}

export async function verSala(salaId: string, signal?: AbortSignal): Promise<SalaPublica> {
  const ruta = `/salas/${encodeURIComponent(salaId)}`;
  return (await llamar(ruta, { metodo: 'GET', signal }, esquemaSalaPublica))!;
}

const esquemaResumen = z.object({
  salasAbiertas: z.number(),
  partidasEnCurso: z.number(),
  jugadores: z.number(),
});
export type ResumenDeSalas = z.infer<typeof esquemaResumen>;

/** Cuántas salas y jugadores hay ahora mismo (solo números; sirve para la portada). */
export async function verResumen(signal?: AbortSignal): Promise<ResumenDeSalas> {
  return (await llamar('/salas/resumen', { metodo: 'GET', signal }, esquemaResumen))!;
}

export async function empezarSala(
  salaId: string,
  token: string,
  opciones: OpcionesPartida = {},
): Promise<void> {
  const ruta = `/salas/${encodeURIComponent(salaId)}/empezar`;
  await llamar(ruta, { metodo: 'POST', cuerpo: opciones, token }, null);
}
