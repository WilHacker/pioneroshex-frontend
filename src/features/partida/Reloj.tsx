'use client';

import { useEffect, useState } from 'react';

type Props = {
  /** Momento (hora de este navegador) en que se acaba el tiempo, o `null` si no hay límite. */
  vence: number | null;
};

const CADA_MS = 250;
/** Desde aquí el reloj se pone en rojo: queda poco. */
const POCO_TIEMPO_S = 10;

/** Segundos que faltan, sin bajar de cero. */
export const segundosQueFaltan = (vence: number, ahora: number): number =>
  Math.max(0, Math.ceil((vence - ahora) / 1000));

/** «1:05», «0:09». */
export const comoReloj = (segundos: number): string =>
  `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;

/**
 * La cuenta atrás del turno. El servidor manda cuántos milisegundos quedan (no una hora), así que
 * un reloj de navegador desajustado no cambia nada. Con poco tiempo se pone rojo, y el cambio no
 * depende solo del color: el número también se ve más grande.
 */
export function Reloj({ vence }: Props) {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (vence === null) return;
    const intervalo = setInterval(() => setAhora(Date.now()), CADA_MS);
    return () => clearInterval(intervalo);
  }, [vence]);

  if (vence === null) return null;
  const faltan = segundosQueFaltan(vence, ahora);
  const poco = faltan <= POCO_TIEMPO_S;

  return (
    <span
      role="timer"
      aria-label="Tiempo del turno"
      title="Tiempo que queda para jugar"
      className={`flex items-center gap-1 rounded-full px-3 py-1 font-extrabold shadow-lg ${poco ? 'bg-coral text-lg text-white' : 'bg-black/35 text-base text-white backdrop-blur'}`}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none">
        <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="2.5" />
        <path d="M12 8v5l3 2M9 3h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      {comoReloj(faltan)}
    </span>
  );
}
