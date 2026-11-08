import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { RECURSOS } from '@/lib/esquemas';
import { vistaDePrueba } from '@/lib/pruebas';
import { Banco } from './Banco';

const ver = (cambios: Parameters<typeof vistaDePrueba>[0] = {}) =>
  render(<Banco vista={vistaDePrueba(cambios)} />);

describe('Banco', () => {
  it('cada recurso es una casilla con su carta, marcada para que la entrega vuele hasta ahí', () => {
    const { container } = ver();
    for (const recurso of RECURSOS) {
      expect(container.querySelector(`[data-banco-recurso="${recurso}"]`)).toBeInTheDocument();
    }
  });

  it('dibuja la carta real de cada recurso, con lo que queda', () => {
    const { container } = ver();
    expect(container.querySelector('img[src$="/cartas/madera.svg"]')).toBeInTheDocument();
    expect(screen.getByLabelText('19 de madera en el banco')).toBeInTheDocument();
  });

  it('un recurso que se acabó se ve apagado y lo dice con texto', () => {
    ver({ banco: { MADERA: 0, LADRILLO: 19, OVEJA: 19, TRIGO: 19, MINERAL: 19 } });
    const madera = screen.getByLabelText('0 de madera en el banco');
    expect(within(madera).getByText('agotado')).toBeInTheDocument();
  });

  it('muestra el mazo de desarrollo con su carta de reverso y cuántas quedan', () => {
    const { container } = ver({ tamanoMazo: 21 });
    expect(screen.getByLabelText('21 cartas de desarrollo en el mazo')).toBeInTheDocument();
    expect(
      container.querySelector('img[src$="/cartas/reverso-desarrollo.svg"]'),
    ).toBeInTheDocument();
  });

  it('lleva el icono del banco a la izquierda de las cartas', () => {
    const { container } = ver();
    const icono = container.querySelector('section[aria-label="Banco"] > svg')!;
    expect(icono).toBeInTheDocument();
    // Dentro de la sección «Banco» el dibujo es decorativo: no repite el nombre.
    expect(icono).toHaveAttribute('aria-hidden', 'true');
    expect(icono.nextElementSibling?.tagName).toBe('UL');
  });

  it('el mazo es una carta más del banco, con su contador', () => {
    const { container } = ver({ tamanoMazo: 25 });
    const mazo = screen.getByLabelText('25 cartas de desarrollo en el mazo');
    expect(within(mazo).getByText('25')).toBeInTheDocument();
    expect(mazo.closest('ul')).toBe(
      container.querySelector('[data-banco-recurso="MADERA"]')!.closest('ul'),
    );
  });

  it('el contador de cada carta va en su esquina', () => {
    ver();
    const madera = screen.getByLabelText('19 de madera en el banco');
    const contador = within(madera).getByText('19');
    expect(contador).toHaveClass('absolute');
    expect(contador.className).toContain('-top-');
    expect(contador.className).toContain('-right-');
  });

  describe('la guía de las cartas de desarrollo', () => {
    const abrirGuia = async () => {
      ver();
      await userEvent.click(
        screen.getByRole('button', { name: /cartas de desarrollo en el mazo/ }),
      );
    };

    it('el mazo es un botón que abre la guía, y otro botón la cierra', async () => {
      ver();
      expect(
        screen.queryByRole('region', { name: 'Cartas de desarrollo' }),
      ).not.toBeInTheDocument();
      const mazo = screen.getByRole('button', { name: /cartas de desarrollo en el mazo/ });
      expect(mazo).toHaveAttribute('aria-expanded', 'false');
      await userEvent.click(mazo);
      expect(mazo).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('region', { name: 'Cartas de desarrollo' })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Cerrar la guía' }));
      expect(
        screen.queryByRole('region', { name: 'Cartas de desarrollo' }),
      ).not.toBeInTheDocument();
    });

    it('cuenta las cartas según los jugadores de la partida', async () => {
      await abrirGuia();
      expect(screen.getByRole('listitem', { name: /Caballero/ })).toHaveTextContent('14 cartas');
    });

    it('con Escape se cierra', async () => {
      await abrirGuia();
      await userEvent.keyboard('{Escape}');
      expect(
        screen.queryByRole('region', { name: 'Cartas de desarrollo' }),
      ).not.toBeInTheDocument();
    });
  });
});
