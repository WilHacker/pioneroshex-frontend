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

/** El dibujo de cada recurso: los SVG de `public/recursos/`, el mismo que lleva cada casilla. */
const ARCHIVO: Record<Recurso, string> = {
  MADERA: '/recursos/madera.svg',
  LADRILLO: '/recursos/ladrillo.svg',
  OVEJA: '/recursos/oveja.svg',
  TRIGO: '/recursos/trigo.svg',
  MINERAL: '/recursos/mineral.svg',
};

const NOMBRES: Record<Recurso, string> = {
  MADERA: 'Madera',
  LADRILLO: 'Ladrillo',
  OVEJA: 'Oveja',
  TRIGO: 'Trigo',
  MINERAL: 'Mineral',
};

/**
 * El dibujo de un recurso, sin fondo. Para listas, costos y el registro. Va en un cuadro de 32 por
 * 32 (el dibujo se centra y conserva su proporción), así sirve igual en HTML que dentro del tablero.
 */
export function IconoRecurso({ recurso, tamano = 24 }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={tamano}
      height={tamano}
      role="img"
      aria-label={NOMBRES[recurso]}
    >
      <image href={ARCHIVO[recurso]} x="0" y="0" width="32" height="32" />
    </svg>
  );
}
