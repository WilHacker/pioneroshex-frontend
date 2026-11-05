type Props = {
  /** Cara 1 a 6, o `null` para un dado sin tirar. */
  valor: number | null;
  tamano?: number;
};

/** Posición de los puntos de cada cara, en una cuadrícula de 3 por 3. */
export const PUNTOS: Record<number, readonly (readonly [number, number])[]> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [2, 0],
    [0, 2],
    [2, 2],
  ],
  5: [
    [0, 0],
    [2, 0],
    [1, 1],
    [0, 2],
    [2, 2],
  ],
  6: [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2],
  ],
};

/** Una cara de dado dibujada en SVG. Sin valor muestra el dado en blanco. */
export function Dado({ valor, tamano = 56 }: Props) {
  const puntos = valor === null ? [] : (PUNTOS[valor] ?? []);
  return (
    <svg
      viewBox="0 0 48 48"
      width={tamano}
      height={tamano}
      role="img"
      aria-label={valor === null ? 'Dado sin tirar' : `Dado: ${valor}`}
    >
      <rect x="3" y="4" width="42" height="42" rx="9" fill="#b7c6c3" />
      <rect
        x="3"
        y="2"
        width="42"
        height="42"
        rx="9"
        fill="#fbfdfc"
        stroke="#8aa09c"
        strokeWidth="1.5"
      />
      <rect x="6" y="5" width="36" height="14" rx="7" fill="#ffffff" opacity="0.7" />
      {puntos.map(([columna, fila]) => (
        <circle
          key={`${columna}-${fila}`}
          cx={12 + columna * 12}
          cy={11 + fila * 12}
          r="3.6"
          fill="#12312f"
        />
      ))}
    </svg>
  );
}
