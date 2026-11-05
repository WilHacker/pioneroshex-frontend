import type { Vista } from '@/lib/esquemas';
import { colorDeJugador } from './colores';

type Props = {
  vista: Vista;
  nombreDe: (jugadorId: string) => string;
  indiceDe: (jugadorId: string) => number;
};

export function PanelJugadores({ vista, nombreDe, indiceDe }: Props) {
  return (
    <section
      aria-labelledby="titulo-jugadores"
      className="rounded-lg border border-zinc-300 p-3 dark:border-zinc-700"
    >
      <h2 id="titulo-jugadores" className="mb-2 text-sm font-semibold tracking-wide uppercase">
        Jugadores
      </h2>
      <ul className="flex flex-col gap-1.5">
        {vista.jugadores.map((j) => {
          const enTurno =
            j.id ===
            (vista.fase === 'CONSTRUCCION_ESPECIAL' ? vista.turnoEspecialDe : vista.turnoDe);
          return (
            <li
              key={j.id}
              aria-current={enTurno ? 'true' : undefined}
              className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${enTurno ? 'bg-yellow-100 font-semibold text-zinc-900' : ''}`}
            >
              <span
                aria-hidden="true"
                className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: colorDeJugador(indiceDe(j.id)) }}
              >
                {indiceDe(j.id) + 1}
              </span>
              <span className="grow truncate">
                {nombreDe(j.id)}
                {j.id === vista.yo ? ' (tú)' : ''}
                {enTurno ? ' · en turno' : ''}
              </span>
              <span title="Puntos de victoria">{j.puntos} pts</span>
              <span title="Cartas de recursos en mano">🂠 {j.totalCartas}</span>
              {vista.granEjercito === j.id && <span title="Gran ejército">⚔</span>}
              {vista.granRuta === j.id && <span title="Gran ruta">🛣</span>}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-zinc-500">
        Mazo: {vista.tamanoMazo} cartas · Gana quien llegue a {vista.config.puntosVictoria} puntos
      </p>
    </section>
  );
}
