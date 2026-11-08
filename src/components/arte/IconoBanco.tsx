type Props = {
  /** Lado en píxeles. */
  tamano?: number;
  /** Texto para lectores de pantalla; si falta, el icono es decorativo. */
  etiqueta?: string;
};

/** El edificio del banco: frontón, cuatro columnas y escalones. Dibujo propio, sin fondo. */
export function IconoBanco({ tamano = 40, etiqueta }: Props) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={tamano}
      height={tamano}
      role={etiqueta ? 'img' : undefined}
      aria-label={etiqueta}
      aria-hidden={etiqueta ? undefined : true}
    >
      <polygon
        points="24,4 45,16 3,16"
        fill="#c9a46a"
        stroke="#6f5430"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <rect x="4" y="16" width="40" height="4" fill="#e8d6a8" stroke="#6f5430" strokeWidth="1.4" />
      {[9, 18.5, 28, 37.5].map((x) => (
        <rect
          key={x}
          x={x}
          y="21"
          width="4.5"
          height="17"
          fill="#f1e3bd"
          stroke="#6f5430"
          strokeWidth="1.2"
        />
      ))}
      <rect
        x="4"
        y="38"
        width="40"
        height="3.5"
        fill="#e8d6a8"
        stroke="#6f5430"
        strokeWidth="1.4"
      />
      <rect
        x="1.5"
        y="41.5"
        width="45"
        height="4"
        rx="1"
        fill="#c9a46a"
        stroke="#6f5430"
        strokeWidth="1.4"
      />
      <circle cx="24" cy="12" r="2.6" fill="#f2b233" stroke="#6f5430" strokeWidth="1" />
    </svg>
  );
}
