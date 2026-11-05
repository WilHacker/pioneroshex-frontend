'use client';

import { useState } from 'react';
import type { Credencial, Hex } from '@/lib/esquemas';
import { textoDeMotivo } from '@/lib/mensajes';
import { victimasEn } from '@/lib/tablero';
import {
  accionDeArista,
  accionDeLadron,
  accionDeVertice,
  esMiTurno,
  mensajeDeFase,
  modoEfectivo,
  objetivoDe,
  type Modo,
} from './logica';
import { PanelAcciones } from './PanelAcciones';
import { PanelDescarte } from './PanelDescarte';
import { PanelJugadores } from './PanelJugadores';
import { PanelMano } from './PanelMano';
import { PanelTratos } from './PanelTratos';
import { Registro } from './Registro';
import { Tablero } from './Tablero';
import { useJuego } from './useJuego';

type Props = {
  credencial: Credencial;
  /** Nombre visible de cada jugador, por id. */
  nombres: Readonly<Record<string, string>>;
};

interface VictimaPendiente {
  readonly destino: Hex;
  readonly victimas: readonly string[];
}

const MAX_CARRETERAS = 2;

export function Partida({ credencial, nombres }: Props) {
  const juego = useJuego(credencial.salaId, credencial.token);
  const [elegido, setElegido] = useState<Modo | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [carreteras, setCarreteras] = useState<readonly string[]>([]);
  const [pendiente, setPendiente] = useState<VictimaPendiente | null>(null);

  if (juego.rechazo !== null) {
    return (
      <p role="alert" className="rounded border-2 border-red-500 p-4">
        No se pudo entrar a la partida: {textoDeMotivo(juego.rechazo)}.
      </p>
    );
  }
  if (!juego.datos) {
    return <output className="text-sm">Conectando con la partida…</output>;
  }

  const { mesa, vista, acciones } = juego.datos;
  const nombreDe = (id: string): string => nombres[id] ?? id;
  const indiceDe = (id: string): number => vista.jugadores.findIndex((j) => j.id === id);
  const miTurno = esMiTurno(vista);
  const modo = modoEfectivo(vista, elegido);
  const miDescarte = vista.yo === null ? 0 : (vista.descartesPendientes[vista.yo] ?? 0);
  const miMano = vista.jugadores.find((j) => j.id === vista.yo)?.recursos ?? null;

  const ejecutar = async (accion: object | null): Promise<void> => {
    if (!accion) return;
    setOcupado(true);
    const error = await juego.enviar(accion);
    setOcupado(false);
    setAviso(error);
    if (error === null) {
      setElegido(null);
      setCarreteras([]);
      setPendiente(null);
    }
  };

  const alCasilla = (destino: Hex): void => {
    const victimas = victimasEn(mesa, vista, destino);
    if (victimas.length > 1) setPendiente({ destino, victimas });
    else void ejecutar(accionDeLadron(modo, destino, victimas[0] ?? null));
  };

  const alArista = (id: string): void => {
    if (modo !== 'CARRETERAS') {
      void ejecutar(accionDeArista(vista, modo, id));
      return;
    }
    setCarreteras((previas) =>
      previas.includes(id)
        ? previas.filter((a) => a !== id)
        : [...previas, id].slice(-MAX_CARRETERAS),
    );
  };

  const elegirModo = (nuevo: Modo | null): void => {
    setElegido(nuevo);
    setCarreteras([]);
    setPendiente(null);
    setAviso(null);
  };

  return (
    <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="flex flex-col items-center gap-3">
        <output
          className="w-full rounded bg-zinc-100 px-3 py-2 text-center font-medium text-zinc-900"
          aria-live="polite"
        >
          {mensajeDeFase(vista, nombreDe)}
          {vista.dados && vista.fase !== 'FIN'
            ? ` · Dados: ${vista.dados[0]} + ${vista.dados[1]}`
            : ''}
        </output>
        {juego.conexion === 'reconectando' && (
          <output className="text-sm text-amber-600">Conexión perdida: reconectando…</output>
        )}
        {aviso && (
          <p
            role="alert"
            className="w-full rounded border border-red-500 px-3 py-1.5 text-sm text-red-600"
          >
            {aviso}
          </p>
        )}
        <Tablero
          mesa={mesa}
          vista={vista}
          indiceDe={indiceDe}
          nombreDe={nombreDe}
          objetivo={objetivoDe(modo)}
          aristasElegidas={carreteras}
          onVertice={(id) => void ejecutar(accionDeVertice(vista, modo, id))}
          onArista={alArista}
          onCasilla={alCasilla}
        />
        {modo === 'CARRETERAS' && (
          <button
            type="button"
            disabled={ocupado || carreteras.length === 0}
            onClick={() =>
              void ejecutar({ tipo: 'JUGAR_CONSTRUCCION_CARRETERAS', aristas: carreteras })
            }
            className="rounded border px-3 py-1.5 text-sm font-medium enabled:hover:bg-yellow-100 enabled:hover:text-zinc-900 disabled:opacity-40"
          >
            Construir {carreteras.length} {carreteras.length === 1 ? 'camino' : 'caminos'} (elige
            hasta {MAX_CARRETERAS})
          </button>
        )}
        {pendiente && (
          <fieldset className="flex flex-wrap items-center gap-2 text-sm">
            <legend className="sr-only">Elegir a quién robar</legend>
            <span>¿A quién le robas?</span>
            {pendiente.victimas.map((id) => (
              <button
                key={id}
                type="button"
                disabled={ocupado}
                onClick={() => void ejecutar(accionDeLadron(modo, pendiente.destino, id))}
                className="rounded border px-2 py-1 hover:bg-zinc-100 hover:text-zinc-900"
              >
                {nombreDe(id)}
              </button>
            ))}
          </fieldset>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <PanelJugadores vista={vista} nombreDe={nombreDe} indiceDe={indiceDe} />
        {miDescarte > 0 && miMano && (
          <PanelDescarte
            cantidad={miDescarte}
            mano={miMano}
            ocupado={ocupado}
            onDescartar={(recursos) => void ejecutar({ tipo: 'DESCARTAR_RECURSOS', recursos })}
          />
        )}
        <PanelMano
          vista={vista}
          puedeJugarCarta={miTurno && vista.fase === 'FASE_PRINCIPAL' && !ocupado}
          onModo={elegirModo}
          onAccion={(accion) => void ejecutar(accion)}
        />
        {miTurno && (
          <PanelAcciones
            acciones={acciones}
            modo={modo}
            ocupado={ocupado}
            onModo={elegirModo}
            onAccion={(accion) => void ejecutar(accion)}
          />
        )}
        <PanelTratos
          vista={vista}
          nombreDe={nombreDe}
          ocupado={ocupado}
          puedeProponer={miTurno && vista.fase === 'FASE_PRINCIPAL'}
          onAccion={(accion) => void ejecutar(accion)}
        />
        <Registro eventos={juego.eventos} nombreDe={nombreDe} />
      </div>
    </div>
  );
}
