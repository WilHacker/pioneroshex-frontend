import { IconoRecurso } from '@/components/arte/IconoRecurso';
import type { Punto, Recurso } from '@/lib/esquemas';
import { archivoDePieza } from '@/lib/piezas';
import { ImagenSVG } from './ImagenSVG';

/** Las piezas del tablero, en unidades del tablero (el lado de una casilla mide 1). */

type PiezaProps = {
  posicion: Punto;
  color: string;
  /** Más transparente, para la vista previa antes de confirmar. */
  fantasma?: boolean;
};

/** Cuánto ocupa cada dibujo en el tablero, en unidades del tablero (el lado de una casilla es 1). */
const TAMANO_POBLADO = 0.68;
const TAMANO_CIUDAD = 0.66;
const TAMANO_LADRON = 0.64;
/** El camino ocupa esta parte del largo del segmento: deja ver los edificios de los extremos. */
const LARGO_CAMINO = 0.8;
/** Alto y ancho del dibujo del camino (40 × 194): sirve para no deformarlo. */
const PROPORCION_CAMINO = 40 / 194;
const OPACIDAD_FANTASMA = 0.72;

/** Una casa sobre su vértice, en el color del jugador. */
export function Poblado({ posicion, color, fantasma = false }: PiezaProps) {
  return (
    <g
      transform={`translate(${posicion.x} ${posicion.y})`}
      opacity={fantasma ? OPACIDAD_FANTASMA : 1}
    >
      <ImagenSVG
        src={archivoDePieza('poblado', color)}
        centroX={0}
        centroY={-0.04}
        ancho={TAMANO_POBLADO}
        alto={TAMANO_POBLADO}
      />
    </g>
  );
}

/** Una ciudad sobre su vértice, en el color del jugador. */
export function Ciudad({ posicion, color, fantasma = false }: PiezaProps) {
  return (
    <g
      transform={`translate(${posicion.x} ${posicion.y})`}
      opacity={fantasma ? OPACIDAD_FANTASMA : 1}
    >
      <ImagenSVG
        src={archivoDePieza('ciudad', color)}
        centroX={0}
        centroY={-0.04}
        ancho={TAMANO_CIUDAD}
        alto={TAMANO_CIUDAD}
      />
    </g>
  );
}

type CaminoProps = {
  desde: Punto;
  hasta: Punto;
  color: string;
  fantasma?: boolean;
};

/** Un camino entre dos vértices: su dibujo (vertical) girado para que siga el segmento. */
export function Camino({ desde, hasta, color, fantasma = false }: CaminoProps) {
  const dx = hasta.x - desde.x;
  const dy = hasta.y - desde.y;
  const largo = Math.hypot(dx, dy) || 1;
  // El dibujo mira a lo largo del eje y: este giro lo lleva a la dirección del segmento.
  const giro = (Math.atan2(-dx, dy) * 180) / Math.PI;
  const alto = largo * LARGO_CAMINO;
  return (
    <g
      transform={`translate(${(desde.x + hasta.x) / 2} ${(desde.y + hasta.y) / 2}) rotate(${giro})`}
      opacity={fantasma ? OPACIDAD_FANTASMA : 1}
    >
      <ImagenSVG
        src={archivoDePieza('camino', color)}
        centroX={0}
        centroY={0}
        ancho={alto * PROPORCION_CAMINO}
        alto={alto}
      />
    </g>
  );
}

/** El ladrón: su figura apoyada sobre la casilla. */
export function Ladron({ posicion }: { posicion: Punto }) {
  return (
    <g transform={`translate(${posicion.x} ${posicion.y})`}>
      <title>Ladrón</title>
      <ImagenSVG
        src="/tablero/ladron.svg"
        centroX={0}
        centroY={-0.06}
        ancho={TAMANO_LADRON}
        alto={TAMANO_LADRON}
      />
    </g>
  );
}

type PuertoProps = {
  /** Los dos vértices que protege el puerto: cada uno lleva un muelle hasta el barco. */
  vertices: readonly [Punto, Punto];
  mar: Punto;
  /** Vector unitario hacia el mar: si mira hacia arriba la etiqueta va sobre el barco, si no debajo. */
  afuera: Punto;
  tipo: 'GENERICO' | Recurso;
  /** En qué vértices (en el orden de `vertices`) tengo una casa: ese muelle es el que me conecta. */
  conectados?: readonly [boolean, boolean];
  /** Dónde va el centro de la etiqueta; por defecto, justo sobre o bajo el barco. */
  etiquetaEn?: Punto;
};

const BARCO: Record<PuertoProps['tipo'], string> = {
  GENERICO: '/tablero/puerto-3a1.svg',
  MADERA: '/tablero/puerto-madera.svg',
  LADRILLO: '/tablero/puerto-ladrillo.svg',
  OVEJA: '/tablero/puerto-oveja.svg',
  TRIGO: '/tablero/puerto-trigo.svg',
  MINERAL: '/tablero/puerto-mineral.svg',
};

const SIN_CONECTAR: readonly [boolean, boolean] = [false, false];

