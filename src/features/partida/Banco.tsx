import { COLOR_RECURSO, IconoRecurso } from '@/components/arte/IconoRecurso';
import { RECURSOS, type Vista } from '@/lib/esquemas';
import { NOMBRE_RECURSO } from '@/lib/mensajes';

type Props = {
  vista: Vista;
};

/** Lo que queda en el banco y en el mazo de cartas de desarrollo. */
export function Banco({ vista }: Props) {
  return (
    <section
      aria-label="Banco"
      className="flex items-center gap-1.5 rounded-2xl bg-black/25 px-2 py-1.5 text-white"
    >
      <ul className="flex grow gap-1">
        {RECURSOS.map((r) => (
          <li
            key={r}
            aria-label={`${vista.banco[r]} de ${NOMBRE_RECURSO[r]} en el banco`}
            className="flex grow items-center justify-center gap-1 rounded-lg py-1"
            style={{ backgroundColor: COLOR_RECURSO[r].fondo }}
          >
            <IconoRecurso recurso={r} tamano={20} />
            <span className="text-sm font-extrabold text-white drop-shadow">{vista.banco[r]}</span>
          </li>
        ))}
      </ul>
      <p className="px-1 text-xs leading-tight" title="Cartas de desarrollo que quedan">
        <span className="block text-base font-extrabold">{vista.tamanoMazo}</span>
        mazo
      </p>
    </section>
  );
}
