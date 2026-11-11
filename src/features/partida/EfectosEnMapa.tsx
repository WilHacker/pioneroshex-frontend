'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { IconoRecurso } from '@/components/arte/IconoRecurso';
import { colorDeJugador } from '@/lib/colores';
import type { Mesa, Punto } from '@/lib/esquemas';
import { NOMBRE_RECURSO } from '@/lib/mensajes';
import { efectosDeMapa, type EfectoMapa } from './efectosMapa';
import type { Juego } from './useJuego';

type Props = {
  /** Lo que trajo la última notificación; cada una nueva puede traer recursos o construcciones. */
  ultimos: Juego['ultimos'];
  mesa: Mesa;
  indiceDe: (jugadorId: string) => number;
  nombreDe: (jugadorId: string) => string;
  /** Quien juega: sus recursos y puntos se marcan con un aro más grueso. */
  yo: string | null;
};

type Visible = EfectoMapa & { readonly id: number };

/** Los recursos esperan a que los dados casi se detengan (`.entrega`); luego tardan unos 1,9 s en irse. */
const DURACION_MS = 3300;
/** Separación horizontal entre dos recursos sobre el mismo edificio. */
const SEPARACION = 0.62;

function RecursoEnVertice({
  efecto,
  posicion,
  desvio,
  color,
  nombre,
  propio,
}: {
  efecto: Extract<EfectoMapa, { clase: 'RECURSO' }>;
  posicion: Punto;
  desvio: number;
  color: string;
  nombre: string;
  propio: boolean;
}) {
  return (
    <g transform={`translate(${posicion.x + desvio} ${posicion.y - 0.34})`}>
      <g className="entrega">
        <title>{`${nombre} recibe ${efecto.cantidad} de ${NOMBRE_RECURSO[efecto.recurso]}`}</title>
        {propio && <circle r="0.4" fill="none" stroke="#ffc95c" strokeWidth="0.09" />}
        <circle r="0.3" fill="#fffdf3" stroke={color} strokeWidth="0.08" />
        <g transform="translate(-0.17 -0.17)">
          <IconoRecurso recurso={efecto.recurso} tamano={0.34} />
        </g>
        <text
          y="0.62"
          textAnchor="middle"
          fontSize="0.3"
          fontWeight="800"
          fill="#12312f"
          stroke="#ffffff"
          strokeWidth="0.09"
          paintOrder="stroke"
        >
          {`+${efecto.cantidad}`}
        </text>
      </g>
    </g>
  );
}

function PuntoEnVertice({
  efecto,
  posicion,
  color,
  nombre,
  propio,
}: {
  efecto: Extract<EfectoMapa, { clase: 'PUNTO' }>;
  posicion: Punto;
  color: string;
  nombre: string;
  propio: boolean;
}) {
  return (
    <g transform={`translate(${posicion.x} ${posicion.y - 0.7})`}>
      <g className="punto-sube">
        <title>{`${nombre} gana ${efecto.puntos} ${efecto.puntos === 1 ? 'punto' : 'puntos'}`}</title>
        <rect
          x="-0.46"
          y="-0.22"
          width="0.92"
          height="0.44"
          rx="0.22"
          fill={color}
          stroke={propio ? '#ffc95c' : '#ffffff'}
          strokeWidth={propio ? 0.09 : 0.05}
        />
        <text
          y="0.1"
          textAnchor="middle"
          fontSize="0.3"
          fontWeight="800"
          fill="#ffffff"
          stroke="#12312f"
          strokeWidth="0.05"
          paintOrder="stroke"
        >
          {`+${efecto.puntos} ★`}
        </text>
      </g>
    </g>
  );
}

/**
 * Lo que pasa en el mapa tras cada jugada, justo donde pasa: sobre cada edificio que cobra aparece
 * el recurso que recibe (con el color de su dueño, el tuyo con un aro dorado) y sobre cada poblado
 * o ciudad que se construye, el punto que vale. Es un adorno: se dibuja dentro del tablero (`capa`)
 * y no recibe toques.
 */
export function EfectosEnMapa({ ultimos, mesa, indiceDe, nombreDe, yo }: Props) {
  const [visibles, setVisibles] = useState<readonly Visible[]>([]);
  const numeroVisto = useRef(0);
  const siguienteId = useRef(0);
  const temporizadores = useRef<ReturnType<typeof setTimeout>[]>([]);
  const posiciones = useMemo(
    () => new Map<string, Punto>(mesa.vertices.map((v) => [v.id, v.posicion])),
    [mesa],
  );

  useEffect(() => {
    if (ultimos.numero === numeroVisto.current) return;
    numeroVisto.current = ultimos.numero;
    const nuevos = efectosDeMapa(ultimos.eventos).map((e): Visible => {
      siguienteId.current += 1;
      return { ...e, id: siguienteId.current };
    });
    if (nuevos.length === 0) return;
    const ids = new Set(nuevos.map((n) => n.id));
    // Los efectos llegan con la notificación y solo se pueden contar al recibirla, no al renderizar.
    // oxlint-disable-next-line react/set-state-in-effect
    setVisibles((previos) => [...previos, ...nuevos]);
    temporizadores.current.push(
      setTimeout(
        () => setVisibles((previos) => previos.filter((v) => !ids.has(v.id))),
        DURACION_MS,
      ),
    );
  }, [ultimos]);

  useEffect(() => {
    const pendientes = temporizadores.current;
    return () => pendientes.forEach(clearTimeout);
  }, []);

  // Varios recursos sobre el mismo edificio se reparten en fila para no taparse.
  const recursosEn = (vertice: string): Visible[] =>
    visibles.filter((v) => v.clase === 'RECURSO' && v.vertice === vertice);

  return (
    <g pointerEvents="none" aria-hidden="true" data-efectos-mapa="">
      {visibles.map((v) => {
        const posicion = posiciones.get(v.vertice);
        if (!posicion) return null;
        const color = colorDeJugador(Math.max(0, indiceDe(v.jugador)));
        const nombre = nombreDe(v.jugador);
        const propio = v.jugador === yo;
        if (v.clase === 'PUNTO') {
          return (
            <PuntoEnVertice
              key={v.id}
              efecto={v}
              posicion={posicion}
              color={color}
              nombre={nombre}
              propio={propio}
            />
          );
        }
        const juntos = recursosEn(v.vertice);
        const desvio =
          (juntos.findIndex((w) => w.id === v.id) - (juntos.length - 1) / 2) * SEPARACION;
        return (
          <RecursoEnVertice
            key={v.id}
            efecto={v}
            posicion={posicion}
            desvio={desvio}
            color={color}
            nombre={nombre}
            propio={propio}
          />
        );
      })}
    </g>
  );
}
