import { z } from 'zod';
import {
  esquemaCredencial,
  esquemaInfoDeMapa,
  esquemaRecomendado,
  esquemaSalaAbierta,
  esquemaSalaPublica,
  type Credencial,
  type InfoDeMapa,
  type OpcionesDeSala,
  type Recomendado,
  type SalaAbierta,
  type SalaPublica,
} from './esquemas';
import { llamar } from './http';

// Se reexporta para quien ya lo importaba de aquí.
export { ErrorApi } from './http';

export interface OpcionesPartida extends OpcionesDeSala {
  semillaMapa?: string;
}

/** Crea la sala ya con el tope de jugadores y las reglas elegidas: una sola petición. */
export async function crearSala(
  nombre: string,
  publica = false,
  reglas: OpcionesDeSala = {},
): Promise<Credencial> {
  // `publica` solo viaja cuando es true: el servidor la toma como falsa por defecto.
  const cuerpo = { nombre, ...(publica ? { publica } : {}), ...reglas };
  return (await llamar('/salas', { metodo: 'POST', cuerpo }, esquemaCredencial))!;
}

/** Los puntos, el tiempo y los turnos que conviene proponer para `jugadores` jugadores. */
export async function verRecomendado(
  jugadores: number,
  signal?: AbortSignal,
): Promise<Recomendado> {
  const ruta = `/recomendado/${jugadores}`;
  return (await llamar(ruta, { metodo: 'GET', signal }, esquemaRecomendado))!;
}

/** El catálogo de mapas con su forma y sus rangos de jugadores. */
export async function listarMapas(signal?: AbortSignal): Promise<InfoDeMapa[]> {
  return (await llamar('/mapas', { metodo: 'GET', signal }, z.array(esquemaInfoDeMapa)))!;
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

const rutaDeSala = (salaId: string): string => `/salas/${encodeURIComponent(salaId)}`;

/** Quien juega se va de la sala de espera. Si era el anfitrión, el cargo pasa al más antiguo. */
export async function salirDeSala(salaId: string, token: string): Promise<void> {
  await llamar(`${rutaDeSala(salaId)}/salir`, { metodo: 'POST', token }, null);
}

/** El anfitrión saca a otro jugador de la sala de espera. */
export async function expulsarDeSala(
  salaId: string,
  token: string,
  jugadorId: string,
): Promise<void> {
  const ruta = `${rutaDeSala(salaId)}/jugadores/${encodeURIComponent(jugadorId)}`;
  await llamar(ruta, { metodo: 'DELETE', token }, null);
}

/** El anfitrión le pasa el cargo a otro jugador. */
export async function cederAnfitrion(
  salaId: string,
  token: string,
  jugadorId: string,
): Promise<void> {
  await llamar(
    `${rutaDeSala(salaId)}/anfitrion`,
    { metodo: 'POST', cuerpo: { jugadorId }, token },
    null,
  );
}
