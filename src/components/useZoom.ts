import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import type { Caja } from '@/lib/tablero';
import {
  acercarEn,
  desplazamientoDeArrastre,
  desplazar,
  nivelDeZoom,
  puntoDeSvg,
} from '@/lib/zoom';

/** Lo que se acerca o aleja con cada botón o cada "paso" de la rueda. */
const FACTOR_BOTON = 1.6;
const FACTOR_RUEDA = 1.15;
/** Sin gestos durante este tiempo, el tablero vuelve a dibujarse con todo detalle. */
const REPOSO_MS = 300;
/** Clase del `<svg>` mientras dura un gesto: el CSS la usa para dibujar más rápido (ver globals.css). */
const CLASE_EN_GESTO = 'tablero-en-gesto';
/** Píxeles que hay que mover el dedo para que un toque cuente como arrastre y no como clic. */
const UMBRAL_ARRASTRE_PX = 6;

interface EstadoDeZoom {
  /** La caja base con la que se calculó: si cambia (otro tablero), la vista vuelve a ser la entera. */
  readonly clave: string;
  readonly caja: Caja;
}

interface Dedo {
  x: number;
  y: number;
}

const claveDe = (c: Caja): string => `${c.x}|${c.y}|${c.ancho}|${c.alto}`;
const distancia = (a: Dedo, b: Dedo): number => Math.hypot(a.x - b.x, a.y - b.y);

export interface ZoomDelSvg {
  readonly svgRef: RefObject<SVGSVGElement | null>;
  readonly viewBox: string;
  readonly nivel: number;
  readonly acercar: () => void;
  readonly alejar: () => void;
  readonly verTodo: () => void;
  /** Propiedades que se esparcen sobre el `<svg>`. Vacías si el zoom no está activo. */
  readonly propiedades: {
    readonly onPointerDown?: (e: React.PointerEvent<SVGSVGElement>) => void;
    readonly onPointerMove?: (e: React.PointerEvent<SVGSVGElement>) => void;
    readonly onPointerUp?: (e: React.PointerEvent<SVGSVGElement>) => void;
    readonly onPointerCancel?: (e: React.PointerEvent<SVGSVGElement>) => void;
    readonly onClickCapture?: (e: React.MouseEvent<SVGSVGElement>) => void;
    readonly style?: CSSProperties;
  };
}

/**
 * Zoom y arrastre de un `<svg>` con su caja base: rueda (acerca bajo el cursor), arrastre con un
 * dedo (solo si está acercado), pellizco con dos y botones. Un arrastre no cuenta como clic sobre
 * lo que haya debajo. Con `activo` en falso no engancha nada y la vista es siempre la entera.
 */
