import { useState } from 'react';
import { RECURSOS, type AccionDisponible, type Recurso } from '@/lib/esquemas';
import { NOMBRE_RECURSO, textoDeMotivo } from '@/lib/mensajes';
import type { Modo } from './logica';

type Props = {
  acciones: readonly AccionDisponible[];
  modo: Modo | null;
  ocupado: boolean;
  onModo: (modo: Modo | null) => void;
  onAccion: (accion: object) => void;
};

type BotonProps = {
  etiqueta: string;
  tipo: string;
  acciones: readonly AccionDisponible[];
  ocupado: boolean;
  activo?: boolean;
  onClick: () => void;
};

/** Un botón que sigue lo que el servidor dice que se puede hacer, y explica por qué no si no. */
function Boton({ etiqueta, tipo, acciones, ocupado, activo = false, onClick }: BotonProps) {
  const accion = acciones.find((a) => a.tipo === tipo);
  const habilitado = accion?.disponible === true && !ocupado;
  return (
    <button
      type="button"
      disabled={!habilitado}
      aria-pressed={activo || undefined}
      title={!accion?.disponible && accion?.motivo ? textoDeMotivo(accion.motivo) : undefined}
      onClick={onClick}
      className={`rounded border px-3 py-1.5 text-sm font-medium enabled:hover:bg-zinc-100 enabled:hover:text-zinc-900 disabled:opacity-40 ${activo ? 'bg-yellow-200 text-zinc-900' : ''}`}
    >
      {etiqueta}
    </button>
  );
}

export function PanelAcciones({ acciones, modo, ocupado, onModo, onAccion }: Props) {
  const [entrega, setEntrega] = useState<Recurso>('MADERA');
  const [recibe, setRecibe] = useState<Recurso>('TRIGO');
  const alternar = (nuevo: Modo) => onModo(modo === nuevo ? null : nuevo);
  const comun = { acciones, ocupado };

  return (
    <section
      aria-labelledby="titulo-acciones"
      className="rounded-lg border border-zinc-300 p-3 dark:border-zinc-700"
    >
      <h2 id="titulo-acciones" className="mb-2 text-sm font-semibold tracking-wide uppercase">
        Acciones
      </h2>
      <div className="flex flex-wrap gap-2">
        <Boton
          {...comun}
          etiqueta="Tirar dados"
          tipo="TIRAR_DADOS"
          onClick={() => onAccion({ tipo: 'TIRAR_DADOS' })}
        />
        <Boton
          {...comun}
          etiqueta="Poblado"
          tipo="CONSTRUIR_POBLADO"
          activo={modo === 'POBLADO'}
          onClick={() => alternar('POBLADO')}
        />
        <Boton
          {...comun}
          etiqueta="Ciudad"
          tipo="CONSTRUIR_CIUDAD"
          activo={modo === 'CIUDAD'}
          onClick={() => alternar('CIUDAD')}
        />
        <Boton
          {...comun}
          etiqueta="Camino"
          tipo="CONSTRUIR_CAMINO"
          activo={modo === 'CAMINO'}
          onClick={() => alternar('CAMINO')}
        />
        <Boton
          {...comun}
          etiqueta="Comprar carta"
          tipo="COMPRAR_CARTA_DESARROLLO"
          onClick={() => onAccion({ tipo: 'COMPRAR_CARTA_DESARROLLO' })}
        />
        <Boton
          {...comun}
          etiqueta="Pasar (construcción especial)"
          tipo="PASAR_CONSTRUCCION_ESPECIAL"
          onClick={() => onAccion({ tipo: 'PASAR_CONSTRUCCION_ESPECIAL' })}
        />
        <Boton
          {...comun}
          etiqueta="Terminar turno"
          tipo="TERMINAR_TURNO"
          onClick={() => onAccion({ tipo: 'TERMINAR_TURNO' })}
        />
      </div>

      <fieldset className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <legend className="mb-1 text-xs font-semibold tracking-wide uppercase">
          Cambiar con la banca
        </legend>
        <label className="flex items-center gap-1">
          Entrego
          <select
            value={entrega}
            onChange={(e) => setEntrega(e.target.value as Recurso)}
            className="rounded border bg-transparent px-1 py-0.5"
          >
            {RECURSOS.map((r) => (
              <option key={r} value={r} className="text-zinc-900">
                {NOMBRE_RECURSO[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1">
          Recibo
          <select
            value={recibe}
            onChange={(e) => setRecibe(e.target.value as Recurso)}
            className="rounded border bg-transparent px-1 py-0.5"
          >
            {RECURSOS.map((r) => (
              <option key={r} value={r} className="text-zinc-900">
                {NOMBRE_RECURSO[r]}
              </option>
            ))}
          </select>
        </label>
        <Boton
          {...comun}
          etiqueta="Cambiar"
          tipo="CAMBIAR_CON_BANCA"
          onClick={() => onAccion({ tipo: 'CAMBIAR_CON_BANCA', entrega, recibe })}
        />
      </fieldset>
    </section>
  );
}
