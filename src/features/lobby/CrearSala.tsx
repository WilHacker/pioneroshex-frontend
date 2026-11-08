'use client';

import { useEffect, useState } from 'react';
import { Ayuda } from '@/components/Ayuda';
import type { InfoDeMapa, OpcionesDeSala, Recomendado } from '@/lib/esquemas';
import { listarMapas, verRecomendado } from '@/lib/salas';
import { AYUDAS } from './ayudas';
import { OpcionesSala, type CambiosDeSala } from './OpcionesSala';
import { SelectorDeMapa } from './SelectorDeMapa';

const JUGADORES_MIN = 2;
const JUGADORES_MAX = 12;
const JUGADORES_POR_DEFECTO = 4;
const OPCIONES_DE_JUGADORES = Array.from(
  { length: JUGADORES_MAX - JUGADORES_MIN + 1 },
  (_, i) => JUGADORES_MIN + i,
);

const BOTON =
  'rounded-full bg-azafran px-6 py-2.5 text-lg font-extrabold text-tinta shadow-md transition enabled:hover:scale-105 enabled:hover:bg-azafran-claro disabled:opacity-40';

type Props = {
  /** Ocupada o sin nombre: no se puede crear todavía. */
  deshabilitado: boolean;
  onCrear: (publica: boolean, reglas: OpcionesDeSala) => void;
};

type RecomendadoPara = Recomendado & { jugadores: number };

/**
 * Crear una sala empezando por lo que más pesa: cuántos jugadores serán. Con ese número el servidor
 * propone puntos, tiempo y turnos equilibrados; lo que el anfitrión toca a mano se respeta aunque
 * después cambie el número de jugadores.
 */
export function CrearSala({ deshabilitado, onCrear }: Props) {
  const [jugadores, setJugadores] = useState(JUGADORES_POR_DEFECTO);
  const [publica, setPublica] = useState(false);
  const [recomendado, setRecomendado] = useState<RecomendadoPara | null>(null);
  const [fallo, setFallo] = useState(false);
  // Solo lo que el anfitrión cambió: lo demás sigue lo recomendado.
  const [cambios, setCambios] = useState<OpcionesDeSala>({});
  const [mapas, setMapas] = useState<readonly InfoDeMapa[]>([]);
  const [mapaElegido, setMapaElegido] = useState<string | null>(null);

  useEffect(() => {
    const controlador = new AbortController();
    verRecomendado(jugadores, controlador.signal).then(
      (r) => {
        setRecomendado({ ...r, jugadores });
        setFallo(false);
      },
      () => {
        if (!controlador.signal.aborted) setFallo(true);
      },
    );
    return () => controlador.abort();
  }, [jugadores]);

  useEffect(() => {
    const controlador = new AbortController();
    listarMapas(controlador.signal).then(setMapas, () => undefined);
    return () => controlador.abort();
  }, []);

  // Si al subir los jugadores el mapa elegido ya no cabe, se usa el automático.
  const mapa = mapas.some((m) => m.id === mapaElegido && jugadores <= m.maximoTecnico)
    ? mapaElegido
    : null;
  const opciones: OpcionesDeSala = {
    ...(recomendado ? sinJugadores(recomendado) : {}),
    ...cambios,
  };

  function alCambiar({ publica: esPublica, ...reglas }: CambiosDeSala): void {
    if (esPublica !== undefined) setPublica(esPublica);
    if (Object.keys(reglas).length > 0) setCambios((antes) => ({ ...antes, ...reglas }));
  }

  // Lo recomendado de otro número de jugadores no vale: se espera al de este (o al aviso de fallo).
  const listo = fallo || recomendado?.jugadores === jugadores;

  const crear = (): void =>
    onCrear(publica, { maxJugadores: jugadores, ...opciones, ...(mapa ? { mapa } : {}) });

  return (
    <div className="flex w-full flex-col gap-5">
      <fieldset aria-label="Jugadores" className="flex flex-col gap-2">
        <legend className="mb-1 flex items-center gap-1.5 text-base font-extrabold">
          ¿Cuántos jugadores serán?
          <Ayuda tema="Jugadores">{AYUDAS.jugadores}</Ayuda>
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {OPCIONES_DE_JUGADORES.map((n) => (
            <button
              key={n}
              type="button"
              data-n={n}
              aria-label={`${n} jugadores`}
              aria-pressed={n === jugadores}
              onClick={() => setJugadores(n)}
              className={`size-10 rounded-xl border-2 text-lg font-extrabold transition enabled:hover:-translate-y-0.5 ${
                n === jugadores
                  ? 'border-azafran bg-azafran text-tinta shadow'
                  : 'border-tinta/15 bg-white/60 text-tinta/80'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tinta/80">
        {fallo ? (
          <output>No se pudo cargar lo recomendado: se usan los valores normales del juego.</output>
        ) : (
          recomendado && (
            <output>
              Recomendado para <strong>{recomendado.jugadores} jugadores</strong>: puntos, tiempo y
              turnos ya están ajustados para que la partida salga equilibrada.
            </output>
          )
        )}
        {Object.keys(cambios).length > 0 && (
          <button
            type="button"
            onClick={() => setCambios({})}
            className="font-bold text-mar-laguna underline"
          >
            Volver a lo recomendado
          </button>
        )}
      </div>

      <OpcionesSala
        opciones={opciones}
        publica={publica}
        jugadores={jugadores}
        editable
        onCambiar={alCambiar}
      />

      <SelectorDeMapa
        mapas={mapas}
        elegido={mapa}
        jugadores={jugadores}
        editable
        onElegir={setMapaElegido}
      />

      <button
        type="button"
        disabled={deshabilitado || !listo}
        onClick={crear}
        className={`${BOTON} self-center`}
      >
        Crear sala
      </button>
    </div>
  );
}

/** Las reglas recomendadas, sin el número de jugadores al que corresponden. */
function sinJugadores({ jugadores: _jugadores, ...reglas }: RecomendadoPara): Recomendado {
  return reglas;
}
