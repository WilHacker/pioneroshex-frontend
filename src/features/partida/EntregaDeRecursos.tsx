'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { IconoRecurso } from '@/components/arte/IconoRecurso';
import type { Recurso } from '@/lib/esquemas';
import { entregasDe } from './entregas';
import type { Juego } from './useJuego';

type Punto = { readonly x: number; readonly y: number };

interface Vuelo {
  readonly id: number;
  readonly recurso: Recurso;
  readonly cantidad: number;
  readonly desde: Punto;
  readonly hasta: Punto;
  /** El elemento que recibe: rebota un poco al llegar el icono. */
  readonly destino: Element;
  readonly retrasoMs: number;
}

const DURACION_MS = 1000;
/** Entre una entrega y la siguiente, para que se vea a quién va cada una. */
const ESCALON_MS = 150;
/** Un reparto muy grande no debe llenar la pantalla de iconos. */
const ENTREGAS_MAX = 14;
const MARGEN_PANTALLA = 16;

/** El centro de un elemento si se ve en pantalla; `null` si está oculto (p. ej. la lista de escritorio en un móvil). */
function centroVisible(el: Element): Punto | null {
  const caja = el.getBoundingClientRect();
  if (caja.width === 0 && caja.height === 0) return null;
  return { x: caja.left + caja.width / 2, y: caja.top + caja.height / 2 };
}

function primeroVisible(elementos: Iterable<Element>): { el: Element; centro: Punto } | null {
  for (const el of elementos) {
    const centro = centroVisible(el);
    if (centro) return { el, centro };
  }
  return null;
}

const conAtributo = (atributo: string, valor: string): Element[] =>
  [...document.querySelectorAll(`[${atributo}]`)].filter(
    (el) => el.getAttribute(atributo) === valor,
  );

/** Si el banco queda fuera de la pantalla (móvil), el icono entra desde el borde en vez de salir de la nada. */
const dentroDePantalla = (p: Punto): Punto => ({
  x: Math.min(Math.max(p.x, MARGEN_PANTALLA), window.innerWidth - MARGEN_PANTALLA),
  y: Math.min(Math.max(p.y, MARGEN_PANTALLA), window.innerHeight - MARGEN_PANTALLA),
});

const prefiereMenosMovimiento = (): boolean =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const traslado = (p: Punto, escala: number): string =>
  `translate(${p.x}px, ${p.y}px) scale(${escala})`;

function VueloDeRecurso({ vuelo, alTerminar }: { vuelo: Vuelo; alTerminar: (id: number) => void }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    // Un navegador sin animaciones no muestra el vuelo: es un adorno, no información.
    if (!el || typeof el.animate !== 'function') {
      alTerminar(vuelo.id);
      return;
    }
    const vuelo$ = el.animate(
      [
        { transform: traslado(vuelo.desde, 0.5), opacity: 0 },
        { transform: traslado(vuelo.desde, 1), opacity: 1, offset: 0.12 },
        { transform: traslado(vuelo.hasta, 1), opacity: 1, offset: 0.82 },
        { transform: traslado(vuelo.hasta, 0.6), opacity: 0 },
      ],
      { duration: DURACION_MS, delay: vuelo.retrasoMs, easing: 'ease-in-out', fill: 'both' },
    );
    vuelo$.onfinish = () => alTerminar(vuelo.id);
    const rebote =
      typeof vuelo.destino.animate === 'function'
        ? vuelo.destino.animate(
            [
              { transform: 'scale(1)' },
              { transform: 'scale(1.06)', offset: 0.4 },
              { transform: 'scale(1)' },
            ],
            { duration: 420, delay: vuelo.retrasoMs + DURACION_MS * 0.8, easing: 'ease-out' },
          )
        : null;
    return () => {
      vuelo$.cancel();
      rebote?.cancel();
    };
  }, [vuelo, alTerminar]);

  return (
    <span
      ref={ref}
      className="absolute top-0 left-0 flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 rounded-full bg-white py-0.5 pr-2 pl-0.5 text-sm font-extrabold text-tinta opacity-0 shadow-lg ring-2 ring-azafran"
    >
      <IconoRecurso recurso={vuelo.recurso} tamano={26} />+{vuelo.cantidad}
    </span>
  );
}

type Props = {
  /** Lo que trajo la última notificación; cada una nueva puede traer un reparto de recursos. */
  ultimos: Juego['ultimos'];
  /** Quien juega: lo que gana vuela hasta su mano. */
  yo: string | null;
};

/**
 * Cuando el banco reparte recursos, un icono sale de la casilla de ese recurso en el banco y vuela
 * hasta cada jugador que lo recibe (o hasta tu mano, si eres tú). Solo dibuja un adorno encima de
 * la pantalla: busca los puntos de salida y llegada por `data-banco-recurso`, `data-jugador-id` y
 * `data-mano-recursos`.
 */
export function EntregaDeRecursos({ ultimos, yo }: Props) {
  const [vuelos, setVuelos] = useState<readonly Vuelo[]>([]);
  const numeroVisto = useRef(0);
  const siguienteId = useRef(0);

  useEffect(() => {
    if (ultimos.numero === numeroVisto.current) return;
    numeroVisto.current = ultimos.numero;
    if (prefiereMenosMovimiento()) return;

    const nuevos: Vuelo[] = [];
    for (const entrega of entregasDe(ultimos.eventos).slice(0, ENTREGAS_MAX)) {
      const origen = primeroVisible(conAtributo('data-banco-recurso', entrega.recurso));
      const destino =
        (entrega.jugador === yo
          ? primeroVisible(document.querySelectorAll('[data-mano-recursos]'))
          : null) ?? primeroVisible(conAtributo('data-jugador-id', entrega.jugador));
      if (!destino) continue;
      siguienteId.current += 1;
      nuevos.push({
        id: siguienteId.current,
        recurso: entrega.recurso,
        cantidad: entrega.cantidad,
        desde: dentroDePantalla(origen?.centro ?? { x: window.innerWidth / 2, y: 0 }),
        hasta: destino.centro,
        destino: destino.el,
        retrasoMs: nuevos.length * ESCALON_MS,
      });
    }
    // Las posiciones solo se conocen midiendo el DOM ya pintado: no se pueden derivar al renderizar.
    // oxlint-disable-next-line react/set-state-in-effect
    if (nuevos.length > 0) setVuelos((previos) => [...previos, ...nuevos]);
  }, [ultimos, yo]);

  const quitar = useCallback(
    (id: number) => setVuelos((previos) => previos.filter((v) => v.id !== id)),
    [],
  );

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {vuelos.map((vuelo) => (
        <VueloDeRecurso key={vuelo.id} vuelo={vuelo} alTerminar={quitar} />
      ))}
    </div>
  );
}
