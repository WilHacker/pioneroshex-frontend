import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OpcionesSala } from './OpcionesSala';

const base = { opciones: {}, publica: false, jugadores: 2, editable: true };

describe('OpcionesSala', () => {
  it('sin nada elegido marca los valores por defecto', () => {
    render(<OpcionesSala {...base} onCambiar={vi.fn()} />);

    expect(screen.getByRole('button', { name: '10' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Azar' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '7' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Privada' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('muestra lo que ya se eligió', () => {
    render(
      <OpcionesSala
        {...base}
        opciones={{ puntosVictoria: 12, modoDados: 'EQUILIBRADO' }}
        publica
        onCambiar={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '12' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Parejo' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Pública' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('al tocar una carta avisa solo de ese cambio', async () => {
    const onCambiar = vi.fn();
    const usuario = userEvent.setup();
    render(<OpcionesSala {...base} onCambiar={onCambiar} />);

    await usuario.click(screen.getByRole('button', { name: '15' }));
    await usuario.click(screen.getByRole('button', { name: 'Parejo' }));
    await usuario.click(screen.getByRole('button', { name: '9' }));
    await usuario.click(screen.getByRole('button', { name: 'Pública' }));

    expect(onCambiar.mock.calls).toEqual([
      [{ puntosVictoria: 15 }],
      [{ modoDados: 'EQUILIBRADO' }],
      [{ robberHandLimit: 9 }],
      [{ publica: true }],
    ]);
  });

  it('el modo de turnos B solo se ofrece desde 5 jugadores', () => {
    const { rerender } = render(<OpcionesSala {...base} onCambiar={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'B' })).toBeDisabled();

    rerender(<OpcionesSala {...base} jugadores={5} onCambiar={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'B' })).toBeEnabled();
  });

  it('quien no es anfitrión ve las reglas pero no las puede cambiar', () => {
    render(<OpcionesSala {...base} editable={false} onCambiar={vi.fn()} />);

    for (const boton of screen.getAllByRole('button')) expect(boton).toBeDisabled();
  });
});
