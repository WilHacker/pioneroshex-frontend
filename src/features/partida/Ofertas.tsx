import { IconoAccion } from '@/components/arte/IconosEstado';
import { RECURSOS, type Cantidades, type Trato, type Vista } from '@/lib/esquemas';
import { CartaRecurso } from './CartaRecurso';
import { colorDeJugador } from '@/lib/colores';

type Props = {
  vista: Vista;
  nombreDe: (jugadorId: string) => string;
  indiceDe: (jugadorId: string) => number;
  ocupado: boolean;
  onAccion: (accion: object) => void;
};

function Cartas({ cantidades }: { cantidades: Cantidades }) {
  return (
    <span className="flex gap-1">
      {RECURSOS.filter((r) => cantidades[r] > 0).map((r) => (
        <CartaRecurso key={r} recurso={r} tamano="pequena" cantidad={cantidades[r]} />
      ))}
    </span>
  );
}

type BotonProps = {
  etiqueta: string;
  clases: string;
  icono: 'ACEPTAR' | 'RECHAZAR';
  disabled: boolean;
  onClick: () => void;
};

function Boton({ etiqueta, clases, icono, disabled, onClick }: BotonProps) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      title={etiqueta}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-10 items-center justify-center rounded-full text-white enabled:hover:brightness-110 disabled:opacity-40 ${clases}`}
    >
      <IconoAccion tipo={icono} />
    </button>
  );
}

type FilaProps = Props & { trato: Trato };

function Oferta({ trato, vista, nombreDe, indiceDe, ocupado, onAccion }: FilaProps) {
  const esMio = trato.proponente === vista.yo;
  const puedeResponder =
    !esMio &&
    vista.yo !== null &&
    (trato.destinatario === null || trato.destinatario === vista.yo) &&
    !trato.rechazadoPor.includes(vista.yo);
  const alAccionar = (tipo: string) => () => onAccion({ tipo, tratoId: trato.id });

  return (
    <li
      aria-label={`Oferta de ${nombreDe(trato.proponente)}`}
      className="flex items-center gap-3 rounded-2xl border-2 border-azafran bg-niebla px-3 py-2 text-tinta shadow-xl"
    >
      <span
        aria-hidden="true"
        title={nombreDe(trato.proponente)}
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white ring-4 ring-white"
        style={{ backgroundColor: colorDeJugador(indiceDe(trato.proponente)) }}
      >
        {nombreDe(trato.proponente).slice(0, 1).toUpperCase()}
      </span>
      <Cartas cantidades={trato.entrega} />
      <IconoAccion tipo="INTERCAMBIO" />
      <Cartas cantidades={trato.pide} />
      {trato.destinatario !== null && trato.destinatario !== vista.yo && (
        <span className="text-xs font-bold text-tinta-suave">
          para {nombreDe(trato.destinatario)}
        </span>
      )}
      <span className="grow" />
      {puedeResponder && (
        <>
          <Boton
            etiqueta="Aceptar"
            clases="bg-hoja"
            icono="ACEPTAR"
            disabled={ocupado}
            onClick={alAccionar('ACEPTAR_TRATO')}
          />
          <Boton
            etiqueta="Rechazar"
            clases="bg-coral"
            icono="RECHAZAR"
            disabled={ocupado}
            onClick={alAccionar('RECHAZAR_TRATO')}
          />
        </>
      )}
      {esMio && (
        <Boton
          etiqueta="Cancelar"
          clases="bg-tinta-suave"
          icono="RECHAZAR"
          disabled={ocupado}
          onClick={alAccionar('CANCELAR_TRATO')}
        />
      )}
    </li>
  );
}

/** Las ofertas de comercio abiertas, flotando sobre el tablero con sus cartas. */
export function Ofertas(props: Props) {
  if (props.vista.tratos.length === 0) return null;
  return (
    <ul aria-label="Ofertas de comercio" className="flex flex-col items-center gap-2">
      {props.vista.tratos.map((t) => (
        <Oferta key={t.id} trato={t} {...props} />
      ))}
    </ul>
  );
}
