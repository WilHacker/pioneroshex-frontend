import type { Presencia } from '@/lib/esquemas';

/** Lo que se muestra de quien no está jugando él mismo. */
export type EstadoDePresencia = 'desconectado' | 'piloto' | 'abandono';

export const ETIQUETA_DE_PRESENCIA: Record<EstadoDePresencia, { texto: string; ayuda: string }> = {
  desconectado: {
    texto: 'Desconectado',
    ayuda: 'Perdió la conexión. Si no vuelve pronto, el juego jugará por él.',
  },
  abandono: {
    texto: 'Abandonó',
    ayuda: 'Dejó la partida. El juego juega por él hasta el final.',
  },
  piloto: {
    texto: 'Piloto automático',
    ayuda:
      'No está conectado: el juego juega por él para no hacer esperar. Al volver recupera el control.',
  },
};

/**
 * Cómo está `jugadorId` según la presencia que mandó el servidor. Sin presencia (aún no llegó) o
 * si es el propio jugador, no se marca nada: quien ve la pantalla está conectado por definición.
 */
export function estadoDePresencia(
  presencia: Presencia | null | undefined,
  jugadorId: string,
  yo: string | null,
): EstadoDePresencia | null {
  if (!presencia || jugadorId === yo) return null;
  if (presencia.abandonaron.includes(jugadorId)) return 'abandono';
  if (presencia.piloto.includes(jugadorId)) return 'piloto';
  return presencia.conectados.includes(jugadorId) ? null : 'desconectado';
}
