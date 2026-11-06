import type { ReactNode } from 'react';
import { oscurecer } from '@/components/arte/IconoPieza';
import type { Punto, Terreno } from '@/lib/esquemas';
import { esquinasDeCasilla } from '@/lib/tablero';
import { COLOR_TERRENO, NOMBRE_TERRENO, aclarar } from '@/lib/colores';

const TERRENOS = Object.keys(COLOR_TERRENO) as Terreno[];

/** Los degradados de las casillas; va una sola vez dentro del `<svg>` del tablero. */
export function DefinicionesDeCasilla() {
  return (
    <defs>
      {TERRENOS.map((t) => (
        <radialGradient key={t} id={`terreno-${t}`} cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor={aclarar(COLOR_TERRENO[t], 0.22)} />
          <stop offset="100%" stopColor={COLOR_TERRENO[t]} />
        </radialGradient>
      ))}
    </defs>
  );
}

const puntos = (lista: readonly Punto[]): string => lista.map((p) => `${p.x},${p.y}`).join(' ');

/** Cuatro lugares libres alrededor de la ficha donde van los dibujos del terreno. */
const LUGARES: readonly Punto[] = [
  { x: -0.5, y: -0.3 },
  { x: 0.5, y: -0.3 },
  { x: -0.4, y: 0.4 },
  { x: 0.4, y: 0.4 },
];

function Pino({ x, y }: Punto) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-0.03" y="0.1" width="0.06" height="0.1" fill="#6b4423" />
      <polygon points="0,-0.24 0.15,0.02 -0.15,0.02" fill="#1f5a31" />
      <polygon points="0,-0.12 0.19,0.14 -0.19,0.14" fill="#27703f" />
    </g>
  );
}

function Oveja({ x, y }: Punto) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="-0.05" cy="0" r="0.09" fill="#fff" />
      <circle cx="0.04" cy="-0.04" r="0.09" fill="#fff" />
      <circle cx="0.08" cy="0.03" r="0.08" fill="#fff" />
      <circle cx="-0.01" cy="0.05" r="0.08" fill="#fff" />
      <ellipse cx="0.17" cy="0.03" rx="0.05" ry="0.06" fill="#3a3a44" />
    </g>
  );
}

function Espiga({ x, y }: Punto) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="#8a6a12" strokeWidth="0.03" strokeLinecap="round">
      <line x1="0" y1="0.2" x2="0" y2="-0.18" />
      {[-0.1, 0, 0.1].map((dy) => (
        <g key={dy} fill="#fff0a6" stroke="none">
          <ellipse cx="-0.06" cy={dy} rx="0.06" ry="0.03" transform={`rotate(-35 -0.06 ${dy})`} />
          <ellipse cx="0.06" cy={dy} rx="0.06" ry="0.03" transform={`rotate(35 0.06 ${dy})`} />
        </g>
      ))}
    </g>
  );
}

function Ladrillos({ x, y }: Punto) {
  return (
    <g transform={`translate(${x} ${y})`} fill="#f1a37f" stroke="#a2502f" strokeWidth="0.015">
      <rect x="-0.16" y="-0.12" width="0.15" height="0.09" rx="0.01" />
      <rect x="0.01" y="-0.12" width="0.15" height="0.09" rx="0.01" />
      <rect x="-0.08" y="-0.02" width="0.16" height="0.09" rx="0.01" />
      <rect x="-0.16" y="0.08" width="0.15" height="0.09" rx="0.01" />
      <rect x="0.01" y="0.08" width="0.15" height="0.09" rx="0.01" />
    </g>
  );
}

function Pico({ x, y }: Punto) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points="-0.2,0.15 -0.02,-0.2 0.2,0.15" fill="#5d6b7e" />
      <polygon points="-0.02,-0.2 0.05,-0.06 0,-0.08 -0.04,-0.03 -0.08,-0.09" fill="#f3f7fb" />
      <polygon points="0.07,0.15 0.18,-0.04 0.3,0.15" fill="#6d7b8e" />
    </g>
  );
}

