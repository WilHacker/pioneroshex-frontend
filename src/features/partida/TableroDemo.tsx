'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { IconoRecurso } from '@/components/arte/IconoRecurso';
import { caminosDemo, edificiosDemo, JUGADORES_DEMO, ladronDemo, mesaDemo } from '@/lib/demo';
import { entregasDe, parQueSuma, sumasQueEntregan } from '@/lib/produccion';
import { Dados } from './Dados';
import { Tablero } from './Tablero';

const vistaDemo = {
  yo: null,
  edificios: edificiosDemo,
  caminos: caminosDemo,
  ladron: ladronDemo,
};

const SUMAS_VISTOSAS = sumasQueEntregan(mesaDemo, edificiosDemo, ladronDemo);
const ESPERA_PRIMERA_TIRADA_MS = 700;
const DURACION_RESALTE_MS = 5000;
const TAMANO_RECURSO = 0.5;
const SEPARACION_RECURSOS = 0.46;

const indiceDe = (id: string): number => Math.max(0, JUGADORES_DEMO.indexOf(id as 'j1'));
const nombreDe = (id: string): string => `Jugador ${indiceDe(id) + 1}`;
const sinHacer = (): void => undefined;

/**
 * El tablero de la portada: un adorno vivo. Al cargar tira los dados solo (con una suma que
 * reparte algo) y después se vuelve a tirar tocando los dados. Las casillas con ese número laten y
 * los recursos suben desde ellas, como en una partida de verdad.
 */
export function TableroDemo() {
  const [dados, setDados] = useState<readonly [number, number] | null>(null);
  const [tirada, setTirada] = useState(0);
  const [resaltado, setResaltado] = useState<number | null>(null);
  const apagarResalte = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const lanzar = useCallback((par: readonly [number, number]) => {
    setDados(par);
    setTirada((n) => n + 1);
    setResaltado(par[0] + par[1]);
    clearTimeout(apagarResalte.current);
    apagarResalte.current = setTimeout(() => setResaltado(null), DURACION_RESALTE_MS);
  }, []);

  useEffect(() => {
    const primera = setTimeout(() => {
      const suma = SUMAS_VISTOSAS[Math.floor(Math.random() * SUMAS_VISTOSAS.length)] ?? 8;
      lanzar(parQueSuma(suma, Math.random));
    }, ESPERA_PRIMERA_TIRADA_MS);
    return () => {
      clearTimeout(primera);
      clearTimeout(apagarResalte.current);
    };
  }, [lanzar]);

  const tirarAlAzar = (): void => {
    lanzar([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]);
  };

  const suma = dados ? dados[0] + dados[1] : null;
  const entregas = suma ? entregasDe(mesaDemo, edificiosDemo, ladronDemo, suma) : [];

  const recursos = (
    <g key={tirada} pointerEvents="none" aria-hidden="true">
      {entregas.flatMap((e) =>
        Array.from({ length: e.cantidad }, (_, i) => {
          const desvio = (i - (e.cantidad - 1) / 2) * SEPARACION_RECURSOS;
          return (
            <g
              key={`${e.clave}-${i}`}
              transform={`translate(${e.centro.x + desvio - TAMANO_RECURSO / 2} ${e.centro.y - TAMANO_RECURSO / 2})`}
            >
              <g className="entrega">
                <IconoRecurso recurso={e.recurso} tamano={TAMANO_RECURSO} />
              </g>
            </g>
          );
        }),
      )}
    </g>
  );

  return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center">
      <div className="h-[min(50vh,36rem)] min-h-72 w-full">
        <Tablero
          mesa={mesaDemo}
          vista={vistaDemo}
          indiceDe={indiceDe}
          nombreDe={nombreDe}
          objetivo={null}
          sitios={[]}
          previa={null}
          numeroResaltado={resaltado}
          onVertice={sinHacer}
          onArista={sinHacer}
          onCasilla={sinHacer}
          capa={recursos}
        />
      </div>
      <button
        type="button"
        onClick={tirarAlAzar}
        aria-label="Tirar los dados"
        title="Tirar los dados"
        className="mt-2 cursor-pointer rounded-2xl transition hover:scale-105"
      >
        <Dados
          dados={dados}
          tirada={tirada}
          puedeTirar={false}
          ocupado={false}
          onTirar={sinHacer}
        />
      </button>
    </div>
  );
}