export function useZoom(base: Caja, activo: boolean): ZoomDelSvg {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const claveBase = claveDe(base);
  const [estado, setEstado] = useState<EstadoDeZoom>({ clave: claveBase, caja: base });
  const caja = estado.clave === claveBase ? estado.caja : base;
  const nivel = nivelDeZoom(base, caja);

  const temporizadorDeGesto = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dedos = useRef(new Map<number, Dedo>());
  const arrastre = useRef({ recorrido: 0, movido: false });

  /**
   * Mientras se hace zoom o se arrastra, el `<svg>` se repinta decenas de veces por segundo: se le
   * pone una clase que apaga el suavizado de bordes y se quita al quedarse quieto. Se hace sobre el
   * DOM, sin pasar por React, para no sumar renderizados a cada paso.
   */
  const marcarGesto = useCallback((): void => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.classList.add(CLASE_EN_GESTO);
    clearTimeout(temporizadorDeGesto.current);
    temporizadorDeGesto.current = setTimeout(
      () => svgRef.current?.classList.remove(CLASE_EN_GESTO),
      REPOSO_MS,
    );
  }, []);

  useEffect(() => () => clearTimeout(temporizadorDeGesto.current), []);

  /** Cambia la vista a partir de la actual; si era de otro tablero, parte de la entera. */
  const actualizar = useCallback(
    (cambio: (actual: Caja) => Caja): void => {
      setEstado((previo) => {
        const actual = previo.clave === claveBase ? previo.caja : base;
        return { clave: claveBase, caja: cambio(actual) };
      });
    },
    [base, claveBase],
  );

  /** Acerca o aleja alrededor de un punto de pantalla; sin punto, alrededor del centro de la vista. */
  const zoomEn = useCallback(
    (factor: number, pantalla?: Dedo): void => {
      const rect = svgRef.current?.getBoundingClientRect();
      actualizar((actual) => {
        const foco =
          rect && pantalla
            ? puntoDeSvg(rect, actual, pantalla.x, pantalla.y)
            : { x: actual.x + actual.ancho / 2, y: actual.y + actual.alto / 2 };
        return acercarEn(base, actual, factor, foco);
      });
    },
    [actualizar, base],
  );

  // La rueda se engancha a mano: React la registra como pasiva y así no podría evitar que la página
  // también se desplace.
  useEffect(() => {
    const svg = svgRef.current;
    if (!activo || !svg) return;
    const alRodar = (e: WheelEvent): void => {
      e.preventDefault();
      marcarGesto();
      zoomEn(e.deltaY < 0 ? FACTOR_RUEDA : 1 / FACTOR_RUEDA, { x: e.clientX, y: e.clientY });
    };
    svg.addEventListener('wheel', alRodar, { passive: false });
    return () => svg.removeEventListener('wheel', alRodar);
  }, [activo, zoomEn, marcarGesto]);

  const acercar = useCallback(() => zoomEn(FACTOR_BOTON), [zoomEn]);
  const alejar = useCallback(() => zoomEn(1 / FACTOR_BOTON), [zoomEn]);
  const verTodo = useCallback(() => actualizar(() => base), [actualizar, base]);

  const alBajar = (e: React.PointerEvent<SVGSVGElement>): void => {
    dedos.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (dedos.current.size === 1) arrastre.current = { recorrido: 0, movido: false };
  };

  const alMover = (e: React.PointerEvent<SVGSVGElement>): void => {
    const anterior = dedos.current.get(e.pointerId);
    if (!anterior) return;
    const ahora = { x: e.clientX, y: e.clientY };

    if (dedos.current.size >= 2) {
      // Pellizco: lo que se separan o juntan los dos dedos, alrededor de su punto medio.
      const otro = [...dedos.current.entries()].find(([id]) => id !== e.pointerId)?.[1];
      dedos.current.set(e.pointerId, ahora);
      if (!otro) return;
      const antes = distancia(anterior, otro);
      const despues = distancia(ahora, otro);
      arrastre.current.movido = true;
      marcarGesto();
      if (antes > 0 && despues > 0) {
        zoomEn(despues / antes, { x: (ahora.x + otro.x) / 2, y: (ahora.y + otro.y) / 2 });
      }
      return;
    }

    dedos.current.set(e.pointerId, ahora);
    const dx = ahora.x - anterior.x;
    const dy = ahora.y - anterior.y;
    arrastre.current.recorrido += Math.hypot(dx, dy);
    if (arrastre.current.recorrido < UMBRAL_ARRASTRE_PX) return;
    if (!arrastre.current.movido) {
      // Solo al pasar el umbral: capturar antes enviaría el clic de un toque suelto al <svg> y no al sitio.
      svgRef.current?.setPointerCapture?.(e.pointerId);
    }
    arrastre.current.movido = true;
    marcarGesto();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    actualizar((actual) => {
      const mover = desplazamientoDeArrastre(rect, actual, dx, dy);
      return desplazar(base, actual, mover.dx, mover.dy);
    });
  };

  const alSoltar = (e: React.PointerEvent<SVGSVGElement>): void => {
    dedos.current.delete(e.pointerId);
  };

  // Un arrastre termina con un "clic" sobre lo que quede debajo del dedo: se descarta.
  const alHacerClicEnCaptura = (e: React.MouseEvent<SVGSVGElement>): void => {
    if (!arrastre.current.movido) return;
    arrastre.current.movido = false;
    e.stopPropagation();
    e.preventDefault();
  };

  const propiedades: ZoomDelSvg['propiedades'] = activo
    ? {
        onPointerDown: alBajar,
        onPointerMove: alMover,
        onPointerUp: alSoltar,
        onPointerCancel: alSoltar,
        onClickCapture: alHacerClicEnCaptura,
        // Con la vista completa se deja desplazar la página con un dedo; acercada, el arrastre es del tablero.
        style: { touchAction: nivel > 1 + 1e-6 ? 'none' : 'pan-y' },
      }
    : {};

  return {
    svgRef,
    viewBox: `${caja.x} ${caja.y} ${caja.ancho} ${caja.alto}`,
    nivel,
    acercar,
    alejar,
    verTodo,
    propiedades,
  };
}
