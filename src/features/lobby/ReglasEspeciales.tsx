import Image from 'next/image';
import type { ReactNode } from 'react';
import { Dado } from '@/components/arte/Dado';
import type { OpcionesDeSala } from '@/lib/esquemas';
import type { CambiosDeSala } from './OpcionesSala';

type Regla = {
  /** Campo de las opciones de la sala que activa o apaga esta regla. */
  clave: 'ladronAmistoso' | 'arranqueProtegido' | 'ocultarBanco' | 'manosVisibles';
  titulo: string;
  descripcion: string;
  icono: ReactNode;
};

/** Las reglas que se activan o apagan, cada una con su explicación a la vista. */
const REGLAS: readonly Regla[] = [
  {
    clave: 'ladronAmistoso',
    titulo: 'Ladrón amistoso',
    descripcion: 'No se puede robar a jugadores con menos de 3 puntos de victoria.',
    icono: (
      <Image
        src="/tablero/ladron.svg"
        alt=""
        width={36}
        height={44}
        unoptimized
        className="h-11 w-9 shrink-0"
      />
    ),
  },
  {
    clave: 'arranqueProtegido',
    titulo: 'Arranque protegido',
    descripcion:
      'Sin 7 en las dos primeras rondas: nadie pierde cartas ni mueve el ladrón al empezar.',
    icono: (
      <span className="size-10 shrink-0">
        <Dado valor={6} tamano={40} />
      </span>
    ),
  },
  {
    clave: 'ocultarBanco',
    titulo: 'Ocultar cartas del Banco',
    descripcion: 'No se muestra cuántas cartas quedan en el Banco ni en el mazo de desarrollo.',
    icono: (
      <Image
        src="/cartas/reverso-recursos.svg"
        alt=""
        width={32}
        height={44}
        unoptimized
        className="h-11 w-8 shrink-0"
      />
    ),
  },
  {
    clave: 'manosVisibles',
    titulo: 'Cartas a la vista',
    descripcion:
      'Todos ven las cartas de recursos de todos. Las de desarrollo siguen siendo secretas.',
    icono: (
      <Image
        src="/cartas/madera.svg"
        alt=""
        width={32}
        height={44}
        unoptimized
        className="h-11 w-8 shrink-0"
      />
    ),
  },
];

type Props = {
  opciones: OpcionesDeSala;
  /** Solo el anfitrión, y solo antes de empezar. */
  editable: boolean;
  onCambiar: (cambios: CambiosDeSala) => void;
};

/**
 * Reglas para jugar distinto, como cartas que se encienden y se apagan. La explicación va dentro de
 * cada carta (no escondida en un aviso): así se entiende qué se está eligiendo.
 */
export function ReglasEspeciales({ opciones, editable, onCambiar }: Props) {
  return (
    <fieldset aria-label="Reglas especiales" className="flex flex-col gap-1.5 sm:col-span-2">
      <legend className="mb-1.5 text-sm font-extrabold">Reglas especiales</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {REGLAS.map((regla) => {
          const activa = opciones[regla.clave] === true;
          const idDescripcion = `regla-${regla.clave}`;
          return (
            <button
              key={regla.clave}
              type="button"
              aria-pressed={activa}
              aria-describedby={idDescripcion}
              disabled={!editable}
              onClick={() => onCambiar({ [regla.clave]: !activa })}
              className={`flex items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition enabled:hover:-translate-y-0.5 disabled:cursor-default ${
                activa
                  ? 'border-azafran bg-azafran/25 shadow'
                  : 'border-tinta/15 bg-white/60 disabled:opacity-60'
              }`}
            >
              {regla.icono}
              <span className="flex min-w-0 flex-col">
                <span className="font-extrabold">{regla.titulo}</span>
                <span id={idDescripcion} className="text-xs leading-snug text-tinta/75">
                  {regla.descripcion}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
