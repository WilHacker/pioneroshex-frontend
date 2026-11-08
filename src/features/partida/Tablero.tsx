import { memo, useMemo, type KeyboardEvent, type ReactNode } from 'react';
import { ControlesDeZoom } from '@/components/ControlesDeZoom';
import { useZoom } from '@/components/useZoom';
import type { Hex, Mesa, Punto, Vista } from '@/lib/esquemas';
import {
  cajaDeMesa,
  type Caja,
  claveHex,
  esquinasDeCasilla,
  posicionDePuerto,
  separarEtiquetas,
  posicionesDeVertices,
  viewBoxDe,
} from '@/lib/tablero';
import { Casilla, DefinicionesDeCasilla } from './Casilla';
import { colorDeJugador } from '@/lib/colores';
import { puertosConectados } from '@/lib/puertos';
import {
  Camino,
  Ciudad,
  Ladron,
  Poblado,
  Puerto,
  etiquetaHabitual,
  medidasDeEtiqueta,
} from './PiezasSVG';

/** Qué se puede tocar ahora en el tablero. */
export type Objetivo = 'POBLADOS' | 'CIUDADES' | 'ARISTAS' | 'CASILLAS' | null;

type Props = {
  mesa: Mesa;
  /** Solo lo que el tablero dibuja: así también sirve para el tablero decorativo de la portada. */
  vista: Pick<Vista, 'yo' | 'edificios' | 'caminos' | 'ladron'>;
  /** Posición de cada jugador en el orden de turno (para su color y su número). */
  indiceDe: (jugadorId: string) => number;
  nombreDe: (jugadorId: string) => string;
  objetivo: Objetivo;
  /** Dónde se puede actuar: ids de vértice o de arista, o claves `"q,r"` de casilla. */
  sitios: readonly string[];
  /** El sitio elegido que espera confirmación (se muestra la pieza en fantasma). */
  previa: string | null;
  /** Aristas ya elegidas para "construcción de carreteras". */
  aristasElegidas?: readonly string[];
  /** El número que acaba de salir: sus casillas laten. */
  numeroResaltado?: number | null;
  onVertice: (id: string) => void;
  onArista: (id: string) => void;
  onCasilla: (hex: Hex) => void;
  /** Dibujo extra encima de todo (p. ej. los recursos que reparte una tirada). */
  capa?: ReactNode;
  /** Zoom con rueda, arrastre, pellizco y botones. Apagado en el tablero decorativo de la portada. */
  zoom?: boolean;
};

const SIN_ARISTAS: readonly string[] = [];
const RADIO_DE_TOQUE = 0.32;

/** El mar poco profundo y la arena que rodean la isla (anchos en unidades del tablero). */
const COLOR_MAR_BAJO = '#2f93a6';
const ANCHO_MAR_BAJO = 1.15;
const COLOR_PLAYA = '#f1dfa8';
const ANCHO_PLAYA = 0.42;

const puntos = (lista: readonly Punto[]): string => lista.map((p) => `${p.x},${p.y}`).join(' ');

type TocableProps = {
  etiqueta: string;
  alActivar: () => void;
  presionado?: boolean;
  children: ReactNode;
};

/** Un elemento del SVG que se maneja con ratón y con teclado (Enter o Espacio), como un botón. */
function Tocable({ etiqueta, alActivar, presionado, children }: TocableProps) {
  const alTeclear = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      alActivar();
    }
  };
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={etiqueta}
      aria-pressed={presionado}
      className="cursor-pointer outline-none focus-visible:[&_.aro]:stroke-azafran"
      onClick={alActivar}
      onKeyDown={alTeclear}
    >
      {children}
    </g>
  );
}

/**
 * La marca de una pieza en vista previa: tocarla de nuevo la coloca. Es un aro verde alrededor de
 * la pieza con un visto en una esquina. El aro es lo bastante estrecho para no llegar a la ficha
 * de ningún número vecino (las fichas están a 1 de cada vértice), y el botón «Colocar aquí» de la
 * pantalla hace de confirmación grande.
 */
