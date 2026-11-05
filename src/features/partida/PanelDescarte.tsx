import { useState } from 'react';
import { RECURSOS, type Cantidades } from '@/lib/esquemas';
import { NOMBRE_RECURSO } from '@/lib/mensajes';

type Props = {
  /** Cuántas cartas hay que descartar. */
  cantidad: number;
  mano: Cantidades;
  ocupado: boolean;
  onDescartar: (recursos: Partial<Cantidades>) => void;
};

const VACIO: Cantidades = { MADERA: 0, LADRILLO: 0, OVEJA: 0, TRIGO: 0, MINERAL: 0 };

export function PanelDescarte({ cantidad, mano, ocupado, onDescartar }: Props) {
  const [elegido, setElegido] = useState<Cantidades>(VACIO);
  const total = RECURSOS.reduce((suma, r) => suma + elegido[r], 0);
  const cambiar = (r: (typeof RECURSOS)[number], delta: number) =>
    setElegido((previo) => ({ ...previo, [r]: Math.max(0, Math.min(mano[r], previo[r] + delta)) }));

  return (
    <section aria-labelledby="titulo-descarte" className="rounded-lg border-2 border-red-500 p-3">
      <h2 id="titulo-descarte" className="text-sm font-semibold tracking-wide uppercase">
        Sacaron un 7: descarta {cantidad} cartas
      </h2>
      <ul className="mt-2 flex flex-col gap-1 text-sm">
        {RECURSOS.map((r) => (
          <li key={r} className="flex items-center gap-2">
            <span className="w-20">{NOMBRE_RECURSO[r]}</span>
            <button
              type="button"
              aria-label={`Quitar ${NOMBRE_RECURSO[r]}`}
              onClick={() => cambiar(r, -1)}
              className="size-7 rounded border"
            >
              −
            </button>
            <output aria-label={`${NOMBRE_RECURSO[r]} a descartar`} className="w-6 text-center">
              {elegido[r]}
            </output>
            <button
              type="button"
              aria-label={`Añadir ${NOMBRE_RECURSO[r]}`}
              onClick={() => cambiar(r, 1)}
              className="size-7 rounded border"
            >
              +
            </button>
            <span className="text-xs text-zinc-500">de {mano[r]}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={ocupado || total !== cantidad}
        onClick={() =>
          onDescartar(
            Object.fromEntries(RECURSOS.filter((r) => elegido[r] > 0).map((r) => [r, elegido[r]])),
          )
        }
        className="mt-2 rounded border px-3 py-1.5 text-sm font-medium enabled:hover:bg-red-100 enabled:hover:text-zinc-900 disabled:opacity-40"
      >
        Descartar ({total}/{cantidad})
      </button>
    </section>
  );
}