const TAMANO_BARCO = 1.05;
/** Qué tan lejos del centro del barco, arriba o abajo, va la etiqueta con la razón de cambio. */
const DISTANCIA_ETIQUETA = 0.68;
const ALTO_ETIQUETA = 0.42;

/** Lo que ocupa la etiqueta de un puerto (para repartirlas sin que se pisen). */
export const medidasDeEtiqueta = (tipo: PuertoProps['tipo']) => ({
  ancho: tipo === 'GENERICO' ? 0.74 : 1.2,
  alto: ALTO_ETIQUETA,
});

/** Sitio habitual de la etiqueta: centrada sobre el barco (si mira hacia arriba) o debajo. */
export const etiquetaHabitual = (mar: Punto, afuera: Punto): Punto => ({
  x: mar.x,
  y: mar.y + (afuera.y < 0 ? -1 : 1) * DISTANCIA_ETIQUETA,
});

type MuelleProps = { desde: Punto; hasta: Punto; conectado: boolean };

/**
 * Un muelle de tablones desde un vértice de la costa hasta el barco. Donde tengo una casa se
 * resalta en dorado con un halo: ese es el muelle que me deja usar el puerto.
 */
function Muelle({ desde, hasta, conectado }: MuelleProps) {
  const linea = {
    x1: desde.x,
    y1: desde.y,
    x2: hasta.x,
    y2: hasta.y,
    strokeLinecap: 'round',
  } as const;
  return (
    <g data-muelle="" {...(conectado && { 'data-conectado': 'true' })}>
      {conectado && <line {...linea} stroke="#ffffff" strokeWidth="0.22" opacity="0.85" />}
      <line
        {...linea}
        stroke={conectado ? '#6b3f12' : '#4a2c12'}
        strokeWidth={conectado ? 0.15 : 0.1}
      />
      <line
        {...linea}
        stroke={conectado ? '#ffd34d' : '#d9b377'}
        strokeWidth={conectado ? 0.09 : 0.06}
      />
    </g>
  );
}

/**
 * Lo que acepta el puerto, en grande: el recurso (si es 2:1) y la razón. El dibujo del barco ya la
 * lleva en la vela, pero ahí es demasiado pequeña para leerla de un vistazo.
 */
function EtiquetaDePuerto({ tipo, conectado }: { tipo: PuertoProps['tipo']; conectado: boolean }) {
  const razon = tipo === 'GENERICO' ? '3:1' : '2:1';
  const { ancho } = medidasDeEtiqueta(tipo);
  const que =
    tipo === 'GENERICO'
      ? 'Puerto: cambia 3 cartas iguales por 1 de lo que quieras'
      : `Puerto: cambia 2 cartas de ${tipo.toLowerCase()} por 1 de lo que quieras`;
  return (
    <g data-etiqueta-puerto="" {...(conectado && { 'data-conectado': 'true' })}>
      <title>
        {conectado
          ? `${que}. Estás conectado: tienes una casa en su muelle.`
          : `${que}. Para usarlo necesitas una casa en uno de sus muelles.`}
      </title>
      <rect
        x={-ancho / 2}
        y={-ALTO_ETIQUETA / 2}
        width={ancho}
        height={ALTO_ETIQUETA}
        rx={ALTO_ETIQUETA / 2}
        fill="#0c3340"
        stroke={conectado ? '#ffc95c' : '#fff'}
        strokeWidth={conectado ? 0.07 : 0.04}
      />
      {tipo !== 'GENERICO' && (
        <g transform={`translate(${-ancho / 2 + 0.08} ${-0.18})`}>
          <IconoRecurso recurso={tipo} tamano={0.36} />
        </g>
      )}
      <text
        x={tipo === 'GENERICO' ? 0 : 0.2}
        y="0.115"
        textAnchor="middle"
        fontSize="0.32"
        fontWeight="800"
        fill={conectado ? '#ffd34d' : '#fff'}
      >
        {razon}
      </text>
    </g>
  );
}

/**
 * Un puerto: el barco en el mar, un muelle a cada vértice que protege y lo que acepta. Para usarlo
 * hace falta una casa en uno de sus dos vértices: ese muelle se resalta.
 */
export function Puerto({
  vertices,
  mar,
  afuera,
  tipo,
  conectados = SIN_CONECTAR,
  etiquetaEn,
}: PuertoProps) {
  // Centrada sobre el barco (nunca a un lado): así ocupa poco ancho y el tablero necesita menos margen.
  const etiqueta = etiquetaEn ?? etiquetaHabitual(mar, afuera);
  return (
    <g>
      <Muelle desde={vertices[0]} hasta={mar} conectado={conectados[0]} />
      <Muelle desde={vertices[1]} hasta={mar} conectado={conectados[1]} />
      <ImagenSVG
        src={BARCO[tipo]}
        centroX={mar.x}
        centroY={mar.y}
        ancho={TAMANO_BARCO}
        alto={TAMANO_BARCO}
      />
      <g transform={`translate(${etiqueta.x} ${etiqueta.y})`}>
        <EtiquetaDePuerto tipo={tipo} conectado={conectados[0] || conectados[1]} />
      </g>
    </g>
  );
}
