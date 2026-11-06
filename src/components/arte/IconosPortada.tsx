/** Iconos propios (cuadro de 32 por 32) para las cartas y los contadores de la portada. */

type Props = { tamano?: number };

function Base({ tamano = 32, children }: Props & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 32 32" width={tamano} height={tamano} aria-hidden="true">
      {children}
    </svg>
  );
}

/** Una cabeza y unos hombros: un jugador. */
export function IconoPersona(props: Props) {
  return (
    <Base {...props}>
      <circle cx="16" cy="11" r="5.5" fill="currentColor" />
      <path d="M5 28c0-6.4 4.9-10 11-10s11 3.6 11 10z" fill="currentColor" />
    </Base>
  );
}

/** Una persona con una estrella: quien guarda sus puntos con una cuenta. */
export function IconoCuenta(props: Props) {
  return (
    <Base {...props}>
      <circle cx="13" cy="12" r="5" fill="currentColor" />
      <path d="M3 28c0-6 4.4-9.5 10-9.5s10 3.5 10 9.5z" fill="currentColor" />
      <path
        d="M25 3l1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z"
        fill="#f2b233"
        stroke="#12312f"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </Base>
  );
}

/** Dos personas juntas: jugar con amigos. */
export function IconoAmigos(props: Props) {
  return (
    <Base {...props}>
      <circle cx="11" cy="11" r="4.5" fill="currentColor" />
      <path d="M2 27c0-5.5 4-8.5 9-8.5s9 3 9 8.5z" fill="currentColor" />
      <circle cx="22.5" cy="12" r="3.8" fill="currentColor" opacity="0.7" />
      <path
        d="M17 19.5c1.8-.9 3.6-1.2 5.5-1.2 4.2 0 7.5 2.6 7.5 8.7h-9.5"
        fill="currentColor"
        opacity="0.7"
      />
    </Base>
  );
}

/** Una casita: una sala abierta. */
export function IconoSala(props: Props) {
  return (
    <Base {...props}>
      <path d="M16 4L3 15h4v12h18V15h4z" fill="currentColor" />
      <rect x="13" y="19" width="6" height="8" fill="#12312f" opacity="0.5" />
    </Base>
  );
}
