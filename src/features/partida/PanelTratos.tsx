import { useState } from 'react';
import { RECURSOS, type Cantidades, type Trato, type Vista } from '@/lib/esquemas';
import { NOMBRE_RECURSO } from '@/lib/mensajes';

type Props = {
  vista: Vista;
  nombreDe: (jugadorId: string) => string;
  ocupado: boolean;
  puedeProponer: boolean;
  onAccion: (accion: object) => void;
};

const VACIO: Cantidades = { MADERA: 0, LADRILLO: 0, OVEJA: 0, TRIGO: 0, MINERAL: 0 };
const CANTIDAD_MAX = 19;

/** Solo los recursos con cantidad: `{ MADERA: 2 }`. */
const soloConCantidad = (c: Cantidades): Partial<Cantidades> =>
  Object.fromEntries(RECURSOS.filter((r) => c[r] > 0).map((r) => [r, c[r]]));

const resumen = (c: Cantidades): string => {
  const partes = RECURSOS.filter((r) => c[r] > 0).map((r) => `${c[r]} ${NOMBRE_RECURSO[r]}`);
  return partes.length > 0 ? partes.join(', ') : 'nada';
};

type CampoProps = {
  titulo: string;
  valor: Cantidades;
  onCambio: (valor: Cantidades) => void;
};

function Campo({ titulo, valor, onCambio }: CampoProps) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="text-xs font-semibold">{titulo}</legend>
      {RECURSOS.map((r) => (
        <label key={r} className="flex items-center gap-1 text-xs">
          {NOMBRE_RECURSO[r]}
          <input
            type="number"
            min={0}
            max={CANTIDAD_MAX}
            value={valor[r]}
            onChange={(e) =>
              onCambio({
                ...valor,
                [r]: Math.max(0, Math.min(CANTIDAD_MAX, Number(e.target.value) || 0)),
              })
            }
            className="w-12 rounded border bg-transparent px-1 py-0.5"
          />
        </label>
      ))}
    </fieldset>
  );
}

function FilaTrato({
  trato,
  vista,
  nombreDe,
  ocupado,
  onAccion,
}: {
  trato: Trato;
  vista: Vista;
  nombreDe: (id: string) => string;
  ocupado: boolean;
  onAccion: (accion: object) => void;
}) {
  const esMio = trato.proponente === vista.yo;
  const puedeResponder =
    !esMio &&
    vista.yo !== null &&
    (trato.destinatario === null || trato.destinatario === vista.yo) &&
    !trato.rechazadoPor.includes(vista.yo);
  const para = trato.destinatario === null ? 'a todos' : `a ${nombreDe(trato.destinatario)}`;

  return (
    <li className="rounded border border-zinc-300 p-2 text-sm dark:border-zinc-700">
      <p>
        <strong>{nombreDe(trato.proponente)}</strong> ofrece {resumen(trato.entrega)} y pide{' '}
        {resumen(trato.pide)} ({para})
      </p>
      <div className="mt-1 flex gap-2">
        {puedeResponder && (
          <>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => onAccion({ tipo: 'ACEPTAR_TRATO', tratoId: trato.id })}
              className="rounded border px-2 py-0.5 hover:bg-green-100 hover:text-zinc-900"
            >
              Aceptar
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => onAccion({ tipo: 'RECHAZAR_TRATO', tratoId: trato.id })}
              className="rounded border px-2 py-0.5 hover:bg-red-100 hover:text-zinc-900"
            >
              Rechazar
            </button>
          </>
        )}
        {esMio && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => onAccion({ tipo: 'CANCELAR_TRATO', tratoId: trato.id })}
            className="rounded border px-2 py-0.5 hover:bg-zinc-100 hover:text-zinc-900"
          >
            Cancelar
          </button>
        )}
      </div>
    </li>
  );
}

export function PanelTratos({ vista, nombreDe, ocupado, puedeProponer, onAccion }: Props) {
  const [ofrezco, setOfrezco] = useState<Cantidades>(VACIO);
  const [pido, setPido] = useState<Cantidades>(VACIO);
  const [destinatario, setDestinatario] = useState('');
  const rivales = vista.jugadores.filter((j) => j.id !== vista.yo);
  const hayOferta = RECURSOS.some((r) => ofrezco[r] > 0);
  const hayPeticion = RECURSOS.some((r) => pido[r] > 0);

  return (
    <section
      aria-labelledby="titulo-tratos"
      className="rounded-lg border border-zinc-300 p-3 dark:border-zinc-700"
    >
      <h2 id="titulo-tratos" className="mb-2 text-sm font-semibold tracking-wide uppercase">
        Comercio entre jugadores
      </h2>
      {vista.tratos.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay tratos abiertos.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {vista.tratos.map((t) => (
            <FilaTrato
              key={t.id}
              trato={t}
              vista={vista}
              nombreDe={nombreDe}
              ocupado={ocupado}
              onAccion={onAccion}
            />
          ))}
        </ul>
      )}
      {puedeProponer && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium">Proponer un trato</summary>
          <div className="mt-2 flex flex-col gap-2">
            <Campo titulo="Ofrezco" valor={ofrezco} onCambio={setOfrezco} />
            <Campo titulo="Pido" valor={pido} onCambio={setPido} />
            <label className="flex items-center gap-2 text-sm">
              Para
              <select
                value={destinatario}
                onChange={(e) => setDestinatario(e.target.value)}
                className="rounded border bg-transparent px-1 py-0.5"
              >
                <option value="" className="text-zinc-900">
                  Todos
                </option>
                {rivales.map((j) => (
                  <option key={j.id} value={j.id} className="text-zinc-900">
                    {nombreDe(j.id)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={ocupado || !hayOferta || !hayPeticion}
              onClick={() =>
                onAccion({
                  tipo: 'PROPONER_TRATO',
                  entrega: soloConCantidad(ofrezco),
                  pide: soloConCantidad(pido),
                  ...(destinatario === '' ? {} : { destinatario }),
                })
              }
              className="self-start rounded border px-3 py-1.5 text-sm font-medium enabled:hover:bg-zinc-100 enabled:hover:text-zinc-900 disabled:opacity-40"
            >
              Proponer
            </button>
          </div>
        </details>
      )}
    </section>
  );
}
