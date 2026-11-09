// Clases compartidas por las pantallas de cuenta, para que todas se vean igual.

export const ETIQUETA = 'flex flex-col gap-1 text-sm font-extrabold';

export const CAMPO = 'rounded-xl border-2 border-tinta/20 bg-white px-3 py-2 text-lg font-normal';

export const BOTON =
  'rounded-full bg-azafran px-6 py-2.5 text-lg font-extrabold text-tinta shadow-md transition enabled:hover:scale-105 enabled:hover:bg-azafran-claro disabled:opacity-40';

export const BOTON_SECUNDARIO =
  'rounded-full border-2 border-tinta/25 px-5 py-2 font-extrabold text-tinta transition enabled:hover:bg-tinta/10 disabled:opacity-40';

export const BOTON_PELIGRO =
  'rounded-full bg-coral px-5 py-2 font-extrabold text-white transition enabled:hover:brightness-110 disabled:opacity-40';

/** Un enlace dentro de una frase: sin altura mínima, para no estirar el interlineado. */
export const ENLACE_EN_TEXTO = 'font-bold text-mar-laguna underline';

/** Un enlace suelto (en su propia fila): con altura mínima para tocarlo bien en el teléfono. */
export const ENLACE = `inline-flex min-h-8 items-center ${ENLACE_EN_TEXTO}`;

export const AVISO = 'rounded-xl bg-coral/15 px-3 py-2 text-sm font-bold text-coral';
