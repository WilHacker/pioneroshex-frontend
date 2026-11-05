import { useState } from 'react';
import { IconoDesarrollo, NOMBRE_DESARROLLO } from '@/components/arte/IconosEstado';
import { RECURSOS, type Carta, type Recurso, type Vista } from '@/lib/esquemas';
import { NOMBRE_RECURSO } from '@/lib/mensajes';
import { CartaRecurso } from './CartaRecurso';
import type { Modo } from './logica';

type Props = {
  vista: Vista;
  /** Puedo jugar una carta ahora (es mi turno y la fase lo permite). */
  puedeJugar: boolean;
  onModo: (modo: Modo) => void;
  onAccion: (accion: object) => void;
};

const SIN_CARTAS: readonly Carta[] = [];
const ORDEN: readonly Carta[] = [
  'CABALLERO',
  'CONSTRUCCION_CARRETERAS',
  'ABUNDANCIA',
  'MONOPOLIO',
  'PUNTO_VICTORIA',
];
const FONDO: Record<Carta, string> = {
  CABALLERO: '#c9d3df',
  CONSTRUCCION_CARRETERAS: '#ecd9b0',
  ABUNDANCIA: '#d9c6f0',
  MONOPOLIO: '#f6dc9a',
  PUNTO_VICTORIA: '#fbe9a8',
};

/** Cuántos recursos hay que elegir al jugar la carta, o `null` si se juega sobre el tablero. */
const ELECCIONES: Partial<Record<Carta, number>> = { MONOPOLIO: 1, ABUNDANCIA: 2 };

type SelectorProps = {
  carta: Carta;
  cuantos: number;
  onElegir: (recursos: Recurso[]) => void;
  onCerrar: () => void;
};

/** Los cinco recursos para elegir (uno para el monopolio, dos para la abundancia). */
function SelectorDeRecursos({ carta, cuantos, onElegir, onCerrar }: SelectorProps) {
  const [elegidos, setElegidos] = useState<Recurso[]>([]);
  const elegir = (r: Recurso): void => {
    const nuevos = [...elegidos, r];
    if (nuevos.length === cuantos) {
      onElegir(nuevos);
      return;
    }
    setElegidos(nuevos);
  };
  return (
    <fieldset className="absolute bottom-full left-0 z-30 mb-3 flex items-center gap-2 rounded-2xl border-2 border-azafran bg-niebla p-2 shadow-2xl">
      <legend className="sr-only">
        {NOMBRE_DESARROLLO[carta]}: elige {cuantos === 1 ? 'un recurso' : `${cuantos} recursos`}
      </legend>
      {RECURSOS.map((r) => (
        <CartaRecurso
          key={r}
          recurso={r}
          tamano="pequena"
          elegida={elegidos.includes(r)}
          etiqueta={`Elegir ${NOMBRE_RECURSO[r]}`}
          onClick={() => elegir(r)}
        />
      ))}
      <button
        type="button"
        aria-label="Cancelar"
        onClick={onCerrar}
        className="size-8 rounded-full bg-white font-extrabold text-tinta hover:bg-azafran-claro"
      >
        ×
      </button>
    </fieldset>
  );
}

/** Mis cartas de desarrollo en la mano: tocar una la juega (o pide elegir sitio o recursos). */
export function CartasDesarrollo({ vista, puedeJugar, onModo, onAccion }: Props) {
  const [eligiendo, setEligiendo] = useState<Carta | null>(null);
  const cartas = vista.jugadores.find((j) => j.id === vista.yo)?.cartasDesarrollo ?? SIN_CARTAS;
  const cuenta = (carta: Carta): number => cartas.filter((c) => c === carta).length;
  const tengo = ORDEN.filter((c) => cuenta(c) > 0);
  if (tengo.length === 0) return null;

  const jugar = (carta: Carta): void => {
    if (carta === 'CABALLERO') onModo('CABALLERO');
    else if (carta === 'CONSTRUCCION_CARRETERAS') onModo('CARRETERAS');
    else setEligiendo(carta);
  };

  const elegidosListos = (carta: Carta, recursos: Recurso[]): void => {
    setEligiendo(null);
    if (carta === 'MONOPOLIO') onAccion({ tipo: 'JUGAR_MONOPOLIO', recurso: recursos[0] });
    else onAccion({ tipo: 'JUGAR_ABUNDANCIA', recursos: [recursos[0], recursos[1]] });
  };

  return (
    <div className="relative">
      {eligiendo && ELECCIONES[eligiendo] && (
        <SelectorDeRecursos
          carta={eligiendo}
          cuantos={ELECCIONES[eligiendo]}
          onElegir={(r) => elegidosListos(eligiendo, r)}
          onCerrar={() => setEligiendo(null)}
        />
      )}
      <ul aria-label="Cartas de desarrollo" className="flex items-end gap-1">
        {tengo.map((carta) => {
          const jugable = carta !== 'PUNTO_VICTORIA' && puedeJugar;
          const nombre = `${NOMBRE_DESARROLLO[carta]} ×${cuenta(carta)}`;
          const caja = `relative flex h-[4.6rem] w-[3.3rem] flex-col items-center justify-center rounded-xl border-2 border-white/70 shadow-md transition ${jugable ? 'cursor-pointer hover:-translate-y-1' : 'opacity-70'}`;
          const contenido = (
            <>
              <IconoDesarrollo carta={carta} tamano={34} />
              <span className="absolute -top-2 -right-2 flex min-w-6 items-center justify-center rounded-full bg-tinta px-1 text-xs font-extrabold text-white ring-2 ring-white">
                {cuenta(carta)}
              </span>
            </>
          );
          return (
            <li key={carta}>
              {carta === 'PUNTO_VICTORIA' ? (
                <div
                  role="img"
                  aria-label={`${nombre} (cuenta sola)`}
                  title={nombre}
                  className={caja}
                  style={{ backgroundColor: FONDO[carta] }}
                >
                  {contenido}
                </div>
              ) : (
                <button
                  type="button"
                  aria-label={`Jugar ${nombre}`}
                  title={nombre}
                  disabled={!jugable}
                  onClick={() => jugar(carta)}
                  className={caja}
                  style={{ backgroundColor: FONDO[carta] }}
                >
                  {contenido}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
