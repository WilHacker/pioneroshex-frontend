import { oscurecer } from '@/components/arte/IconoPieza';
import { IconoRecurso } from '@/components/arte/IconoRecurso';
import type { Punto, Recurso } from '@/lib/esquemas';

/** Las piezas del tablero, en unidades del tablero (el lado de una casilla mide 1). */

type PiezaProps = {
  posicion: Punto;
  color: string;
  /** Más transparente, para la vista previa antes de confirmar. */
  fantasma?: boolean;
};

export function Poblado({ posicion, color, fantasma = false }: PiezaProps) {
  const borde = oscurecer(color);
  return (
    <g transform={`translate(${posicion.x} ${posicion.y})`} opacity={fantasma ? 0.72 : 1}>
      <polygon
        points="0,-0.22 0.19,-0.06 0.19,0.16 -0.19,0.16 -0.19,-0.06"
        fill={color}
        stroke={borde}
        strokeWidth="0.04"
        strokeLinejoin="round"
      />
      <polygon points="0,-0.22 0.19,-0.06 0,-0.1" fill="#fff" opacity="0.28" />
      <rect x="-0.035" y="0.04" width="0.07" height="0.12" fill={borde} />
    </g>
  );
}

export function Ciudad({ posicion, color, fantasma = false }: PiezaProps) {
  const borde = oscurecer(color);
  return (
    <g transform={`translate(${posicion.x} ${posicion.y})`} opacity={fantasma ? 0.72 : 1}>
      <polygon
        points="-0.27,0.17 -0.27,-0.04 -0.12,-0.16 0.03,-0.04 0.03,0.17"
        fill={color}
        stroke={borde}
        strokeWidth="0.04"
        strokeLinejoin="round"
      />
      <rect
        x="0.03"
        y="-0.12"
        width="0.24"
        height="0.29"
        fill={color}
        stroke={borde}
        strokeWidth="0.04"
        strokeLinejoin="round"
      />
      <rect x="0.03" y="-0.2" width="0.24" height="0.08" fill={borde} />
      <rect x="0.11" y="-0.02" width="0.08" height="0.08" fill="#fff6d1" />
      <rect x="-0.17" y="0.04" width="0.07" height="0.13" fill={borde} />
    </g>
  );
}

type CaminoProps = {
  desde: Punto;
  hasta: Punto;
  color: string;
  fantasma?: boolean;
};

/** Un camino entre dos vértices, acortado en los extremos para no tapar los edificios. */
export function Camino({ desde, hasta, color, fantasma = false }: CaminoProps) {
  const largo = Math.hypot(hasta.x - desde.x, hasta.y - desde.y) || 1;
  const recorte = 0.15 / largo;
  const a = {
    x: desde.x + (hasta.x - desde.x) * recorte,
    y: desde.y + (hasta.y - desde.y) * recorte,
  };
  const b = {
    x: hasta.x - (hasta.x - desde.x) * recorte,
    y: hasta.y - (hasta.y - desde.y) * recorte,
  };
  return (
    <g opacity={fantasma ? 0.72 : 1} strokeLinecap="round">
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={oscurecer(color)} strokeWidth="0.19" />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth="0.12" />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fff" strokeWidth="0.03" opacity="0.3" />
    </g>
  );
}

/** El ladrón: una figura oscura con capucha, apoyada sobre la casilla. */
export function Ladron({ posicion }: { posicion: Punto }) {
  return (
    <g transform={`translate(${posicion.x} ${posicion.y})`}>
      <title>Ladrón</title>
      <ellipse cx="0" cy="0.18" rx="0.16" ry="0.05" fill="#000" opacity="0.28" />
      <path
        d="M-0.14 0.16 Q-0.14 -0.02 0 -0.08 Q0.14 -0.02 0.14 0.16 Z"
        fill="#232a35"
        stroke="#0e1218"
        strokeWidth="0.025"
      />
      <circle cx="0" cy="-0.16" r="0.09" fill="#232a35" stroke="#0e1218" strokeWidth="0.025" />
      <ellipse cx="0" cy="-0.15" rx="0.045" ry="0.035" fill="#8fd3cf" opacity="0.75" />
    </g>
  );
}

type PuertoProps = {
  borde: Punto;
  mar: Punto;
  tipo: 'GENERICO' | Recurso;
};

/** Un puerto: un barquito en el mar atado a la costa, con su razón de cambio. */
export function Puerto({ borde, mar, tipo }: PuertoProps) {
  const etiqueta = tipo === 'GENERICO' ? '3:1' : '2:1';
  return (
    <g>
      <line
        x1={borde.x}
        y1={borde.y}
        x2={mar.x}
        y2={mar.y}
        stroke="#c9a56a"
        strokeWidth="0.05"
        strokeDasharray="0.07 0.05"
      />
      <g transform={`translate(${mar.x} ${mar.y})`}>
        <path
          d="M-0.26 0.06 H0.26 L0.17 0.2 H-0.17 Z"
          fill="#7a4a24"
          stroke="#4a2c12"
          strokeWidth="0.025"
          strokeLinejoin="round"
        />
        <line x1="0" y1="0.06" x2="0" y2="-0.3" stroke="#4a2c12" strokeWidth="0.03" />
        <polygon
          points="0.02,-0.28 0.2,0.02 0.02,0.02"
          fill="#fdf7e6"
          stroke="#bda97a"
          strokeWidth="0.02"
        />
        <polygon
          points="-0.02,-0.2 -0.18,0.02 -0.02,0.02"
          fill="#f2e6c4"
          stroke="#bda97a"
          strokeWidth="0.02"
        />
        <rect
          x="-0.17"
          y="0.21"
          width="0.34"
          height="0.15"
          rx="0.07"
          fill="#0c3340"
          opacity="0.85"
        />
        <text x="0" y="0.325" textAnchor="middle" fontSize="0.12" fontWeight="800" fill="#fff">
          {etiqueta}
        </text>
        {tipo !== 'GENERICO' && (
          <g transform="translate(-0.13 -0.43)">
            <circle
              cx="0.13"
              cy="0.13"
              r="0.15"
              fill="#fbf3dc"
              stroke="#8a7a52"
              strokeWidth="0.02"
            />
            <g transform="translate(0.015 0.015)">
              <IconoRecurso recurso={tipo} tamano={0.23} />
            </g>
          </g>
        )}
      </g>
    </g>
  );
}
