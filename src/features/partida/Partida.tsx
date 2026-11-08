'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { IconoAccion } from '@/components/arte/IconosEstado';
import type { Credencial, Hex } from '@/lib/esquemas';
import { textoDeMotivo } from '@/lib/mensajes';
import { marcarSorteoVisto, yaVioElSorteo } from '@/lib/sesion';
import { sonidoDelJuego, type Efecto } from '@/lib/sonido';
import { victimasEn } from '@/lib/tablero';
import { AvisoDeAbandono } from './AvisoDeAbandono';
import { Banco } from './Banco';
import { CartasDesarrollo } from './CartasDesarrollo';
import { colorDeJugador } from '@/lib/colores';
import { Comercio } from './Comercio';
import { Dados } from './Dados';
import { EntregaDeRecursos } from './EntregaDeRecursos';
import { SorteoDeOrden } from './SorteoDeOrden';
import { efectoDe } from './efectos';
import { Jugadores } from './Jugadores';
import {
  accionDeArista,
  accionDeLadron,
  accionDeVertice,
  esMiTurno,
  mensajeDeFase,
  modoEfectivo,
  objetivoDe,
  sitiosDe,
  type Modo,
} from './logica';
import { ManoCartas } from './ManoCartas';
import { Ofertas } from './Ofertas';
import { PanelDescarte } from './PanelDescarte';
import { Paleta } from './Paleta';
import { Registro } from './Registro';
import { Reloj } from './Reloj';
import { TiraDeJugadores } from './TiraDeJugadores';
import { Tablero } from './Tablero';
import { useJuego } from './useJuego';

type Props = {
  credencial: Credencial;
  /** Nombre visible de cada jugador, por id. */
  nombres: Readonly<Record<string, string>>;
};

interface VictimaPendiente {
  readonly destino: Hex;
  readonly victimas: readonly string[];
}

const MAX_CARRETERAS = 2;
const BOTON_REDONDO =
  'flex size-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur enabled:hover:bg-black/45';

