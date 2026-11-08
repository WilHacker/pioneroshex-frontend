'use client';

import { useEffect, useRef } from 'react';

type Props = {
  /** Si solo quedan dos jugadores, abandonar le da la victoria al otro. */
  soloQuedanDos: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
};

/**
 * «¿Seguro que quieres abandonar?». Abandonar no se puede deshacer, así que antes de hacerlo se
 * explica qué pasa. El foco empieza en «Seguir jugando» (lo seguro) y Escape también cancela.
 */
export function AvisoDeAbandono({ soloQuedanDos, onConfirmar, onCancelar }: Props) {
  const seguro = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    seguro.current?.focus();
    const alTeclear = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onCancelar();
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [onCancelar]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="titulo-abandono"
        aria-describedby="detalle-abandono"
        className="flex max-w-sm flex-col gap-4 rounded-3xl bg-niebla p-6 text-tinta shadow-2xl"
      >
        <h2 id="titulo-abandono" className="text-xl font-extrabold">
          ¿Abandonar la partida?
        </h2>
        <p id="detalle-abandono" className="text-sm leading-snug">
          Dejarás de jugar y el piloto automático jugará por ti hasta el final. No se puede
          deshacer.{' '}
          {soloQuedanDos
            ? 'Como solo sois dos, la victoria será del otro jugador.'
            : 'Si todos los demás abandonan también, ganará quien quede.'}
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            ref={seguro}
            type="button"
            onClick={onCancelar}
            className="rounded-full bg-azafran px-5 py-2 font-extrabold hover:bg-azafran-claro"
          >
            Seguir jugando
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="rounded-full bg-coral/20 px-5 py-2 font-extrabold text-coral hover:bg-coral/30"
          >
            Sí, abandonar
          </button>
        </div>
      </div>
    </div>
  );
}
