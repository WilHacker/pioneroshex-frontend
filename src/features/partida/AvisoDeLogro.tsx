'use client';

import { useEffect, useState } from 'react';
import type { EventoJuego } from '@/lib/esquemas';
import { describirLogro } from '@/lib/mensajes';

type Props = {
  /** Lo que trajo la última notificación; `numero` sube con cada una. */
  ultimos: { readonly numero: number; readonly eventos: readonly EventoJuego[] };
  nombreDe: (jugadorId: string) => string;
};

const DURACION_MS = 6000;

/** Cartel que avisa a todos cuando la gran ruta o el gran ejército cambian de manos. */
export function AvisoDeLogro({ ultimos, nombreDe }: Props) {
  const [frase, setFrase] = useState<string | null>(null);

  useEffect(() => {
    const logros = ultimos.eventos
      .map((evento) => describirLogro(evento, nombreDe))
      .filter((f): f is string => f !== null);
    if (logros.length === 0) return;
    setFrase(logros.join(' · '));
    const id = setTimeout(() => setFrase(null), DURACION_MS);
    return () => clearTimeout(id);
    // Solo reacciona a una notificación nueva, no a que cambie `nombreDe`.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [ultimos.numero]);

  if (frase === null) return null;
  return (
    <output className="mx-auto max-w-full rounded-xl border-2 border-azafran bg-[#f5efe0] px-4 py-2 text-center text-sm font-extrabold text-tinta shadow-lg">
      🏆 {frase}
    </output>
  );
}
