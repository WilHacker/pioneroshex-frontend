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
    return <p className="px-3 text-sm text-white/80">Tu mano está vacía</p>;
  }
  return (
    <ul aria-label="Tu mano" className="flex items-end pl-2">
      {tengo.map((r, i) => (
        <li key={r} className="-ml-2 first:ml-0">
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
