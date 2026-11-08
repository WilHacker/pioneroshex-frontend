import { render, screen, within } from '@testing-library/react';
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

    const opciones = screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'));
    expect(opciones.length).toBeGreaterThan(10);
    for (const boton of opciones) expect(boton).toBeDisabled();
    // Las explicaciones las puede leer cualquiera.
    expect(screen.getByRole('button', { name: /Qué significa «Dados»/ })).toBeEnabled();
  });

  it('el tiempo por turno empieza sin límite y se puede elegir uno', async () => {
    const onCambiar = vi.fn();
    const usuario = userEvent.setup();
    render(<OpcionesSala {...base} onCambiar={onCambiar} />);

    expect(
      within(screen.getByRole('group', { name: 'Tiempo por turno' })).getByRole('button', {
        name: '∞',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
    await usuario.click(screen.getByRole('button', { name: '1 min' }));
    await usuario.click(screen.getByRole('button', { name: '30 s' }));

    expect(onCambiar.mock.calls).toEqual([[{ turnoSegundos: 60 }], [{ turnoSegundos: 30 }]]);
  });

  it('muestra el tiempo ya elegido', () => {
    render(<OpcionesSala {...base} opciones={{ turnoSegundos: 120 }} onCambiar={vi.fn()} />);

    expect(screen.getByRole('button', { name: '2 min' })).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(screen.getByRole('group', { name: 'Tiempo por turno' })).getByRole('button', {
        name: '∞',
      }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it.each([
    'Puntos para ganar',
    'Dados',
    'Cartas antes de descartar',
    'Tiempo por turno',
    'Turnos',
    'Orden de turno',
    'Comercio entre jugadores',
    'Ofertas por turno',
    'Sala',
  ])('«%s» tiene su icono de información con una explicación', async (titulo) => {
    const usuario = userEvent.setup();
    render(<OpcionesSala {...base} onCambiar={vi.fn()} />);

    await usuario.click(screen.getByRole('button', { name: `Qué significa «${titulo}»` }));

    expect(screen.getByRole('note').textContent?.length).toBeGreaterThan(20);
  });

  it('cada grupo sigue llamándose por su título', () => {
    render(<OpcionesSala {...base} onCambiar={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'Puntos para ganar' })).toBeInTheDocument();
  });

  it('el orden de turno empieza aleatorio y se puede elegir sortearlo con dados o por llegada', async () => {
    const onCambiar = vi.fn();
    const usuario = userEvent.setup();
    render(<OpcionesSala {...base} onCambiar={onCambiar} />);

    expect(screen.getByRole('button', { name: 'Aleatorio' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await usuario.click(screen.getByRole('button', { name: 'Por dados' }));
    await usuario.click(screen.getByRole('button', { name: 'Por llegada' }));

    expect(onCambiar).toHaveBeenNthCalledWith(1, { ordenDeTurno: 'TIRADA' });
    expect(onCambiar).toHaveBeenNthCalledWith(2, { ordenDeTurno: 'ENTRADA' });
  });

  it('muestra el orden de turno que ya se eligió', () => {
    render(<OpcionesSala {...base} opciones={{ ordenDeTurno: 'TIRADA' }} onCambiar={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Por dados' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('incluye las reglas especiales y manda el cambio al tocar el ladrón amistoso', async () => {
    const onCambiar = vi.fn();
    const usuario = userEvent.setup();
    render(<OpcionesSala {...base} onCambiar={onCambiar} />);
    await usuario.click(screen.getByRole('button', { name: /Ladrón amistoso/ }));
    expect(onCambiar).toHaveBeenCalledWith({ ladronAmistoso: true });
  });

  it('el comercio empieza libre y se puede dejar privado o solo con el banco', async () => {
    const onCambiar = vi.fn();
    const usuario = userEvent.setup();
    render(<OpcionesSala {...base} onCambiar={onCambiar} />);
    expect(screen.getByRole('button', { name: 'Libre' })).toHaveAttribute('aria-pressed', 'true');
    await usuario.click(screen.getByRole('button', { name: 'Privado' }));
    await usuario.click(screen.getByRole('button', { name: 'Solo banco' }));
    expect(onCambiar).toHaveBeenNthCalledWith(1, { modoComercio: 'PRIVADO' });
    expect(onCambiar).toHaveBeenNthCalledWith(2, { modoComercio: 'SOLO_BANCO' });
  });

  it('las ofertas por turno empiezan sin tope y se puede fijar uno', async () => {
    const onCambiar = vi.fn();
    const usuario = userEvent.setup();
    render(<OpcionesSala {...base} onCambiar={onCambiar} />);
    const grupo = screen.getByRole('group', { name: 'Ofertas por turno' });
    expect(within(grupo).getByRole('button', { name: '∞' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await usuario.click(within(grupo).getByRole('button', { name: '3' }));
    expect(onCambiar).toHaveBeenCalledWith({ maxOfertasPorTurno: 3 });
  });

  it('sin comercio con jugadores no tiene sentido fijar un tope de ofertas', () => {
    render(
      <OpcionesSala {...base} opciones={{ modoComercio: 'SOLO_BANCO' }} onCambiar={vi.fn()} />,
    );
    const grupo = screen.getByRole('group', { name: 'Ofertas por turno' });
    for (const b of within(grupo)
      .getAllByRole('button', { pressed: undefined })
      .filter((x) => x.hasAttribute('aria-pressed'))) {
      expect(b).toBeDisabled();
    }
  });

  it('los dados ofrecen cuatro modos y empiezan en «Azar»', async () => {
    const onCambiar = vi.fn();
    const usuario = userEvent.setup();
    render(<OpcionesSala {...base} onCambiar={onCambiar} />);
    const grupo = screen.getByRole('group', { name: 'Dados' });
    expect(
      within(grupo)
        .getAllByRole('button')
        .filter((b) => b.hasAttribute('aria-pressed')),
    ).toHaveLength(4);
    expect(within(grupo).getByRole('button', { name: 'Azar' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await usuario.click(within(grupo).getByRole('button', { name: 'Baraja' }));
    await usuario.click(within(grupo).getByRole('button', { name: 'Sin rachas' }));
    expect(onCambiar).toHaveBeenNthCalledWith(1, { modoDados: 'BARAJA' });
    expect(onCambiar).toHaveBeenNthCalledWith(2, { modoDados: 'SIN_RACHAS' });
  });

  it('muestra el modo de dados que ya se eligió', () => {
    render(<OpcionesSala {...base} opciones={{ modoDados: 'SIN_RACHAS' }} onCambiar={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Sin rachas' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
