import { io } from 'socket.io-client';
import { z } from 'zod';
import { env } from '@/config/env';
import { esquemaSalaAbierta, esquemaSalaPublica, type SalaPublica } from './esquemas';

/**
 * La sala de espera y la portada reciben lo que cambia por un socket (namespace `/lobby`) en lugar de
 * preguntar cada pocos segundos. Las acciones (crear, entrar, salir…) siguen siendo peticiones HTTP.
 * Si la conexión se corta, socket.io reintenta solo y el servidor vuelve a mandar el estado completo.
 */

/** La sala tal como la ve el servidor, más quién tiene su pestaña abierta. */
export const esquemaSalaEnVivo = esquemaSalaPublica.extend({ conectados: z.array(z.string()) });
export type SalaEnVivo = z.infer<typeof esquemaSalaEnVivo>;

const esquemaPortada = z.object({
  salas: z.array(esquemaSalaAbierta),
  resumen: z.object({
    salasAbiertas: z.number(),
    partidasEnCurso: z.number(),
    jugadores: z.number(),
  }),
});
export type PortadaEnVivo = z.infer<typeof esquemaPortada>;

const esquemaError = z.object({ motivo: z.string() });

export interface ManejadoresDeSala {
  alEstado: (sala: SalaEnVivo) => void;
  /** Todos salieron o la sala caducó. */
  alCerrarse: () => void;
  /** El servidor no nos deja mirar esa sala (`SALA_NO_EXISTE`...) o mandó algo ilegible. */
  alRechazar: (motivo: string) => void;
}

const urlDelLobby = `${env.NEXT_PUBLIC_API_URL}/lobby`;

/**
 * Mira una sala de espera. Con `token` el servidor te cuenta como conectado; sin él (o con uno que ya
 * no vale) solo ves la sala. Devuelve la función que cierra la conexión; después de llamarla ya no
 * llega nada, así un aviso tardío no pisa a una suscripción nueva.
 */
export function suscribirSala(
  entrada: { salaId: string; token?: string | undefined },
  m: ManejadoresDeSala,
): () => void {
  const auth =
    entrada.token === undefined
      ? { salaId: entrada.salaId }
      : { salaId: entrada.salaId, token: entrada.token };
  const socket = io(urlDelLobby, { auth, transports: ['websocket'] });
  let activa = true;

  socket.on('sala:estado', (datos: unknown) => {
    if (!activa) return;
    const sala = esquemaSalaEnVivo.safeParse(datos);
    if (sala.success) m.alEstado(sala.data);
    else m.alRechazar('RESPUESTA_INVALIDA');
  });
  socket.on('sala:cerrada', () => {
    if (activa) m.alCerrarse();
  });
  socket.on('lobby:error', (datos: unknown) => {
    if (!activa) return;
    const error = esquemaError.safeParse(datos);
    m.alRechazar(error.success ? error.data.motivo : 'RESPUESTA_INVALIDA');
  });

  return () => {
    activa = false;
    socket.disconnect();
  };
}

export interface ManejadoresDePortada {
  alDatos: (portada: PortadaEnVivo) => void;
  /** No se pudo conectar o llegó algo ilegible; si la conexión vuelve, llegan datos otra vez. */
  alFallar: () => void;
}

/** Las salas públicas abiertas y los números de la portada, en vivo. */
export function suscribirPortada(m: ManejadoresDePortada): () => void {
  const socket = io(urlDelLobby, { auth: {}, transports: ['websocket'] });
  let activa = true;

  socket.on('portada:salas', (datos: unknown) => {
    if (!activa) return;
    const portada = esquemaPortada.safeParse(datos);
    if (portada.success) m.alDatos(portada.data);
    else m.alFallar();
  });
  socket.on('connect_error', () => {
    if (activa) m.alFallar();
  });

  return () => {
    activa = false;
    socket.disconnect();
  };
}

export type { SalaPublica };
