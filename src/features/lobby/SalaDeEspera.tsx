'use client';

import Link from 'next/link';
import { useEffect, useState, type SyntheticEvent } from 'react';
import { IconoPersona } from '@/components/arte/IconosPortada';
import { aclarar, colorDeJugador } from '@/lib/colores';
import type { Credencial, SalaPublica } from '@/lib/esquemas';
import { cambiarSala, empezarSala, unirseASala, verSala } from '@/lib/salas';
import { enlaceDeSala, guardarCredencial, guardarNombre, leerCredencial } from '@/lib/sesion';
import { OpcionesSala, type CambiosDeSala } from './OpcionesSala';

const CADA_MS = 2000;
const MINIMO_JUGADORES = 2;
const JUGADORES_MAX = 10;
const ASIENTOS_VISIBLES_MIN = 4;
const AVISO_COPIADO_MS = 1800;

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

const BOTON_PRINCIPAL =
  'rounded-full bg-azafran px-8 py-3 text-xl font-extrabold text-tinta shadow-lg ring-4 ring-azafran-claro/50 transition enabled:hover:scale-105 enabled:hover:bg-azafran-claro disabled:opacity-50 disabled:ring-0';

function Asiento({ nombre, indice, yo }: { nombre: string; indice: number; yo: boolean }) {
  const color = colorDeJugador(indice);
  return (
    <li className="flex flex-col items-center gap-1" title={nombre}>
      <span
        aria-hidden="true"
        style={{ background: `linear-gradient(145deg, ${aclarar(color, 0.25)}, ${color})` }}
        className={`flex size-14 items-center justify-center rounded-full text-2xl font-extrabold text-white shadow-md ring-4 ${yo ? 'ring-azafran' : 'ring-white/70'}`}
      >
        {nombre.charAt(0).toUpperCase()}
      </span>
      <span className="max-w-20 truncate text-sm font-bold">{nombre}</span>
    </li>
  );
}

function AsientoVacio() {
  return (
    <li className="flex flex-col items-center gap-1 text-tinta/30" aria-hidden="true">
      <span className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-current">
        <IconoPersona tamano={24} />
      </span>
      <span className="text-sm">&nbsp;</span>
    </li>
  );
}

/** El código en grande y un botón que copia el enlace de invitación. */
function Invitar({ salaId }: { salaId: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar(): Promise<void> {
    try {
      await navigator.clipboard.writeText(enlaceDeSala(window.location.origin, salaId));
      setCopiado(true);
      setTimeout(() => setCopiado(false), AVISO_COPIADO_MS);
    } catch {
      // Sin permiso para el portapapeles, el código a la vista sigue sirviendo.
    }
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <span className="rounded-xl bg-tinta px-4 py-2 font-mono text-2xl font-extrabold tracking-widest text-espuma">
        {salaId}
      </span>
      <button
        type="button"
        onClick={() => void copiar()}
        title="Copiar el enlace de invitación"
        className="bg-laguna hover:bg-laguna/85 rounded-full px-4 py-2 font-extrabold text-white transition"
      >
        {copiado ? '¡Copiado!' : 'Copiar enlace'}
      </button>
    </div>
  );
}

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
      guardarNombre(nombre);
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

  /** Se ve el cambio al instante y, si el servidor lo rechaza, se vuelve a lo que dice el servidor. */
  async function cambiar(cambios: CambiosDeSala): Promise<void> {
    if (!credencial || !sala) return;
    const { publica, ...reglas } = cambios;
    setSala({
      ...sala,
      publica: publica ?? sala.publica,
      opciones: { ...sala.opciones, ...reglas },
    });
    try {
      await cambiarSala(salaId, credencial.token, cambios);
      setError(null);
    } catch (e: unknown) {
      setError(mensajeDe(e));
      setSala(sala);
    }
  }

  const aviso = error && (
    <p role="alert" className="rounded-xl bg-coral/15 px-3 py-2 text-sm font-bold text-coral">
      {error}
    </p>
  );

  if (!sala) {
    return (
      <div className="mar flex flex-1 flex-col items-center justify-center gap-3 p-4 text-white">
        <output className="text-lg font-bold">Cargando la sala…</output>
        {aviso}
        {error && (
          <Link href="/jugar" className="font-bold underline">
            Volver
          </Link>
        )}
      </div>
    );
  }

  const soyAnfitrion = credencial?.jugadorId === sala.anfitrion;
  const sePuedeEmpezar = sala.jugadores.length >= MINIMO_JUGADORES;
  const asientosVacios =
    Math.max(ASIENTOS_VISIBLES_MIN, sala.jugadores.length) - sala.jugadores.length;

  return (
    <div className="mar flex flex-1 flex-col items-center gap-4 p-4 text-white">
      <header className="flex w-full max-w-2xl items-center justify-between py-2">
        <Link href="/" className="text-2xl font-extrabold tracking-tight">
          PionerosHex
        </Link>
        <Link href="/jugar" className="font-bold text-white/80 underline">
          Salir
        </Link>
      </header>

      <section
        aria-labelledby="titulo-sala"
        className="flex w-full max-w-2xl flex-col gap-5 rounded-3xl bg-niebla p-5 text-tinta shadow-2xl"
      >
        <h1 id="titulo-sala" className="sr-only">
          Sala {sala.id}
        </h1>
        <Invitar salaId={sala.id} />

        <ul
          aria-label={`Jugadores (${sala.jugadores.length} de ${JUGADORES_MAX})`}
          className="flex flex-wrap justify-center gap-4"
        >
          {sala.jugadores.map((j, i) => (
            <Asiento
              key={j.id}
              nombre={j.id === sala.anfitrion ? `${j.nombre} ★` : j.nombre}
              indice={i}
              yo={j.id === credencial?.jugadorId}
            />
          ))}
          {Array.from({ length: asientosVacios }, (_, i) => (
            <AsientoVacio key={`vacio-${i}`} />
          ))}
        </ul>

        <OpcionesSala
          opciones={sala.opciones}
          publica={sala.publica}
          jugadores={sala.jugadores.length}
          editable={soyAnfitrion && !sala.empezada}
          onCambiar={(c) => void cambiar(c)}
        />

        {!credencial && !sala.empezada && (
          <form onSubmit={(e) => void unirme(e)} className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm font-bold">
              Tu nombre
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={20}
                autoComplete="name"
                className="rounded-xl border-2 border-tinta/20 bg-white px-3 py-2 text-lg"
              />
            </label>
            <button
              type="submit"
              disabled={ocupado || nombre.trim() === ''}
              className={BOTON_PRINCIPAL}
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
            className={`${BOTON_PRINCIPAL} self-center`}
          >
            {sePuedeEmpezar
              ? 'Empezar la partida'
              : `Faltan jugadores (mínimo ${MINIMO_JUGADORES})`}
          </button>
        )}
        {credencial && !soyAnfitrion && !sala.empezada && (
          <output className="text-center font-bold">
            Esperando a que el anfitrión empiece la partida…
          </output>
        )}
        {!credencial && sala.empezada && (
          <p role="alert" className="rounded-xl bg-coral/15 px-3 py-2 text-sm font-bold text-coral">
            La partida ya empezó y no estás en ella.
          </p>
        )}
        {aviso}
      </section>
    </div>
  );
}
