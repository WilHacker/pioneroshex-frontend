import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IconoIntercambio } from './IconoIntercambio';

describe('IconoIntercambio', () => {
  it('dibuja las dos cartas que se intercambian', () => {
    const { container } = render(<IconoIntercambio />);
    expect(container.querySelector('image')).toHaveAttribute('href', '/ui/intercambio.svg');
  });

  it('sin etiqueta es decorativo: no aparece para lectores de pantalla', () => {
    const { container } = render(<IconoIntercambio />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('con etiqueta es una imagen con ese nombre', () => {
    render(<IconoIntercambio etiqueta="Intercambio" />);
    expect(screen.getByRole('img', { name: 'Intercambio' })).toBeInTheDocument();
  });

  it('respeta el tamaño pedido', () => {
    const { container } = render(<IconoIntercambio tamano={48} />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '48');
  });
});
