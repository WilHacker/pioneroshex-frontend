import { z } from 'zod';
import {
  esquemaCredencial,
  esquemaSalaAbierta,
  esquemaSalaPublica,
  type Credencial,
  type OpcionesDeSala,
  type SalaAbierta,
  type SalaPublica,
} from './esquemas';
import { llamar } from './http';

// Se reexporta para quien ya lo importaba de aquí.
export { ErrorApi } from './http';

export interface OpcionesPartida extends OpcionesDeSala {
  semillaMapa?: string;
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
