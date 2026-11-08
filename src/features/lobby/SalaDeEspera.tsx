'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from 'react';
import { IconoPersona } from '@/components/arte/IconosPortada';
import { useCuenta } from '@/components/useCuenta';
import { aclarar, colorDeJugador } from '@/lib/colores';
import type { Credencial, InfoDeMapa } from '@/lib/esquemas';
import { suscribirSala, type SalaEnVivo } from '@/lib/lobby';
import {
  cambiarSala,
  cederAnfitrion,
  empezarSala,
  expulsarDeSala,
  listarMapas,
  salirDeSala,
  unirseASala,
} from '@/lib/salas';
import {
  enlaceDeSala,
  guardarCredencial,
  guardarNombre,
  leerCredencial,
  olvidarCredencial,
} from '@/lib/sesion';
import { OpcionesSala, type CambiosDeSala } from './OpcionesSala';
import { SelectorDeMapa } from './SelectorDeMapa';

const MINIMO_JUGADORES = 2;
const MENSAJE_SALA_INEXISTENTE = 'La sala no existe';
const MENSAJE_SIN_CONEXION = 'No se pudo mantener la conexión con la sala';
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

type AsientoProps = {
  nombre: string;
  indice: number;
  yo: boolean;
  /** Sin pestaña abierta en esta sala: se ve la palabra, el color solo acompaña. */
  desconectado: boolean;
  /** Botones del anfitrión para este jugador (expulsar, ceder el cargo). */
  acciones?: ReactNode;
};

function Asiento({ nombre, indice, yo, desconectado, acciones }: AsientoProps) {
  const color = colorDeJugador(indice);
  return (
    <li
      className={`flex flex-col items-center gap-1 ${desconectado ? 'opacity-60' : ''}`}
      title={nombre}
    >
      <span
        aria-hidden="true"
        style={{ background: `linear-gradient(145deg, ${aclarar(color, 0.25)}, ${color})` }}
        className={`flex size-14 items-center justify-center rounded-full text-2xl font-extrabold text-white shadow-md ring-4 ${yo ? 'ring-azafran' : 'ring-white/70'}`}
      >
        {nombre.charAt(0).toUpperCase()}
      </span>
      <span className="max-w-20 truncate text-sm font-bold">{nombre}</span>
      {desconectado && <span className="text-xs font-bold text-tinta/70">Desconectado</span>}
      {acciones}
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

const CLASE_COPIAR =
  'rounded-full bg-mar-laguna px-4 py-2 font-extrabold text-white transition hover:bg-mar-laguna/85';

type CopiarProps = { texto: string; etiqueta: string; copiado: string; ayuda: string };

/** Un botón que copia `texto` y avisa un momento; sin permiso para el portapapeles no hace nada. */
function BotonCopiar({ texto, etiqueta, copiado, ayuda }: CopiarProps) {
  const [hecho, setHecho] = useState(false);

  async function copiar(): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto);
      setHecho(true);
      setTimeout(() => setHecho(false), AVISO_COPIADO_MS);
    } catch {
      // Sin permiso para el portapapeles, el código a la vista sigue sirviendo.
    }
  }

  return (
    <button type="button" onClick={() => void copiar()} title={ayuda} className={CLASE_COPIAR}>
      {hecho ? copiado : etiqueta}
    </button>
  );
}

/** El código en grande, con un botón para copiarlo y otro para copiar el enlace de invitación. */
function Invitar({ salaId }: { salaId: string }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <span className="rounded-xl bg-tinta px-4 py-2 font-mono text-2xl font-extrabold tracking-widest text-espuma">
        {salaId}
      </span>
      <BotonCopiar
        texto={salaId}
        etiqueta="Copiar código"
        copiado="¡Código copiado!"
        ayuda="Copiar solo el código de la sala, para escribirlo en «Unirse»"
      />
      <BotonCopiar
        texto={enlaceDeSala(window.location.origin, salaId)}
        etiqueta="Copiar enlace"
        copiado="¡Copiado!"
        ayuda="Copiar el enlace de invitación: entra directo a la sala"
      />
    </div>
  );
}

