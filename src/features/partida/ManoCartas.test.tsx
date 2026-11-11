import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ManoCartas } from './ManoCartas';

const mano = { MADERA: 0, LADRILLO: 1, OVEJA: 0, TRIGO: 3, MINERAL: 2 };

describe('ManoCartas', () => {
  it('muestra la cantidad de cada recurso que tengo', () => {
    render(<ManoCartas recursos={mano} />);
    const lista = screen.getByRole('list', { name: 'Tu mano' });
    expect(within(lista).getByRole('img', { name: '1 de ladrillo' })).toBeInTheDocument();
    expect(within(lista).getByRole('img', { name: '3 de trigo' })).toBeInTheDocument();
    expect(within(lista).getByRole('img', { name: '2 de mineral' })).toBeInTheDocument();
    expect(within(lista).queryByRole('img', { name: /madera|oveja/ })).not.toBeInTheDocument();
  });

  it('cada carta queda por encima de la de su derecha, para que su número no se tape', () => {
    render(<ManoCartas recursos={mano} />);
    const niveles = screen.getAllByRole('listitem').map((li) => Number(li.style.zIndex));
    expect(niveles).toEqual([3, 2, 1]);
  });

  it('sin cartas, o siendo espectador, dice que la mano está vacía', () => {
    const { rerender } = render(<ManoCartas recursos={null} />);
    expect(screen.getByText('Tu mano está vacía')).toBeInTheDocument();
    rerender(<ManoCartas recursos={{ MADERA: 0, LADRILLO: 0, OVEJA: 0, TRIGO: 0, MINERAL: 0 }} />);
    expect(screen.getByText('Tu mano está vacía')).toBeInTheDocument();
  });
});
