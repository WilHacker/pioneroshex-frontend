'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { IconoAmigos, IconoCuenta, IconoPersona, IconoSala } from '@/components/arte/IconosPortada';
import { verResumen, type ResumenDeSalas } from '@/lib/salas';

const REFRESCO_RESUMEN_MS = 30_000;

type Props = {
  /** El tablero decorativo; lo pone la página porque vive en otra feature. */
  tablero: ReactNode;
};

/** Los números de la portada. Si el servidor no responde, simplemente no se muestran. */
function useResumen(): ResumenDeSalas | null {
  const [resumen, setResumen] = useState<ResumenDeSalas | null>(null);

  useEffect(() => {
    let controlador = new AbortController();
    const cargar = (): void => {
      controlador.abort();
      controlador = new AbortController();
      verResumen(controlador.signal)
        .then(setResumen)
        .catch(() => undefined);
    };
    cargar();
    const intervalo = setInterval(cargar, REFRESCO_RESUMEN_MS);
    return () => {
      clearInterval(intervalo);
      controlador.abort();
    };
  }, []);

  return resumen;
}

type ContadorProps = { icono: ReactNode; valor: number; etiqueta: string };

function Contador({ icono, valor, etiqueta }: ContadorProps) {
  return (
    <li
      title={etiqueta}
      className="flex items-center gap-2 rounded-full bg-black/25 py-1.5 pr-4 pl-3 text-lg font-extrabold text-white"
    >
      <span className="text-espuma">{icono}</span>
      {valor}
      <span className="sr-only">{etiqueta}</span>
    </li>
  );
}

const CARTA =
  'group relative flex w-full flex-col items-center gap-2 rounded-2xl border-b-8 bg-niebla px-4 py-5 text-tinta shadow-xl transition sm:w-52';

/** Las tres maneras de entrar, como cartas. Las cuentas llegan después: por ahora solo avisan. */
function Cartas() {
  return (
    <ul className="flex w-full max-w-3xl flex-col items-stretch justify-center gap-5 sm:flex-row sm:items-end">
      <li className="sm:-rotate-2">
        <Link href="/jugar" className={`${CARTA} border-hoja hover:-translate-y-1`}>
          <span className="text-hoja">
            <IconoPersona tamano={44} />
          </span>
          <span className="text-xl font-extrabold">Invitado</span>
          <span className="text-sm">Entra y juega</span>
        </Link>
      </li>
      <li>
        <div
          aria-disabled="true"
          className={`${CARTA} cursor-not-allowed border-azafran opacity-80`}
          title="Pronto"
        >
          <span className="text-laguna">
            <IconoCuenta tamano={44} />
          </span>
          <span className="text-xl font-extrabold">Con cuenta</span>
          <span className="text-sm">Guarda tus puntos</span>
          <span className="absolute -top-3 right-3 rounded-full bg-azafran px-3 py-0.5 text-xs font-extrabold">
            Pronto
          </span>
        </div>
      </li>
      <li className="sm:rotate-2">
        <Link href="/jugar" className={`${CARTA} border-coral hover:-translate-y-1`}>
          <span className="text-coral">
            <IconoAmigos tamano={44} />
          </span>
          <span className="text-xl font-extrabold">Con amigos</span>
          <span className="text-sm">Usa un código</span>
        </Link>
      </li>
    </ul>
  );
}

export function Portada({ tablero }: Props) {
  const resumen = useResumen();

  return (
    <div className="mar flex flex-1 flex-col items-center gap-8 px-4 pb-12 text-white">
      <header className="flex w-full max-w-5xl items-center justify-between py-4">
        <p className="text-2xl font-extrabold tracking-tight">PionerosHex</p>
        <nav aria-label="Cuenta" className="flex gap-2">
          <button
            type="button"
            disabled
            title="Pronto"
            className="rounded-full px-4 py-2 font-bold text-white/70"
          >
            Entrar
          </button>
          <button
            type="button"
            disabled
            title="Pronto"
            className="rounded-full bg-white/15 px-4 py-2 font-bold text-white/70"
          >
            Crear cuenta
          </button>
        </nav>
      </header>

      <main className="flex w-full flex-col items-center gap-8">
        <h1 className="sr-only">PionerosHex, juego de estrategia sobre mapas hexagonales</h1>
        <section aria-label="Tablero de demostración" className="w-full">
          {tablero}
        </section>

        <Link
          href="/jugar"
          className="rounded-full bg-azafran px-10 py-4 text-2xl font-extrabold text-tinta shadow-xl ring-4 ring-azafran-claro/50 transition hover:scale-105 hover:bg-azafran-claro"
        >
          Jugar ahora
        </Link>

        {resumen && (
          <ul aria-label="Ahora mismo" className="flex gap-3">
            <Contador
              icono={<IconoSala tamano={24} />}
              valor={resumen.salasAbiertas}
              etiqueta="salas abiertas"
            />
            <Contador
              icono={<IconoPersona tamano={24} />}
              valor={resumen.jugadores}
              etiqueta="jugadores en salas"
            />
          </ul>
        )}

        <Cartas />
      </main>
    </div>
  );
}
