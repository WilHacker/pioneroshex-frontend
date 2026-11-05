import { useCallback, useEffect, useRef, useState } from 'react';
import { conectar, type Conexion, type EstadoConexion } from '@/lib/conexion';
import type { AccionDisponible, EventoJuego, Mesa, Sitios, Vista } from '@/lib/esquemas';
import { textoDeMotivo } from '@/lib/mensajes';
import { sumaDeDados } from './efectos';

const EVENTOS_MAX = 60;
/** Cuánto tiempo laten en el tablero las casillas del número que salió. */
const RESALTADO_MS = 5000;

export interface DatosDePartida {
  readonly mesa: Mesa;
  readonly vista: Vista;
  readonly acciones: readonly AccionDisponible[];
  readonly sitios: Sitios;
}

export interface Juego {
  readonly conexion: EstadoConexion;
  /** Motivo por el que el servidor no nos deja entrar; la partida no se puede jugar. */
  readonly rechazo: string | null;
  readonly datos: DatosDePartida | null;
  readonly eventos: readonly EventoJuego[];
  /** Lo que trajo la última notificación; `numero` sube con cada una (para reaccionar a lo nuevo). */
  readonly ultimos: { readonly numero: number; readonly eventos: readonly EventoJuego[] };
  /** Cuántas tiradas han llegado desde que entré: hace rodar los dados aunque repitan resultado. */
  readonly tiradas: number;
  /** El número que acaba de salir, unos segundos; las casillas con ese número laten. */
  readonly resaltado: number | null;
  /** Manda una acción. Devuelve `null` si se aceptó, o el motivo en español si no. */
  readonly enviar: (accion: object) => Promise<string | null>;
}

/** Mantiene la conexión del jugador con su partida y refleja lo que manda el servidor. */
export function useJuego(salaId: string, token: string): Juego {
  const [conexion, setConexionEstado] = useState<EstadoConexion>('conectando');
  const [rechazo, setRechazo] = useState<string | null>(null);
  const [datos, setDatos] = useState<DatosDePartida | null>(null);
  const [eventos, setEventos] = useState<readonly EventoJuego[]>([]);
  const [ultimos, setUltimos] = useState<Juego['ultimos']>({ numero: 0, eventos: [] });
  const [tiradas, setTiradas] = useState(0);
  const [resaltado, setResaltado] = useState<number | null>(null);
  const actual = useRef<Conexion | null>(null);
  const apagarResaltado = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const nueva = conectar(
      { salaId, token },
      {
        alInicio: (inicio) => {
          setRechazo(null);
          setDatos({
            mesa: inicio.mesa,
            vista: inicio.vista,
            acciones: inicio.acciones,
            sitios: inicio.sitios,
          });
        },
        alNotificar: (n) => {
          setDatos((previo) =>
            previo ? { ...previo, vista: n.vista, acciones: n.acciones, sitios: n.sitios } : previo,
          );
          setEventos((previos) => [...previos, ...n.eventos].slice(-EVENTOS_MAX));
          setUltimos((previo) => ({ numero: previo.numero + 1, eventos: n.eventos }));
          const sumas = n.eventos.map(sumaDeDados).filter((suma) => suma !== null);
          if (sumas.length > 0) {
            setTiradas((cuenta) => cuenta + sumas.length);
            setResaltado(sumas.at(-1) ?? null);
            clearTimeout(apagarResaltado.current);
            apagarResaltado.current = setTimeout(() => setResaltado(null), RESALTADO_MS);
          }
        },
        alRechazar: setRechazo,
        alCambiarEstado: setConexionEstado,
      },
    );
    actual.current = nueva;
    return () => {
      nueva.cerrar();
      actual.current = null;
      clearTimeout(apagarResaltado.current);
    };
  }, [salaId, token]);

  const enviar = useCallback(async (accion: object): Promise<string | null> => {
    const respuesta = await (actual.current?.enviar(accion) ??
      Promise.resolve({ ok: false as const, motivo: 'SIN_RESPUESTA' }));
    return respuesta.ok ? null : textoDeMotivo(respuesta.motivo);
  }, []);

  return { conexion, rechazo, datos, eventos, ultimos, tiradas, resaltado, enviar };
}
