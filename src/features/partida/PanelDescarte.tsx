import { useState } from 'react';
import { IconoAccion } from '@/components/arte/IconosEstado';
import { RECURSOS, type Cantidades } from '@/lib/esquemas';
import { NOMBRE_RECURSO } from '@/lib/mensajes';
import { CartaRecurso } from './CartaRecurso';

type Props = {
  /** Cuántas cartas hay que descartar. */
  cantidad: number;
  mano: Cantidades;
  ocupado: boolean;
  onDescartar: (recursos: Partial<Cantidades>) => void;
};

const VACIO: Cantidades = { MADERA: 0, LADRILLO: 0, OVEJA: 0, TRIGO: 0, MINERAL: 0 };

/** Descartar tocando cartas: las de arriba son tu mano; las de abajo, lo que vas a soltar. */
export function PanelDescarte({ cantidad, mano, ocupado, onDescartar }: Props) {
  const [elegido, setElegido] = useState<Cantidades>(VACIO);
  const total = RECURSOS.reduce((suma, r) => suma + elegido[r], 0);
  const cambiar = (r: (typeof RECURSOS)[number], delta: number): void =>
    setElegido((previo) => ({ ...previo, [r]: Math.max(0, Math.min(mano[r], previo[r] + delta)) }));
  const sueltas = RECURSOS.filter((r) => elegido[r] > 0);

  return (
    <section
      aria-labelledby="titulo-descarte"
      className="flex flex-col items-center gap-3 rounded-2xl border-2 border-coral bg-niebla p-3 text-tinta shadow-2xl"
    >
      <h2 id="titulo-descarte" className="text-lg font-extrabold">
        Descarta {cantidad}
      </h2>
      <fieldset className="flex gap-2">
        <legend className="sr-only">Tu mano</legend>
        {RECURSOS.map((r) => (
          <CartaRecurso
            key={r}
            recurso={r}
            cantidad={mano[r] - elegido[r]}
            desactivada={mano[r] - elegido[r] === 0}
            etiqueta={`Añadir ${NOMBRE_RECURSO[r]}`}
            onClick={() => cambiar(r, 1)}
          />
        ))}
      </fieldset>
      <fieldset className="flex min-h-[3.4rem] items-center gap-2">
        <legend className="sr-only">A descartar</legend>
        {sueltas.length === 0 ? (
          <span className="text-sm text-tinta-suave">Toca las cartas que vas a soltar</span>
        ) : (
          sueltas.map((r) => (
            <CartaRecurso
              key={r}
              recurso={r}
              tamano="pequena"
              cantidad={elegido[r]}
              etiqueta={`Quitar ${NOMBRE_RECURSO[r]}`}
              onClick={() => cambiar(r, -1)}
            />
          ))
        )}
      </fieldset>
      <button
        type="button"
        aria-label={`Descartar (${total} de ${cantidad})`}
        disabled={ocupado || total !== cantidad}
        onClick={() =>
          onDescartar(
            Object.fromEntries(RECURSOS.filter((r) => elegido[r] > 0).map((r) => [r, elegido[r]])),
          )
        }
        className="flex items-center gap-2 rounded-full bg-coral px-5 py-2 font-extrabold text-white enabled:hover:brightness-110 disabled:opacity-40"
      >
        <IconoAccion tipo="ACEPTAR" />
        {total}/{cantidad}
      </button>
    </section>
  );
}
