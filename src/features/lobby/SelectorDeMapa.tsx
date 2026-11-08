import Image from 'next/image';
import { Ayuda } from '@/components/Ayuda';
import type { InfoDeMapa } from '@/lib/esquemas';
import { aptitudDeMapa, contornoDeForma, type Aptitud } from '@/lib/mapas';
import { AYUDAS } from './ayudas';

const TEXTO_APTITUD: Record<Aptitud, string> = {
  RECOMENDADO: 'Recomendado',
  JUSTO: 'Justo',
  NO: 'No cabe',
};

const CLASE_APTITUD: Record<Aptitud, string> = {
  RECOMENDADO: 'bg-mar-laguna/15 text-mar-laguna',
  JUSTO: 'bg-azafran/30 text-tinta',
  NO: 'bg-coral/15 text-coral',
};

const CARTA =
  'flex w-36 shrink-0 flex-col gap-1.5 rounded-2xl border-2 p-2 text-left transition enabled:hover:-translate-y-0.5 disabled:cursor-default';

function claseDeCarta(elegida: boolean, deshabilitada: boolean): string {
  if (elegida) return `${CARTA} border-azafran bg-azafran/20 shadow`;
  return `${CARTA} border-tinta/15 bg-white/60 ${deshabilitada ? 'opacity-60' : ''}`;
}

/** La forma del mapa sobre el mar: imagen oficial con contorno SVG como base y respaldo. */
function VistaPrevia({ id, forma }: { id: string; forma: InfoDeMapa['forma'] }) {
  const { poligonos, viewBox } = contornoDeForma(forma);
  return (
    <div className="relative h-20 w-full overflow-hidden rounded-xl bg-mar-profundo/20">
      <svg viewBox={viewBox} aria-hidden="true" className="mar h-full w-full">
        {poligonos.map((puntos) => (
          <polygon
            key={puntos}
            points={puntos}
            fill="#cfe3a3"
            stroke="#6e9a52"
            strokeWidth="0.08"
          />
        ))}
      </svg>
      <Image
        src={`/mapas/${id}.png`}
        alt=""
        fill
        sizes="144px"
        className="object-contain p-1 drop-shadow"
      />
    </div>
  );
}

type Props = {
  mapas: readonly InfoDeMapa[];
  /** El id del mapa elegido, o `null` para el automático. */
  elegido: string | null;
  /** Cuántos hay en la sala ahora: de ahí sale si el mapa «cabe». */
  jugadores: number;
  /** Solo el anfitrión, y solo antes de empezar. */
  editable: boolean;
  onElegir: (id: string | null) => void;
};

/**
 * Las formas de mapa como cartas con vista previa. El aviso («Recomendado», «Justo», «No cabe»)
 * va siempre en texto: el color solo acompaña. Un mapa en el que no caben los jugadores de la
 * sala no se puede elegir; el servidor lo comprueba también.
 */
export function SelectorDeMapa({ mapas, elegido, jugadores, editable, onElegir }: Props) {
  return (
    // `min-w-0`: un <fieldset> se ensancha por defecto hasta el ancho de su contenido y la fila de
    // cartas se saldría del panel en vez de desplazarse dentro de él.
    <fieldset aria-label="Mapa" className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 flex items-center gap-1.5 text-sm font-extrabold">
        Mapa
        <Ayuda tema="Mapa">{AYUDAS.mapa}</Ayuda>
      </legend>
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          aria-pressed={elegido === null}
          disabled={!editable}
          onClick={() => onElegir(null)}
          className={claseDeCarta(elegido === null, !editable)}
        >
          <span className="mar flex h-20 w-full items-center justify-center rounded-xl text-3xl font-extrabold text-white">
            ?
          </span>
          <span className="font-extrabold">Automático</span>
          <span className="text-xs text-tinta/70">El hexágono que toca según los jugadores</span>
        </button>
        {mapas.map((m) => {
          const aptitud = aptitudDeMapa(m, jugadores);
          const noCabe = aptitud === 'NO';
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={elegido === m.id}
              disabled={!editable || noCabe}
              title={noCabe ? `Admite hasta ${m.maximoTecnico} jugadores` : m.descripcion}
              onClick={() => onElegir(m.id)}
              className={claseDeCarta(elegido === m.id, !editable || noCabe)}
            >
              <VistaPrevia id={m.id} forma={m.forma} />
              <span className="font-extrabold">{m.nombre}</span>
              <span className="text-xs text-tinta/70">
                {m.casillas} casillas · {m.minimoRecomendado}–{m.maximoRecomendado} jugadores
              </span>
              <span
                className={`self-start rounded-full px-2 py-0.5 text-xs font-extrabold ${CLASE_APTITUD[aptitud]}`}
              >
                {TEXTO_APTITUD[aptitud]}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
