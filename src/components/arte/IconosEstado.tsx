import type { Carta } from '@/lib/esquemas';

/** Iconos pequeños propios (cuadro de 32 por 32) para cartas de desarrollo y estadísticas. */

type IconoProps = {
  tamano?: number;
  /** Texto para lectores de pantalla; si falta, el icono es decorativo. */
  etiqueta?: string;
};

function Base({ tamano = 24, etiqueta, children }: IconoProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={tamano}
      height={tamano}
      role={etiqueta ? 'img' : undefined}
      aria-label={etiqueta}
      aria-hidden={etiqueta ? undefined : true}
    >
      {children}
    </svg>
  );
}

/** Un casco con visera: los caballeros. */
export function IconoCaballero(props: IconoProps) {
  return (
    <Base {...props}>
      <path
        d="M5 20 C5 10 11 5 17 5 C23 5 27 10 27 17 L27 24 H5 Z"
        fill="#9aa8bb"
        stroke="#5d6b7e"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M5 17 H27 V21 H5 Z" fill="#3a4658" />
      <rect x="14" y="17" width="4" height="7" fill="#3a4658" />
      <path d="M17 5 C19 1 24 1 26 3 C23 3 21 5 21 7" fill="#e0344f" />
      <path
        d="M8 12 C9 9 12 7 14 7"
        fill="none"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.6"
      />
    </Base>
  );
}

/** Una carta de recursos de espaldas: la mano de un rival. */
export function IconoCartaMano(props: IconoProps) {
  return (
    <Base {...props}>
      <rect
        x="7"
        y="3"
        width="18"
        height="26"
        rx="3"
        fill="#2f6fe0"
        stroke="#1d4aa6"
        strokeWidth="1.5"
      />
      <rect
        x="10"
        y="6"
        width="12"
        height="20"
        rx="2"
        fill="none"
        stroke="#9db8f2"
        strokeWidth="1.2"
      />
      <circle cx="16" cy="16" r="3" fill="#9db8f2" />
    </Base>
  );
}

/** Dos tramos de camino: la longitud de la ruta o construcción de carreteras. */
export function IconoRuta(props: IconoProps) {
  return (
    <Base {...props}>
      <g strokeLinecap="round">
        <line x1="4" y1="24" x2="16" y2="10" stroke="#5a3d22" strokeWidth="7" />
        <line x1="4" y1="24" x2="16" y2="10" stroke="#c9a56a" strokeWidth="4.4" />
        <line x1="16" y1="24" x2="28" y2="10" stroke="#5a3d22" strokeWidth="7" />
        <line x1="16" y1="24" x2="28" y2="10" stroke="#c9a56a" strokeWidth="4.4" />
      </g>
    </Base>
  );
}

export function IconoEstrella(props: IconoProps) {
  return (
    <Base {...props}>
      <polygon
        points="16,3 19.6,11.6 29,12.4 21.8,18.6 24.1,27.8 16,22.9 7.9,27.8 10.2,18.6 3,12.4 12.4,11.6"
        fill="#f2b233"
        stroke="#b9801a"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </Base>
  );
}

function Moneda({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y + 2} rx="9" ry="4" fill="#b9801a" />
      <ellipse cx={x} cy={y} rx="9" ry="4" fill="#f2b233" stroke="#b9801a" strokeWidth="1" />
    </g>
  );
}

/** El dibujo de cada carta de desarrollo. */
export function IconoDesarrollo({ carta, ...props }: IconoProps & { carta: Carta }) {
  switch (carta) {
    case 'CABALLERO':
      return <IconoCaballero {...props} />;
    case 'CONSTRUCCION_CARRETERAS':
      return <IconoRuta {...props} />;
    case 'PUNTO_VICTORIA':
      return <IconoEstrella {...props} />;
    case 'MONOPOLIO':
      return (
        <Base {...props}>
          <Moneda x={16} y={24} />
          <Moneda x={16} y={18} />
          <Moneda x={16} y={12} />
          <path d="M16 3 L18.2 8 H13.8 Z" fill="#e0344f" />
        </Base>
      );
    case 'ABUNDANCIA':
      return (
        <Base {...props}>
          <g transform="rotate(-14 12 18)">
            <rect
              x="4"
              y="8"
              width="13"
              height="19"
              rx="2.5"
              fill="#3f8f52"
              stroke="#256b37"
              strokeWidth="1.2"
            />
          </g>
          <g transform="rotate(14 20 18)">
            <rect
              x="15"
              y="8"
              width="13"
              height="19"
              rx="2.5"
              fill="#efc94c"
              stroke="#c39b21"
              strokeWidth="1.2"
            />
          </g>
          <path
            d="M16 2 L17.5 5.5 L21 6 L18.2 8.2 L19 12 L16 10 L13 12 L13.8 8.2 L11 6 L14.5 5.5 Z"
            fill="#fff"
            stroke="#f2b233"
            strokeWidth="0.9"
          />
        </Base>
      );
  }
}

export const NOMBRE_DESARROLLO: Record<Carta, string> = {
  CABALLERO: 'Caballero',
  CONSTRUCCION_CARRETERAS: 'Construcción de carreteras',
  ABUNDANCIA: 'Abundancia',
  MONOPOLIO: 'Monopolio',
  PUNTO_VICTORIA: 'Punto de victoria',
};

export type TipoAccionIcono =
  'ACEPTAR' | 'RECHAZAR' | 'INTERCAMBIO' | 'ESPERA' | 'SONIDO' | 'SILENCIO' | 'SALIR';

/** Iconos de botones: usan el color del texto (`currentColor`) para adaptarse a cada fondo. */
export function IconoAccion({ tipo, tamano = 22 }: { tipo: TipoAccionIcono; tamano?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamano}
      height={tamano}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {tipo === 'ACEPTAR' && <path d="M4 12.5 L9.5 18 L20 6" />}
      {tipo === 'RECHAZAR' && <path d="M6 6 L18 18 M18 6 L6 18" />}
      {tipo === 'INTERCAMBIO' && (
        <path d="M4 8 H18 M14 4 L18 8 L14 12 M20 16 H6 M10 12 L6 16 L10 20" />
      )}
      {tipo === 'ESPERA' && (
        <path
          d="M7 3 H17 M7 21 H17 M8 3 C8 9 16 9 16 12 C16 15 8 15 8 21 M16 3 C16 9 8 9 8 12 C8 15 16 15 16 21"
          strokeWidth="2"
        />
      )}
      {tipo === 'SONIDO' && (
        <path
          d="M4 9 H8 L13 4 V20 L8 15 H4 Z M17 8.5 C19 10.5 19 13.5 17 15.5 M19.5 5.5 C23 9 23 15 19.5 18.5"
          strokeWidth="2"
        />
      )}
      {tipo === 'SILENCIO' && (
        <path d="M4 9 H8 L13 4 V20 L8 15 H4 Z M17 9 L22 15 M22 9 L17 15" strokeWidth="2" />
      )}
      {tipo === 'SALIR' && (
        <path d="M10 4 H5 V20 H10 M14 8 L19 12 L14 16 M19 12 H9" strokeWidth="2" />
      )}
    </svg>
  );
}
