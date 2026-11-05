import { Dado } from '@/components/arte/Dado';

type Props = {
  dados: readonly [number, number] | null;
  /** Me toca tirar: los dados se vuelven un botón. */
  puedeTirar: boolean;
  ocupado: boolean;
  onTirar: () => void;
};

/** Los dos dados. Cuando me toca tirar se pulsan y laten; si no, solo muestran la última tirada. */
export function Dados({ dados, puedeTirar, ocupado, onTirar }: Props) {
  // La clave cambia con cada tirada para que la animación vuelva a empezar.
  const tirada = dados ? `${dados[0]}-${dados[1]}` : 'sin-tirar';
  const caras = (
    <span key={tirada} className="dado-rodando flex gap-2">
      <Dado valor={dados?.[0] ?? null} />
      <Dado valor={dados?.[1] ?? null} />
    </span>
  );

  if (!puedeTirar) {
    return (
      <output aria-label="Dados" className="flex rounded-2xl bg-black/20 p-2">
        {caras}
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
      {caras}
      <span className="text-sm font-extrabold text-tinta">Tirar dados</span>
    </button>
  );
}
