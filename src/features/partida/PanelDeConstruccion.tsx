import { IconoPieza } from '@/components/arte/IconoPieza';
import { costoDe, faltaPara, textoDeFalta } from '@/lib/costos';
import type { Cantidades } from '@/lib/esquemas';
import { NOMBRE_RECURSO } from '@/lib/mensajes';
import { CartaRecurso } from './CartaRecurso';
import { TEXTO_DE_SITIO } from './logica';
import type { SitioRapido } from './Tablero';

type Props = {
  sitio: SitioRapido;
  /** Mi mano, para ver si alcanza; `null` si no la conozco. */
  mano: Cantidades | null;
  /** Color del jugador, para dibujar la pieza. */
  color: string;
};

/** Verde y rojo oscuros: con contraste suficiente para texto sobre el fondo crema. */
const TEXTO_BIEN = 'text-[#1f6b3d]';
const TEXTO_FALTA = 'text-[#b3361a]';

/**
 * Lo que cuesta construir en un sitio del mapa y si alcanza con tu mano. Es solo un cartel: no se
 * pulsa; la confirmación es la marca verde sobre el propio mapa.
 */
export function PanelDeConstruccion({ sitio, mano, color }: Props) {
  const { titulo } = TEXTO_DE_SITIO[sitio.tipo];
  const falta = faltaPara(mano, sitio.tipo);
  const alcanza = Object.keys(falta).length === 0;

  return (
    <section
      aria-label={titulo}
      className="flex flex-col items-center gap-2 rounded-xl border-[3px] border-[#101c28] bg-[#f5efe0] px-4 py-3 text-tinta shadow-lg"
    >
      <h2 className="flex items-center gap-2 text-base font-extrabold">
        <IconoPieza pieza={sitio.tipo} color={color} tamano={26} />
        {titulo}
      </h2>
      <ul aria-label="Costo" className="flex items-start gap-3 pt-2">
        {costoDe(sitio.tipo).map(({ recurso, cantidad }) => {
          const tengo = mano?.[recurso] ?? 0;
          const sobra = tengo >= cantidad;
          return (
            <li key={recurso} className="flex flex-col items-center gap-1">
              <CartaRecurso
                recurso={recurso}
                tamano="pequena"
                cantidad={cantidad}
                desactivada={!sobra}
                etiqueta={`${cantidad} de ${NOMBRE_RECURSO[recurso]}`}
              />
              <span className={`text-xs font-extrabold ${sobra ? TEXTO_BIEN : TEXTO_FALTA}`}>
                tienes {tengo}
              </span>
            </li>
          );
        })}
      </ul>
      <p className={`text-sm font-bold ${alcanza ? TEXTO_BIEN : TEXTO_FALTA}`}>
        {alcanza ? 'Tienes todo lo necesario' : `Te falta ${textoDeFalta(falta)}`}
      </p>
    </section>
  );
}
