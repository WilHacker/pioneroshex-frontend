import { COLOR_RECURSO, IconoRecurso } from '@/components/arte/IconoRecurso';
import type { Recurso } from '@/lib/esquemas';
import { NOMBRE_RECURSO } from '@/lib/mensajes';

type Props = {
  recurso: Recurso;
  /** El número de la esquina; sin él, la carta no lleva contador. */
  cantidad?: number;
  tamano?: 'normal' | 'pequena';
  /** Resaltada, por ejemplo la carta elegida para un cambio. */
  elegida?: boolean;
  desactivada?: boolean;
  /** Si hay, la carta es un botón que se toca. */
  onClick?: () => void;
  /** Lo que lee un lector de pantalla; por defecto, la cantidad y el nombre. */
  etiqueta?: string;
  /** Giro en grados, para abanicar varias cartas. */
  giro?: number;
};

const TAMANOS = {
  normal: { caja: 'h-[4.6rem] w-[3.3rem]', icono: 34 },
  pequena: { caja: 'h-[3.1rem] w-[2.3rem]', icono: 24 },
};

/** Una carta de recurso: se usa en la mano, en el comercio y en el descarte. */
export function CartaRecurso({
  recurso,
  cantidad,
  tamano = 'normal',
  elegida = false,
  desactivada = false,
  onClick,
  etiqueta,
  giro = 0,
}: Props) {
  const { caja, icono } = TAMANOS[tamano];
  const color = COLOR_RECURSO[recurso];
  const nombre =
    etiqueta ?? `${cantidad === undefined ? '' : `${cantidad} de `}${NOMBRE_RECURSO[recurso]}`;
  const clases = `relative flex ${caja} shrink-0 flex-col items-center justify-center rounded-xl border-2 shadow-md transition ${elegida ? 'ring-4 ring-azafran' : ''} ${desactivada ? 'opacity-40' : ''} ${onClick && !desactivada ? 'cursor-pointer hover:-translate-y-1' : ''}`;
  const estilo = {
    backgroundColor: color.fondo,
    borderColor: color.borde,
    transform: giro === 0 ? undefined : `rotate(${giro}deg)`,
  };
  const contenido = (
    <>
      <IconoRecurso recurso={recurso} tamano={icono} />
      {cantidad !== undefined && (
        <span className="absolute -top-2 -right-2 flex min-w-6 items-center justify-center rounded-full bg-tinta px-1 text-xs font-extrabold text-white ring-2 ring-white">
          {cantidad}
        </span>
      )}
    </>
  );

  if (!onClick) {
    return (
      <div role="img" aria-label={nombre} className={clases} style={estilo}>
        {contenido}
      </div>
    );
  }
  return (
    <button
      type="button"
      aria-label={nombre}
      disabled={desactivada}
      onClick={onClick}
      className={clases}
      style={estilo}
    >
      {contenido}
    </button>
  );
}
