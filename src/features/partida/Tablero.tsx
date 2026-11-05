import type { KeyboardEvent } from 'react';
import type { Hex, Mesa, Vista } from '@/lib/esquemas';
import {
  cajaDeMesa,
  claveHex,
  esquinasDeCasilla,
  posicionDePuerto,
  posicionesDeVertices,
  viewBoxDe,
} from '@/lib/tablero';
import { COLOR_TERRENO, NOMBRE_TERRENO, colorDeJugador } from './colores';
import { NOMBRE_RECURSO } from '@/lib/mensajes';

/** Qué se puede tocar ahora en el tablero. */
export type Objetivo = 'POBLADOS' | 'CIUDADES' | 'ARISTAS' | 'CASILLAS' | null;

type Props = {
  mesa: Mesa;
  vista: Vista;
  /** Posición de cada jugador en el orden de turno (para su color y su número). */
  indiceDe: (jugadorId: string) => number;
  nombreDe: (jugadorId: string) => string;
  objetivo: Objetivo;
  /** Aristas ya elegidas (p. ej. para construcción de carreteras). */
  aristasElegidas?: readonly string[];
  onVertice: (id: string) => void;
  onArista: (id: string) => void;
  onCasilla: (hex: Hex) => void;
};

const SIN_ARISTAS: readonly string[] = [];

const puntos = (lista: readonly { x: number; y: number }[]): string =>
  lista.map((p) => `${p.x},${p.y}`).join(' ');

/** Activa un elemento SVG con Enter o Espacio, como un botón. */
const alTeclear = (accion: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    accion();
  }
};

