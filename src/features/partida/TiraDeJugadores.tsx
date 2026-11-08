import Image from 'next/image';
import { IconoCartaMano, IconoEstrella } from '@/components/arte/IconosEstado';
import { colorDeJugador } from '@/lib/colores';
import type { Presencia, Vista } from '@/lib/esquemas';
import { estadoDePresencia, ETIQUETA_DE_PRESENCIA } from './presencia';

type Props = {
  vista: Vista;
  nombreDe: (jugadorId: string) => string;
  indiceDe: (jugadorId: string) => number;
  presencia?: Presencia | null;
};

/**
 * Los jugadores en una fila que se desliza, para pantallas pequeñas: cada uno es su inicial con su
 * color, sus puntos y sus cartas. El de turno lleva un aro azafrán. En pantallas grandes se usa la
 * lista completa de `Jugadores`.
 */
export function TiraDeJugadores({ vista, nombreDe, indiceDe, presencia = null }: Props) {
  const turno = vista.fase === 'CONSTRUCCION_ESPECIAL' ? vista.turnoEspecialDe : vista.turnoDe;

  return (
    <ul
      aria-label="Resumen de jugadores"
      className="relative -mx-3 flex shrink-0 [scrollbar-width:none] gap-1.5 overflow-x-auto px-3 pb-1 lg:hidden"
    >
      {vista.jugadores.map((j) => {
        const enTurno = j.id === turno;
        const soyYo = j.id === vista.yo;
        const ausencia = estadoDePresencia(presencia, j.id, vista.yo);
        return (
          <li
            key={j.id}
            data-jugador-id={j.id}
            data-en-turno={enTurno ? 'true' : undefined}
            data-presencia={ausencia ?? undefined}
            aria-current={enTurno ? 'true' : undefined}
            title={nombreDe(j.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 text-tinta shadow ${enTurno ? 'bg-azafran-claro ring-2 ring-azafran' : 'bg-niebla'}`}
          >
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-full text-base font-extrabold text-white"
              style={{ backgroundColor: colorDeJugador(indiceDe(j.id)) }}
            >
              {nombreDe(j.id).charAt(0).toUpperCase()}
            </span>
            <span className="sr-only">
              {nombreDe(j.id)}
              {soyYo ? ' (tú)' : ''}
              {enTurno ? ' · en turno' : ''}
              {ausencia ? ` · ${ETIQUETA_DE_PRESENCIA[ausencia].texto}` : ''}
            </span>
            {ausencia && (
              <span
                aria-hidden="true"
                title={ETIQUETA_DE_PRESENCIA[ausencia].ayuda}
                className={`size-2.5 rounded-full ${ausencia === 'piloto' ? 'bg-azafran' : 'bg-tinta/60'}`}
              />
            )}
            <span className="flex items-center gap-0.5 text-sm font-extrabold" title="Puntos">
              <IconoEstrella tamano={16} />
              {j.puntos}
              <span className="sr-only"> puntos</span>
            </span>
            <span className="flex items-center gap-0.5 text-sm font-bold" title="Cartas">
              <IconoCartaMano tamano={16} />
              {j.totalCartas}
              <span className="sr-only"> cartas</span>
            </span>
            {vista.granEjercito === j.id && (
              <span
                title="Gran ejército"
                className="flex items-center rounded-full bg-azafran px-1 py-0.5"
              >
                <Image
                  src="/insignias/gran-ejercito.svg"
                  alt=""
                  width={14}
                  height={14}
                  unoptimized
                  className="object-contain"
                />
                <span className="sr-only">Gran ejército</span>
              </span>
            )}
            {vista.granRuta === j.id && (
              <span
                title="Gran ruta"
                className="flex items-center rounded-full bg-azafran px-1 py-0.5"
              >
                <Image
                  src="/insignias/gran-ruta.svg"
                  alt=""
                  width={14}
                  height={14}
                  unoptimized
                  className="object-contain"
                />
                <span className="sr-only">Gran ruta</span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
