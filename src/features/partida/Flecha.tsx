/** Verde y rojo de las flechas del comercio: recibir y dar. */
export const VERDE = '#2f9d5b';
export const ROJO = '#d23b2a';

/**
 * Una flecha verde hacia abajo (recibes) o roja hacia arriba (das). El color no es la única señal:
 * quien la usa añade el texto («recibe», «da», «Pido», «Doy»).
 */
export function Flecha({ recibe }: { recibe: boolean }) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" className="shrink-0">
      <path
        d={recibe ? 'M10 3v12M4.5 10 10 16l5.5-6' : 'M10 17V5M4.5 10 10 4l5.5 6'}
        fill="none"
        stroke={recibe ? VERDE : ROJO}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
