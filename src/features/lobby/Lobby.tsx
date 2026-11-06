'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore, type SyntheticEvent } from 'react';
import { IconoSala } from '@/components/arte/IconosPortada';
import type { Credencial, SalaAbierta } from '@/lib/esquemas';
import { crearSala, listarSalas, unirseASala } from '@/lib/salas';
import { guardarCredencial, guardarNombre, leerNombre } from '@/lib/sesion';

const NOMBRE_MAX = 20;
const REFRESCO_SALAS_MS = 5000;

type Pestana = 'abiertas' | 'crear' | 'codigo';

const PESTANAS: readonly { id: Pestana; etiqueta: string }[] = [
  { id: 'abiertas', etiqueta: 'Salas abiertas' },
  { id: 'crear', etiqueta: 'Crear' },
  { id: 'codigo', etiqueta: 'Tengo un código' },
];

const BOTON =
  'rounded-full bg-azafran px-6 py-2.5 text-lg font-extrabold text-tinta shadow-md transition enabled:hover:scale-105 enabled:hover:bg-azafran-claro disabled:opacity-40';

const sinSuscripcion = (): (() => void) => () => undefined;

/** El nombre recordado de otras visitas; en el servidor y al hidratar es vacío, sin desajustes. */
function useNombre(): [string, (nombre: string) => void] {
  const guardado = useSyncExternalStore(sinSuscripcion, leerNombre, () => '');
  const [escrito, setEscrito] = useState<string | null>(null);
  return [escrito ?? guardado, setEscrito];
}

/** Las salas públicas que esperan jugadores; se refrescan solas. */
function useSalasAbiertas(activo: boolean): { salas: SalaAbierta[] | null; fallo: boolean } {
  const [salas, setSalas] = useState<SalaAbierta[] | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    if (!activo) return;
    let controlador = new AbortController();
    const cargar = (): void => {
      controlador.abort();
      controlador = new AbortController();
      listarSalas(controlador.signal).then(
        (lista) => {
          setSalas(lista);
          setFallo(false);
        },
        () => {
          if (!controlador.signal.aborted) setFallo(true);
        },
      );
    };
    cargar();
    const intervalo = setInterval(cargar, REFRESCO_SALAS_MS);
    return () => {
      clearInterval(intervalo);
      controlador.abort();
    };
  }, [activo]);

  return { salas, fallo };
}

/** Puntos llenos y vacíos: de un vistazo cuántos lugares quedan. */
function Lugares({ ocupados, maximo }: { ocupados: number; maximo: number }) {
  return (
    <span className="flex items-center gap-0.5" title={`${ocupados} de ${maximo} jugadores`}>
      {Array.from({ length: maximo }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`size-2.5 rounded-full ${i < ocupados ? 'bg-laguna' : 'bg-tinta/15'}`}
        />
      ))}
      <span className="sr-only">{`${ocupados} de ${maximo} jugadores`}</span>
    </span>
  );
}

type ListaProps = {
  salas: SalaAbierta[] | null;
  fallo: boolean;
  deshabilitado: boolean;
  onEntrar: (id: string) => void;
};

