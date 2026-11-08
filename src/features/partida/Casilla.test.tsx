import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Terreno } from '@/lib/esquemas';
import { Casilla } from './Casilla';

const dibujar = (terreno: Terreno, ficha: number | null = null) =>
  render(
    <svg>
      <Casilla terreno={terreno} ficha={ficha} centro={{ x: 0, y: 0 }} />
    </svg>,
  );

describe('Casilla: el icono de cada terreno', () => {
  it.each([
    ['BOSQUE', '/recursos/madera.svg'],
    ['PASTO', '/recursos/oveja.svg'],
    ['CAMPO', '/recursos/trigo.svg'],
    ['COLINA', '/recursos/ladrillo.svg'],
    ['MONTANA', '/recursos/mineral.svg'],
    ['DESIERTO', '/recursos/cactus.svg'],
  ] as const)('%s dibuja %s', (terreno, archivo) => {
    const { container } = dibujar(terreno, terreno === 'DESIERTO' ? null : 8);
    expect(container.querySelector(`image[href="${archivo}"]`)).toBeInTheDocument();
  });

  it('el desierto lleva un solo cactus y conserva sus dunas de arena', () => {
    const { container } = dibujar('DESIERTO');
    expect(container.querySelectorAll('image')).toHaveLength(1);
    expect(container.querySelectorAll('path[d^="M-0.2 0.05"]').length).toBeGreaterThan(0);
  });
});
