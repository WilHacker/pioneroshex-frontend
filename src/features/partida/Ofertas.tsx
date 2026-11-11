import { useState, type ReactNode } from 'react';
import { IconoAccion } from '@/components/arte/IconosEstado';
import { IconoAmigos } from '@/components/arte/IconosPortada';
import { colorDeJugador } from '@/lib/colores';
import { RECURSOS, type Cantidades, type Trato, type Vista } from '@/lib/esquemas';
import { CartaRecurso } from './CartaRecurso';
import { Flecha, ROJO, VERDE } from './Flecha';

type Props = {
  vista: Vista;
  nombreDe: (jugadorId: string) => string;
  indiceDe: (jugadorId: string) => number;
  ocupado: boolean;
  onAccion: (accion: object) => void;
};

function Cartas({ cantidades }: { cantidades: Cantidades }) {
  return (
    <span className="flex gap-1 pt-1.5">
      {RECURSOS.filter((r) => cantidades[r] > 0).map((r) => (
        <CartaRecurso key={r} recurso={r} tamano="pequena" cantidad={cantidades[r]} />
      ))}
    </span>
  );
}

type AvatarProps = {
  nombre: string;
  color: string;
  /** Quien ya rechazó la oferta lleva una cruz roja. */
  rechazo?: boolean;
  /** Quien ya dijo que sí lleva un check verde. */
  acepto?: boolean;
  /** El jugador de esta pantalla lleva un aro dorado. */
  esYo?: boolean;
};

/** El círculo de un jugador con su inicial. */
function Avatar({ nombre, color, rechazo = false, acepto = false, esYo = false }: AvatarProps) {
  return (
    <span
      title={nombre}
      className={`relative flex size-9 shrink-0 items-center justify-center rounded-full text-base font-extrabold text-white ring-[3px] ${esYo ? 'ring-azafran' : 'ring-white'}`}
      style={{ backgroundColor: color }}
    >
      <span aria-hidden="true">{nombre.slice(0, 1).toUpperCase()}</span>
      <span className="sr-only">
        {`${nombre}${esYo ? ' (tú)' : ''}${rechazo ? ' rechazó' : ''}${acepto ? ' aceptó' : ''}`}
      </span>
      {rechazo && (
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -bottom-1.5 flex size-4 items-center justify-center rounded-full bg-coral text-white ring-2 ring-white"
        >
          <IconoAccion tipo="RECHAZAR" tamano={10} />
        </span>
      )}
      {acepto && (
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -bottom-1.5 flex size-4 items-center justify-center rounded-full text-white ring-2 ring-white"
          style={{ backgroundColor: VERDE }}
        >
          <IconoAccion tipo="ACEPTAR" tamano={10} />
        </span>
      )}
    </span>
  );
}

type FilaProps = {
  /** Con quién es el intercambio en esta fila: el grupo, un jugador o tú. */
  quien: ReactNode;
  recibe: boolean;
  cantidades: Cantidades;
};

/** Una fila: con quién, si se recibe o se da, y las cartas. */
function Fila({ quien, recibe, cantidades }: FilaProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex w-10 shrink-0 items-center justify-center">{quien}</span>
      <Flecha recibe={recibe} />
      <span className="sr-only">{recibe ? 'recibe' : 'da'}</span>
      <Cartas cantidades={cantidades} />
    </div>
  );
}

type BotonProps = {
  etiqueta: string;
  fondo: string;
  icono: 'ACEPTAR' | 'RECHAZAR';
  disabled: boolean;
  onClick: () => void;
};

function Boton({ etiqueta, fondo, icono, disabled, onClick }: BotonProps) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      title={etiqueta}
      disabled={disabled}
      onClick={onClick}
      style={{ backgroundColor: fondo }}
      className="flex size-11 items-center justify-center rounded-xl text-white shadow ring-2 ring-white enabled:hover:brightness-110 disabled:opacity-40"
    >
      <IconoAccion tipo={icono} tamano={26} />
    </button>
  );
}

