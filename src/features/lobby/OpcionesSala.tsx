import type { ReactNode } from 'react';
import type { OpcionesDeSala } from '@/lib/esquemas';

/** Lo que el anfitrión puede cambiar: la visibilidad de la sala y las reglas de la partida. */
export type CambiosDeSala = OpcionesDeSala & { publica?: boolean };

const PUNTOS = [8, 10, 12, 15] as const;
/** Segundos por turno; 0 es sin límite. Los mismos valores que acepta el servidor. */
const TIEMPOS = [
  { segundos: 0, etiqueta: '∞', ayuda: 'Sin límite de tiempo' },
  { segundos: 30, etiqueta: '30 s', ayuda: '30 segundos por turno' },
  { segundos: 60, etiqueta: '1 min', ayuda: '1 minuto por turno' },
  { segundos: 90, etiqueta: '1:30', ayuda: 'Un minuto y medio por turno' },
  { segundos: 120, etiqueta: '2 min', ayuda: '2 minutos por turno' },
  { segundos: 180, etiqueta: '3 min', ayuda: '3 minutos por turno' },
] as const;
const DESCARTE = [7, 9] as const;
const PUNTOS_POR_DEFECTO = 10;
const DESCARTE_POR_DEFECTO = 7;
/** El modo de turnos B (construcción especial) solo existe con 5 o más jugadores. */
const JUGADORES_MODO_B = 5;

type Opcion<T> = {
  valor: T;
  etiqueta: ReactNode;
  ayuda?: string;
  deshabilitada?: boolean;
};

type GrupoProps<T extends string | number | boolean> = {
  titulo: string;
  valor: T;
  opciones: readonly Opcion<T>[];
  editable: boolean;
  onElegir: (valor: T) => void;
};

/** Una pregunta con respuestas cortas: se toca la que se quiere, como una carta. */
function Grupo<T extends string | number | boolean>({
  titulo,
  valor,
  opciones,
  editable,
  onElegir,
}: GrupoProps<T>) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-extrabold">{titulo}</legend>
      <div className="flex flex-wrap gap-2">
        {opciones.map((o) => {
          const elegida = o.valor === valor;
          return (
            <button
              key={String(o.valor)}
              type="button"
              aria-pressed={elegida}
              disabled={!editable || o.deshabilitada}
              title={o.ayuda}
              onClick={() => onElegir(o.valor)}
              className={`min-w-12 rounded-xl border-2 px-3 py-1.5 font-extrabold transition enabled:hover:-translate-y-0.5 disabled:cursor-default ${
                elegida
                  ? 'border-azafran bg-azafran text-tinta shadow'
                  : 'border-tinta/15 bg-white/60 text-tinta/80 disabled:opacity-60'
              }`}
            >
              {o.etiqueta}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

type Props = {
  opciones: OpcionesDeSala;
  publica: boolean;
  jugadores: number;
  /** Solo el anfitrión, y solo antes de empezar. */
  editable: boolean;
  onCambiar: (cambios: CambiosDeSala) => void;
};

/**
 * Las reglas de la partida como cartas para tocar. Los demás jugadores las ven igual, sin poder
 * cambiarlas. Lo que no se ha tocado muestra el valor por defecto del servidor.
 */
export function OpcionesSala({ opciones, publica, jugadores, editable, onCambiar }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Grupo
        titulo="Puntos para ganar"
        valor={opciones.puntosVictoria ?? PUNTOS_POR_DEFECTO}
        opciones={PUNTOS.map((p) => ({ valor: p, etiqueta: p }))}
        editable={editable}
        onElegir={(puntosVictoria) => onCambiar({ puntosVictoria })}
      />
      <Grupo
        titulo="Dados"
        valor={opciones.modoDados ?? 'AZAR'}
        opciones={[
          { valor: 'AZAR', etiqueta: 'Azar', ayuda: 'Cada tirada es independiente' },
          {
            valor: 'EQUILIBRADO',
            etiqueta: 'Parejo',
            ayuda: 'Cada 36 tiradas salen todas las combinaciones una vez',
          },
        ]}
        editable={editable}
        onElegir={(modoDados) => onCambiar({ modoDados })}
      />
      <Grupo
        titulo="Cartas antes de descartar"
        valor={opciones.robberHandLimit ?? DESCARTE_POR_DEFECTO}
        opciones={DESCARTE.map((c) => ({
          valor: c,
          etiqueta: c,
          ayuda: `Con más de ${c} cartas, un 7 te obliga a descartar`,
        }))}
        editable={editable}
        onElegir={(robberHandLimit) => onCambiar({ robberHandLimit })}
      />
      <Grupo
        titulo="Tiempo por turno"
        valor={opciones.turnoSegundos ?? 0}
        opciones={TIEMPOS.map((t) => ({
          valor: t.segundos,
          etiqueta: t.etiqueta,
          ayuda: `${t.ayuda}: si se acaba, el juego juega por ti`,
        }))}
        editable={editable}
        onElegir={(turnoSegundos) => onCambiar({ turnoSegundos })}
      />
      <Grupo
        titulo="Turnos"
        valor={opciones.turnRuleMode ?? 'A'}
        opciones={[
          { valor: 'A', etiqueta: 'A', ayuda: 'Un turno tras otro' },
          {
            valor: 'B',
            etiqueta: 'B',
            ayuda: 'Construcción especial entre turnos (desde 5 jugadores)',
            deshabilitada: jugadores < JUGADORES_MODO_B,
          },
        ]}
        editable={editable}
        onElegir={(turnRuleMode) => onCambiar({ turnRuleMode })}
      />
      <Grupo
        titulo="Sala"
        valor={publica}
        opciones={[
          { valor: false, etiqueta: 'Privada', ayuda: 'Solo entra quien tenga el enlace' },
          { valor: true, etiqueta: 'Pública', ayuda: 'Aparece en la lista de salas abiertas' },
        ]}
        editable={editable}
        onElegir={(esPublica) => onCambiar({ publica: esPublica })}
      />
    </div>
  );
}
