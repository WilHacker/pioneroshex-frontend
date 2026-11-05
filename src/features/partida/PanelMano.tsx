import { useState } from 'react';
import { RECURSOS, type Carta, type Recurso, type Vista } from '@/lib/esquemas';
import { NOMBRE_RECURSO, nombreDeCarta } from '@/lib/mensajes';
import type { Modo } from './logica';

type Props = {
  vista: Vista;
  /** Puedo jugar una carta ahora (es mi turno y la fase lo permite). */
  puedeJugarCarta: boolean;
  onModo: (modo: Modo) => void;
  onAccion: (accion: object) => void;
};

const SIN_CARTAS: readonly Carta[] = [];

export function PanelMano({ vista, puedeJugarCarta, onModo, onAccion }: Props) {
  const [monopolio, setMonopolio] = useState<Recurso>('MADERA');
  const [primero, setPrimero] = useState<Recurso>('MADERA');
  const [segundo, setSegundo] = useState<Recurso>('TRIGO');
  const yo = vista.jugadores.find((j) => j.id === vista.yo);
  if (!yo?.recursos) return null;

  const cartas = yo.cartasDesarrollo ?? SIN_CARTAS;
  const cuenta = (carta: Carta): number => cartas.filter((c) => c === carta).length;

  return (
    <section
      aria-labelledby="titulo-mano"
      className="rounded-lg border border-zinc-300 p-3 dark:border-zinc-700"
    >
      <h2 id="titulo-mano" className="mb-2 text-sm font-semibold tracking-wide uppercase">
        Tu mano
      </h2>
      <ul className="grid grid-cols-5 gap-1 text-center text-sm">
        {RECURSOS.map((r) => (
          <li key={r} className="rounded bg-zinc-100 px-1 py-1.5 text-zinc-900">
            <span className="block text-lg font-bold">{yo.recursos?.[r] ?? 0}</span>
            <span className="block text-[0.7rem]">{NOMBRE_RECURSO[r]}</span>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-xs text-zinc-500">
        Banco: {RECURSOS.map((r) => `${vista.banco[r]} ${NOMBRE_RECURSO[r]}`).join(' · ')}
      </p>

      <h3 className="mt-3 text-xs font-semibold tracking-wide uppercase">Cartas de desarrollo</h3>
      {cartas.length === 0 ? (
        <p className="text-sm text-zinc-500">No tienes cartas.</p>
      ) : (
        <ul className="mt-1 flex flex-col gap-1 text-sm">
          {cuenta('CABALLERO') > 0 && (
            <li className="flex items-center justify-between">
              <span>Caballero ×{cuenta('CABALLERO')}</span>
              <button
                type="button"
                disabled={!puedeJugarCarta}
                onClick={() => onModo('CABALLERO')}
                className="rounded border px-2 py-0.5 enabled:hover:bg-zinc-100 enabled:hover:text-zinc-900 disabled:opacity-50"
              >
                Jugar
              </button>
            </li>
          )}
          {cuenta('CONSTRUCCION_CARRETERAS') > 0 && (
            <li className="flex items-center justify-between">
              <span>Construcción de carreteras ×{cuenta('CONSTRUCCION_CARRETERAS')}</span>
              <button
                type="button"
                disabled={!puedeJugarCarta}
                onClick={() => onModo('CARRETERAS')}
                className="rounded border px-2 py-0.5 enabled:hover:bg-zinc-100 enabled:hover:text-zinc-900 disabled:opacity-50"
              >
                Jugar
              </button>
            </li>
          )}
          {cuenta('MONOPOLIO') > 0 && (
            <li className="flex flex-wrap items-center gap-2">
              <span>Monopolio ×{cuenta('MONOPOLIO')}</span>
              <select
                aria-label="Recurso del monopolio"
                value={monopolio}
                onChange={(e) => setMonopolio(e.target.value as Recurso)}
                className="rounded border bg-transparent px-1 py-0.5"
              >
                {RECURSOS.map((r) => (
                  <option key={r} value={r} className="text-zinc-900">
                    {NOMBRE_RECURSO[r]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!puedeJugarCarta}
                onClick={() => onAccion({ tipo: 'JUGAR_MONOPOLIO', recurso: monopolio })}
                className="rounded border px-2 py-0.5 enabled:hover:bg-zinc-100 enabled:hover:text-zinc-900 disabled:opacity-50"
              >
                Jugar
              </button>
            </li>
          )}
          {cuenta('ABUNDANCIA') > 0 && (
            <li className="flex flex-wrap items-center gap-2">
              <span>Abundancia ×{cuenta('ABUNDANCIA')}</span>
              <select
                aria-label="Primer recurso de la abundancia"
                value={primero}
                onChange={(e) => setPrimero(e.target.value as Recurso)}
                className="rounded border bg-transparent px-1 py-0.5"
              >
                {RECURSOS.map((r) => (
                  <option key={r} value={r} className="text-zinc-900">
                    {NOMBRE_RECURSO[r]}
                  </option>
                ))}
              </select>
              <select
                aria-label="Segundo recurso de la abundancia"
                value={segundo}
                onChange={(e) => setSegundo(e.target.value as Recurso)}
                className="rounded border bg-transparent px-1 py-0.5"
              >
                {RECURSOS.map((r) => (
                  <option key={r} value={r} className="text-zinc-900">
                    {NOMBRE_RECURSO[r]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!puedeJugarCarta}
                onClick={() => onAccion({ tipo: 'JUGAR_ABUNDANCIA', recursos: [primero, segundo] })}
                className="rounded border px-2 py-0.5 enabled:hover:bg-zinc-100 enabled:hover:text-zinc-900 disabled:opacity-50"
              >
                Jugar
              </button>
            </li>
          )}
          {cuenta('PUNTO_VICTORIA') > 0 && (
            <li>
              {nombreDeCarta('PUNTO_VICTORIA')} ×{cuenta('PUNTO_VICTORIA')} (cuenta sola)
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
