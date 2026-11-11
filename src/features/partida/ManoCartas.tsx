import { RECURSOS, type Cantidades } from '@/lib/esquemas';
import { CartaRecurso } from './CartaRecurso';

type Props = {
  /** Mi mano; `null` si soy espectador. */
  recursos: Cantidades | null;
};

/** Mis cartas de recursos en abanico: una carta por tipo, con su cantidad. */
export function ManoCartas({ recursos }: Props) {
  const tengo = recursos ? RECURSOS.filter((r) => recursos[r] > 0) : [];
  if (!recursos || tengo.length === 0) {
    return (
      <p
        data-mano-recursos=""
        className="rounded-xl border-[3px] border-[#101c28] bg-[#f5efe0] px-4 py-3 text-sm text-tinta shadow"
      >
        Tu mano está vacía
      </p>
    );
  }
  return (
    <ul
      aria-label="Tu mano"
      data-mano-recursos=""
      className="flex items-end rounded-xl border-[3px] border-[#101c28] bg-[#f5efe0] px-4 pt-3 pb-2 shadow"
    >
      {tengo.map((r, i) => (
        // La carta de la izquierda va por encima de la siguiente: el número de su esquina
        // sobresale hacia la derecha y, si no, la carta vecina lo taparía.
        <li key={r} className="relative -ml-3 first:ml-0" style={{ zIndex: tengo.length - i }}>
          <CartaRecurso
            recurso={r}
            cantidad={recursos[r]}
            giro={(i - (tengo.length - 1) / 2) * 4}
          />
        </li>
      ))}
    </ul>
  );
}
