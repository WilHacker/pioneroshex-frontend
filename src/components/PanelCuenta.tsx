import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
  titulo: string;
  children: ReactNode;
};

/** El marco de las pantallas de cuenta: el mar de fondo y un panel claro, como el lobby. */
export function PanelCuenta({ titulo, children }: Props) {
  return (
    <main className="mar flex flex-1 flex-col items-center gap-4 p-4 text-white">
      <header className="flex w-full max-w-xl items-center justify-between py-2">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center text-2xl font-extrabold tracking-tight"
        >
          PionerosHex
        </Link>
        <Link
          href="/jugar"
          className="inline-flex min-h-10 items-center font-bold text-white/80 underline"
        >
          Jugar
        </Link>
      </header>
      <section
        aria-labelledby="titulo-cuenta"
        className="flex w-full max-w-xl flex-col gap-4 rounded-3xl bg-niebla p-5 text-tinta shadow-2xl"
      >
        <h1 id="titulo-cuenta" className="text-2xl font-extrabold">
          {titulo}
        </h1>
        {children}
      </section>
    </main>
  );
}
