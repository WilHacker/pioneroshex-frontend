import { useState } from 'react';
import { IconoAccion } from '@/components/arte/IconosEstado';
import { IconoBanco } from '@/components/arte/IconoBanco';
import { IconoIntercambio } from '@/components/arte/IconoIntercambio';
import { IconoAmigos } from '@/components/arte/IconosPortada';
import {
  RECURSOS,
  type AccionDisponible,
  type Cantidades,
  type Mesa,
  type Recurso,
  type Vista,
} from '@/lib/esquemas';
import { NOMBRE_RECURSO, textoDeMotivo } from '@/lib/mensajes';
import { razonDeBanca } from '@/lib/puertos';
import { CartaRecurso } from './CartaRecurso';
import { Flecha } from './Flecha';
import { colorDeJugador } from '@/lib/colores';

type Props = {
  /** El tablero: de aquí salen los puertos que dan mejor razón de cambio con la banca. */
  mesa: Mesa;
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

const nombreCapital = (r: Recurso): string =>
  NOMBRE_RECURSO[r].charAt(0).toUpperCase() + NOMBRE_RECURSO[r].slice(1);

type FilaProps = {
  titulo: string;
  /** Lo que pides (recibes, flecha verde) o lo que das (flecha roja). */
  recibe: boolean;
  valores: Cantidades;
  /** Máximo por recurso; `null` si no hay manos que respetar. */
  limite: Cantidades | null;
  /** Con la banca: cuántas cartas cuesta cada recurso (4, 3 o 2); se muestra bajo cada carta. */
  razones?: Readonly<Record<Recurso, number>>;
  alCambiar: (recurso: Recurso, delta: number) => void;
};

/** Cinco cartas: tocar una suma 1, el signo menos quita 1. */
function FilaDeCartas({ titulo, recibe, valores, limite, razones, alCambiar }: FilaProps) {
  return (
    <fieldset className="flex items-end gap-2">
      <legend className="sr-only">{titulo}</legend>
      <span aria-hidden="true" className="flex w-12 shrink-0 flex-col items-center gap-0.5 pb-8">
        <Flecha recibe={recibe} />
        <span className="text-xs font-extrabold">{titulo}</span>
      </span>
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
          {razones && (
            <span
              title={`${nombreCapital(r)}: ${razones[r]} cartas por 1`}
              className={`rounded-full px-1.5 text-[0.65rem] leading-4 font-extrabold ${razones[r] < 4 ? 'bg-hoja text-white' : 'bg-white text-tinta'}`}
            >
              {razones[r]}:1
            </span>
          )}
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
  mesa,
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
  const mano = vista.jugadores.find((j) => j.id === vista.yo)?.recursos ?? null;
  const rivales = vista.jugadores.filter((j) => j.id !== vista.yo);
  const puedeTratos = acciones.some((a) => a.tipo === 'PROPONER_TRATO' && a.disponible);
  const puedeBanca = acciones.some((a) => a.tipo === 'CAMBIAR_CON_BANCA' && a.disponible);
  const privado = vista.config.modoComercio === 'PRIVADO';
  // Se abre donde se puede hacer algo: en la banca si no hay tratos, y en un jugador si es privado.
  const [destino, setDestino] = useState<Destino>(() => {
    if (!puedeTratos) return puedeBanca ? 'BANCA' : 'TODOS';
    return privado ? (rivales[0]?.id ?? 'TODOS') : 'TODOS';
  });
  // Por qué no se puede ofrecer a jugadores (solo si es una regla de la sala, no el turno o la fase).
  const motivoSinTratos = acciones.find(
    (a) => a.tipo === 'PROPONER_TRATO' && !a.disponible,
  )?.motivo;
  const avisoDeReglas =
    motivoSinTratos === 'NO_PUEDES_COMERCIAR' || motivoSinTratos === 'DEMASIADAS_OFERTAS'
      ? textoDeMotivo(motivoSinTratos)
      : null;
  const conBanca = destino === 'BANCA';

  // Con la banca cada recurso se paga a su razón (4 cartas iguales, 3 con un puerto genérico, 2 con el
  // de ese recurso; salen de mis casas en los puertos, igual que las calcula el servidor) y se recibe
  // una carta por cada cambio completo. Se puede mezclar: cada toque en «Doy» suma una razón entera.
  const razones = Object.fromEntries(
    RECURSOS.map((r) => [r, razonDeBanca(mesa, vista, r)]),
  ) as Record<Recurso, number>;
  const cambios = RECURSOS.reduce((suma, r) => suma + Math.floor(doy[r] / razones[r]), 0);
  const pedidas = total(pido);

  /** Con jugadores: de uno en uno, sin pasar de lo que tengo (al dar) ni del tope (al pedir). */
  const acotar = (
    previo: Cantidades,
    recurso: Recurso,
    delta: number,
    maximo: number,
  ): Cantidades => ({
    ...previo,
    [recurso]: Math.max(0, Math.min(maximo, previo[recurso] + delta)),
  });
  const alCambiarDoy = (recurso: Recurso, delta: number): void =>
    setDoy((previo) => {
      if (!conBanca) return acotar(previo, recurso, delta, mano ? mano[recurso] : MAX_PEDIDO);
      const siguiente = previo[recurso] + delta * razones[recurso];
      return siguiente < 0 || siguiente > (mano?.[recurso] ?? 0)
        ? previo
        : { ...previo, [recurso]: siguiente };
    });
  const alCambiarPido = (recurso: Recurso, delta: number): void =>
    setPido((previo) => {
      if (!conBanca) return acotar(previo, recurso, delta, MAX_PEDIDO);
      const siguiente = previo[recurso] + delta;
      return siguiente < 0 || (delta > 0 && total(previo) >= cambios)
        ? previo
        : { ...previo, [recurso]: siguiente };
    });

  // Qué cartas se pueden tocar en la banca: dar solo si queda una razón completa en la mano y no se
  // está pidiendo ese recurso; pedir solo mientras falten cartas por elegir y no se esté dando.
  const limiteDoyBanca = Object.fromEntries(
    RECURSOS.map((r) => [r, (mano?.[r] ?? 0) - doy[r] >= razones[r] && pido[r] === 0 ? 1 : 0]),
  ) as Cantidades;
  const limitePidoBanca = Object.fromEntries(
    RECURSOS.map((r) => [r, doy[r] === 0 && pedidas < cambios ? 1 : 0]),
  ) as Cantidades;

  const mismoRecurso = RECURSOS.some((r) => doy[r] > 0 && pido[r] > 0);
  const valido = conBanca
    ? cambios > 0 && pedidas === cambios && !mismoRecurso
    : total(doy) > 0 && total(pido) > 0;
  const pista =
    cambios === 0
      ? 'Elige qué das: cada toque suma un cambio completo.'
      : pedidas < cambios
        ? `Elige ${cambios - pedidas} ${cambios - pedidas === 1 ? 'carta' : 'cartas'} más.`
        : pedidas > cambios
          ? `Pides ${pedidas - cambios} de más: quita ${pedidas - cambios === 1 ? 'una carta' : 'cartas'}.`
          : `${cambios} ${cambios === 1 ? 'cambio' : 'cambios'}: listo para enviar.`;

  const enviar = (): void => {
    if (conBanca) {
      onAccion({
        tipo: 'CAMBIAR_CON_BANCA',
        entrega: soloConCantidad(doy),
        recibe: soloConCantidad(pido),
      });
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
      className="fixed inset-x-0 bottom-2 z-40 mx-auto flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-[33rem] flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-azafran bg-niebla p-3 text-tinta shadow-2xl lg:absolute lg:inset-x-auto lg:right-0 lg:bottom-full lg:z-30 lg:mx-0 lg:mb-3 lg:max-h-none lg:w-[min(33rem,94vw)] lg:overflow-visible"
    >
      <header className="flex items-center gap-2">
        <IconoIntercambio tamano={36} />
        <h2 className="text-lg font-extrabold">Comerciar</h2>
      </header>
      {avisoDeReglas && (
        <output className="block rounded-xl bg-azafran/30 px-3 py-1.5 text-sm font-bold">
          {avisoDeReglas}
        </output>
      )}
      {/* Con quién: todos, un jugador o la banca. Arriba, como la cabecera de las ofertas. */}
      <div className="flex flex-wrap items-center gap-2">
        {!privado && (
          <button
            type="button"
            aria-pressed={destino === 'TODOS'}
            disabled={!puedeTratos}
            onClick={() => elegirDestino('TODOS')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold disabled:opacity-40 ${destino === 'TODOS' ? 'bg-azafran' : 'bg-white'}`}
          >
            <IconoAmigos tamano={22} />
            Todos
          </button>
        )}
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
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold disabled:opacity-40 ${conBanca ? 'bg-azafran' : 'bg-white'}`}
        >
          <IconoBanco tamano={22} />
          Banca
        </button>
      </div>

      {/* Lo que pides (recibes, flecha verde) y lo que das (flecha roja), como en las ofertas. */}
      <FilaDeCartas
        titulo="Pido"
        recibe
        valores={pido}
        limite={conBanca ? limitePidoBanca : null}
        alCambiar={alCambiarPido}
      />
      <FilaDeCartas
        titulo="Doy"
        recibe={false}
        valores={doy}
        limite={conBanca ? limiteDoyBanca : mano}
        {...(conBanca && { razones })}
        alCambiar={alCambiarDoy}
      />
      {conBanca && (
        <p
          className={`text-sm font-bold ${valido ? 'text-[#1f6b3d]' : 'text-tinta-suave'}`}
          data-pista-banca=""
        >
          {pista}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
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
