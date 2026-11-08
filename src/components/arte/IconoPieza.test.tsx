import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IconoPieza } from './IconoPieza';

describe('IconoPieza', () => {
  it.each([
    ['POBLADO', 'Poblado', '/piezas/2f6fe0/poblado.svg'],
    ['CIUDAD', 'Ciudad', '/piezas/2f6fe0/ciudad.svg'],
    ['CAMINO', 'Camino', '/piezas/2f6fe0/camino.svg'],
  ] as const)('%s dibuja su SVG en el color del jugador', (pieza, nombre, archivo) => {
    const { container } = render(<IconoPieza pieza={pieza} color="#2f6fe0" />);
    expect(screen.getByRole('img', { name: nombre })).toBeInTheDocument();
    expect(container.querySelector('image')).toHaveAttribute('href', archivo);
  });

  it('la carta de desarrollo usa el reverso morado, sin importar el color', () => {
    const { container } = render(<IconoPieza pieza="CARTA" color="#2f6fe0" />);
    expect(screen.getByRole('img', { name: 'Carta de desarrollo' })).toBeInTheDocument();
    expect(container.querySelector('image')).toHaveAttribute(
      'href',
      '/cartas/reverso-desarrollo.svg',
    );
  });

  it('respeta el tamaño pedido', () => {
    render(<IconoPieza pieza="CIUDAD" color="#e0344f" tamano={40} />);
    expect(screen.getByRole('img', { name: 'Ciudad' })).toHaveAttribute('width', '40');
  });

  it('el camino se gira para verse en diagonal en su cuadro', () => {
    const { container } = render(<IconoPieza pieza="CAMINO" color="#e0344f" />);
    expect(container.querySelector('g[transform*="rotate"]')).toBeInTheDocument();
  });
});
