import { io } from 'socket.io-client';
import { env } from '@/config/env';
import {
  esquemaInicio,
  esquemaNotificacion,
  esquemaRespuestaAccion,
  type Inicio,
  type Notificacion,
  type RespuestaAccion,
} from './esquemas';

const TIEMPO_RESPUESTA_MS = 5000;
const CIERRE_VOLUNTARIO = 'io client disconnect';

export type EstadoConexion = 'conectando' | 'conectado' | 'reconectando' | 'cerrado';

export interface Manejadores {
  alInicio: (inicio: Inicio) => void;
  alNotificar: (notificacion: Notificacion) => void;
  /** El servidor no nos deja entrar (token inválido, partida sin empezar...). */
  alRechazar: (motivo: string) => void;
  alCambiarEstado: (estado: EstadoConexion) => void;
}

export interface Conexion {
  /** Manda una acción (sin `jugador`: el servidor sabe quién eres) y espera el acuse. */
  enviar: (accion: object) => Promise<RespuestaAccion>;
  cerrar: () => void;
}

/**
 * Se conecta a la partida con el token de la sala. Todo lo que llega se valida con Zod; si el
 * servidor manda algo con otra forma se avisa como rechazo en lugar de romper la pantalla.
 * Si se corta la conexión, socket.io reintenta solo y el servidor vuelve a mandar el inicio.
 */
export function conectar(auth: { salaId: string; token: string }, m: Manejadores): Conexion {
  const socket = io(env.NEXT_PUBLIC_API_URL, { auth, transports: ['websocket'] });
  m.alCambiarEstado('conectando');

  socket.on('connect', () => m.alCambiarEstado('conectado'));
  socket.on('disconnect', (razon: string) =>
    m.alCambiarEstado(razon === CIERRE_VOLUNTARIO ? 'cerrado' : 'reconectando'),
  );
  socket.on('juego:inicio', (datos: unknown) => {
    const inicio = esquemaInicio.safeParse(datos);
    if (inicio.success) m.alInicio(inicio.data);
    else m.alRechazar('RESPUESTA_INVALIDA');
  });
  socket.on('juego:notificacion', (datos: unknown) => {
    const notificacion = esquemaNotificacion.safeParse(datos);
    if (notificacion.success) m.alNotificar(notificacion.data);
    else m.alRechazar('RESPUESTA_INVALIDA');
  });
  socket.on('juego:error', (datos: unknown) => {
    const motivo = (datos as { motivo?: unknown } | null)?.motivo;
    m.alRechazar(typeof motivo === 'string' ? motivo : 'NO_AUTORIZADO');
  });

  return {
    enviar: async (accion) => {
      try {
        const crudo: unknown = await socket
          .timeout(TIEMPO_RESPUESTA_MS)
          .emitWithAck('juego:accion', accion);
        const respuesta = esquemaRespuestaAccion.safeParse(crudo);
        return respuesta.success ? respuesta.data : { ok: false, motivo: 'RESPUESTA_INVALIDA' };
      } catch {
        return { ok: false, motivo: 'SIN_RESPUESTA' };
      }
    },
    cerrar: () => {
      socket.disconnect();
    },
  };
}
