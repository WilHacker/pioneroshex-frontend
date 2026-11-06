import Link from 'next/link';

// Portada provisional: la Fase 1 del plan la reemplaza por el landing con tablero y dados.
export default function Portada() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl font-bold">PionerosHex</h1>
      <Link
        href="/jugar"
        className="rounded-full bg-azafran px-6 py-3 text-lg font-extrabold text-tinta hover:bg-azafran-claro"
      >
        Jugar ahora
      </Link>
    </main>
  );
}
