import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mapasDePrueba } from '@/lib/pruebas';
import { SelectorDeMapa } from './SelectorDeMapa';

function dibujar(cambios: Partial<Parameters<typeof SelectorDeMapa>[0]> = {}) {
  const onElegir = vi.fn();
  render(
    <SelectorDeMapa
      mapas={mapasDePrueba}
      elegido={null}
      jugadores={4}
      editable
      onElegir={onElegir}
      {...cambios}
    />,
  );
  return { onElegir };
}

describe('SelectorDeMapa', () => {
  it('ofrece el mapa automático y cada mapa del catálogo', () => {
    dibujar();
    const grupo = screen.getByRole('group', { name: 'Mapa' });
    // El ⓘ de ayuda también es un botón, pero no es una carta de mapa.
    const botones = within(grupo)
      .getAllByRole('button')
      .filter((b) => b.hasAttribute('aria-pressed'));
    expect(botones).toHaveLength(1 + mapasDePrueba.length);
    expect(within(grupo).getByRole('button', { name: /Automático/ })).toBeInTheDocument();
    for (const m of mapasDePrueba) {
      expect(within(grupo).getByRole('button', { name: new RegExp(m.nombre) })).toBeInTheDocument();
    }
  });

  it('el automático está elegido cuando no hay mapa', () => {
    dibujar({ elegido: null });
    expect(screen.getByRole('button', { name: /Automático/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /Grande/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('marca el mapa elegido y no el automático', () => {
    dibujar({ elegido: 'grande' });
    expect(screen.getByRole('button', { name: /Grande/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Automático/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('tocar un mapa lo elige por su id', async () => {
    const { onElegir } = dibujar();
    await userEvent.setup().click(screen.getByRole('button', { name: /Grande/ }));
    expect(onElegir).toHaveBeenCalledWith('grande');
  });

  it('tocar el automático manda null', async () => {
    const { onElegir } = dibujar({ elegido: 'grande' });
    await userEvent.setup().click(screen.getByRole('button', { name: /Automático/ }));
    expect(onElegir).toHaveBeenCalledWith(null);
  });

  it('quien no es anfitrión ve la elección pero no puede cambiarla', async () => {
    const { onElegir } = dibujar({ editable: false, elegido: 'grande' });
    const botones = screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'));
    expect(botones.every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
    expect(screen.getByRole('button', { name: /Grande/ })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.setup().click(botones[0]!);
    expect(onElegir).not.toHaveBeenCalled();
  });

  it('muestra casillas y rango de jugadores de cada mapa', () => {
    dibujar();
    const clasico = screen.getByRole('button', { name: /Clásico/ });
    expect(clasico).toHaveTextContent('19 casillas');
    expect(clasico).toHaveTextContent('2–4 jugadores');
  });

  it('dibuja la forma: un polígono por casilla', () => {
    dibujar();
    const clasico = screen.getByRole('button', { name: /Clásico/ });
    expect(clasico.querySelectorAll('svg polygon')).toHaveLength(19);
    const gigante = screen.getByRole('button', { name: /Gigante/ });
    expect(gigante.querySelectorAll('svg polygon')).toHaveLength(61);
  });

  it('avisa con texto (no solo con color) si el mapa va bien para los jugadores de la sala', () => {
    dibujar({ jugadores: 6 });
    expect(screen.getByRole('button', { name: /Grande/ })).toHaveTextContent('Recomendado');
    expect(screen.getByRole('button', { name: /Gigante/ })).toHaveTextContent('Recomendado');
    expect(screen.getByRole('button', { name: /Clásico/ })).toHaveTextContent('Justo');
  });

  it('un mapa en el que no caben los jugadores aparece como «No cabe» y no se puede elegir', async () => {
    const { onElegir } = dibujar({ jugadores: 8 });
    const clasico = screen.getByRole('button', { name: /Clásico/ });
    expect(clasico).toHaveTextContent('No cabe');
    expect(clasico).toBeDisabled();
    expect(clasico).toHaveAttribute('title', expect.stringMatching(/hasta 7 jugadores/));
    await userEvent.setup().click(clasico);
    expect(onElegir).not.toHaveBeenCalled();
  });

  it('un mapa ya elegido sigue visible aunque ahora no quepan (para poder cambiarlo)', () => {
    dibujar({ jugadores: 8, elegido: 'clasico' });
    const clasico = screen.getByRole('button', { name: /Clásico/ });
    expect(clasico).toHaveAttribute('aria-pressed', 'true');
  });

  it('el id elegido puede no estar en el catálogo (cambió): no se marca ninguno ni se rompe', () => {
    dibujar({ elegido: 'ya-no-existe' });
    const botones = screen.getAllByRole('button');
    expect(botones.filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(0);
  });

  it('sin catálogo (aún cargando) solo ofrece el automático', () => {
    dibujar({ mapas: [] });
    const cartas = screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'));
    expect(cartas).toHaveLength(1);
  });
});