const BOTON_ASIENTO =
  'rounded-full bg-tinta/10 px-2 py-0.5 text-xs font-extrabold transition hover:bg-tinta/20 pointer-coarse:min-h-10 pointer-coarse:min-w-10 disabled:opacity-40';

/** Lo que el anfitrión puede hacer con otro jugador antes de empezar. */
function AccionesDeAnfitrion({
  nombre,
  deshabilitado,
  onCeder,
  onExpulsar,
}: {
  nombre: string;
  deshabilitado: boolean;
  onCeder: () => void;
  onExpulsar: () => void;
}) {
  return (
    <span className="flex gap-1">
      <button
        type="button"
        disabled={deshabilitado}
        aria-label={`Hacer anfitrión a ${nombre}`}
        title="Pasarle el cargo de anfitrión"
        onClick={onCeder}
        className={BOTON_ASIENTO}
      >
        ★
      </button>
      <button
        type="button"
        disabled={deshabilitado}
        aria-label={`Expulsar a ${nombre}`}
        title="Sacarlo de la sala"
        onClick={onExpulsar}
        className={`${BOTON_ASIENTO} hover:bg-coral/30`}
      >
        ✕
      </button>
    </span>
  );
}

/** Pantalla para quien ya no está en la sala (salió o lo sacaron). */
function SinSala({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <main className="mar flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center text-white">
      <h1 className="text-2xl font-extrabold">{titulo}</h1>
      <p className="text-white/80">{detalle}</p>
      <Link href="/jugar" className="rounded-full bg-azafran px-6 py-2.5 font-extrabold text-tinta">
        Volver a jugar
      </Link>
    </main>
  );
}

