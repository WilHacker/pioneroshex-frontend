'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

type Props = {
  /** Lo que se explica: da nombre al botón para los lectores de pantalla. */
  tema: string;
  children: ReactNode;
};

/**
 * Un icono ⓘ que explica un ajuste. Se abre con clic, toque o teclado (a diferencia de `title`, que
 * en móvil no existe) y se cierra con Escape, tocando fuera o abriendo otra ayuda.
 */
export function Ayuda({ tema, children }: Props) {
  const [abierta, setAbierta] = useState(false);
  const raiz = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!abierta) return;
    const cerrarSiEsFuera = (e: PointerEvent): void => {
      if (!raiz.current?.contains(e.target as Node)) setAbierta(false);
    };
    const cerrarConEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setAbierta(false);
    };
    document.addEventListener('pointerdown', cerrarSiEsFuera);
    document.addEventListener('keydown', cerrarConEscape);
    return () => {
      document.removeEventListener('pointerdown', cerrarSiEsFuera);
      document.removeEventListener('keydown', cerrarConEscape);
    };
  }, [abierta]);

  return (
    <span ref={raiz} className="relative inline-block align-middle">
      <button
        type="button"
        aria-label={`Qué significa «${tema}»`}
        aria-expanded={abierta}
        aria-controls={abierta ? id : undefined}
        onClick={() => setAbierta((v) => !v)}
        className="inline-flex size-5 items-center justify-center rounded-full border-2 border-current text-xs leading-none font-extrabold opacity-70 transition hover:opacity-100 focus-visible:opacity-100"
      >
        i
      </button>
      {abierta && (
        <span
          id={id}
          role="note"
          className="absolute top-full left-1/2 z-20 mt-2 w-64 max-w-[80vw] -translate-x-1/2 rounded-xl bg-tinta p-3 text-left text-sm leading-snug font-medium text-espuma shadow-xl"
        >
          {children}
        </span>
      )}
    </span>
  );
}
