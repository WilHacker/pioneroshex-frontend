import { useState } from 'react';
import { IconoAccion } from '@/components/arte/IconosEstado';
import {
  RECURSOS,
  type AccionDisponible,
  type Cantidades,
  type Recurso,
  type Vista,
} from '@/lib/esquemas';
import { NOMBRE_RECURSO } from '@/lib/mensajes';
import { CartaRecurso } from './CartaRecurso';
import { colorDeJugador } from '@/lib/colores';

type Props = {
  vista: Vista;
  acciones: readonly AccionDisponible[];
  nombreDe: (jugadorId: string) => string;
  indiceDe: (jugadorId: string) => number;
  ocupado: boolean;
  onAccion: (accion: object) => void;
  onCerrar: () => void;
};

/** Con quién se comercia: con todos, con un jugador o con la banca. */
type Destino = 'TODOS' | 'BANCA' | (string & {});

const VACIO: Cantidades = { MADERA: 0, LADRILLO: 0, OVEJA: 0, TRIGO: 0, MINERAL: 0 };
const MAX_PEDIDO = 9;

/** Solo los recursos con cantidad: `{ MADERA: 2 }`. */
const soloConCantidad = (c: Cantidades): Partial<Cantidades> =>
  Object.fromEntries(RECURSOS.filter((r) => c[r] > 0).map((r) => [r, c[r]]));

const total = (c: Cantidades): number => RECURSOS.reduce((suma, r) => suma + c[r], 0);

type FilaProps = {
  titulo: string;
  valores: Cantidades;
  /** Máximo por recurso; `null` si no hay manos que respetar. */
  limite: Cantidades | null;
  alCambiar: (recurso: Recurso, delta: number) => void;
};

/** Cinco cartas: tocar una suma 1, el signo menos quita 1. */
function FilaDeCartas({ titulo, valores, limite, alCambiar }: FilaProps) {
  return (
    <fieldset className="flex items-end gap-2">
      <legend className="sr-only">{titulo}</legend>
      <span className="w-10 shrink-0 text-sm font-extrabold">{titulo}</span>
      {RECURSOS.map((r) => (
        <div key={r} className="flex flex-col items-center gap-1">
          <CartaRecurso
            recurso={r}
            tamano="pequena"
            cantidad={valores[r] > 0 ? valores[r] : undefined}
            elegida={valores[r] > 0}
            desactivada={limite !== null && limite[r] === 0}
            etiqueta={`${titulo}: añadir ${NOMBRE_RECURSO[r]}`}
            onClick={() => alCambiar(r, 1)}
          />
          <button
            type="button"
            aria-label={`${titulo}: quitar ${NOMBRE_RECURSO[r]}`}
            disabled={valores[r] === 0}
            onClick={() => alCambiar(r, -1)}
            className="size-5 rounded-full bg-tinta text-xs leading-none font-extrabold text-white disabled:opacity-25"
          >
            −
          </button>
        </div>
      ))}
    </fieldset>
  );
}

