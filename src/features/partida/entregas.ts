import { RECURSOS, type EventoJuego, type Recurso } from '@/lib/esquemas';

/** Cartas de un recurso que el banco reparte a un jugador. */
export interface Entrega {
  readonly jugador: string;
  readonly recurso: Recurso;
  readonly cantidad: number;
}

const esRecurso = (valor: unknown): valor is Recurso =>
  typeof valor === 'string' && (RECURSOS as readonly string[]).includes(valor);

/**
 * Lo que el banco entrega a cada jugador en una notificación, para animarlo. Junta lo que recibe
 * el mismo jugador del mismo recurso. Un evento mal formado se ignora: la animación es un adorno y
 * nunca debe romper la partida.
 */
export function entregasDe(eventos: readonly EventoJuego[]): Entrega[] {
  const porClave = new Map<string, Entrega>();
  for (const evento of eventos) {
    if (evento.tipo !== 'RECURSOS_REPARTIDOS') continue;
    const { jugador, recurso, cantidad } = evento;
    if (typeof jugador !== 'string' || !esRecurso(recurso)) continue;
    if (typeof cantidad !== 'number' || !Number.isFinite(cantidad) || cantidad <= 0) continue;
    const clave = `${jugador}|${recurso}`;
    const previa = porClave.get(clave);
    porClave.set(clave, { jugador, recurso, cantidad: (previa?.cantidad ?? 0) + cantidad });
  }
  return [...porClave.values()];
}
