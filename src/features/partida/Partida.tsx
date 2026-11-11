'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { IconoAccion } from '@/components/arte/IconosEstado';
import { faltaPara, textoDeFalta } from '@/lib/costos';
import type { Credencial, Hex } from '@/lib/esquemas';
import { textoDeMotivo } from '@/lib/mensajes';
import { marcarSorteoVisto, yaVioElSorteo } from '@/lib/sesion';
import { sonidoDelJuego, type Efecto } from '@/lib/sonido';
import { victimasEn } from '@/lib/tablero';
import { AvisoDeAbandono } from './AvisoDeAbandono';
import { AvisoDeLogro } from './AvisoDeLogro';
import { Banco } from './Banco';
import { CartasDesarrollo } from './CartasDesarrollo';
import { colorDeJugador } from '@/lib/colores';
import { Comercio } from './Comercio';
import { Dados } from './Dados';
import { EfectosEnMapa } from './EfectosEnMapa';
import { EntregaDeRecursos } from './EntregaDeRecursos';
import { SorteoDeOrden } from './SorteoDeOrden';
import { efectoDe } from './efectos';
import { Jugadores } from './Jugadores';
import {
  accionDeArista,
  accionDeLadron,
  accionDeSitioRapido,
  accionDeVertice,
  esMiTurno,
  mensajeDeFase,
  modoEfectivo,
  objetivoDe,
  puedeConstruirAlDobleClic,
  sitiosDe,
  TEXTO_DE_SITIO,
  type Modo,
} from './logica';
import { ManoCartas } from './ManoCartas';
import { Ofertas } from './Ofertas';
import { PanelDeConstruccion } from './PanelDeConstruccion';
import { PanelDescarte } from './PanelDescarte';
import { PantallaFinal } from './PantallaFinal';
import { Paleta } from './Paleta';
import { Registro } from './Registro';
import { Reloj } from './Reloj';
import { TiraDeJugadores } from './TiraDeJugadores';
import { Tablero, type SitioRapido } from './Tablero';
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
/** Cuánto se queda a la vista el costo de un sitio apuntado, si no se mueve el ratón a otro. */
const APUNTADO_MS = 4000;
/** Cuánto espera la marca de confirmar (el aro verde del mapa) antes de quitarse sola. */
const CONFIRMAR_MS = 8000;
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
  /** El sitio del mapa al que se apunta (ratón encima o un toque): se muestra su costo. */
  const [apuntado, setApuntado] = useState<SitioRapido | null>(null);
  /** El sitio donde se pidió construir con doble clic: espera confirmación. */
  const [rapido, setRapido] = useState<SitioRapido | null>(null);

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

  // El cartel del costo al apuntar se apaga solo; la marca de confirmar se quita con Escape o sola.
  useEffect(() => {
    if (apuntado === null) return;
    const id = setTimeout(() => setApuntado(null), APUNTADO_MS);
    return () => clearTimeout(id);
  }, [apuntado]);
  useEffect(() => {
    if (rapido === null) return;
    const id = setTimeout(() => setRapido(null), CONFIRMAR_MS);
    const alTeclear = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setRapido(null);
    };
    window.addEventListener('keydown', alTeclear);
    return () => {
      clearTimeout(id);
      window.removeEventListener('keydown', alTeclear);
    };
  }, [rapido]);
  // Al acabar mi turno, lo que estaba a medias ya no vale (elegir otra herramienta ya lo limpia).
  useEffect(() => {
    // Hay que sincronizar con un cambio que llega del servidor, no se puede derivar al renderizar.
    // oxlint-disable-next-line react/set-state-in-effect
    if (!miTurno) setRapido(null);
  }, [miTurno]);

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
    setApuntado(null);
    setRapido(null);
  };

  /** `pieza` (p. ej. «un poblado») afina el aviso cuando faltan recursos: dice qué no alcanzó a pagar. */
  const ejecutar = async (accion: object | null, pieza?: string): Promise<void> => {
    if (!accion) return;
    setOcupado(true);
    const error = await juego.enviar(accion);
    setOcupado(false);
    setAviso(
      error !== null && pieza !== undefined && error === textoDeMotivo('RECURSOS_INSUFICIENTES')
        ? `No tienes recursos para ${pieza}`
        : error,
    );
    if (error === null) limpiar();
    else sonido.reproducir('error');
  };

  // Atajo del mapa: apuntar a un sitio muestra su costo; doble clic deja la pieza en fantasma con el
  // aro verde, y un clic en el aro construye. Si no alcanzan los recursos, solo avisa de lo que falta.
  const dobleClicActivo = !yaAbandone && !terminada && puedeConstruirAlDobleClic(vista, modo);
  const alDobleClic = (sitio: SitioRapido): void => {
    if (ocupado) return;
    const falta = faltaPara(miMano, sitio.tipo);
    if (Object.keys(falta).length > 0) {
      setRapido(null);
      setApuntado(sitio);
      setAviso(
        `No tienes recursos para ${TEXTO_DE_SITIO[sitio.tipo].pieza}: te falta ${textoDeFalta(falta)}`,
      );
      sonido.reproducir('error');
      return;
    }
    setApuntado(null);
    setRapido(sitio);
    setAviso(null);
    sonido.reproducir('clic');
  };
  const confirmarRapido = (): void => {
    if (rapido === null || ocupado) return;
    const sitio = rapido;
    setRapido(null);
    void ejecutar(accionDeSitioRapido(sitio), TEXTO_DE_SITIO[sitio.tipo].pieza);
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
    <div className="mar fixed inset-0 z-10 flex flex-col overflow-y-auto font-juego text-white lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:grid-rows-[minmax(0,1fr)_auto] lg:overflow-hidden apaisado:grid apaisado:grid-cols-[minmax(0,1fr)_21rem] apaisado:grid-rows-[auto_minmax(0,1fr)] apaisado:overflow-hidden">
      {/* Teléfono vertical: tablero y pie reparten la altura de la pantalla (sin taparse) y debajo van el banco y el registro. */}
      <div className="flex h-full shrink-0 flex-col lg:contents apaisado:contents">
        <main className="relative flex min-h-0 flex-1 flex-col gap-2 p-3 lg:col-start-1 lg:row-start-1 lg:min-h-0 apaisado:col-start-1 apaisado:row-span-2 apaisado:row-start-1 apaisado:min-h-0">
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
          <AvisoDeLogro ultimos={juego.ultimos} nombreDe={nombreDe} />
          {aviso && (
            <p
              role="alert"
              className="mx-auto rounded-xl bg-coral px-4 py-2 text-sm font-bold shadow-lg"
            >
              {aviso}
            </p>
          )}

          {/* Entre lg y xl el tablero ocupa casi todo el ancho: los dados bajan a su propia fila para no tapar casillas ni puertos. */}
          <div className="relative flex min-h-40 grow items-center justify-center lg:min-h-0 lg:max-xl:grid lg:max-xl:grid-cols-[minmax(0,1fr)] lg:max-xl:grid-rows-[minmax(0,1fr)_auto] apaisado:min-h-0">
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
              entregas={juego.entregadas}
              capa={
                <EfectosEnMapa
                  ultimos={juego.ultimos}
                  mesa={mesa}
                  indiceDe={indiceDe}
                  nombreDe={nombreDe}
                  yo={yo}
                />
              }
              zoom
              onVertice={(id) => tocarSitio(id, accionDeVertice(vista, modo, id))}
              onArista={alArista}
              onCasilla={alCasilla}
              {...(dobleClicActivo && {
                onDoble: alDobleClic,
                onApuntar: (sitio: SitioRapido | null, porClic?: boolean) => {
                  if (rapido !== null) {
                    // Un clic en otro sitio descarta la marca de confirmar; el ratón que pasa por encima, no.
                    if (porClic && sitio !== null && sitio.id !== rapido.id) {
                      setRapido(null);
                      setApuntado(sitio);
                    }
                    return;
                  }
                  setApuntado(sitio);
                },
                onConfirmarFantasma: confirmarRapido,
                fantasma: rapido,
              })}
            />

            {dobleClicActivo && (rapido ?? apuntado) !== null && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-2 left-2 z-20 origin-top-left scale-90"
              >
                <PanelDeConstruccion
                  sitio={(rapido ?? apuntado) as SitioRapido}
                  mano={miMano}
                  color={miColor}
                />
              </div>
            )}

            <div className="absolute top-0 left-1/2 z-20 -translate-x-1/2">
              <Ofertas
                vista={vista}
                nombreDe={nombreDe}
                indiceDe={indiceDe}
                ocupado={ocupado}
                onAccion={alAccion}
              />
            </div>

            <div className="absolute right-1 bottom-1 origin-bottom-right scale-60 sm:scale-100 lg:max-xl:static lg:max-xl:[zoom:0.7] lg:max-xl:justify-self-end apaisado:scale-60">
              <Dados
                dados={vista.dados}
                tirada={juego.tiradas}
                puedeTirar={puedeTirar}
                ocupado={ocupado}
                onTirar={() => alAccion({ tipo: 'TIRAR_DADOS' })}
              />
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
              <PantallaFinal vista={vista} credencial={credencial} nombreDe={nombreDe} />
            )}
          </div>

          {/* Los controles de la jugada van debajo del tablero, no encima: flotando sobre su borde tapaban los puertos. Vacío, no ocupa sitio. */}
          <div className="z-20 flex shrink-0 flex-col items-center gap-2 empty:hidden">
            {miDescarte > 0 && miMano && (
              <PanelDescarte
                cantidad={miDescarte}
                mano={miMano}
                ocupado={ocupado}
                onDescartar={(recursos) => alAccion({ tipo: 'DESCARTAR_RECURSOS', recursos })}
              />
            )}
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
        </main>

        <footer className="z-20 flex shrink-0 flex-wrap items-end justify-between gap-x-4 gap-y-2 bg-mar-profundo/85 px-3 pt-2 pb-3 sm:px-4 sm:pt-4 sm:pb-5 lg:static lg:col-start-1 lg:row-start-2 lg:bg-transparent apaisado:static apaisado:col-start-2 apaisado:row-start-1 apaisado:bg-transparent apaisado:px-3 apaisado:pt-2 apaisado:pb-0">
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
      </div>

      <aside className="flex flex-col gap-3 overflow-y-auto p-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 apaisado:col-start-2 apaisado:row-start-2">
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