function ListaDeSalas({ salas, fallo, deshabilitado, onEntrar }: ListaProps) {
  if (salas === null) {
    return (
      <output className="py-6 text-center font-bold text-tinta/70">
        {fallo ? 'No se pudo cargar la lista' : 'Buscando salas…'}
      </output>
    );
  }
  if (salas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-tinta/70">
        <IconoSala tamano={40} />
        <p className="font-bold">No hay salas abiertas</p>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {salas.map((s) => (
        <li
          key={s.id}
          className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-2.5"
        >
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-extrabold">{s.anfitrion}</span>
            <Lugares ocupados={s.jugadores} maximo={s.maximo} />
          </span>
          <button
            type="button"
            disabled={deshabilitado || s.jugadores >= s.maximo}
            onClick={() => onEntrar(s.id)}
            className={BOTON}
          >
            Entrar
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Pantalla de entrada: elegir nombre y buscar sala, crear una o unirse con un código. */
export function Lobby() {
  const router = useRouter();
  const [nombre, setNombre] = useNombre();
  const [pestana, setPestana] = useState<Pestana>('abiertas');
  const [publica, setPublica] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const { salas, fallo } = useSalasAbiertas(pestana === 'abiertas');

  const sinNombre = nombre.trim() === '';

  async function entrar(pedir: () => Promise<Credencial>): Promise<void> {
    setOcupado(true);
    setError(null);
    try {
      const credencial = await pedir();
      guardarNombre(nombre);
      guardarCredencial(credencial);
      router.push(`/sala/${encodeURIComponent(credencial.salaId)}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Algo salió mal');
      setOcupado(false);
    }
  }

  const unirse = (id: string): void => void entrar(() => unirseASala(id, nombre.trim()));

  const alUnirsePorCodigo = (evento: SyntheticEvent): void => {
    evento.preventDefault();
    unirse(codigo.trim().toLowerCase());
  };

  return (
    <section
      aria-label="Entrar a jugar"
      className="flex w-full max-w-xl flex-col gap-4 rounded-3xl bg-niebla p-5 text-tinta shadow-2xl"
    >
      <label className="flex flex-col gap-1 text-sm font-extrabold">
        Tu nombre
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={NOMBRE_MAX}
          autoComplete="name"
          className="rounded-xl border-2 border-tinta/20 bg-white px-3 py-2 text-lg font-normal"
        />
      </label>

      <div
        role="tablist"
        aria-label="Cómo entrar"
        className="flex gap-1 rounded-full bg-tinta/10 p-1"
      >
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            id={`pestana-${p.id}`}
            aria-selected={pestana === p.id}
            aria-controls="panel-lobby"
            onClick={() => setPestana(p.id)}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-extrabold transition ${
              pestana === p.id ? 'bg-tinta text-white shadow' : 'text-tinta/70 hover:text-tinta'
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      <div id="panel-lobby" role="tabpanel" aria-labelledby={`pestana-${pestana}`}>
        {pestana === 'abiertas' && (
          <ListaDeSalas
            salas={salas}
            fallo={fallo}
            deshabilitado={ocupado || sinNombre}
            onEntrar={unirse}
          />
        )}

        {pestana === 'crear' && (
          <div className="flex flex-col items-center gap-4">
            <fieldset className="flex gap-2">
              <legend className="sr-only">Quién puede entrar</legend>
              {[
                { valor: false, etiqueta: 'Privada', ayuda: 'Solo con el enlace' },
                { valor: true, etiqueta: 'Pública', ayuda: 'Sale en la lista de salas' },
              ].map((o) => (
                <button
                  key={o.etiqueta}
                  type="button"
                  aria-pressed={publica === o.valor}
                  title={o.ayuda}
                  onClick={() => setPublica(o.valor)}
                  className={`rounded-xl border-2 px-5 py-2 font-extrabold transition ${
                    publica === o.valor
                      ? 'border-azafran bg-azafran'
                      : 'border-tinta/15 bg-white/60 text-tinta/80'
                  }`}
                >
                  {o.etiqueta}
                </button>
              ))}
            </fieldset>
            <button
              type="button"
              disabled={ocupado || sinNombre}
              onClick={() => void entrar(() => crearSala(nombre.trim(), publica))}
              className={BOTON}
            >
              Crear sala
            </button>
          </div>
        )}

        {pestana === 'codigo' && (
          <form onSubmit={alUnirsePorCodigo} className="flex items-end gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm font-extrabold">
              Código de la sala
              <input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="rounded-xl border-2 border-tinta/20 bg-white px-3 py-2 font-mono text-lg font-normal"
              />
            </label>
            <button
              type="submit"
              disabled={ocupado || sinNombre || codigo.trim() === ''}
              className={BOTON}
            >
              Unirme
            </button>
          </form>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-coral/15 px-3 py-2 text-sm font-bold text-coral">
          {error}
        </p>
      )}
      <Link href="/" className="self-center text-sm font-bold text-tinta/70 underline">
        Volver al inicio
      </Link>
    </section>
  );
}
