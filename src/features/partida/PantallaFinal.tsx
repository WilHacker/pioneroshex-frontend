'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Credencial, Vista } from '@/lib/esquemas';
import { pedirRevancha } from '@/lib/salas';
import { guardarCredencial } from '@/lib/sesion';
import { mensajeDeFase } from './logica';

type Props = {
  vista: Vista;
  credencial: Credencial;
  nombreDe: (id: string) => string;
};

const mensajeDe = (e: unknown): string => (e instanceof Error ? e.message : 'Algo salió mal');

/**
 * La partida terminó: quién ganó, cómo quedó cada uno y la revancha. Sale de la vista del servidor, así
 * que reaparece tal cual al recargar mientras la partida siga viva allí. «Revancha» abre (o se une a) una
 * sala nueva con las mismas reglas y lleva a ella; el servidor junta a quienes la piden en la misma sala.
 */
export function PantallaFinal({ vista, credencial, nombreDe }: Props) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Los empates conservan el orden de turno (la ordenación es estable).
  const clasificacion = [...vista.jugadores].sort((a, b) => b.puntos - a.puntos);

  async function revancha(): Promise<void> {
    setOcupado(true);
    setError(null);
    try {
      const nueva = await pedirRevancha(credencial.salaId, credencial.token);
      guardarCredencial(nueva);
      router.push(`/sala/${encodeURIComponent(nueva.salaId)}`);
    } catch (e: unknown) {
      setError(mensajeDe(e));
      setOcupado(false);
    }
  }

  return (
    <output className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <span className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl bg-niebla px-8 py-8 text-center text-tinta shadow-2xl">
        <span className="text-3xl font-extrabold">{mensajeDeFase(vista, nombreDe)}</span>
        <ol aria-label="Clasificación" className="flex w-full flex-col gap-1 text-left">
          {clasificacion.map((j, i) => (
            <li
              key={j.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-1.5 font-bold ${j.id === vista.ganador ? 'bg-azafran' : 'bg-white/70'}`}
            >
              <span aria-hidden="true" className="w-5 text-center">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate">{nombreDe(j.id)}</span>
              <span>{j.puntos === 1 ? '1 punto' : `${j.puntos} puntos`}</span>
            </li>
          ))}
        </ol>
        {error && (
          <p role="alert" className="rounded-xl bg-coral/15 px-3 py-2 text-sm font-bold text-coral">
            {error}
          </p>
        )}
        <span className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={ocupado}
            onClick={() => void revancha()}
            className="rounded-full bg-azafran px-6 py-2 font-extrabold hover:bg-azafran-claro disabled:opacity-50"
          >
            Revancha
          </button>
          <Link href="/" className="rounded-full bg-tinta/10 px-6 py-2 font-extrabold">
            Volver al inicio
          </Link>
        </span>
      </span>
    </output>
  );
}
