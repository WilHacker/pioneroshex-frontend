import { ZOOM_MAX } from '@/lib/zoom';

type Props = {
  /** 1 es el tablero entero. */
  nivel: number;
  onAcercar: () => void;
  onAlejar: () => void;
  onVerTodo: () => void;
};

const EPSILON = 1e-6;

const BOTON =
  'flex size-10 items-center justify-center rounded-full bg-niebla/90 text-xl font-extrabold text-tinta shadow-lg ring-2 ring-white/70 transition enabled:hover:scale-110 disabled:opacity-40';

/** Tres botones para acercar, alejar y volver a ver todo el tablero (además de rueda y gestos). */
export function ControlesDeZoom({ nivel, onAcercar, onAlejar, onVerTodo }: Props) {
  const alMaximo = nivel >= ZOOM_MAX - EPSILON;
  const completo = nivel <= 1 + EPSILON;
  return (
    <div className="absolute bottom-1 left-1 z-10 flex flex-col gap-1.5">
      <button
        type="button"
        aria-label="Acercar"
        title="Acercar"
        disabled={alMaximo}
        onClick={onAcercar}
        className={BOTON}
      >
        +
      </button>
      <button
        type="button"
        aria-label="Alejar"
        title="Alejar"
        disabled={completo}
        onClick={onAlejar}
        className={BOTON}
      >
        −
      </button>
      <button
        type="button"
        aria-label="Ver todo el tablero"
        title="Ver todo el tablero"
        disabled={completo}
        onClick={onVerTodo}
        className={`${BOTON} text-base`}
      >
        ⤢
      </button>
    </div>
  );
}
