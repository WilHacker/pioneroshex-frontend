import { RECURSOS, type EventoJuego, type Recurso } from '@/lib/esquemas';

/** Algo que aparece sobre un vértice del mapa y se desvanece: un recurso que llega o un punto ganado. */
export type EfectoMapa =
  | {
      readonly clase: 'RECURSO';
      readonly vertice: string;
      readonly jugador: string;
      readonly recurso: Recurso;
      readonly cantidad: number;
    }
  | {
      readonly clase: 'PUNTO';
      readonly vertice: string;
      readonly jugador: string;
      readonly puntos: number;
    };

const esRecurso = (valor: unknown): valor is Recurso =>
  typeof valor === 'string' && (RECURSOS as readonly string[]).includes(valor);

interface Fuente {
  readonly vertice: string;
  readonly cantidad: number;
}

/** Los orígenes (`causa.fuentes`) de un reparto de producción; los mal formados se ignoran. */
function fuentesDe(causa: unknown): Fuente[] {
  if (typeof causa !== 'object' || causa === null) return [];
  const { fuentes, vertice } = causa as { fuentes?: unknown; vertice?: unknown };
  if (Array.isArray(fuentes)) {
    return (fuentes as unknown[]).flatMap((f) => {
      if (typeof f !== 'object' || f === null) return [];
      const { vertice: v, cantidad } = f as { vertice?: unknown; cantidad?: unknown };
      return typeof v === 'string' && typeof cantidad === 'number' && cantidad > 0
        ? [{ vertice: v, cantidad }]
        : [];
    });
  }
  // Los recursos iniciales de la preparación traen un solo vértice y no una lista.
  return typeof vertice === 'string' ? [{ vertice, cantidad: Number.POSITIVE_INFINITY }] : [];
}

/**
 * Qué mostrar sobre el mapa por lo que trajo una notificación:
 * - cada edificio que recibe recursos, con lo que recibe (si el banco se quedó corto, solo lo que
 *   de verdad se entregó, repartido en orden entre sus edificios);
 * - cada poblado o ciudad que se construye, con el punto que vale.
 * Junta lo del mismo jugador, vértice y recurso. Un evento mal formado se ignora: es un adorno.
 */
export function efectosDeMapa(eventos: readonly EventoJuego[]): EfectoMapa[] {
  const efectos: EfectoMapa[] = [];
  const sumar = (nuevo: Extract<EfectoMapa, { clase: 'RECURSO' }>): void => {
    const indice = efectos.findIndex(
      (e) =>
        e.clase === 'RECURSO' &&
        e.vertice === nuevo.vertice &&
        e.jugador === nuevo.jugador &&
        e.recurso === nuevo.recurso,
    );
    const previo = efectos[indice];
    if (previo?.clase === 'RECURSO') {
      efectos[indice] = { ...previo, cantidad: previo.cantidad + nuevo.cantidad };
    } else {
      efectos.push(nuevo);
    }
  };

  for (const evento of eventos) {
    const { tipo, jugador } = evento;
    if (typeof jugador !== 'string') continue;
    if (tipo === 'RECURSOS_REPARTIDOS') {
      const { recurso, cantidad } = evento;
      if (!esRecurso(recurso) || typeof cantidad !== 'number' || cantidad <= 0) continue;
      let restante = cantidad;
      for (const fuente of fuentesDe(evento.causa)) {
        if (restante <= 0) break;
        const entregada = Math.min(fuente.cantidad, restante);
        restante -= entregada;
        sumar({ clase: 'RECURSO', vertice: fuente.vertice, jugador, recurso, cantidad: entregada });
      }
    } else if (tipo === 'POBLADO_COLOCADO' || tipo === 'CIUDAD_COLOCADA') {
      const { vertice } = evento;
      // Mejorar un poblado a ciudad suma 1 punto más; un poblado nuevo, 1.
      if (typeof vertice === 'string')
        efectos.push({ clase: 'PUNTO', vertice, jugador, puntos: 1 });
    }
  }
  return efectos;
}
