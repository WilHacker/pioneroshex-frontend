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

describe('Casilla: la ficha y el resaltado de la tirada', () => {
  const conTirada = (entrega?: number) =>
    render(
      <svg>
        <Casilla
          terreno="PASTO"
          ficha={5}
          centro={{ x: 0, y: 0 }}
          resaltada
          {...(entrega !== undefined && { entrega })}
        />
      </svg>,
    );

  it('el número se ve con un contorno que lo separa del fondo', () => {
    const { container } = dibujar('PASTO', 5);
    const numero = [...container.querySelectorAll('text')].find((t) => t.textContent === '5');
    expect(numero?.getAttribute('paint-order')).toBe('stroke');
  });

  it('si salieron cartas, la casilla lo dice y muestra cuántas', () => {
    const { container, getByText } = conTirada(3);
    expect(getByText('Produce con el 5: salen 3 cartas')).toBeInTheDocument();
    expect(getByText('+3')).toBeInTheDocument();
    expect(container.querySelector('.sitio')).toBeInTheDocument();
  });

  it('si salió su número y no salió nada, solo se dibuja el contorno', () => {
    const { container, getByText, queryByText } = conTirada();
    expect(getByText('Salió el 5, pero aquí nadie cobra')).toBeInTheDocument();
    expect(queryByText(/^\+/)).not.toBeInTheDocument();
    expect(container.querySelector('.sitio')).not.toBeInTheDocument();
  });
});

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
