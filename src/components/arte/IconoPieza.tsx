export type TipoPieza = 'CAMINO' | 'POBLADO' | 'CIUDAD' | 'CARTA';

type Props = {
  pieza: TipoPieza;
  color: string;
  tamano?: number;
};

const NOMBRES: Record<TipoPieza, string> = {
  CAMINO: 'Camino',
  POBLADO: 'Poblado',
  CIUDAD: 'Ciudad',
  CARTA: 'Carta de desarrollo',
};

/** Oscurece un color `#rrggbb` para dar el borde de la pieza. */
export function oscurecer(color: string, factor = 0.62): string {
  const canal = (i: number): string =>
    Math.round(parseInt(color.slice(1 + i * 2, 3 + i * 2), 16) * factor)
      .toString(16)
      .padStart(2, '0');
  return `#${canal(0)}${canal(1)}${canal(2)}`;
}

/** Las piezas de construcción como iconos de interfaz, en un cuadro de 32 por 32. */
export function IconoPieza({ pieza, color, tamano = 28 }: Props) {
  const borde = oscurecer(color);
  return (
    <svg viewBox="0 0 32 32" width={tamano} height={tamano} role="img" aria-label={NOMBRES[pieza]}>
      {pieza === 'CAMINO' && (
        <g transform="rotate(-35 16 16)">
          <rect x="2" y="11.5" width="28" height="9" rx="2.5" fill={borde} />
          <rect x="3" y="12.5" width="26" height="7" rx="2" fill={color} />
          <rect x="4.5" y="13.2" width="23" height="2" rx="1" fill="#ffffff" opacity="0.28" />
        </g>
      )}
      {pieza === 'POBLADO' && (
        <>
          <polygon points="16,3 28,13 28,28 4,28 4,13" fill={borde} />
          <polygon points="16,5.5 26,14 26,26 6,26 6,14" fill={color} />
          <rect x="13" y="17" width="6" height="9" rx="1" fill={borde} />
          <polygon points="16,5.5 26,14 16,12" fill="#ffffff" opacity="0.25" />
        </>
      )}
      {pieza === 'CIUDAD' && (
        <>
          <polygon points="2,28 2,15 10,9 18,15 18,28" fill={borde} />
          <polygon points="4,26 4,16 10,11.5 16,16 16,26" fill={color} />
          <rect x="18" y="12" width="12" height="16" fill={borde} />
          <rect x="20" y="14" width="8" height="12" fill={color} />
          <rect x="18" y="8" width="12" height="4" fill={borde} />
          <rect x="22" y="17" width="3" height="3.5" fill="#fff6d1" />
          <rect x="7" y="19" width="4" height="7" rx="1" fill={borde} />
        </>
      )}
      {pieza === 'CARTA' && (
        <>
          <rect x="6" y="2" width="20" height="28" rx="3.5" fill={borde} />
          <rect x="7.5" y="3.5" width="17" height="25" rx="2.5" fill={color} />
          <circle cx="16" cy="16" r="6" fill="#ffffff" opacity="0.9" />
          <path
            d="M13.5 14.2a2.6 2.6 0 1 1 3.6 2.4c-.8.4-1.1.8-1.1 1.6"
            fill="none"
            stroke={borde}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="16" cy="20.4" r="0.95" fill={borde} />
        </>
      )}
    </svg>
  );
}
