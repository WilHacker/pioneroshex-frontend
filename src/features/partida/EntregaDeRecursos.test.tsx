import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventoJuego } from '@/lib/esquemas';
import { EntregaDeRecursos } from './EntregaDeRecursos';

type Animacion = { onfinish: (() => void) | null; cancel: () => void };

const reparto = (jugador: string, recurso: string, cantidad: number): EventoJuego => ({
  tipo: 'RECURSOS_REPARTIDOS',
  jugador,
  recurso,
  cantidad,
});

/** Cada elemento con `data-*` ocupa una caja conocida: así se sabe de dónde a dónde vuela. */
const CAJAS: Record<string, DOMRect> = {
  'banco-MADERA': new DOMRect(100, 20, 40, 40),
  'banco-TRIGO': new DOMRect(150, 20, 40, 40),
  'jugador-j1': new DOMRect(300, 200, 100, 40),
  'jugador-j2': new DOMRect(300, 260, 100, 40),
  mano: new DOMRect(20, 500, 200, 60),
};

function Escenario({
  ultimos,
  yo = null,
}: {
  ultimos: Parameters<typeof EntregaDeRecursos>[0]['ultimos'];
  yo?: string | null;
}) {
  return (
    <>
      <div data-banco-recurso="MADERA" />
      <div data-banco-recurso="TRIGO" />
      <div data-jugador-id="j1" />
      <div data-jugador-id="j2" />
      <div data-mano-recursos="" />
      <EntregaDeRecursos ultimos={ultimos} yo={yo} />
    </>
  );
}

let animar: ReturnType<typeof vi.fn>;
let animaciones: Animacion[];

beforeEach(() => {
  animaciones = [];
  animar = vi.fn(() => {
    const animacion: Animacion = { onfinish: null, cancel: vi.fn() };
    animaciones.push(animacion);
    return animacion;
  });
  Object.defineProperty(HTMLElement.prototype, 'animate', { value: animar, configurable: true });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const banco = this.getAttribute('data-banco-recurso');
    const jugador = this.getAttribute('data-jugador-id');
    if (banco) return CAJAS[`banco-${banco}`]!;
    if (jugador) return CAJAS[`jugador-${jugador}`]!;
    if (this.hasAttribute('data-mano-recursos')) return CAJAS.mano!;
    return new DOMRect(0, 0, 0, 0);
  });
  window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as never;
});

afterEach(() => {
  vi.restoreAllMocks();
  // @ts-expect-error se quita la simulación para no afectar a otros tests
  delete HTMLElement.prototype.animate;
});

describe('EntregaDeRecursos', () => {
  it('no anima nada mientras no llega un reparto', () => {
    render(<Escenario ultimos={{ numero: 0, eventos: [] }} />);
    expect(animar).not.toHaveBeenCalled();
  });

  it('un recurso repartido vuela desde su casilla del banco hasta el jugador', () => {
    render(<Escenario ultimos={{ numero: 1, eventos: [reparto('j1', 'MADERA', 2)] }} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
    const fotogramas = animar.mock.calls[0]![0] as Keyframe[];
    // Sale del centro de la casilla del banco y termina en el centro del jugador.
    expect(fotogramas.at(0)!.transform).toContain('120px, 40px');
    expect(fotogramas.at(-2)!.transform).toContain('350px, 220px');
  });

  it('con varios jugadores salen uno tras otro, no todos a la vez', () => {
    render(
      <Escenario
        ultimos={{ numero: 1, eventos: [reparto('j1', 'MADERA', 1), reparto('j2', 'TRIGO', 1)] }}
      />,
    );
    const retrasos = animar.mock.calls
      .map(([, opciones]) => (opciones as KeyframeAnimationOptions).delay)
      .filter((retraso) => typeof retraso === 'number');
    expect(new Set(retrasos).size).toBeGreaterThan(1);
  });

  it('lo que gano yo vuela hasta mi mano, no hasta mi tarjeta de jugador', () => {
    render(<Escenario ultimos={{ numero: 1, eventos: [reparto('j1', 'MADERA', 1)] }} yo="j1" />);
    const fotogramas = animar.mock.calls[0]![0] as Keyframe[];
    expect(fotogramas.at(-2)!.transform).toContain('120px, 530px');
  });

  it('una notificación ya vista no vuelve a animar', () => {
    const ultimos = { numero: 1, eventos: [reparto('j1', 'MADERA', 1)] };
    const { rerender } = render(<Escenario ultimos={ultimos} />);
    const llamadas = animar.mock.calls.length;
    rerender(<Escenario ultimos={{ ...ultimos }} />);
    expect(animar.mock.calls.length).toBe(llamadas);
  });

  it('al terminar la animación quita el icono volador', () => {
    render(<Escenario ultimos={{ numero: 1, eventos: [reparto('j1', 'MADERA', 3)] }} />);
    expect(screen.getByText('+3')).toBeInTheDocument();
    act(() => animaciones[0]!.onfinish?.());
    expect(screen.queryByText('+3')).not.toBeInTheDocument();
  });

  it('respeta «reducir movimiento»: no anima', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as never;
    render(<Escenario ultimos={{ numero: 1, eventos: [reparto('j1', 'MADERA', 1)] }} />);
    expect(animar).not.toHaveBeenCalled();
    expect(screen.queryByText('+1')).not.toBeInTheDocument();
  });

  it('si el navegador no sabe animar, no se rompe ni deja iconos pegados', () => {
    // @ts-expect-error se simula un navegador sin la API
    delete HTMLElement.prototype.animate;
    render(<Escenario ultimos={{ numero: 1, eventos: [reparto('j1', 'MADERA', 1)] }} />);
    expect(screen.queryByText('+1')).not.toBeInTheDocument();
  });

  it('un jugador que no está en pantalla (la lista oculta) se omite', () => {
    render(<Escenario ultimos={{ numero: 1, eventos: [reparto('j9', 'MADERA', 1)] }} />);
    expect(animar).not.toHaveBeenCalled();
  });
});
