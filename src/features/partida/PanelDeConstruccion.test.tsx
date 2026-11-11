import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PanelDeConstruccion } from './PanelDeConstruccion';

const sin = { MADERA: 0, LADRILLO: 0, OVEJA: 0, TRIGO: 0, MINERAL: 0 };

describe('PanelDeConstruccion', () => {
  it('muestra el título y cada recurso del costo con lo que tienes', () => {
    render(
      <PanelDeConstruccion
        sitio={{ tipo: 'CAMINO', id: 'a1' }}
        mano={{ ...sin, MADERA: 3 }}
        color="#e4572e"
      />,
    );
    expect(screen.getByRole('heading')).toHaveTextContent('Poner un camino');
    const costo = within(screen.getByRole('list', { name: 'Costo' })).getAllByRole('listitem');
    expect(costo).toHaveLength(2);
    expect(within(costo[0]!).getByText('tienes 3')).toBeInTheDocument();
    expect(within(costo[1]!).getByText('tienes 0')).toBeInTheDocument();
  });

  it('dice qué falta, con los recursos separados por comas y «y»', () => {
    render(<PanelDeConstruccion sitio={{ tipo: 'POBLADO', id: 'v' }} mano={sin} color="#e4572e" />);
    expect(
      screen.getByText('Te falta 1 de madera, 1 de ladrillo, 1 de oveja y 1 de trigo'),
    ).toBeInTheDocument();
  });

  it('con una mano que alcanza lo dice', () => {
    render(
      <PanelDeConstruccion
        sitio={{ tipo: 'CIUDAD', id: 'v' }}
        mano={{ ...sin, TRIGO: 2, MINERAL: 3 }}
        color="#e4572e"
      />,
    );
    expect(screen.getByRole('heading')).toHaveTextContent('Mejorar a ciudad');
    expect(screen.getByText('Tienes todo lo necesario')).toBeInTheDocument();
  });

  it('con la mano desconocida cuenta como que falta todo', () => {
    render(<PanelDeConstruccion sitio={{ tipo: 'CAMINO', id: 'a1' }} mano={null} color="#fff" />);
    expect(screen.getByText('Te falta 1 de madera y 1 de ladrillo')).toBeInTheDocument();
  });

  it('es solo un cartel: no tiene botones (la confirmación es el aro verde del mapa)', () => {
    render(<PanelDeConstruccion sitio={{ tipo: 'CAMINO', id: 'a1' }} mano={sin} color="#fff" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
