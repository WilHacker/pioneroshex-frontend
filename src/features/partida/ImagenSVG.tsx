/**
 * El tablero mide ~12 unidades de ancho: una `<image>` de menos de una unidad se rasteriza a menos
 * de un píxel y no se ve. Se dibuja en un espacio 100 veces mayor y se reduce con `scale`.
 */
const AMPLIACION = 100;

type Props = {
  src: string;
  /** Centro de la imagen, en unidades del tablero. */
  centroX: number;
  centroY: number;
  ancho: number;
  alto: number;
};

/** Una imagen decorativa (un SVG de `public/`) centrada en un punto del tablero. */
export function ImagenSVG({ src, centroX, centroY, ancho, alto }: Props) {
  return (
    <g transform={`translate(${centroX} ${centroY}) scale(${1 / AMPLIACION})`}>
      <image
        href={src}
        x={(-ancho * AMPLIACION) / 2}
        y={(-alto * AMPLIACION) / 2}
        width={ancho * AMPLIACION}
        height={alto * AMPLIACION}
        aria-hidden="true"
      />
    </g>
  );
}
