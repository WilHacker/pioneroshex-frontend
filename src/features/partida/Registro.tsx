import type { ReactNode } from 'react';
import { Dado } from '@/components/arte/Dado';
import { IconoPieza } from '@/components/arte/IconoPieza';
import { IconoAccion, IconoDesarrollo } from '@/components/arte/IconosEstado';
import { RECURSOS, esquemaRecurso, type EventoJuego } from '@/lib/esquemas';
import { describirEvento } from '@/lib/mensajes';
import { colorDeJugador } from '@/lib/colores';
import { CartaRecurso } from './CartaRecurso';

type Props = {
  eventos: readonly EventoJuego[];
  nombreDe: (jugadorId: string) => string;
  indiceDe: (jugadorId: string) => number;
};

/** Todo lo que guarda la pantalla (`useJuego` conserva 60 eventos): la caja tiene scroll. */
const LINEAS_MAX = 60;

const texto = (valor: unknown): string => (typeof valor === 'string' ? valor : '');
const numero = (valor: unknown): number => (typeof valor === 'number' ? valor : 0);
const recursoDe = (valor: unknown) => {
  const r = esquemaRecurso.safeParse(valor);
  return r.success ? r.data : null;
};

/** Cartas sueltas de un recurso: una carta pequeña con el número en la esquina. */
function Cantidad({ valor, recurso }: { valor: number; recurso: unknown }) {
  const r = recursoDe(recurso);
  if (!r) return <span className="font-bold">{valor}</span>;
  return (
    <span className="mr-1 inline-flex pt-1.5">
      <CartaRecurso recurso={r} tamano="mini" cantidad={valor} />
    </span>
  );
}

/** Lo que cambia entre dos manos, como una fila de iconos: `1 [madera] 2 [oveja]`. */
function Cartas({ cantidades }: { cantidades: unknown }) {
  if (typeof cantidades !== 'object' || cantidades === null) return null;
  const mapa = cantidades as Record<string, unknown>;
  return (
    <>
      {RECURSOS.filter((r) => numero(mapa[r]) > 0).map((r) => (
        <Cantidad key={r} valor={numero(mapa[r])} recurso={r} />
      ))}
    </>
  );
}

/** El detalle gráfico de un evento, o `null` si es mejor contarlo con una frase. */
function detalleDe(e: EventoJuego, color: (id: string) => string): ReactNode {
  const quien = texto(e.jugador);
  switch (e.tipo) {
    case 'DADOS_TIRADOS': {
      const dados = Array.isArray(e.dados) ? e.dados.map(numero) : [];
      return (
        <>
          <Dado valor={dados[0] ?? null} tamano={22} />
          <Dado valor={dados[1] ?? null} tamano={22} />
        </>
      );
    }
    case 'RECURSOS_REPARTIDOS':
      return <Cantidad valor={numero(e.cantidad)} recurso={e.recurso} />;
    case 'POBLADO_COLOCADO':
      return <IconoPieza pieza="POBLADO" color={color(quien)} tamano={22} />;
    case 'CIUDAD_COLOCADA':
      return <IconoPieza pieza="CIUDAD" color={color(quien)} tamano={22} />;
    case 'CAMINO_COLOCADO':
      return <IconoPieza pieza="CAMINO" color={color(quien)} tamano={22} />;
    case 'CARTA_DESARROLLO_COMPRADA':
      return <IconoPieza pieza="CARTA" color="#e0a82e" tamano={22} />;
    case 'CAMBIO_CON_BANCA_REALIZADO':
      return (
        <>
          <Cantidad valor={numero(e.cantidadEntregada)} recurso={e.entrega} />
          <IconoAccion tipo="INTERCAMBIO" tamano={16} />
          <Cantidad valor={1} recurso={e.recibe} />
        </>
      );
    case 'TRATO_ACEPTADO':
      return (
        <>
          <Cartas cantidades={e.entrega} />
          <IconoAccion tipo="INTERCAMBIO" tamano={16} />
          <Cartas cantidades={e.pide} />
        </>
      );
    case 'CABALLERO_JUGADO':
      return <IconoDesarrollo carta="CABALLERO" tamano={22} />;
    case 'CONSTRUCCION_CARRETERAS_JUGADA':
      return <IconoDesarrollo carta="CONSTRUCCION_CARRETERAS" tamano={22} />;
    case 'ABUNDANCIA_JUGADA':
      return <IconoDesarrollo carta="ABUNDANCIA" tamano={22} />;
    case 'MONOPOLIO_JUGADO':
      return (
        <>
          <IconoDesarrollo carta="MONOPOLIO" tamano={22} />
          <Cantidad valor={numero(e.cantidadRobada)} recurso={e.recurso} />
        </>
      );
    default:
      return null;
  }
}

/** Quién hizo cada cosa; en un trato, quien lo aceptó, y al robar, el ladrón. */
const autorDe = (e: EventoJuego): string =>
  texto(
    e.tipo === 'TRATO_ACEPTADO' ? e.aceptante : e.tipo === 'CARTA_ROBADA' ? e.ladron : e.jugador,
  );

/** Lo último que pasó, lo más nuevo arriba: casi todo con iconos, y una frase solo si hace falta. */
export function Registro({ eventos, nombreDe, indiceDe }: Props) {
  const color = (id: string): string => colorDeJugador(Math.max(0, indiceDe(id)));
  const filas = eventos
    .map((evento, posicion) => ({
      posicion,
      evento,
      detalle: detalleDe(evento, color),
      frase: describirEvento(evento, nombreDe),
    }))
    .filter((f) => f.detalle !== null || f.frase !== null)
    .slice(-LINEAS_MAX)
    .reverse();

  return (
    <section
      aria-labelledby="titulo-registro"
      // Una zona con scroll debe poder recorrerse con el teclado.
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      className="max-h-56 shrink-0 overflow-y-auto overscroll-contain rounded-2xl border-[3px] border-[#101c28] bg-[#f5efe0] p-3 text-tinta shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-azafran"
    >
      <h2 id="titulo-registro" className="sr-only">
        Registro
      </h2>
      {filas.length === 0 ? (
        <p className="text-center text-sm text-tinta-suave">Aún no ha pasado nada.</p>
      ) : (
        <ol className="flex flex-col gap-1">
          {filas.map(({ posicion, evento, detalle, frase }, i) => {
            const autor = autorDe(evento);
            return (
              <li
                key={posicion}
                aria-label={frase ?? undefined}
                className={`flex items-center gap-1.5 text-sm ${i === 0 ? 'font-bold' : 'text-tinta-suave'}`}
              >
                {autor !== '' && (
                  <span
                    aria-hidden="true"
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: color(autor) }}
                  />
                )}
                <span className="truncate">{autor !== '' ? nombreDe(autor) : ''}</span>
                {detalle ?? <span className="truncate text-xs">{frase}</span>}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
