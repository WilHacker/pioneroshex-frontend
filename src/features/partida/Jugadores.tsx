import Image from 'next/image';
import type { ReactNode } from 'react';
import {
  IconoCaballero,
  IconoCartaMano,
  IconoEstrella,
  IconoRuta,
} from '@/components/arte/IconosEstado';
import { IconoPieza } from '@/components/arte/IconoPieza';
import type { JugadorVista, Vista } from '@/lib/esquemas';
import { colorDeJugador } from '@/lib/colores';

type Props = {
  vista: Vista;
  nombreDe: (jugadorId: string) => string;
  indiceDe: (jugadorId: string) => number;
};

type DatoProps = { icono: ReactNode; valor: number; titulo: string };

/** Un número con su icono. El texto completo va en el título y para lectores de pantalla. */
function Dato({ icono, valor, titulo }: DatoProps) {
  return (
    <span className="flex items-center gap-0.5" title={titulo}>
      {icono}
      <span className="text-sm font-extrabold">{valor}</span>
      <span className="sr-only">{titulo}</span>
    </span>
  );
}

type AvatarProps = { nombre: string; color: string; grande?: boolean; enTurno: boolean };

/** El círculo del jugador con su inicial; un aro azafrán marca de quién es el turno. */
function Avatar({ nombre, color, grande = false, enTurno }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-extrabold text-white ring-4 ${grande ? 'size-14 text-2xl' : 'size-10 text-lg'} ${enTurno ? 'ring-azafran' : 'ring-white'}`}
      style={{ backgroundColor: color }}
    >
      {nombre.slice(0, 1).toUpperCase()}
    </span>
  );
}

function Puntos({ valor, grande = false }: { valor: number; grande?: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center gap-1 rounded-full bg-tinta font-extrabold text-white ${grande ? 'px-3 py-1 text-2xl' : 'px-2 py-0.5 text-base'}`}
      title="Puntos de victoria"
    >
      <IconoEstrella tamano={grande ? 24 : 16} />
      {valor}
      <span className="sr-only">puntos</span>
    </span>
  );
}

function Estadisticas({ jugador, vista }: { jugador: JugadorVista; vista: Vista }) {
  return (
    <div className="flex items-center gap-2.5 text-tinta">
      <Dato
        icono={<IconoCartaMano tamano={20} />}
        valor={jugador.totalCartas}
        titulo="cartas en mano"
      />
      <Dato
        icono={<IconoPieza pieza="CARTA" color="#e0a82e" tamano={20} />}
        valor={jugador.totalCartasDesarrollo}
        titulo="cartas de desarrollo"
      />
      <Dato
        icono={<IconoCaballero tamano={20} />}
        valor={jugador.caballerosJugados}
        titulo="caballeros jugados"
      />
      {vista.granEjercito === jugador.id && (
        <span
          title="Gran ejército"
          className="flex items-center gap-1 rounded-full bg-azafran px-2 py-0.5"
        >
          <Image
            src="/insignias/gran-ejercito.svg"
            alt=""
            width={18}
            height={18}
            unoptimized
            className="object-contain"
          />
          <IconoCaballero tamano={18} etiqueta="Gran ejército" />
        </span>
      )}
      {vista.granRuta === jugador.id && (
        <span
          title="Gran ruta"
          className="flex items-center gap-1 rounded-full bg-azafran px-2 py-0.5"
        >
          <Image
            src="/insignias/gran-ruta.svg"
            alt=""
            width={18}
            height={18}
            unoptimized
            className="object-contain"
          />
          <IconoRuta tamano={18} etiqueta="Gran ruta" />
        </span>
      )}
    </div>
  );
}

/** Quién juega: tú primero y más grande, luego los rivales en orden de turno. */
export function Jugadores({ vista, nombreDe, indiceDe }: Props) {
  const turno = vista.fase === 'CONSTRUCCION_ESPECIAL' ? vista.turnoEspecialDe : vista.turnoDe;
  const mio = vista.jugadores.find((j) => j.id === vista.yo);
  const rivales = vista.jugadores.filter((j) => j.id !== vista.yo);

  return (
    <section aria-label="Jugadores" className="flex flex-col gap-2">
      {mio && (
        <article
          aria-current={mio.id === turno ? 'true' : undefined}
          className={`flex items-center gap-3 rounded-2xl border-2 bg-niebla p-3 text-tinta shadow-lg ${mio.id === turno ? 'border-azafran' : 'border-borde'}`}
        >
          <Avatar
            nombre={nombreDe(mio.id)}
            color={colorDeJugador(indiceDe(mio.id))}
            grande
            enTurno={mio.id === turno}
          />
          <div className="min-w-0 grow">
            <p className="truncate text-lg font-extrabold">
              {nombreDe(mio.id)} <span className="font-medium text-tinta-suave">(tú)</span>
            </p>
            <Estadisticas jugador={mio} vista={vista} />
          </div>
          <Puntos valor={mio.puntos} grande />
          {mio.id === turno && <span className="sr-only">tu turno</span>}
        </article>
      )}

      <ul className="flex flex-col gap-1.5">
        {rivales.map((j) => {
          const enTurno = j.id === turno;
          return (
            <li
              key={j.id}
              aria-current={enTurno ? 'true' : undefined}
              className={`flex items-center gap-2.5 rounded-xl border bg-niebla/95 px-2.5 py-2 ${enTurno ? 'border-azafran ring-2 ring-azafran' : 'border-borde'}`}
            >
              <Avatar
                nombre={nombreDe(j.id)}
                color={colorDeJugador(indiceDe(j.id))}
                enTurno={enTurno}
              />
              <div className="min-w-0 grow">
                <p className="truncate text-sm font-bold text-tinta">
                  {nombreDe(j.id)}
                  {enTurno && <span className="sr-only"> · en turno</span>}
                </p>
                <Estadisticas jugador={j} vista={vista} />
              </div>
              <Puntos valor={j.puntos} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
