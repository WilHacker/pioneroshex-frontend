import type { CSSProperties } from 'react';
import { PUNTOS } from './Dado';

type Props = {
  /** Cara 1 a 6, o `null` para un dado sin tirar. */
  valor: number | null;
  tamano?: number;
  /** 1 o -1: cada dado rueda hacia un lado distinto para que no giren iguales. */
  giro?: 1 | -1;
};

/** Cada cara del cubo: la cara opuesta a otra suma siempre 7 (1-6, 2-5, 3-4). */
const CARAS: readonly { readonly valor: number; readonly giro: string }[] = [
  { valor: 1, giro: 'rotateY(0deg)' },
  { valor: 6, giro: 'rotateY(180deg)' },
  { valor: 3, giro: 'rotateY(90deg)' },
  { valor: 4, giro: 'rotateY(-90deg)' },
  { valor: 2, giro: 'rotateX(90deg)' },
  { valor: 5, giro: 'rotateX(-90deg)' },
];

/** Cuánto hay que girar el cubo para que la cara `valor` mire al jugador: `[x, y]` en grados. */
export const ORIENTACION: Readonly<Record<number, readonly [number, number]>> = {
  1: [0, 0],
  6: [0, 180],
  3: [0, -90],
  4: [0, 90],
  2: [-90, 0],
  5: [90, 0],
};

/** Las caras más alejadas de la luz se ven más oscuras, para dar volumen. */
const SOMBRA: Record<number, string> = {
  1: 'brightness(1)',
  6: 'brightness(0.78)',
  3: 'brightness(0.9)',
  4: 'brightness(0.84)',
  2: 'brightness(1.04)',
  5: 'brightness(0.72)',
};

function Cara({
  valor,
  giro,
  mitad,
  sinTirar,
}: {
  valor: number;
  giro: string;
  mitad: number;
  sinTirar: boolean;
}) {
  const puntos = PUNTOS[valor] ?? [];
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 rounded-[18%] border border-[#8aa09c] bg-gradient-to-br from-white to-[#dce6e4] [backface-visibility:hidden]"
      style={{ transform: `${giro} translateZ(${mitad}px)`, filter: SOMBRA[valor] }}
    >
      <svg viewBox="0 0 48 48" className="size-full">
        {sinTirar && valor === 1 ? (
          <text x="24" y="33" textAnchor="middle" fontSize="28" fontWeight="800" fill="#12312f">
            ?
          </text>
        ) : (
          puntos.map(([columna, fila]) => (
            <circle
              key={`${columna}-${fila}`}
              cx={12 + columna * 12}
              cy={12 + fila * 12}
              r="4.2"
              fill="#12312f"
            />
          ))
        )}
      </svg>
    </div>
  );
}

/**
 * Un dado de verdad: un cubo que rueda hasta mostrar su cara. Al volver a montarlo (con otra
 * `key`) vuelve a rodar. Sin valor muestra un dado con un interrogante.
 */
export function Dado3D({ valor, tamano = 64, giro = 1 }: Props) {
  const [x, y] = ORIENTACION[valor ?? 1] ?? ORIENTACION[1]!;
  const estiloCubo = {
    '--fx': `${x}deg`,
    '--fy': `${y}deg`,
    '--giro': giro,
    transformStyle: 'preserve-3d',
  } as CSSProperties;

  return (
    <div
      role="img"
      aria-label={valor === null ? 'Dado sin tirar' : `Dado: ${valor}`}
      style={{ width: tamano, height: tamano, perspective: tamano * 6 }}
    >
      <div
        className="size-full"
        style={{ transformStyle: 'preserve-3d', transform: 'rotateX(-24deg) rotateY(-30deg)' }}
      >
        <div className="dado3d-cubo relative size-full" style={estiloCubo}>
          {CARAS.map((c) => (
            <Cara
              key={c.valor}
              valor={c.valor}
              giro={c.giro}
              mitad={tamano / 2}
              sinTirar={valor === null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
