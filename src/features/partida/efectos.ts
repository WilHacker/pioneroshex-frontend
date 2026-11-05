import type { EventoJuego } from '@/lib/esquemas';
import type { Efecto } from '@/lib/sonido';

/** Qué sonido corresponde a un evento de la partida, o `null` si no suena nada. */
export function efectoDe(evento: EventoJuego, yo: string | null): Efecto | null {
  switch (evento.tipo) {
    case 'DADOS_TIRADOS':
      return 'dados';
    case 'POBLADO_COLOCADO':
    case 'CIUDAD_COLOCADA':
    case 'CAMINO_COLOCADO':
    case 'LADRON_MOVIDO':
    case 'CABALLERO_JUGADO':
    case 'CONSTRUCCION_CARRETERAS_JUGADA':
      return 'colocar';
    case 'RECURSOS_REPARTIDOS':
      return evento.jugador === yo ? 'ganar' : null;
    case 'TRATO_PROPUESTO': {
      const proponente = (evento.trato as { proponente?: unknown } | undefined)?.proponente;
      return proponente === yo ? null : 'oferta';
    }
    case 'PARTIDA_GANADA':
      return 'victoria';
    default:
      return null;
  }
}

/** La suma de los dos dados de un evento `DADOS_TIRADOS`, o `null` si no lo es o viene mal. */
export function sumaDeDados(evento: EventoJuego): number | null {
  if (evento.tipo !== 'DADOS_TIRADOS' || !Array.isArray(evento.dados)) return null;
  const [a, b] = evento.dados;
  return typeof a === 'number' && typeof b === 'number' ? a + b : null;
}
