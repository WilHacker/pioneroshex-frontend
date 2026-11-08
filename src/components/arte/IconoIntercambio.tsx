type Props = {
  /** Lado en píxeles. */
  tamano?: number;
  /** Texto para lectores de pantalla; si falta, el icono es decorativo. */
  etiqueta?: string;
};

/** Dos cartas (trigo y ladrillo) que se intercambian con dos flechas: el icono de comerciar. */
export function IconoIntercambio({ tamano = 32, etiqueta }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={tamano}
      height={tamano}
      role={etiqueta ? 'img' : undefined}
      aria-label={etiqueta}
      aria-hidden={etiqueta ? undefined : true}
    >
      <image href="/ui/intercambio.svg" x="0" y="0" width="32" height="32" />
    </svg>
  );
}
