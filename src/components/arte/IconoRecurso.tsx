import type { Recurso } from '@/lib/esquemas';

/** Color de fondo de la carta de cada recurso. */
export const COLOR_RECURSO: Record<Recurso, { fondo: string; borde: string }> = {
  MADERA: { fondo: '#3f8f52', borde: '#256b37' },
  LADRILLO: { fondo: '#d4704a', borde: '#a2502f' },
  OVEJA: { fondo: '#a8d46f', borde: '#7ba645' },
  TRIGO: { fondo: '#efc94c', borde: '#c39b21' },
  MINERAL: { fondo: '#8796a8', borde: '#5f6e80' },
};

type Props = {
  recurso: Recurso;
  /** Lado en píxeles. */
  tamano?: number;
};

/** Un dibujo simple por recurso, en un cuadro de 32 por 32. Todo el arte es propio. */
function Dibujo({ recurso }: { recurso: Recurso }) {
  switch (recurso) {
    case 'MADERA':
      return (
        <>
          <ellipse cx="16" cy="17" rx="12" ry="9" fill="#9b6233" />
          <ellipse cx="16" cy="15" rx="12" ry="9" fill="#c98d52" />
          <ellipse cx="16" cy="15" rx="8" ry="5.8" fill="#e0b377" />
          <ellipse cx="16" cy="15" rx="4.2" ry="3" fill="none" stroke="#b27a42" strokeWidth="1.2" />
          <ellipse cx="16" cy="15" rx="1.2" ry="0.9" fill="#9b6233" />
        </>
      );
    case 'LADRILLO':
      return (
        <>
          <rect x="3" y="6" width="12.5" height="7.5" rx="1.2" fill="#f0a07c" />
          <rect x="16.5" y="6" width="12.5" height="7.5" rx="1.2" fill="#e8895f" />
          <rect x="9.5" y="14.5" width="13" height="7.5" rx="1.2" fill="#f0a07c" />
          <rect x="1" y="14.5" width="7.5" height="7.5" rx="1.2" fill="#e8895f" />
          <rect x="23.5" y="14.5" width="7.5" height="7.5" rx="1.2" fill="#e8895f" />
          <rect x="3" y="23" width="12.5" height="6" rx="1.2" fill="#e8895f" />
          <rect x="16.5" y="23" width="12.5" height="6" rx="1.2" fill="#f0a07c" />
        </>
      );
    case 'OVEJA':
      return (
        <>
          <circle cx="11" cy="14" r="6" fill="#ffffff" />
          <circle cx="17" cy="11" r="6.5" fill="#ffffff" />
          <circle cx="22" cy="15" r="6" fill="#ffffff" />
          <circle cx="15" cy="18" r="6" fill="#ffffff" />
          <ellipse cx="25.5" cy="19" rx="3.6" ry="4.4" fill="#3a3a44" />
          <circle cx="26.3" cy="18" r="0.8" fill="#ffffff" />
          <rect x="11" y="22" width="2.2" height="6" rx="1" fill="#3a3a44" />
          <rect x="18" y="22" width="2.2" height="6" rx="1" fill="#3a3a44" />
        </>
      );
    case 'TRIGO':
      return (
        <>
          <path d="M16 29 V8" stroke="#8a6a12" strokeWidth="1.6" strokeLinecap="round" />
          {[10, 15, 20].map((y) => (
            <g key={y}>
              <ellipse
                cx="12"
                cy={y}
                rx="3.6"
                ry="1.9"
                fill="#fff0a6"
                transform={`rotate(-35 12 ${y})`}
              />
              <ellipse
                cx="20"
                cy={y}
                rx="3.6"
                ry="1.9"
                fill="#fff0a6"
                transform={`rotate(35 20 ${y})`}
              />
            </g>
          ))}
          <ellipse cx="16" cy="6" rx="1.9" ry="3.2" fill="#fff0a6" />
        </>
      );
    case 'MINERAL':
      return (
        <>
          <polygon points="4,24 9,10 17,5 25,9 29,22 20,28 9,28" fill="#c5cfdb" />
          <polygon points="9,10 17,5 17,17 4,24" fill="#e3e9f0" />
          <polygon points="17,5 25,9 29,22 17,17" fill="#a3b0c0" />
          <polygon points="4,24 17,17 29,22 20,28 9,28" fill="#8796a8" />
        </>
      );
  }
}

const NOMBRES: Record<Recurso, string> = {
  MADERA: 'Madera',
  LADRILLO: 'Ladrillo',
  OVEJA: 'Oveja',
  TRIGO: 'Trigo',
  MINERAL: 'Mineral',
};

/** El dibujo de un recurso, sin fondo. Para listas, costos y el registro. */
export function IconoRecurso({ recurso, tamano = 24 }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={tamano}
      height={tamano}
      role="img"
      aria-label={NOMBRES[recurso]}
    >
      <Dibujo recurso={recurso} />
    </svg>
  );
}
