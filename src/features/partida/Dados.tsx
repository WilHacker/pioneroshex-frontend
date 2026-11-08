import { Dado } from '@/components/arte/Dado';

type Props = {
  dados: readonly [number, number] | null;
  /** Cuántas tiradas van: al subir, los dados vuelven a rodar aunque salga lo mismo. */
  tirada: number;
  /** Me toca tirar: los dados se vuelven un botón. */
  puedeTirar: boolean;
  ocupado: boolean;
  onTirar: () => void;
};

/** La suma de la tirada, en grande; el 7 va en rojo porque activa al ladrón. */
function Suma({ valor }: { valor: number }) {
  return (
    <span
      key={valor}
      title={valor === 7 ? 'Siete: se mueve el ladrón' : `Suma: ${valor}`}
      className={`suma-aparece flex size-14 items-center justify-center rounded-full text-3xl font-extrabold text-white shadow-lg ring-4 ring-white ${valor === 7 ? 'bg-coral' : 'bg-tinta'}`}
    >
      {valor}
      <span className="sr-only">suma de los dados</span>
    </span>
  );
}

/**
 * Los dos dados (caras 2D que giran un instante al tirarse) y, al lado, la suma. Cuando me toca tirar son un botón y laten;
 * si no, solo muestran la última tirada.
 */
export function Dados({ dados, tirada, puedeTirar, ocupado, onTirar }: Props) {
  const suma = dados ? dados[0] + dados[1] : null;
  const cubos = (
    // La clave cambia con cada tirada para que los cubos se monten de nuevo y vuelvan a rodar.
    <span key={`${tirada}-${dados?.join('-') ?? 'sin'}`} className="flex gap-3 px-3 py-2">
      <span className="dado-rodando">
        <Dado valor={dados?.[0] ?? null} tamano={64} />
      </span>
      <span className="dado-rodando">
        <Dado valor={dados?.[1] ?? null} tamano={64} />
      </span>
    </span>
  );

  if (!puedeTirar) {
    return (
      <output aria-label="Dados" className="flex items-center gap-3 rounded-2xl bg-black/20 p-2">
        {cubos}
        {suma !== null && <Suma valor={suma} />}
      </output>
    );
  }
  return (
    <button
      type="button"
      disabled={ocupado}
      onClick={onTirar}
      className="flex flex-col items-center gap-1 rounded-2xl bg-azafran/90 p-2 shadow-lg ring-4 ring-azafran-claro/60 transition enabled:hover:scale-105 disabled:opacity-60"
    >
      {cubos}
      <span className="text-sm font-extrabold text-tinta">Tirar dados</span>
    </button>
  );
}
