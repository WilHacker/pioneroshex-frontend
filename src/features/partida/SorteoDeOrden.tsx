'use client';

import { useEffect, useState } from 'react';
import { Dado } from '@/components/arte/Dado';
import type { Vista } from '@/lib/esquemas';

/** Cuánto se espera entre una tirada y la siguiente al revelar el sorteo. */
const PASO_MS = 700;

type Props = {
  sorteo: Vista['sorteo'];
  /** Los jugadores de primero a último, ya decidido. */
  orden: readonly string[];
  nombreDe: (jugadorId: string) => string;
  onCerrar: () => void;
};

const sumaDe = (dados: readonly [number, number]): number => dados[0] + dados[1];

function prefiereMenosMovimiento(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

const tituloDeRonda = (indice: number): string =>
  indice === 0 ? 'Primera tirada' : indice === 1 ? 'Desempate' : `Desempate ${indice}`;

/**
 * El sorteo del orden de turno «como en el Monopoly»: cada jugador tira dos dados, el más alto va
 * primero, y quienes empatan repiten entre ellos. Las tiradas las hizo el servidor (todos ven las
 * mismas); aquí solo se revelan una a una. «Saltar» y «reducir movimiento» van directo al resultado.
 */
export function SorteoDeOrden({ sorteo, orden, nombreDe, onCerrar }: Props) {
  const total = sorteo.reduce((suma, ronda) => suma + ronda.length, 0);
  const [reveladas, setReveladas] = useState(() => (prefiereMenosMovimiento() ? total : 0));
  const terminado = reveladas >= total;

  useEffect(() => {
    if (terminado) return;
    const intervalo = setInterval(() => setReveladas((n) => n + 1), PASO_MS);
    return () => clearInterval(intervalo);
  }, [terminado]);

  // El número de la primera tirada de cada ronda, para saber cuándo empieza a verse.
  const inicios = sorteo.map((_, i) => sorteo.slice(0, i).reduce((s, r) => s + r.length, 0));

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <dialog
        open
        aria-modal="true"
        aria-label="Sorteo del orden de turno"
        className="static m-0 flex w-full max-w-md flex-col gap-4 rounded-3xl bg-niebla p-5 text-tinta shadow-2xl"
      >
        <h2 className="text-center text-xl font-extrabold">Sorteo del orden de turno</h2>
        <p className="text-center text-sm text-tinta/70">
          Cada jugador tira dos dados: el más alto juega primero. Si hay empate, repiten solo los
          empatados.
        </p>

        {sorteo.map((ronda, r) =>
          inicios[r]! < reveladas || terminado ? (
            // Las rondas solo se añaden al final y no tienen id propio: el índice es estable.
            // oxlint-disable-next-line react/no-array-index-key
            <section key={r} className="flex flex-col gap-1.5">
              <h3 className="text-sm font-extrabold">{tituloDeRonda(r)}</h3>
              <ul className="flex flex-col gap-1">
                {ronda.map((t, i) => {
                  const revelada = inicios[r]! + i < reveladas;
                  return (
                    <li
                      key={t.jugador}
                      data-testid={revelada ? 'tirada-revelada' : undefined}
                      className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-1"
                    >
                      <span className="min-w-0 flex-1 truncate font-bold">
                        {nombreDe(t.jugador)}
                      </span>
                      <span className={revelada ? 'dado-rodando' : 'opacity-40'}>
                        <Dado valor={revelada ? t.dados[0] : null} tamano={34} />
                      </span>
                      <span className={revelada ? 'dado-rodando' : 'opacity-40'}>
                        <Dado valor={revelada ? t.dados[1] : null} tamano={34} />
                      </span>
                      <span className="w-7 text-right text-lg font-extrabold">
                        {revelada ? sumaDe(t.dados) : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null,
        )}

        {terminado ? (
          <>
            <output className="sr-only">
              Orden de juego: {orden.map((id) => nombreDe(id)).join(', ')}
            </output>
            <section className="flex flex-col gap-1.5">
              <h3 className="text-sm font-extrabold">Orden de juego</h3>
              <ol aria-label="Orden de juego" className="flex flex-col gap-1">
                {orden.map((id, i) => (
                  <li
                    key={id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-1.5 font-extrabold ${i === 0 ? 'bg-azafran' : 'bg-white/70'}`}
                  >
                    <span aria-hidden="true" className="w-5 text-center">
                      {i + 1}
                    </span>
                    <span className="sr-only">{i + 1}.º </span>
                    {nombreDe(id)}
                  </li>
                ))}
              </ol>
            </section>
            <button
              type="button"
              onClick={onCerrar}
              className="self-center rounded-full bg-azafran px-8 py-2.5 text-lg font-extrabold shadow-md hover:bg-azafran-claro"
            >
              ¡A jugar!
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setReveladas(total)}
            className="self-center rounded-full bg-tinta/10 px-5 py-1.5 text-sm font-extrabold hover:bg-tinta/20"
          >
            Saltar
          </button>
        )}
      </dialog>
    </div>
  );
}