export function Partida({ credencial, nombres }: Props) {
  const juego = useJuego(credencial.salaId, credencial.token);
  const sonido = sonidoDelJuego();
  const [silenciado, setSilenciado] = useState(() => sonido.silenciado);
  const [elegido, setElegido] = useState<Modo | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [carreteras, setCarreteras] = useState<readonly string[]>([]);
  const [pendiente, setPendiente] = useState<VictimaPendiente | null>(null);
  const [comercioAbierto, setComercioAbierto] = useState(false);
  const [confirmandoAbandono, setConfirmandoAbandono] = useState(false);
  const [sorteoCerrado, setSorteoCerrado] = useState(false);

  const vista = juego.datos?.vista ?? null;
  const yo = vista?.yo ?? null;
  const miTurno = vista ? esMiTurno(vista) : false;

  // Los sonidos reaccionan a lo que trae cada notificación y al pasar a ser mi turno.
  const numeroVisto = useRef(0);
  useEffect(() => {
    if (juego.ultimos.numero === numeroVisto.current) return;
    numeroVisto.current = juego.ultimos.numero;
    const efectos = new Set<Efecto>();
    for (const evento of juego.ultimos.eventos) {
      const efecto = efectoDe(evento, yo);
      if (efecto) efectos.add(efecto);
    }
    for (const efecto of efectos) sonido.reproducir(efecto);
  }, [juego.ultimos, yo, sonido]);

  const eraMiTurno = useRef(false);
  useEffect(() => {
    if (miTurno && !eraMiTurno.current) sonido.reproducir('turno');
    eraMiTurno.current = miTurno;
  }, [miTurno, sonido]);

  if (juego.rechazo !== null) {
    return (
      <div className="mar fixed inset-0 z-10 flex items-center justify-center p-4 font-juego">
        <p
          role="alert"
          className="max-w-md rounded-2xl border-2 border-coral bg-niebla p-5 text-tinta"
        >
          No se pudo entrar a la partida: {textoDeMotivo(juego.rechazo)}.{' '}
          <Link href="/" className="font-extrabold underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    );
  }
  if (!juego.datos || !vista) {
    return (
      <div className="mar fixed inset-0 z-10 flex items-center justify-center font-juego">
        <output className="rounded-full bg-black/30 px-5 py-2 font-bold text-white">
          Conectando con la partida…
        </output>
      </div>
    );
  }

  const { mesa, acciones, sitios } = juego.datos;
  const nombreDe = (id: string): string => nombres[id] ?? id;
  const indiceDe = (id: string): number => vista.jugadores.findIndex((j) => j.id === id);
  const miColor = colorDeJugador(Math.max(0, yo ? indiceDe(yo) : 0));
  const modo = modoEfectivo(vista, elegido);
  const miDescarte = yo === null ? 0 : (vista.descartesPendientes[yo] ?? 0);
  const miMano = vista.jugadores.find((j) => j.id === yo)?.recursos ?? null;
  const puedeTirar = acciones.some((a) => a.tipo === 'TIRAR_DADOS' && a.disponible);
  const terminada = vista.fase === 'FIN';
  const verSorteo = vista.sorteo.length > 0 && !sorteoCerrado && !yaVioElSorteo(credencial.salaId);
  const yaAbandone = yo !== null && (juego.presencia?.abandonaron.includes(yo) ?? false);
  const quedanSinAbandonar = vista.jugadores.length - (juego.presencia?.abandonaron.length ?? 0);
  /** Lo que se enviaría al confirmar la vista previa: un camino si es una arista, si no un vértice. */
  const accionDePrevia =
    previa === null
      ? null
      : mesa.aristas.some((a) => a.id === previa)
        ? accionDeArista(vista, modo, previa)
        : accionDeVertice(vista, modo, previa);

  const limpiar = (): void => {
    setElegido(null);
    setPrevia(null);
    setCarreteras([]);
    setPendiente(null);
  };

  const ejecutar = async (accion: object | null): Promise<void> => {
    if (!accion) return;
    setOcupado(true);
    const error = await juego.enviar(accion);
    setOcupado(false);
    setAviso(error);
    if (error === null) limpiar();
    else sonido.reproducir('error');
  };

  /** Primer toque: vista previa. Segundo toque en el mismo sitio: confirma. */
  const tocarSitio = (id: string, accion: object | null): void => {
    if (previa === id) {
      void ejecutar(accion);
      return;
    }
    setPrevia(id);
    setAviso(null);
    sonido.reproducir('clic');
  };

  const alArista = (id: string): void => {
    if (modo !== 'CARRETERAS') {
      tocarSitio(id, accionDeArista(vista, modo, id));
      return;
    }
    setCarreteras((previas) =>
      previas.includes(id)
        ? previas.filter((a) => a !== id)
        : [...previas, id].slice(-MAX_CARRETERAS),
    );
  };

  const alCasilla = (destino: Hex): void => {
    const victimas = victimasEn(mesa, vista, destino);
    if (victimas.length > 1) setPendiente({ destino, victimas });
    else void ejecutar(accionDeLadron(modo, destino, victimas[0] ?? null));
  };

  const elegirModo = (nuevo: Modo | null): void => {
    limpiar();
    setElegido(nuevo);
    setAviso(null);
    setComercioAbierto(false);
    if (nuevo) sonido.reproducir('clic');
  };

  const alAccion = (accion: object): void => void ejecutar(accion);

  return (
    <div className="mar fixed inset-0 z-10 flex flex-col overflow-y-auto font-juego text-white lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:grid-rows-[minmax(0,1fr)_auto] lg:overflow-hidden">
      <main className="relative flex min-h-[60vh] flex-col gap-2 p-3 lg:col-start-1 lg:row-start-1 lg:min-h-0">
        <header className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              aria-label={silenciado ? 'Sonido apagado' : 'Sonido activado'}
              aria-pressed={!silenciado}
              title={silenciado ? 'Sonido apagado' : 'Sonido activado'}
              onClick={() => setSilenciado(sonido.alternarSilencio())}
              className={BOTON_REDONDO}
            >
              <IconoAccion tipo={silenciado ? 'SILENCIO' : 'SONIDO'} />
            </button>
            {terminada ? (
              <Link href="/" aria-label="Salir" title="Salir" className={BOTON_REDONDO}>
                <IconoAccion tipo="SALIR" />
              </Link>
            ) : (
              <button
                type="button"
                aria-label="Abandonar la partida"
                title="Abandonar la partida"
                onClick={() => setConfirmandoAbandono(true)}
                className={BOTON_REDONDO}
              >
                <IconoAccion tipo="SALIR" />
              </button>
            )}
          </div>
          <output
            aria-live="polite"
            className={`rounded-full px-4 py-2 text-center text-base font-extrabold shadow-lg sm:px-6 sm:text-lg ${miTurno ? 'bg-azafran text-tinta' : 'bg-black/35 text-white backdrop-blur'}`}
          >
            {mensajeDeFase(vista, nombreDe)}
          </output>
          <span className="flex min-w-[5.5rem] justify-end">
            <Reloj vence={juego.vence} />
          </span>
        </header>

        <TiraDeJugadores
          vista={vista}
          nombreDe={nombreDe}
          indiceDe={indiceDe}
          presencia={juego.presencia}
        />

        {juego.conexion === 'reconectando' && (
          <output className="mx-auto rounded-full bg-coral px-4 py-1 text-sm font-bold">
            Reconectando…
          </output>
        )}
        {aviso && (
          <p
            role="alert"
            className="mx-auto rounded-xl bg-coral px-4 py-2 text-sm font-bold shadow-lg"
          >
            {aviso}
          </p>
        )}

        {/* Entre lg y xl el tablero ocupa casi todo el ancho: los dados bajan a su propia fila para no tapar casillas ni puertos. */}
        <div className="relative flex min-h-[24rem] grow items-center justify-center lg:min-h-0 lg:max-xl:grid lg:max-xl:grid-cols-[minmax(0,1fr)] lg:max-xl:grid-rows-[minmax(0,1fr)_auto]">
          <Tablero
            mesa={mesa}
            vista={vista}
            indiceDe={indiceDe}
            nombreDe={nombreDe}
            objetivo={objetivoDe(modo)}
            sitios={sitiosDe(modo, sitios)}
            previa={previa}
            aristasElegidas={carreteras}
            numeroResaltado={juego.resaltado}
            zoom
            onVertice={(id) => tocarSitio(id, accionDeVertice(vista, modo, id))}
            onArista={alArista}
            onCasilla={alCasilla}
          />

          <div className="absolute top-0 left-1/2 z-20 -translate-x-1/2">
            <Ofertas
              vista={vista}
              nombreDe={nombreDe}
              indiceDe={indiceDe}
              ocupado={ocupado}
              onAccion={alAccion}
            />
          </div>

          <div className="absolute right-1 bottom-1 origin-bottom-right scale-60 sm:scale-100 lg:max-xl:static lg:max-xl:[zoom:0.7] lg:max-xl:justify-self-end">
            <Dados
              dados={vista.dados}
              tirada={juego.tiradas}
              puedeTirar={puedeTirar}
              ocupado={ocupado}
              onTirar={() => alAccion({ tipo: 'TIRAR_DADOS' })}
            />
          </div>

          <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2">
            {miDescarte > 0 && miMano && (
              <PanelDescarte
                cantidad={miDescarte}
                mano={miMano}
                ocupado={ocupado}
                onDescartar={(recursos) => alAccion({ tipo: 'DESCARTAR_RECURSOS', recursos })}
              />
            )}
            {/* Un botón grande fuera del tablero: la marca sobre la pieza es pequeña y puede quedar sobre un número. */}
            {previa !== null && modo !== 'CARRETERAS' && (
              <button
                type="button"
                disabled={ocupado}
                onClick={() => void ejecutar(accionDePrevia)}
                className="flex items-center gap-2 rounded-full bg-hoja px-7 py-3 text-lg font-extrabold text-white shadow-lg ring-4 ring-white/70 enabled:hover:brightness-110 disabled:opacity-40"
              >
                <IconoAccion tipo="ACEPTAR" />
                Colocar aquí
              </button>
            )}
            {modo === 'CARRETERAS' && (
              <button
                type="button"
                aria-label={`Construir ${carreteras.length} ${carreteras.length === 1 ? 'camino' : 'caminos'}`}
                disabled={ocupado || carreteras.length === 0}
                onClick={() =>
                  alAccion({ tipo: 'JUGAR_CONSTRUCCION_CARRETERAS', aristas: carreteras })
                }
                className="flex items-center gap-2 rounded-full bg-hoja px-5 py-2 font-extrabold text-white shadow-lg enabled:hover:brightness-110 disabled:opacity-40"
              >
                <IconoAccion tipo="ACEPTAR" />
                {carreteras.length}/{MAX_CARRETERAS}
              </button>
            )}
            {pendiente && (
              <fieldset className="flex items-center gap-2 rounded-2xl bg-niebla px-3 py-2 text-tinta shadow-lg">
                <legend className="sr-only">Elegir a quién robar</legend>
                {pendiente.victimas.map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-label={nombreDe(id)}
                    title={nombreDe(id)}
                    disabled={ocupado}
                    onClick={() => void ejecutar(accionDeLadron(modo, pendiente.destino, id))}
                    className="flex size-12 items-center justify-center rounded-full text-xl font-extrabold text-white ring-4 ring-white hover:ring-azafran"
                    style={{ backgroundColor: colorDeJugador(indiceDe(id)) }}
                  >
                    {nombreDe(id).slice(0, 1).toUpperCase()}
                  </button>
                ))}
              </fieldset>
            )}
          </div>

          {yaAbandone && !terminada && (
            <output className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <span className="flex max-w-sm flex-col items-center gap-4 rounded-3xl bg-niebla px-10 py-8 text-center text-tinta shadow-2xl">
                <span className="text-3xl font-extrabold">Abandonaste la partida</span>
                <span className="text-sm">El piloto automático juega por ti hasta el final.</span>
                <Link
                  href="/"
                  className="rounded-full bg-azafran px-6 py-2 font-extrabold hover:bg-azafran-claro"
                >
                  Volver al inicio
                </Link>
              </span>
            </output>
          )}

          {terminada && (
            <output className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <span className="flex flex-col items-center gap-4 rounded-3xl bg-niebla px-10 py-8 text-center text-tinta shadow-2xl">
                <span className="text-3xl font-extrabold">{mensajeDeFase(vista, nombreDe)}</span>
                <Link
                  href="/"
                  className="rounded-full bg-azafran px-6 py-2 font-extrabold hover:bg-azafran-claro"
                >
                  Volver al inicio
                </Link>
              </span>
            </output>
          )}
        </div>
      </main>

      <footer className="sticky bottom-0 z-20 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 bg-mar-profundo/85 px-3 pt-2 pb-3 backdrop-blur sm:px-4 sm:pt-4 sm:pb-5 lg:static lg:col-start-1 lg:row-start-2 lg:bg-transparent lg:backdrop-blur-none">
        <div className="flex items-end gap-6">
          <ManoCartas recursos={miMano} />
          <CartasDesarrollo
            vista={vista}
            puedeJugar={
              miTurno &&
              (vista.fase === 'FASE_PRINCIPAL' || vista.fase === 'PRE_TIRADA') &&
              !ocupado
            }
            onModo={elegirModo}
            onAccion={alAccion}
          />
        </div>
        <div className="relative">
          {comercioAbierto && (
            <Comercio
              mesa={mesa}
              vista={vista}
              acciones={acciones}
              nombreDe={nombreDe}
              indiceDe={indiceDe}
              ocupado={ocupado}
              onAccion={alAccion}
              onCerrar={() => setComercioAbierto(false)}
            />
          )}
          <Paleta
            vista={vista}
            acciones={acciones}
            modo={modo}
            ocupado={ocupado}
            color={miColor}
            comercioAbierto={comercioAbierto}
            onModo={elegirModo}
            onAccion={alAccion}
            onComercio={() => {
              limpiar();
              setComercioAbierto((abierto) => !abierto);
            }}
          />
        </div>
      </footer>

      <aside className="flex flex-col gap-3 overflow-y-auto p-3 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <Banco vista={vista} />
        <div className="hidden lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
          <Jugadores
            vista={vista}
            nombreDe={nombreDe}
            indiceDe={indiceDe}
            presencia={juego.presencia}
          />
        </div>
        <Registro eventos={juego.eventos} nombreDe={nombreDe} indiceDe={indiceDe} />
      </aside>

      <EntregaDeRecursos ultimos={juego.ultimos} yo={yo} />

      {verSorteo && (
        <SorteoDeOrden
          sorteo={vista.sorteo}
          orden={vista.jugadores.map((j) => j.id)}
          nombreDe={nombreDe}
          onCerrar={() => {
            marcarSorteoVisto(credencial.salaId);
            setSorteoCerrado(true);
          }}
        />
      )}

      {confirmandoAbandono && (
        <AvisoDeAbandono
          soloQuedanDos={quedanSinAbandonar <= 2}
          onCancelar={() => setConfirmandoAbandono(false)}
          onConfirmar={() => {
            setConfirmandoAbandono(false);
            void ejecutar({ tipo: 'ABANDONAR' });
          }}
        />
      )}
    </div>
  );
}
