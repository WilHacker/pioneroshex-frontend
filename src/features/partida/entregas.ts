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
 * Cuántas cartas salieron de cada casilla (clave `q,r`) en una notificación, según el origen
 * (`causa.fuentes`) que el servidor adjunta a cada reparto. Una casilla que no aparece no produjo:
 * sin edificios, con el ladrón encima o con el banco corto.
 */
export function cartasPorCasilla(eventos: readonly EventoJuego[]): ReadonlyMap<string, number> {
  const porCasilla = new Map<string, number>();
  for (const evento of eventos) {
    if (evento.tipo !== 'RECURSOS_REPARTIDOS') continue;
    const causa: unknown = evento.causa;
    if (typeof causa !== 'object' || causa === null) continue;
    const fuentes: unknown = (causa as { fuentes?: unknown }).fuentes;
    if (!Array.isArray(fuentes)) continue;
    for (const fuente of fuentes as unknown[]) {
      if (typeof fuente !== 'object' || fuente === null) continue;
      const { casilla, cantidad } = fuente as { casilla?: unknown; cantidad?: unknown };
      if (typeof casilla !== 'string' || typeof cantidad !== 'number' || cantidad <= 0) continue;
      porCasilla.set(casilla, (porCasilla.get(casilla) ?? 0) + cantidad);
    }
  }
  return porCasilla;
}

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
