import { IconoEstrella } from '@/components/arte/IconosEstado';
import type { Estadisticas as DatosDeEstadisticas } from '@/lib/cuentas';

type Props = { datos: DatosDeEstadisticas };

function Dato({ valor, etiqueta }: { valor: string | number; etiqueta: string }) {
  return (
    <li className="flex flex-1 flex-col items-center rounded-2xl bg-white/70 px-3 py-3">
      <span className="text-3xl font-extrabold">{valor}</span>
      <span className="text-sm font-bold text-tinta/70">{etiqueta}</span>
    </li>
  );
}

const formatoFecha = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });

/** Partidas, victorias y promedio, y las últimas partidas con su resultado en palabras. */
export function Estadisticas({ datos }: Props) {
  if (datos.partidas === 0) {
    return (
      <p className="rounded-2xl bg-white/70 px-4 py-5 text-center font-bold text-tinta/70">
        Todavía no has terminado ninguna partida con tu cuenta.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <ul aria-label="Resumen" className="flex gap-2">
        <Dato valor={datos.partidas} etiqueta="Partidas" />
        <Dato valor={datos.victorias} etiqueta="Victorias" />
        <Dato valor={datos.promedioPuntos.toLocaleString('es')} etiqueta="Puntos de media" />
      </ul>
      <ul aria-label="Últimas partidas" className="flex flex-col gap-1.5">
        {datos.ultimas.map((p) => (
          <li
            key={p.partidaId}
            className="flex items-center justify-between gap-3 rounded-xl bg-white/60 px-3 py-2"
          >
            <span className="flex items-center gap-2 font-extrabold">
              {p.gano && (
                <span className="text-azafran">
                  <IconoEstrella tamano={20} />
                </span>
              )}
              {p.gano ? 'Ganaste' : `Ganó ${p.ganador}`}
            </span>
            <span className="text-sm font-bold text-tinta/70">
              {p.puntos} puntos · {p.jugadores} jugadores ·{' '}
              {formatoFecha.format(new Date(p.terminadaEn))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
