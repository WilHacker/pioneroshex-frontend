import Image from 'next/image';
import type { Carta } from '@/lib/esquemas';
import { composicionDelMazo } from '@/lib/mazo';

type Props = {
  /** Cuántos jugadores hay: el mazo se hace más grande con cada cuatro. */
  jugadores: number;
  /** Los puntos para ganar: el de victoria se revela al llegar a ellos. */
  puntosVictoria: number;
};

interface Descripcion {
  readonly carta: Carta;
  readonly nombre: string;
  readonly imagen: string;
  readonly texto: (puntosVictoria: number) => string;
}

/** En el orden en que se explican: las cuatro que se juegan y, al final, la de punto de victoria. */
const CARTAS: readonly Descripcion[] = [
  {
    carta: 'CABALLERO',
    nombre: 'Caballero',
    imagen: '/cartas/caballero.svg',
    texto: () =>
      'Mueve al ladrón a otra casilla y roba una carta de recursos al azar a un jugador que tenga un edificio ahí.',
  },
  {
    carta: 'CONSTRUCCION_CARRETERAS',
    nombre: 'Carreteras',
    imagen: '/cartas/carreteras.svg',
    texto: () => 'Construye 2 caminos gratis.',
  },
  {
    carta: 'ABUNDANCIA',
    nombre: 'Año de la Abundancia',
    imagen: '/cartas/abundancia.svg',
    texto: () => 'Elige 2 cartas de recursos del banco.',
  },
  {
    carta: 'MONOPOLIO',
    nombre: 'Monopolio',
    imagen: '/cartas/monopolio.svg',
    texto: () =>
      'Elige un recurso y roba todas las cartas de ese tipo a todos los demás jugadores.',
  },
  {
    carta: 'PUNTO_VICTORIA',
    nombre: '+1 Punto de victoria',
    imagen: '/cartas/punto-victoria.svg',
    texto: (puntos) =>
      `Da 1 punto de victoria en secreto. Las cartas de punto de victoria se revelan cuando alcanzas los ${puntos} puntos.`,
  },
];

/** Qué hace cada carta de desarrollo y cuántas lleva el mazo de esta partida. */
export function GuiaDeDesarrollo({ jugadores, puntosVictoria }: Props) {
  const cuantas = composicionDelMazo(jugadores);
  const total = Object.values(cuantas).reduce((suma, n) => suma + n, 0);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-snug text-white/95">
        Las cartas de desarrollo tienen habilidades especiales. Hay {total} en total en el mazo y se
        pueden jugar antes de tirar los dados. Solo una por turno, y no la que acabas de comprar (la
        comprada se puede jugar desde el turno siguiente).
      </p>
      <ul className="flex flex-col gap-2.5">
        {CARTAS.map(({ carta, nombre, imagen, texto }) => (
          <li
            key={carta}
            aria-label={`${nombre} (${cuantas[carta]} cartas)`}
            className="flex items-center gap-2.5"
          >
            <Image
              src={imagen}
              alt=""
              width={30}
              height={42}
              unoptimized
              className="shrink-0 drop-shadow"
            />
            <span className="min-w-0 text-sm leading-snug">
              <span className="font-extrabold">{nombre}</span>{' '}
              <span className="text-white/80">({cuantas[carta]} cartas)</span>
              <span className="block text-white/95">{texto(puntosVictoria)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
