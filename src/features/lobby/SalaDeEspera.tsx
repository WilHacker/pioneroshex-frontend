'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import type { Credencial, SalaPublica } from '@/lib/esquemas';
import { empezarSala, unirseASala, verSala } from '@/lib/salas';
import { guardarCredencial, leerCredencial } from '@/lib/sesion';

const CADA_MS = 2000;
const MINIMO_JUGADORES = 2;

/** Lo que necesita la pantalla de juego para arrancar. */
export interface EntradaPartida {
  readonly credencial: Credencial;
  readonly nombres: Readonly<Record<string, string>>;
}

type Props = {
  salaId: string;
  /** Se llama cuando la sala ya empezó y sé quién soy en ella. */
  onEmpezada: (entrada: EntradaPartida) => void;
};

const mensajeDe = (e: unknown): string => (e instanceof Error ? e.message : 'Algo salió mal');

export function SalaDeEspera({ salaId, onEmpezada }: Props) {
  // Antes de cargar la sala se muestra siempre "Cargando", así que leer el almacenamiento aquí no
  // hace que el primer render del navegador difiera del del servidor.
  const [credencial, setCredencial] = useState<Credencial | null>(() => leerCredencial(salaId));
  const [sala, setSala] = useState<SalaPublica | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    const controlador = new AbortController();
    const consultar = (): void => {
      verSala(salaId, controlador.signal).then(
        (nueva) => {
          setSala(nueva);
          setError(null);
        },
        (e: unknown) => {
          if (!controlador.signal.aborted) setError(mensajeDe(e));
        },
      );
    };
    consultar();
    const temporizador = setInterval(consultar, CADA_MS);
    return () => {
      controlador.abort();
      clearInterval(temporizador);
    };
  }, [salaId]);

  useEffect(() => {
    if (!sala?.empezada || !credencial) return;
    const nombres = Object.fromEntries(sala.jugadores.map((j) => [j.id, j.nombre]));
    onEmpezada({ credencial, nombres });
  }, [sala, credencial, onEmpezada]);

  async function unirme(evento: SyntheticEvent): Promise<void> {
    evento.preventDefault();
    setOcupado(true);
    try {
      const nueva = await unirseASala(salaId, nombre.trim());
      guardarCredencial(nueva);
      setCredencial(nueva);
      setError(null);
    } catch (e: unknown) {
      setError(mensajeDe(e));
    } finally {
      setOcupado(false);
    }
  }

  async function empezar(): Promise<void> {
    if (!credencial) return;
    setOcupado(true);
    try {
      await empezarSala(salaId, credencial.token);
      setError(null);
    } catch (e: unknown) {
      setError(mensajeDe(e));
    } finally {
      setOcupado(false);
    }
  }

  const aviso = error && (
    <p role="alert" className="rounded border border-red-500 px-3 py-2 text-sm text-red-600">
      {error}
    </p>
  );

  if (!sala) {
    return (
      <div className="flex flex-col gap-3">
        <output className="text-sm">Cargando la sala…</output>
        {aviso}
      </div>
    );
  }

  const soyAnfitrion = credencial?.jugadorId === sala.anfitrion;
  const sePuedeEmpezar = sala.jugadores.length >= MINIMO_JUGADORES;

  return (
    <section aria-labelledby="titulo-sala" className="flex w-full max-w-md flex-col gap-4">
      <h1 id="titulo-sala" className="text-2xl font-bold">
        Sala <span className="font-mono">{sala.id}</span>
      </h1>
      <p className="text-sm text-zinc-500">Pásales este código a tus amigos para que entren.</p>

      <ul className="flex flex-col gap-1">
        {sala.jugadores.map((j) => (
          <li key={j.id} className="rounded bg-zinc-100 px-3 py-1.5 text-zinc-900">
            {j.nombre}
            {j.id === sala.anfitrion ? ' (anfitrión)' : ''}
            {j.id === credencial?.jugadorId ? ' · tú' : ''}
          </li>
        ))}
      </ul>

      {!credencial && !sala.empezada && (
        <form onSubmit={(e) => void unirme(e)} className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Tu nombre
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={20}
              className="rounded border bg-transparent px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={ocupado || nombre.trim() === ''}
            className="rounded border px-3 py-2 font-medium enabled:hover:bg-zinc-100 enabled:hover:text-zinc-900 disabled:opacity-40"
          >
            Unirme a esta sala
          </button>
        </form>
      )}

      {credencial && soyAnfitrion && !sala.empezada && (
        <button
          type="button"
          disabled={ocupado || !sePuedeEmpezar}
          onClick={() => void empezar()}
          className="rounded bg-zinc-900 px-3 py-2 font-medium text-white enabled:hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {sePuedeEmpezar ? 'Empezar la partida' : `Faltan jugadores (mínimo ${MINIMO_JUGADORES})`}
        </button>
      )}
      {credencial && !soyAnfitrion && !sala.empezada && (
        <output className="text-sm">Esperando a que el anfitrión empiece la partida…</output>
      )}
      {!credencial && sala.empezada && (
        <p role="alert" className="rounded border border-red-500 px-3 py-2 text-sm text-red-600">
          La partida ya empezó y no estás en ella.
        </p>
      )}
      {aviso}
    </section>
  );
}
