import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RECURSOS, type Recurso } from '@/lib/esquemas';
import { IconoRecurso } from './IconoRecurso';

const ARCHIVO: Record<Recurso, string> = {
  MADERA: '/recursos/madera.svg',
  LADRILLO: '/recursos/ladrillo.svg',
  OVEJA: '/recursos/oveja.svg',
  TRIGO: '/recursos/trigo.svg',
  MINERAL: '/recursos/mineral.svg',
};

describe('IconoRecurso', () => {
  it.each(RECURSOS)('%s dibuja su SVG de public/recursos', (recurso) => {
    const { container } = render(<IconoRecurso recurso={recurso} />);
    expect(container.querySelector('image')).toHaveAttribute('href', ARCHIVO[recurso]);
  });

  it('conserva el nombre accesible en español', () => {
    render(<IconoRecurso recurso="OVEJA" />);
    expect(screen.getByRole('img', { name: 'Oveja' })).toBeInTheDocument();
  });

  it('respeta el tamaño pedido', () => {
    render(<IconoRecurso recurso="TRIGO" tamano={40} />);
    expect(screen.getByRole('img', { name: 'Trigo' })).toHaveAttribute('width', '40');
  });
});
