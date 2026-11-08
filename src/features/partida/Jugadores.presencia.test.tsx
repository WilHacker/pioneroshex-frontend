import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Presencia } from '@/lib/esquemas';
import { vistaDePrueba } from '@/lib/pruebas';
import { Jugadores } from './Jugadores';
import { TiraDeJugadores } from './TiraDeJugadores';

const nombreDe = (id: string): string => ({ j1: 'Ana', j2: 'Beto', j3: 'Caro' })[id] ?? id;
const indiceDe = (id: string): number => Number(id.slice(1)) - 1;

const lista = (presencia?: Presencia | null) =>
  render(
    <Jugadores
      vista={vistaDePrueba()}
      nombreDe={nombreDe}
      indiceDe={indiceDe}
      presencia={presencia}
    />,
  );

const fila = (contenedor: HTMLElement, id: string): HTMLElement =>
  contenedor.querySelector<HTMLElement>(`[data-jugador-id="${id}"]`)!;

describe('Jugadores: quién está conectado', () => {
  it('sin información de presencia no marca a nadie', () => {
    const { container } = lista(null);
    expect(container.querySelector('[data-presencia]')).toBeNull();
    expect(screen.queryByText('Desconectado')).not.toBeInTheDocument();
  });

  it('quien no está conectado lleva la palabra «Desconectado»', () => {
    const { container } = lista({ conectados: ['j1', 'j3'], piloto: [], abandonaron: [] });
    expect(within(fila(container, 'j2')).getByText('Desconectado')).toBeInTheDocument();
    expect(fila(container, 'j2')).toHaveAttribute('data-presencia', 'desconectado');
    expect(within(fila(container, 'j3')).queryByText('Desconectado')).not.toBeInTheDocument();
  });

  it('quien va en piloto automático lo dice así, no «Desconectado»', () => {
    const { container } = lista({ conectados: ['j1'], piloto: ['j2'], abandonaron: [] });
    const f = fila(container, 'j2');
    expect(within(f).getByText('Piloto automático')).toBeInTheDocument();
    expect(within(f).queryByText('Desconectado')).not.toBeInTheDocument();
    expect(f).toHaveAttribute('data-presencia', 'piloto');
  });

  it('la etiqueta explica qué significa, para quien no lo sepa', () => {
    const { container } = lista({ conectados: ['j1'], piloto: ['j2'], abandonaron: [] });
    const etiqueta = within(fila(container, 'j2')).getByText('Piloto automático');
    expect(etiqueta).toHaveAttribute('title', expect.stringMatching(/juega por/i));
  });

  it('no se me marca a mí como desconectado aunque falte en la lista', () => {
    const { container } = lista({ conectados: ['j2', 'j3'], piloto: [], abandonaron: [] });
    expect(fila(container, 'j1')).not.toHaveAttribute('data-presencia');
  });
});

describe('TiraDeJugadores: quién está conectado', () => {
  it('lo indica también en la tira de pantallas pequeñas, con texto para lectores de pantalla', () => {
    const { container } = render(
      <TiraDeJugadores
        vista={vistaDePrueba()}
        nombreDe={nombreDe}
        indiceDe={indiceDe}
        presencia={{ conectados: ['j1'], piloto: ['j3'], abandonaron: [] }}
      />,
    );
    expect(fila(container, 'j2')).toHaveAttribute('data-presencia', 'desconectado');
    expect(fila(container, 'j3')).toHaveAttribute('data-presencia', 'piloto');
    expect(within(fila(container, 'j3')).getByText(/Piloto automático/)).toBeInTheDocument();
    expect(fila(container, 'j1')).not.toHaveAttribute('data-presencia');
  });
});

describe('quien abandonó', () => {
  const conAbandono: Presencia = { conectados: ['j1'], piloto: ['j2', 'j3'], abandonaron: ['j2'] };

  it('lleva «Abandonó», no «Piloto automático», aunque también juegue el piloto por él', () => {
    const { container } = lista(conAbandono);
    const f = fila(container, 'j2');
    expect(within(f).getByText('Abandonó')).toBeInTheDocument();
    expect(within(f).queryByText('Piloto automático')).not.toBeInTheDocument();
    expect(f).toHaveAttribute('data-presencia', 'abandono');
  });

  it('los demás ausentes siguen con su propia etiqueta', () => {
    const { container } = lista(conAbandono);
    expect(fila(container, 'j3')).toHaveAttribute('data-presencia', 'piloto');
  });

  it('también se ve en la tira de pantallas pequeñas', () => {
    const { container } = render(
      <TiraDeJugadores
        vista={vistaDePrueba()}
        nombreDe={nombreDe}
        indiceDe={indiceDe}
        presencia={conAbandono}
      />,
    );
    expect(within(fila(container, 'j2')).getByText(/Abandonó/)).toBeInTheDocument();
  });
});

describe('cartas a la vista', () => {
  const conMano = (recursos: Record<string, number> | null) => {
    const base = vistaDePrueba();
    return {
      ...base,
      jugadores: base.jugadores.map((j) =>
        j.id === 'j2' ? { ...j, recursos: recursos as never } : j,
      ),
    };
  };
  const dibujar = (recursos: Record<string, number> | null) =>
    render(<Jugadores vista={conMano(recursos)} nombreDe={nombreDe} indiceDe={indiceDe} />);

  it('si la mano de un rival llega, se enseñan sus cartas por recurso', () => {
    const { container } = dibujar({ MADERA: 2, LADRILLO: 0, OVEJA: 1, TRIGO: 0, MINERAL: 0 });
    const fila = container.querySelector<HTMLElement>('[data-jugador-id="j2"]')!;
    const mano = within(fila).getByLabelText('Cartas en mano');
    expect(within(mano).getByText('2 de madera')).toBeInTheDocument();
    expect(within(mano).getByText('1 de oveja')).toBeInTheDocument();
    expect(within(mano).queryByLabelText(/ladrillo/)).not.toBeInTheDocument();
  });

  it('si no llega (lo normal), no se enseña nada de su mano', () => {
    const { container } = dibujar(null);
    const fila = container.querySelector<HTMLElement>('[data-jugador-id="j2"]')!;
    expect(within(fila).queryByLabelText('Cartas en mano')).not.toBeInTheDocument();
  });

  it('una mano vacía lo dice en vez de quedarse en blanco', () => {
    const { container } = dibujar({ MADERA: 0, LADRILLO: 0, OVEJA: 0, TRIGO: 0, MINERAL: 0 });
    const fila = container.querySelector<HTMLElement>('[data-jugador-id="j2"]')!;
    expect(within(fila).getByLabelText('Cartas en mano')).toHaveTextContent(/sin cartas/i);
  });
});