/** El panel para comerciar: se arma la oferta tocando cartas y se elige con quién. */
export function Comercio({
  vista,
  acciones,
  nombreDe,
  indiceDe,
  ocupado,
  onAccion,
  onCerrar,
}: Props) {
  const [doy, setDoy] = useState<Cantidades>(VACIO);
  const [pido, setPido] = useState<Cantidades>(VACIO);
  const [destino, setDestino] = useState<Destino>('TODOS');
  const mano = vista.jugadores.find((j) => j.id === vista.yo)?.recursos ?? null;
  const rivales = vista.jugadores.filter((j) => j.id !== vista.yo);
  const puedeTratos = acciones.some((a) => a.tipo === 'PROPONER_TRATO' && a.disponible);
  const puedeBanca = acciones.some((a) => a.tipo === 'CAMBIAR_CON_BANCA' && a.disponible);
  const conBanca = destino === 'BANCA';

  const cambiar =
    (poner: (f: (previo: Cantidades) => Cantidades) => void, tope: Cantidades | null) =>
    (recurso: Recurso, delta: number): void => {
      poner((previo) => {
        if (conBanca) return { ...VACIO, [recurso]: delta > 0 ? 1 : 0 };
        const maximo = tope ? tope[recurso] : MAX_PEDIDO;
        return { ...previo, [recurso]: Math.max(0, Math.min(maximo, previo[recurso] + delta)) };
      });
    };

  const unoDeCada =
    RECURSOS.filter((r) => doy[r] > 0).length === 1 &&
    RECURSOS.filter((r) => pido[r] > 0).length === 1;
  const mismoRecurso = RECURSOS.some((r) => doy[r] > 0 && pido[r] > 0);
  const valido = conBanca ? unoDeCada && !mismoRecurso : total(doy) > 0 && total(pido) > 0;

  const enviar = (): void => {
    if (conBanca) {
      const entrega = RECURSOS.find((r) => doy[r] > 0)!;
      const recibe = RECURSOS.find((r) => pido[r] > 0)!;
      onAccion({ tipo: 'CAMBIAR_CON_BANCA', entrega, recibe });
    } else {
      onAccion({
        tipo: 'PROPONER_TRATO',
        entrega: soloConCantidad(doy),
        pide: soloConCantidad(pido),
        ...(destino === 'TODOS' ? {} : { destinatario: destino }),
      });
    }
    onCerrar();
  };

  const elegirDestino = (nuevo: Destino): void => {
    setDestino(nuevo);
    setDoy(VACIO);
    setPido(VACIO);
  };

  return (
    <section
      aria-label="Comerciar"
      className="absolute right-0 bottom-full z-30 mb-3 flex w-[min(33rem,94vw)] flex-col gap-3 rounded-2xl border-2 border-azafran bg-niebla p-3 text-tinta shadow-2xl"
    >
      <FilaDeCartas
        titulo="Doy"
        valores={doy}
        limite={conBanca ? mano : mano}
        alCambiar={cambiar(setDoy, mano)}
      />
      <FilaDeCartas titulo="Pido" valores={pido} limite={null} alCambiar={cambiar(setPido, null)} />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={destino === 'TODOS'}
          disabled={!puedeTratos}
          onClick={() => elegirDestino('TODOS')}
          className={`rounded-full px-3 py-1 text-sm font-bold disabled:opacity-40 ${destino === 'TODOS' ? 'bg-azafran' : 'bg-white'}`}
        >
          Todos
        </button>
        {rivales.map((j) => (
          <button
            key={j.id}
            type="button"
            aria-label={`Ofrecer solo a ${nombreDe(j.id)}`}
            aria-pressed={destino === j.id}
            disabled={!puedeTratos}
            onClick={() => elegirDestino(j.id)}
            title={nombreDe(j.id)}
            className={`flex size-9 items-center justify-center rounded-full text-base font-extrabold text-white ring-4 disabled:opacity-40 ${destino === j.id ? 'ring-azafran' : 'ring-white'}`}
            style={{ backgroundColor: colorDeJugador(indiceDe(j.id)) }}
          >
            {nombreDe(j.id).slice(0, 1).toUpperCase()}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={conBanca}
          disabled={!puedeBanca}
          onClick={() => elegirDestino('BANCA')}
          className={`rounded-full px-3 py-1 text-sm font-bold disabled:opacity-40 ${conBanca ? 'bg-azafran' : 'bg-white'}`}
        >
          Banca
        </button>

        <span className="grow" />
        <button
          type="button"
          aria-label="Cerrar comercio"
          onClick={onCerrar}
          className="flex size-10 items-center justify-center rounded-full bg-white hover:bg-azafran-claro"
        >
          <IconoAccion tipo="RECHAZAR" />
        </button>
        <button
          type="button"
          aria-label="Enviar oferta"
          disabled={!valido || ocupado}
          onClick={enviar}
          className="flex size-10 items-center justify-center rounded-full bg-hoja text-white enabled:hover:brightness-110 disabled:opacity-40"
        >
          <IconoAccion tipo="ACEPTAR" />
        </button>
      </div>
    </section>
  );
}
