import { useCallback, useEffect, useRef, useState } from 'react';
import { conectar, type Conexion, type EstadoConexion } from '@/lib/conexion';
import type { AccionDisponible, EventoJuego, Mesa, Vista } from '@/lib/esquemas';
import { textoDeMotivo } from '@/lib/mensajes';

const EVENTOS_MAX = 60;

export interface DatosDePartida {
  readonly mesa: Mesa;
  readonly vista: Vista;
  readonly acciones: readonly AccionDisponible[];
}

export interface Juego {
  readonly conexion: EstadoConexion;
  /** Motivo por el que el servidor no nos deja entrar; la partida no se puede jugar. */
  readonly rechazo: string | null;
  readonly datos: DatosDePartida | null;
  readonly eventos: readonly EventoJuego[];
  /** Manda una acción. Devuelve `null` si se aceptó, o el motivo en español si no. */
  readonly enviar: (accion: object) => Promise<string | null>;
}

/** Mantiene la conexión del jugador con su partida y refleja lo que manda el servidor. */
export function useJuego(salaId: string, token: string): Juego {
  const [conexion, setConexionEstado] = useState<EstadoConexion>('conectando');
  const [rechazo, setRechazo] = useState<string | null>(null);
  const [datos, setDatos] = useState<DatosDePartida | null>(null);
  const [eventos, setEventos] = useState<readonly EventoJuego[]>([]);
  const actual = useRef<Conexion | null>(null);

  useEffect(() => {
    const nueva = conectar(
      { salaId, token },
      {
        alInicio: (inicio) => {
          setRechazo(null);
          setDatos({ mesa: inicio.mesa, vista: inicio.vista, acciones: inicio.acciones });
        },
        alNotificar: (n) => {
          setDatos((previo) =>
            previo ? { ...previo, vista: n.vista, acciones: n.acciones } : previo,
          );
          setEventos((previos) => [...previos, ...n.eventos].slice(-EVENTOS_MAX));
        },
        alRechazar: setRechazo,
        alCambiarEstado: setConexionEstado,
      },
    );
    actual.current = nueva;
    return () => {
      nueva.cerrar();
      actual.current = null;
    };
  }, [salaId, token]);

  const enviar = useCallback(async (accion: object): Promise<string | null> => {
    const respuesta = await (actual.current?.enviar(accion) ??
      Promise.resolve({ ok: false as const, motivo: 'SIN_RESPUESTA' }));
    return respuesta.ok ? null : textoDeMotivo(respuesta.motivo);
  }, []);

  return { conexion, rechazo, datos, eventos, enviar };
}