function Duna({ x, y }: Punto) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      fill="none"
      stroke="#c4ad6c"
      strokeWidth="0.035"
      strokeLinecap="round"
    >
      <path d="M-0.2 0.05 Q-0.1 -0.08 0 0.05 T0.2 0.05" />
      <path d="M-0.15 0.15 Q-0.05 0.03 0.05 0.15" />
    </g>
  );
}

const MOTIVO: Record<Terreno, (p: Punto) => ReactNode> = {
  BOSQUE: (p) => <Pino {...p} />,
  PASTO: (p) => <Oveja {...p} />,
  CAMPO: (p) => <Espiga {...p} />,
  COLINA: (p) => <Ladrillos {...p} />,
  MONTANA: (p) => <Pico {...p} />,
  DESIERTO: (p) => <Duna {...p} />,
};

/** Los puntos de probabilidad de un número: 5 para el 6 y el 8, 1 para el 2 y el 12. */
const probabilidad = (numero: number): number => 6 - Math.abs(7 - numero);

type Props = {
  terreno: Terreno;
  ficha: number | null;
  centro: Punto;
  /** Acaba de salir su número: late para que se vea qué casillas producen. */
  resaltada?: boolean;
};

/** Una casilla del tablero: el terreno con su relieve, sus dibujos y la ficha del número. */
export function Casilla({ terreno, ficha, centro, resaltada = false }: Props) {
  const color = COLOR_TERRENO[terreno];
  const esquinas = esquinasDeCasilla(centro);
  const interior = esquinasDeCasilla({ x: centro.x, y: centro.y }).map((e) => ({
    x: centro.x + (e.x - centro.x) * 0.9,
    y: centro.y + (e.y - centro.y) * 0.9,
  }));
  const roja = ficha === 6 || ficha === 8;

  return (
    <g>
      <polygon
        points={puntos(esquinas)}
        fill={`url(#terreno-${terreno})`}
        stroke={oscurecer(color, 0.62)}
        strokeWidth="0.05"
        strokeLinejoin="round"
      >
        <title>{NOMBRE_TERRENO[terreno]}</title>
      </polygon>
      <polygon
        points={puntos(interior)}
        fill="none"
        stroke={aclarar(color, 0.45)}
        strokeWidth="0.025"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <g transform={`translate(${centro.x} ${centro.y})`}>
        {LUGARES.map((lugar) => (
          <g key={`${lugar.x},${lugar.y}`}>{MOTIVO[terreno](lugar)}</g>
        ))}
      </g>
      {resaltada && ficha !== null && (
        <g className="sitio">
          <polygon
            points={puntos(esquinas)}
            fill="#ffe08a"
            fillOpacity="0.35"
            stroke="#ffc95c"
            strokeWidth="0.09"
            strokeLinejoin="round"
          >
            <title>{`Produce con el ${ficha}`}</title>
          </polygon>
          <circle
            cx={centro.x}
            cy={centro.y}
            r="0.4"
            fill="none"
            stroke="#fff"
            strokeWidth="0.06"
          />
        </g>
      )}
      {ficha !== null && (
        <g>
          <circle
            cx={centro.x}
            cy={centro.y}
            r="0.3"
            fill="#fbf3dc"
            stroke="#8a7a52"
            strokeWidth="0.03"
          />
          <text
            x={centro.x}
            y={centro.y + 0.07}
            textAnchor="middle"
            fontSize="0.27"
            fontWeight="800"
            fill={roja ? '#c2261c' : '#1d2b2a'}
          >
            {ficha}
          </text>
          {Array.from({ length: probabilidad(ficha) }, (_, i) => (
            <circle
              key={i}
              cx={centro.x + (i - (probabilidad(ficha) - 1) / 2) * 0.06}
              cy={centro.y + 0.18}
              r="0.02"
              fill={roja ? '#c2261c' : '#4a5654'}
            />
          ))}
        </g>
      )}
    </g>
  );
}
