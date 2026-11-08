import { archivoDePieza } from '@/lib/piezas';

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

/**
 * Las piezas de construcción como iconos de interfaz, en un cuadro de 32 por 32: el mismo arte del
 * tablero en el color del jugador. La carta de desarrollo es su reverso morado.
 */
export function IconoPieza({ pieza, color, tamano = 28 }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={tamano} height={tamano} role="img" aria-label={NOMBRES[pieza]}>
      {pieza === 'CAMINO' && (
        <g transform="rotate(-55 16 16)">
          <image href={archivoDePieza('camino', color)} x="13.4" y="2" width="5.2" height="28" />
        </g>
      )}
      {pieza === 'POBLADO' && (
        <image href={archivoDePieza('poblado', color)} x="1" y="1" width="30" height="30" />
      )}
      {pieza === 'CIUDAD' && (
        <image href={archivoDePieza('ciudad', color)} x="1" y="1" width="30" height="30" />
      )}
      {pieza === 'CARTA' && (
        <image href="/cartas/reverso-desarrollo.svg" x="5" y="1" width="22" height="30" />
      )}
    </svg>
  );
}