function Plegador({ abierta, alAlternar }: { abierta: boolean; alAlternar: () => void }) {
  return (
    <button
      type="button"
      aria-expanded={abierta}
      aria-label={abierta ? 'Plegar la oferta' : 'Desplegar la oferta'}
      title={abierta ? 'Plegar' : 'Desplegar'}
      onClick={alAlternar}
      className="flex size-8 items-center justify-center rounded-full text-tinta hover:bg-black/10"
    >
      <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        <path
          d={abierta ? 'M4 13l6-6 6 6' : 'M4 7l6 6 6-6'}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function Oferta({ trato, vista, nombreDe, indiceDe, ocupado, onAccion }: Props & { trato: Trato }) {
  const [abierta, setAbierta] = useState(true);
  const esMio = trato.proponente === vista.yo;
  const puedeResponder =
    !esMio &&
    vista.yo !== null &&
    (trato.destinatario === null || trato.destinatario === vista.yo) &&
    !trato.rechazadoPor.includes(vista.yo) &&
    !trato.aceptadoPor.includes(vista.yo);
  const yaAcepte = !esMio && vista.yo !== null && trato.aceptadoPor.includes(vista.yo);
  const alAccionar = (tipo: string) => () => onAccion({ tipo, tratoId: trato.id });
  const color = (id: string): string => colorDeJugador(Math.max(0, indiceDe(id)));
  const avatar = (id: string, extra: Partial<AvatarProps> = {}) => (
    <Avatar nombre={nombreDe(id)} color={color(id)} {...extra} />
  );

  // A quién va la oferta: a un jugador o a todos los demás.
  const destinatarios =
    trato.destinatario !== null
      ? [trato.destinatario]
      : vista.jugadores.map((j) => j.id).filter((id) => id !== trato.proponente);
  const aOtro = trato.destinatario !== null && trato.destinatario !== vista.yo;

  // Quien responde ve lo que recibe del proponente y lo que da; el proponente y quien mira desde fuera
  // ven lo que se pide al grupo (o al jugador) y lo que se ofrece.
  const filas =
    puedeResponder || yaAcepte ? (
      <>
        <Fila quien={avatar(trato.proponente)} recibe cantidades={trato.entrega} />
        <Fila quien={avatar(vista.yo!, { esYo: true })} recibe={false} cantidades={trato.pide} />
      </>
    ) : (
      <>
        <Fila
          quien={
            trato.destinatario === null ? (
              <span title="Todos los jugadores" className="text-tinta">
                <IconoAmigos tamano={30} />
                <span className="sr-only">Todos</span>
              </span>
            ) : (
              avatar(trato.destinatario, {
                rechazo: trato.rechazadoPor.includes(trato.destinatario),
              })
            )
          }
          recibe
          cantidades={trato.pide}
        />
        <Fila
          quien={avatar(trato.proponente, { esYo: esMio })}
          recibe={false}
          cantidades={trato.entrega}
        />
      </>
    );

  return (
    <li
      aria-label={`Oferta de ${nombreDe(trato.proponente)}`}
      className="flex w-[min(25rem,94vw)] flex-col gap-2 rounded-2xl border-2 border-azafran bg-niebla px-3 py-2 text-tinta shadow-xl"
    >
      <div className="flex items-center gap-2">
        <span className="flex grow flex-wrap items-center justify-center gap-2">
          {destinatarios.map((id) => (
            <span key={id}>
              {avatar(id, {
                rechazo: trato.rechazadoPor.includes(id),
                acepto: trato.aceptadoPor.includes(id),
                esYo: id === vista.yo,
              })}
            </span>
          ))}
          {aOtro && (
            <span className="text-xs font-bold text-tinta-suave">
              para {nombreDe(trato.destinatario!)}
            </span>
          )}
        </span>
        <Plegador abierta={abierta} alAlternar={() => setAbierta((a) => !a)} />
      </div>
      {abierta && (
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 grow flex-col gap-1">{filas}</div>
          <div className="flex shrink-0 gap-2">
            {puedeResponder && (
              <>
                <Boton
                  etiqueta="Aceptar"
                  fondo={VERDE}
                  icono="ACEPTAR"
                  disabled={ocupado}
                  onClick={alAccionar('ACEPTAR_TRATO')}
                />
                <Boton
                  etiqueta="Rechazar"
                  fondo={ROJO}
                  icono="RECHAZAR"
                  disabled={ocupado}
                  onClick={alAccionar('RECHAZAR_TRATO')}
                />
              </>
            )}
            {esMio && (
              <Boton
                etiqueta="Cancelar"
                fondo={color(trato.proponente)}
                icono="RECHAZAR"
                disabled={ocupado}
                onClick={alAccionar('CANCELAR_TRATO')}
              />
            )}
          </div>
        </div>
      )}
      {abierta && yaAcepte && (
        <p className="text-sm font-bold text-[#1f6b3d]">
          Aceptaste. Esperando a que {nombreDe(trato.proponente)} cierre el trato.
        </p>
      )}
      {abierta && esMio && trato.aceptadoPor.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-black/15 pt-2">
          <p className="text-sm font-extrabold">
            {trato.aceptadoPor.length === 1
              ? 'Aceptó: ciérralo con el check'
              : 'Aceptaron varios: elige con quién cerrar'}
          </p>
          <ul aria-label="Quienes aceptaron" className="flex flex-wrap gap-2">
            {trato.aceptadoPor.map((id) => (
              <li
                key={id}
                className="flex items-center gap-2 rounded-full bg-white py-1 pr-1 pl-1.5"
              >
                {avatar(id, { acepto: true })}
                <span aria-hidden="true" className="text-sm font-bold">
                  {nombreDe(id)}
                </span>
                <button
                  type="button"
                  aria-label={`Cerrar el trato con ${nombreDe(id)}`}
                  title={`Cerrar el trato con ${nombreDe(id)}`}
                  disabled={ocupado}
                  onClick={() => onAccion({ tipo: 'CONFIRMAR_TRATO', tratoId: trato.id, con: id })}
                  style={{ backgroundColor: VERDE }}
                  className="flex size-9 items-center justify-center rounded-full text-white shadow enabled:hover:brightness-110 disabled:opacity-40"
                >
                  <IconoAccion tipo="ACEPTAR" tamano={22} />
                </button>
              </li>
            ))}
          </ul>
        </div>
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
