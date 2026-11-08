import { oscurecer } from '@/components/arte/IconoPieza';
import type { Punto, Terreno } from '@/lib/esquemas';
import { esquinasDeCasilla } from '@/lib/tablero';
import { COLOR_TERRENO, NOMBRE_TERRENO, aclarar } from '@/lib/colores';
import { ImagenSVG } from './ImagenSVG';

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

/** Terrenos con icono propio (`public/recursos/`); `proporcion` es ancho / alto del dibujo. */
const ICONOS: Partial<Record<Terreno, { src: string; proporcion: number }>> = {
  BOSQUE: { src: '/recursos/madera.svg', proporcion: 0.97 },
  PASTO: { src: '/recursos/oveja.svg', proporcion: 1.33 },
  CAMPO: { src: '/recursos/trigo.svg', proporcion: 0.92 },
  COLINA: { src: '/recursos/ladrillo.svg', proporcion: 1.78 },
  MONTANA: { src: '/recursos/mineral.svg', proporcion: 1.52 },
  DESIERTO: { src: '/recursos/cactus.svg', proporcion: 1 },
};

/** El icono cabe en la mitad de arriba de la casilla, sobre la ficha del número. */
const ICONO_ANCHO_MAX = 0.6;
const ICONO_ALTO_MAX = 0.46;
const ICONO_CENTRO_Y = -0.58;

function Icono({ src, proporcion }: { src: string; proporcion: number }) {
  const alto = Math.min(ICONO_ALTO_MAX, ICONO_ANCHO_MAX / proporcion);
  return (
    <ImagenSVG
      src={src}
      centroX={0}
      centroY={ICONO_CENTRO_Y}
      ancho={alto * proporcion}
      alto={alto}
    />
  );
}

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
  const icono = ICONOS[terreno];

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
        {icono && <Icono {...icono} />}
        {/* El desierto, además del cactus, conserva dos dunas abajo: el ladrón empieza aquí. */}
        {terreno === 'DESIERTO' &&
          LUGARES.slice(2).map((lugar) => <Duna key={`${lugar.x},${lugar.y}`} {...lugar} />)}
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
