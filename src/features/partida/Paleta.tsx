import { IconoPieza, type TipoPieza } from '@/components/arte/IconoPieza';
import { IconoAccion } from '@/components/arte/IconosEstado';
import { IconoIntercambio } from '@/components/arte/IconoIntercambio';
import { COSTOS } from '@/lib/costos';
import { RECURSOS, type AccionDisponible, type Vista } from '@/lib/esquemas';
import { textoDeMotivo } from '@/lib/mensajes';
import { CartaRecurso } from './CartaRecurso';
import type { Modo } from './logica';

type Props = {
  vista: Vista;
  acciones: readonly AccionDisponible[];
  modo: Modo | null;
  ocupado: boolean;
  /** Color del jugador, para pintar sus piezas. */
  color: string;
  /** El panel de comercio está abierto. */
  comercioAbierto: boolean;
  onModo: (modo: Modo | null) => void;
  onAccion: (accion: object) => void;
  onComercio: () => void;
};

interface Elemento {
  readonly pieza: TipoPieza;
  readonly etiqueta: string;
  readonly tipo: string;
  readonly modo: Modo | null;
}

const ELEMENTOS: readonly Elemento[] = [
  { pieza: 'CAMINO', etiqueta: 'Camino', tipo: 'CONSTRUIR_CAMINO', modo: 'CAMINO' },
  { pieza: 'POBLADO', etiqueta: 'Poblado', tipo: 'CONSTRUIR_POBLADO', modo: 'POBLADO' },
  { pieza: 'CIUDAD', etiqueta: 'Ciudad', tipo: 'CONSTRUIR_CIUDAD', modo: 'CIUDAD' },
  { pieza: 'CARTA', etiqueta: 'Carta de desarrollo', tipo: 'COMPRAR_CARTA_DESARROLLO', modo: null },
];

const BOTON =
  'relative flex size-10 min-[340px]:size-11 min-[360px]:size-12 items-center justify-center rounded-2xl border-[3px] shadow-md ring-2 ring-[#101c28] sm:size-16 apaisado:size-11 transition enabled:hover:-translate-y-1 disabled:opacity-45';

/** Los botones son celestes con borde blanco; el modo elegido se pone azafrán. */
const CELESTE = 'border-white bg-gradient-to-b from-[#9bdcf2] to-[#4fb0d6]';
const AZAFRAN = 'border-azafran bg-gradient-to-b from-azafran-claro to-azafran';

function Costo({ pieza }: { pieza: TipoPieza }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 items-center gap-2.5 rounded-xl border-[3px] border-[#101c28] bg-[#f5efe0] px-3 pt-3 pb-2 shadow-lg group-focus-within:flex group-hover:flex"
    >
      {RECURSOS.filter((r) => (COSTOS[pieza][r] ?? 0) > 0).map((r) => (
        <CartaRecurso
          key={r}
          recurso={r}
          tamano="pequena"
          cantidad={(COSTOS[pieza][r] ?? 0) > 1 ? COSTOS[pieza][r] : undefined}
        />
      ))}
    </span>
  );
}

/** Las piezas que se pueden construir, con lo que cuestan y cuántas quedan en la reserva. */
export function Paleta({
  vista,
  acciones,
  modo,
  ocupado,
  color,
  comercioAbierto,
  onModo,
  onAccion,
  onComercio,
}: Props) {
  const yo = vista.jugadores.find((j) => j.id === vista.yo);
  const restantes: Record<TipoPieza, number | null> = {
    CAMINO: yo?.piezasRestantes.caminos ?? 0,
    POBLADO: yo?.piezasRestantes.poblados ?? 0,
    CIUDAD: yo?.piezasRestantes.ciudades ?? 0,
    CARTA: vista.tamanoMazo,
  };
  const accionDe = (tipo: string): AccionDisponible | undefined =>
    acciones.find((a) => a.tipo === tipo);
  const puedeComerciar =
    accionDe('PROPONER_TRATO')?.disponible === true ||
    accionDe('CAMBIAR_CON_BANCA')?.disponible === true;
  const terminar = accionDe('TERMINAR_TURNO');

  return (
    <div className="flex flex-wrap items-end gap-1.5 sm:gap-2">
      <button
        type="button"
        aria-label="Comerciar"
        title="Comerciar"
        aria-pressed={comercioAbierto}
        disabled={!puedeComerciar && !comercioAbierto}
        onClick={onComercio}
        className={`${BOTON} ${comercioAbierto ? AZAFRAN : CELESTE} text-tinta`}
      >
        <IconoIntercambio tamano={42} />
      </button>

      {ELEMENTOS.map((e) => {
        const accion = accionDe(e.tipo);
        const habilitado = accion?.disponible === true && !ocupado;
        const activo = e.modo !== null && modo === e.modo;
        const alPulsar = (): void => {
          if (e.modo === null) onAccion({ tipo: e.tipo });
          else onModo(activo ? null : e.modo);
        };
        return (
          <div key={e.pieza} className="group relative">
            <Costo pieza={e.pieza} />
            <button
              type="button"
              disabled={!habilitado}
              aria-pressed={e.modo === null ? undefined : activo}
              title={
                !accion?.disponible && accion?.motivo ? textoDeMotivo(accion.motivo) : e.etiqueta
              }
              onClick={alPulsar}
              className={`${BOTON} ${activo ? AZAFRAN : CELESTE}`}
            >
              <IconoPieza
                pieza={e.pieza}
                color={e.pieza === 'CARTA' ? '#2f6fe0' : color}
                tamano={38}
              />
              {restantes[e.pieza] !== null && (
                <span className="absolute -top-2 -right-2 flex min-w-6 items-center justify-center rounded-full bg-tinta px-1 text-[0.7rem] font-extrabold text-white ring-2 ring-white">
                  {restantes[e.pieza]}
                </span>
              )}
            </button>
          </div>
        );
      })}

      <div className="ml-1 flex items-end gap-1.5 sm:ml-2 sm:gap-2">
        {accionDe('PASAR_CONSTRUCCION_ESPECIAL')?.disponible === true && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => onAccion({ tipo: 'PASAR_CONSTRUCCION_ESPECIAL' })}
            className="rounded-xl border border-white/40 px-3 py-2 text-sm font-bold text-white hover:bg-white/15"
          >
            Pasar
          </button>
        )}
        <button
          type="button"
          aria-label="Terminar turno"
          disabled={terminar?.disponible !== true || ocupado}
          title={
            terminar?.disponible
              ? 'Terminar turno'
              : textoDeMotivo(terminar?.motivo ?? 'NO_ES_TU_TURNO')
          }
          onClick={() => onAccion({ tipo: 'TERMINAR_TURNO' })}
          className="flex size-11 items-center justify-center rounded-2xl bg-azafran text-tinta shadow-md transition enabled:hover:-translate-y-1 enabled:hover:bg-azafran-claro disabled:opacity-40 min-[360px]:size-12 sm:size-16 apaisado:size-11"
        >
          <IconoAccion tipo="ESPERA" tamano={32} />
        </button>
      </div>
    </div>
  );
}