export function SalaDeEspera({ salaId, onEmpezada }: Props) {
  // Antes de cargar la sala se muestra siempre "Cargando", así que leer el almacenamiento aquí no
  // hace que el primer render del navegador difiera del del servidor.
  const [credencial, setCredencial] = useState<Credencial | null>(() => leerCredencial(salaId));
  const [sala, setSala] = useState<SalaEnVivo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [escrito, setNombre] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [salio, setSalio] = useState(false);
  const [fueraDeLaSala, setFueraDeLaSala] = useState(false);
  // Me he visto en la lista de jugadores: solo entonces su ausencia significa que me sacaron.
  const meVi = useRef(false);
  const [mapas, setMapas] = useState<InfoDeMapa[]>([]);
  const [mapasFallaron, setMapasFallaron] = useState(false);
  const { usuario } = useCuenta();
  // Con sesión iniciada el servidor ya usa el nombre de la cuenta: se manda ese para que coincida.
  const nombre = usuario?.nombre ?? escrito;

  const miId = credencial?.jugadorId;
  const token = credencial?.token;
  // La sala llega por socket cada vez que cambia (nadie pregunta). Con mi token el servidor me
  // cuenta como conectado; al entrar o salir de la sala cambia el token y la suscripción se rehace.
  useEffect(() => {
    // En el primer estado también cuenta: una credencial vieja de alguien que ya no está.
    let primera = true;
    return suscribirSala(
      { salaId, token },
      {
        alEstado: (nueva) => {
          const dentro = miId !== undefined && nueva.jugadores.some((j) => j.id === miId);
          if (dentro) meVi.current = true;
          if (miId !== undefined && !nueva.empezada && !dentro && (meVi.current || primera)) {
            olvidarCredencial(salaId);
            setFueraDeLaSala(true);
          }
          primera = false;
          setSala(nueva);
          setError(null);
        },
        alCerrarse: () => setError(MENSAJE_SALA_INEXISTENTE),
        alRechazar: (motivo) =>
          setError(motivo === 'SALA_NO_EXISTE' ? MENSAJE_SALA_INEXISTENTE : MENSAJE_SIN_CONEXION),
      },
    );
  }, [salaId, miId, token]);

  // El catálogo no cambia mientras la sala espera: se pide una sola vez.
  useEffect(() => {
    const controlador = new AbortController();
    listarMapas(controlador.signal).then(setMapas, () => {
      if (!controlador.signal.aborted) setMapasFallaron(true);
    });
    return () => controlador.abort();
  }, []);

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
      meVi.current = false;
      setFueraDeLaSala(false);
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

  async function salir(): Promise<void> {
    if (!credencial) return;
    setOcupado(true);
    try {
      await salirDeSala(salaId, credencial.token);
      olvidarCredencial(salaId);
      setSalio(true);
    } catch (e: unknown) {
      setError(mensajeDe(e));
    } finally {
      setOcupado(false);
    }
  }

  /** Una acción del anfitrión sobre otro jugador; el cambio llega solo por el socket. */
  async function sobreJugador(accion: typeof expulsarDeSala, jugadorId: string): Promise<void> {
    if (!credencial) return;
    setOcupado(true);
    try {
      await accion(salaId, credencial.token, jugadorId);
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

  if (salio) {
    return <SinSala titulo="Saliste de la sala" detalle="Puedes volver a entrar cuando quieras." />;
  }
  if (fueraDeLaSala) {
    return (
      <SinSala titulo="Te sacaron de la sala" detalle="El anfitrión te sacó antes de empezar." />
    );
  }

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
    <main className="mar flex flex-1 flex-col items-center gap-4 p-4 text-white">
      <header className="flex w-full max-w-2xl items-center justify-between py-2">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center text-2xl font-extrabold tracking-tight"
        >
          PionerosHex
        </Link>
        {credencial && !sala.empezada ? (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => void salir()}
            className="inline-flex min-h-10 items-center font-bold text-white/80 underline disabled:opacity-50"
          >
            Salir de la sala
          </button>
        ) : (
          <Link
            href="/jugar"
            className="inline-flex min-h-10 items-center font-bold text-white/80 underline"
          >
            Salir
          </Link>
        )}
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
          aria-label={`Jugadores (${sala.jugadores.length} de ${sala.maximo})`}
          className="flex flex-wrap justify-center gap-4"
        >
          {sala.jugadores.map((j, i) => (
            <Asiento
              key={j.id}
              nombre={j.id === sala.anfitrion ? `${j.nombre} ★` : j.nombre}
              indice={i}
              yo={j.id === credencial?.jugadorId}
              desconectado={!sala.conectados.includes(j.id)}
              acciones={
                soyAnfitrion && !sala.empezada && j.id !== sala.anfitrion ? (
                  <AccionesDeAnfitrion
                    nombre={j.nombre}
                    deshabilitado={ocupado}
                    onCeder={() => void sobreJugador(cederAnfitrion, j.id)}
                    onExpulsar={() => void sobreJugador(expulsarDeSala, j.id)}
                  />
                ) : undefined
              }
            />
          ))}
          {Array.from({ length: asientosVacios }, (_, i) => (
            <AsientoVacio key={`vacio-${i}`} />
          ))}
        </ul>

        <SelectorDeMapa
          mapas={mapas}
          elegido={sala.opciones.mapa ?? null}
          jugadores={sala.jugadores.length}
          editable={soyAnfitrion && !sala.empezada}
          onElegir={(mapa) => void cambiar({ mapa })}
        />
        {mapasFallaron && (
          <p className="-mt-3 text-sm font-bold text-tinta/70">
            No se pudo cargar la lista de mapas; se usará el automático.
          </p>
        )}

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
            title={
              sePuedeEmpezar ? undefined : `Hacen falta al menos ${MINIMO_JUGADORES} jugadores`
            }
            onClick={() => void empezar()}
            className={`${BOTON_PRINCIPAL} self-center`}
          >
            {sePuedeEmpezar ? 'Empezar la partida' : 'Faltan jugadores'}
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
    </main>
  );
}
