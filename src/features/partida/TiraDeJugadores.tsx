import { IconoCartaMano, IconoEstrella } from '@/components/arte/IconosEstado';
import { colorDeJugador } from '@/lib/colores';
import type { Vista } from '@/lib/esquemas';

type Props = {
  vista: Vista;
  nombreDe: (jugadorId: string) => string;
  indiceDe: (jugadorId: string) => number;
};

/**
 * Los jugadores en una fila que se desliza, para pantallas pequeñas: cada uno es su inicial con su
 * color, sus puntos y sus cartas. El de turno lleva un aro azafrán. En pantallas grandes se usa la
 * lista completa de `Jugadores`.
 */
export function TiraDeJugadores({ vista, nombreDe, indiceDe }: Props) {
  const turno = vista.fase === 'CONSTRUCCION_ESPECIAL' ? vista.turnoEspecialDe : vista.turnoDe;

  return (
    <ul
      aria-label="Resumen de jugadores"
      className="-mx-3 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-3 pb-1 lg:hidden"
    >
      {vista.jugadores.map((j) => {
        const enTurno = j.id === turno;
        const soyYo = j.id === vista.yo;
        return (
          <li
            key={j.id}
            aria-current={enTurno ? 'true' : undefined}
            title={nombreDe(j.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full bg-niebla py-1 pr-2.5 pl-1 text-tinta shadow ${enTurno ? 'ring-2 ring-azafran' : ''}`}
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
            </span>
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
          </li>
        );
      })}
    </ul>
  );
}