export function Tablero({
  mesa,
  vista,
  indiceDe,
  nombreDe,
  objetivo,
  aristasElegidas = SIN_ARISTAS,
  onVertice,
  onArista,
  onCasilla,
}: Props) {
  const posiciones = posicionesDeVertices(mesa);
  const caja = cajaDeMesa(mesa);

  return (
    <svg
      viewBox={viewBoxDe(caja)}
      aria-label="Tablero de juego"
      className="h-auto w-full max-w-3xl select-none"
    >
      {mesa.casillas.map((c) => (
        <g key={claveHex(c.hex)}>
          <polygon
            points={puntos(esquinasDeCasilla(c.centro))}
            fill={COLOR_TERRENO[c.terreno]}
            stroke="#1f2937"
            strokeWidth={0.04}
          >
            <title>{NOMBRE_TERRENO[c.terreno]}</title>
          </polygon>
          {c.ficha !== null && (
            <g>
              <circle
                cx={c.centro.x}
                cy={c.centro.y}
                r={0.28}
                fill="#fffbeb"
                stroke="#1f2937"
                strokeWidth={0.03}
              />
              <text
                x={c.centro.x}
                y={c.centro.y + 0.09}
                textAnchor="middle"
                fontSize={0.3}
                fontWeight={700}
                fill={c.ficha === 6 || c.ficha === 8 ? '#b91c1c' : '#111827'}
              >
                {c.ficha}
              </text>
            </g>
          )}
        </g>
      ))}

      {mesa.puertos.map((p) => {
        const lugar = posicionDePuerto(p.vertices, posiciones);
        if (!lugar) return null;
        const etiqueta = p.tipo === 'GENERICO' ? '3:1' : `2:1 ${NOMBRE_RECURSO[p.tipo]}`;
        return (
          <g key={p.arista}>
            <line
              x1={lugar.borde.x}
              y1={lugar.borde.y}
              x2={lugar.mar.x}
              y2={lugar.mar.y}
              stroke="#6b7280"
              strokeWidth={0.04}
            />
            <text
              x={lugar.mar.x}
              y={lugar.mar.y}
              textAnchor="middle"
              fontSize={0.2}
              fill="currentColor"
            >
              {etiqueta}
            </text>
          </g>
        );
      })}

      {mesa.aristas.map((a) => {
        const dueno = vista.caminos[a.id];
        const desde = posiciones.get(a.vertices[0]);
        const hasta = posiciones.get(a.vertices[1]);
        if (!desde || !hasta) return null;
        const elegida = aristasElegidas.includes(a.id);
        const libre = dueno === undefined;
        return (
          <g key={a.id}>
            {!libre && (
              <line
                x1={desde.x}
                y1={desde.y}
                x2={hasta.x}
                y2={hasta.y}
                stroke={colorDeJugador(indiceDe(dueno))}
                strokeWidth={0.14}
                strokeLinecap="round"
              >
                <title>{`Camino de ${nombreDe(dueno)}`}</title>
              </line>
            )}
            {objetivo === 'ARISTAS' && libre && (
              <g
                role="button"
                tabIndex={0}
                aria-label={`Poner camino en ${a.id}`}
                aria-pressed={elegida}
                className="cursor-pointer outline-none focus-visible:opacity-100"
                opacity={elegida ? 1 : 0.55}
                onClick={() => onArista(a.id)}
                onKeyDown={alTeclear(() => onArista(a.id))}
              >
                <line
                  x1={desde.x}
                  y1={desde.y}
                  x2={hasta.x}
                  y2={hasta.y}
                  stroke={elegida ? '#facc15' : '#ffffff'}
                  strokeWidth={0.12}
                  strokeLinecap="round"
                  strokeDasharray="0.12 0.1"
                />
                <line
                  x1={desde.x}
                  y1={desde.y}
                  x2={hasta.x}
                  y2={hasta.y}
                  stroke="transparent"
                  strokeWidth={0.4}
                />
              </g>
            )}
          </g>
        );
      })}

      {mesa.vertices.map((v) => {
        const edificio = vista.edificios[v.id];
        const libre = edificio === undefined;
        if (edificio) {
          const indice = indiceDe(edificio.dueno);
          const color = colorDeJugador(indice);
          const lado = edificio.tipo === 'CIUDAD' ? 0.34 : 0.24;
          return (
            <g key={v.id}>
              {edificio.tipo === 'CIUDAD' ? (
                <rect
                  x={v.posicion.x - lado / 2}
                  y={v.posicion.y - lado / 2}
                  width={lado}
                  height={lado}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={0.04}
                />
              ) : (
                <circle
                  cx={v.posicion.x}
                  cy={v.posicion.y}
                  r={lado / 2}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={0.04}
                />
              )}
              <text
                x={v.posicion.x}
                y={v.posicion.y + 0.07}
                textAnchor="middle"
                fontSize={0.2}
                fontWeight={700}
                fill="#fff"
              >
                {indice + 1}
              </text>
              <title>{`${edificio.tipo === 'CIUDAD' ? 'Ciudad' : 'Poblado'} de ${nombreDe(edificio.dueno)}`}</title>
            </g>
          );
        }
        if (objetivo !== 'POBLADOS' || !libre) return null;
        return (
          <g
            key={v.id}
            role="button"
            tabIndex={0}
            aria-label={`Construir en el vértice ${v.id}`}
            className="cursor-pointer outline-none focus-visible:opacity-100"
            opacity={0.6}
            onClick={() => onVertice(v.id)}
            onKeyDown={alTeclear(() => onVertice(v.id))}
          >
            <circle
              cx={v.posicion.x}
              cy={v.posicion.y}
              r={0.13}
              fill="#ffffff"
              stroke="#111827"
              strokeWidth={0.03}
            />
            <circle cx={v.posicion.x} cy={v.posicion.y} r={0.3} fill="transparent" />
          </g>
        );
      })}

      {mesa.vertices.map((v) => {
        const mejorable =
          objetivo === 'CIUDADES' &&
          vista.edificios[v.id]?.tipo === 'POBLADO' &&
          vista.edificios[v.id]?.dueno === vista.yo;
        if (!mejorable) return null;
        return (
          <g
            key={`mejora-${v.id}`}
            role="button"
            tabIndex={0}
            aria-label={`Mejorar a ciudad el poblado en ${v.id}`}
            className="cursor-pointer outline-none"
            onClick={() => onVertice(v.id)}
            onKeyDown={alTeclear(() => onVertice(v.id))}
          >
            <circle
              cx={v.posicion.x}
              cy={v.posicion.y}
              r={0.3}
              fill="transparent"
              stroke="#facc15"
              strokeWidth={0.04}
              strokeDasharray="0.08 0.06"
            />
          </g>
        );
      })}

      {objetivo === 'CASILLAS' &&
        mesa.casillas.map((c) => (
          <g
            key={`dest-${claveHex(c.hex)}`}
            role="button"
            tabIndex={0}
            aria-label={`Mover el ladrón a la casilla ${claveHex(c.hex)}`}
            className="cursor-pointer outline-none"
            opacity={0.35}
            onClick={() => onCasilla(c.hex)}
            onKeyDown={alTeclear(() => onCasilla(c.hex))}
          >
            <polygon
              points={puntos(esquinasDeCasilla(c.centro))}
              fill="#ffffff"
              stroke="#111827"
              strokeWidth={0.05}
            />
          </g>
        ))}

      {vista.ladron &&
        mesa.casillas
          .filter((c) => claveHex(c.hex) === claveHex(vista.ladron!))
          .map((c) => (
            <g key="ladron">
              <circle
                cx={c.centro.x}
                cy={c.centro.y - 0.42}
                r={0.17}
                fill="#111827"
                stroke="#fff"
                strokeWidth={0.03}
              />
              <title>Ladrón</title>
            </g>
          ))}
    </svg>
  );
}