function Confirmar({ posicion }: { posicion: Punto }) {
  return (
    <g transform={`translate(${posicion.x} ${posicion.y})`}>
      <circle r="0.36" fill="none" stroke="#fff" strokeWidth="0.12" />
      <circle r="0.36" fill="none" stroke="#2f9d5b" strokeWidth="0.07" />
      <g transform="translate(0.27 -0.27)">
        <circle r="0.17" fill="#2f9d5b" stroke="#fff" strokeWidth="0.05" />
        <path
          d="M-0.08 0 L-0.02 0.07 L0.09 -0.06"
          fill="none"
          stroke="#fff"
          strokeWidth="0.055"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
}

/** Dónde va cada puerto y su etiqueta, ya separada de las vecinas en los entrantes estrechos. */
function lugaresConEtiqueta(mesa: Mesa, posiciones: ReadonlyMap<string, Punto>) {
  const colocados = mesa.puertos.flatMap((p) => {
    const lugar = posicionDePuerto(p.vertices, posiciones, mesa.casillas);
    return lugar ? [{ p, lugar }] : [];
  });
  const separadas = separarEtiquetas(
    colocados.map(({ p, lugar }) => ({
      centro: etiquetaHabitual(lugar.mar, lugar.afuera),
      ...medidasDeEtiqueta(p.tipo),
    })),
  );
  return colocados.map((c, i) => ({ ...c, etiquetaEn: separadas[i] }));
}

type ContenidoProps = Omit<Props, 'zoom'>;

/**
 * Todo lo que se dibuja dentro del `<svg>`. Está memoizado: el zoom y el arrastre cambian el
 * `viewBox` muchas veces por segundo y esto no debe volver a calcularse con cada uno.
 */
const ContenidoDelTablero = memo(function ContenidoDelTablero({
  mesa,
  vista,
  indiceDe,
  nombreDe,
  objetivo,
  sitios,
  previa,
  aristasElegidas = SIN_ARISTAS,
  numeroResaltado = null,
  onVertice,
  onArista,
  onCasilla,
  capa = null,
}: ContenidoProps) {
  const posiciones = posicionesDeVertices(mesa);
  const miColor = colorDeJugador(vista.yo ? indiceDe(vista.yo) : 0);
  const legales = new Set(sitios);
  const conectados = puertosConectados(mesa, vista);
  const lugaresDePuertos = lugaresConEtiqueta(mesa, posiciones);

  return (
    <>
      <DefinicionesDeCasilla />

      {/* La isla tiene un borde de mar poco profundo y otro de playa, por debajo de las casillas. */}
      <g data-borde="mar" aria-hidden="true">
        {mesa.casillas.map((c) => (
          <polygon
            key={claveHex(c.hex)}
            points={puntos(esquinasDeCasilla(c.centro))}
            fill={COLOR_MAR_BAJO}
            stroke={COLOR_MAR_BAJO}
            strokeWidth={ANCHO_MAR_BAJO}
            strokeLinejoin="round"
          />
        ))}
      </g>
      <g data-borde="playa" aria-hidden="true">
        {mesa.casillas.map((c) => (
          <polygon
            key={claveHex(c.hex)}
            points={puntos(esquinasDeCasilla(c.centro))}
            fill={COLOR_PLAYA}
            stroke={COLOR_PLAYA}
            strokeWidth={ANCHO_PLAYA}
            strokeLinejoin="round"
          />
        ))}
      </g>

      {mesa.casillas.map((c) => (
        <Casilla
          key={claveHex(c.hex)}
          terreno={c.terreno}
          ficha={c.ficha}
          centro={c.centro}
          resaltada={numeroResaltado !== null && c.ficha === numeroResaltado}
        />
      ))}

      {lugaresDePuertos.map(({ p, lugar, etiquetaEn }) => {
        const mios = conectados.get(p.arista) ?? [];
        return (
          <Puerto
            key={p.arista}
            vertices={lugar.vertices}
            mar={lugar.mar}
            afuera={lugar.afuera}
            etiquetaEn={etiquetaEn}
            tipo={p.tipo}
            conectados={[mios.includes(p.vertices[0]), mios.includes(p.vertices[1])]}
          />
        );
      })}

      {mesa.aristas.map((a) => {
        const dueno = vista.caminos[a.id];
        const desde = posiciones.get(a.vertices[0]);
        const hasta = posiciones.get(a.vertices[1]);
        if (!desde || !hasta) return null;
        if (dueno !== undefined) {
          return (
            <g key={a.id}>
              <title>{`Camino de ${nombreDe(dueno)}`}</title>
              <Camino desde={desde} hasta={hasta} color={colorDeJugador(indiceDe(dueno))} />
            </g>
          );
        }
        const elegida = aristasElegidas.includes(a.id);
        const enPrevia = previa === a.id;
        if (elegida || enPrevia) {
          const medio = { x: (desde.x + hasta.x) / 2, y: (desde.y + hasta.y) / 2 };
          return (
            <Tocable
              key={a.id}
              etiqueta={`Confirmar camino en ${a.id}`}
              alActivar={() => onArista(a.id)}
              presionado
            >
              <Camino desde={desde} hasta={hasta} color={miColor} fantasma />
              {enPrevia && <Confirmar posicion={medio} />}
            </Tocable>
          );
        }
        if (objetivo !== 'ARISTAS' || !legales.has(a.id)) return null;
        return (
          <Tocable
            key={a.id}
            etiqueta={`Poner camino en ${a.id}`}
            alActivar={() => onArista(a.id)}
            presionado={false}
          >
            <line
              className="sitio aro"
              x1={desde.x}
              y1={desde.y}
              x2={hasta.x}
              y2={hasta.y}
              stroke="#ffffff"
              strokeWidth="0.1"
              strokeLinecap="round"
              strokeDasharray="0.1 0.09"
            />
            <line
              x1={desde.x}
              y1={desde.y}
              x2={hasta.x}
              y2={hasta.y}
              stroke="transparent"
              strokeWidth="0.45"
            />
          </Tocable>
        );
      })}

      {mesa.vertices.map((v) => {
        const edificio = vista.edificios[v.id];
        const esMio = edificio?.dueno === vista.yo;
        const mejorando =
          objetivo === 'CIUDADES' && esMio && edificio?.tipo === 'POBLADO' && legales.has(v.id);
        const enPrevia = previa === v.id;

        if (edificio) {
          const color = colorDeJugador(indiceDe(edificio.dueno));
          const Pieza = edificio.tipo === 'CIUDAD' ? Ciudad : Poblado;
          const dibujo = (
            <>
              <title>{`${edificio.tipo === 'CIUDAD' ? 'Ciudad' : 'Poblado'} de ${nombreDe(edificio.dueno)}`}</title>
              <Pieza posicion={v.posicion} color={color} />
            </>
          );
          if (!mejorando) return <g key={v.id}>{dibujo}</g>;
          return (
            <Tocable
              key={v.id}
              etiqueta={`Mejorar a ciudad el poblado en ${v.id}`}
              alActivar={() => onVertice(v.id)}
              presionado={enPrevia}
            >
              {dibujo}
              <circle
                className="sitio aro"
                cx={v.posicion.x}
                cy={v.posicion.y}
                r={RADIO_DE_TOQUE}
                fill="none"
                stroke="#ffc95c"
                strokeWidth="0.045"
                strokeDasharray="0.09 0.07"
              />
              {enPrevia && (
                <>
                  <Ciudad posicion={v.posicion} color={miColor} fantasma />
                  <Confirmar posicion={v.posicion} />
                </>
              )}
            </Tocable>
          );
        }

        if (objetivo !== 'POBLADOS' || !legales.has(v.id)) return null;
        return (
          <Tocable
            key={v.id}
            etiqueta={`Construir en el vértice ${v.id}`}
            alActivar={() => onVertice(v.id)}
            presionado={enPrevia}
          >
            {enPrevia ? (
              <>
                <Poblado posicion={v.posicion} color={miColor} fantasma />
                <Confirmar posicion={v.posicion} />
              </>
            ) : (
              <circle
                className="sitio aro"
                cx={v.posicion.x}
                cy={v.posicion.y}
                r="0.12"
                fill="#ffffff"
                stroke="#12312f"
                strokeWidth="0.03"
              />
            )}
            <circle cx={v.posicion.x} cy={v.posicion.y} r={RADIO_DE_TOQUE} fill="transparent" />
          </Tocable>
        );
      })}

      {objetivo === 'CASILLAS' &&
        mesa.casillas
          .filter((c) => legales.has(claveHex(c.hex)))
          .map((c) => (
            <Tocable
              key={`destino-${claveHex(c.hex)}`}
              etiqueta={`Mover el ladrón a la casilla ${claveHex(c.hex)}`}
              alActivar={() => onCasilla(c.hex)}
            >
              <polygon
                className="sitio aro"
                points={puntos(esquinasDeCasilla(c.centro))}
                fill="#ffffff"
                fillOpacity="0.28"
                stroke="#ffffff"
                strokeWidth="0.06"
                strokeLinejoin="round"
              />
            </Tocable>
          ))}

      {vista.ladron &&
        mesa.casillas
          .filter((c) => claveHex(c.hex) === claveHex(vista.ladron!))
          .map((c) => (
            <Ladron key="ladron" posicion={{ x: c.centro.x + 0.34, y: c.centro.y - 0.08 }} />
          ))}
      {capa}
    </>
  );
});

type MarcoProps = { caja: Caja; zoom: boolean; children: ReactNode };

/**
 * El `<svg>` con su zoom. Guarda el estado del zoom (que cambia sin parar) y recibe el dibujo como
 * `children`: como ese elemento no cambia, React no lo vuelve a recorrer en cada paso del zoom.
 */
function MarcoDelTablero({ caja, zoom, children }: MarcoProps) {
  const { svgRef, viewBox, nivel, acercar, alejar, verTodo, propiedades } = useZoom(caja, zoom);
  const svg = (
    <svg
      ref={svgRef}
      viewBox={zoom ? viewBox : viewBoxDe(caja)}
      aria-label="Tablero de juego"
      className="h-full max-h-full w-full max-w-full select-none"
      {...propiedades}
    >
      {children}
    </svg>
  );
  if (!zoom) return svg;
  return (
    <>
      {svg}
      <ControlesDeZoom nivel={nivel} onAcercar={acercar} onAlejar={alejar} onVerTodo={verTodo} />
    </>
  );
}

export function Tablero({ zoom = false, ...contenido }: Props) {
  const caja = useMemo(() => cajaDeMesa(contenido.mesa), [contenido.mesa]);
  return (
    <MarcoDelTablero caja={caja} zoom={zoom}>
      <ContenidoDelTablero {...contenido} />
    </MarcoDelTablero>
  );
}
