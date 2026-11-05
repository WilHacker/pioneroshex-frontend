import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vistaDePrueba } from '@/lib/pruebas';
import { PanelDescarte } from './PanelDescarte';
import { PanelJugadores } from './PanelJugadores';
import { PanelTratos } from './PanelTratos';
import { Registro } from './Registro';

const nombreDe = (id: string): string => ({ j1: 'Ana', j2: 'Beto', j3: 'Caro' })[id] ?? id;
const indiceDe = (id: string): number => Number(id.slice(1)) - 1;
const mano = { MADERA: 3, LADRILLO: 0, OVEJA: 1, TRIGO: 0, MINERAL: 0 };

describe('PanelDescarte', () => {
  it('solo deja descartar cuando se eligió exactamente la cantidad pedida', async () => {
    const alDescartar = vi.fn();
    const usuario = userEvent.setup();
    render(<PanelDescarte cantidad={2} mano={mano} ocupado={false} onDescartar={alDescartar} />);
    const boton = screen.getByRole('button', { name: /Descartar/ });

    expect(boton).toBeDisabled();
    await usuario.click(screen.getByRole('button', { name: 'Añadir madera' }));
    expect(boton).toBeDisabled();
    await usuario.click(screen.getByRole('button', { name: 'Añadir madera' }));
    expect(boton).toBeEnabled();
    await usuario.click(boton);

    expect(alDescartar).toHaveBeenCalledWith({ MADERA: 2 });
  });

  it('no deja descartar más de lo que se tiene ni bajar de cero', async () => {
    const usuario = userEvent.setup();
    render(<PanelDescarte cantidad={5} mano={mano} ocupado={false} onDescartar={vi.fn()} />);

    await usuario.click(screen.getByRole('button', { name: 'Quitar oveja' }));
    expect(screen.getByLabelText('oveja a descartar')).toHaveTextContent('0');
    await usuario.click(screen.getByRole('button', { name: 'Añadir oveja' }));
    await usuario.click(screen.getByRole('button', { name: 'Añadir oveja' }));
    expect(screen.getByLabelText('oveja a descartar')).toHaveTextContent('1');
  });
});

describe('PanelJugadores', () => {
  it('lista a cada jugador, marca al que está en turno y a mí', () => {
    render(
      <PanelJugadores
        vista={vistaDePrueba({ turnoDe: 'j2', granRuta: 'j3' })}
        nombreDe={nombreDe}
        indiceDe={indiceDe}
      />,
    );
    expect(screen.getByText(/Ana \(tú\)/)).toBeInTheDocument();
    expect(screen.getByText(/Beto · en turno/)).toBeInTheDocument();
    expect(screen.getByTitle('Gran ruta')).toBeInTheDocument();
    expect(screen.getByText(/Gana quien llegue a 10 puntos/)).toBeInTheDocument();
  });
});

describe('PanelTratos', () => {
  const trato = {
    id: 't1',
    proponente: 'j2',
    destinatario: null,
    entrega: { MADERA: 1, LADRILLO: 0, OVEJA: 0, TRIGO: 0, MINERAL: 0 },
    pide: { MADERA: 0, LADRILLO: 0, OVEJA: 2, TRIGO: 0, MINERAL: 0 },
    rechazadoPor: [],
  };
  const panel = (
    vista: ReturnType<typeof vistaDePrueba>,
    onAccion = vi.fn(),
    puedeProponer = false,
  ) => (
    <PanelTratos
      vista={vista}
      nombreDe={nombreDe}
      ocupado={false}
      puedeProponer={puedeProponer}
      onAccion={onAccion}
    />
  );

  it('un trato ajeno se puede aceptar o rechazar', async () => {
    const alAccionar = vi.fn();
    const usuario = userEvent.setup();
    render(panel(vistaDePrueba({ tratos: [trato] }), alAccionar));

    expect(screen.getByText(/ofrece 1 madera y pide 2 oveja/)).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Aceptar' }));
    await usuario.click(screen.getByRole('button', { name: 'Rechazar' }));
    expect(alAccionar).toHaveBeenNthCalledWith(1, { tipo: 'ACEPTAR_TRATO', tratoId: 't1' });
    expect(alAccionar).toHaveBeenNthCalledWith(2, { tipo: 'RECHAZAR_TRATO', tratoId: 't1' });
  });

  it('un trato que ya rechacé o que es para otro no se puede responder', () => {
    const rechazado = { ...trato, rechazadoPor: ['j1'] };
    const paraOtro = { ...trato, id: 't2', destinatario: 'j3' };
    render(panel(vistaDePrueba({ tratos: [rechazado, paraOtro] })));
    expect(screen.queryByRole('button', { name: 'Aceptar' })).not.toBeInTheDocument();
  });

  it('mi propio trato solo se puede cancelar', async () => {
    const alAccionar = vi.fn();
    render(panel(vistaDePrueba({ tratos: [{ ...trato, proponente: 'j1' }] }), alAccionar));
    expect(screen.queryByRole('button', { name: 'Aceptar' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(alAccionar).toHaveBeenCalledWith({ tipo: 'CANCELAR_TRATO', tratoId: 't1' });
  });

  it('para proponer hay que ofrecer y pedir algo; manda solo lo que tiene cantidad', async () => {
    const alAccionar = vi.fn();
    const usuario = userEvent.setup();
    render(panel(vistaDePrueba(), alAccionar, true));

    await usuario.click(screen.getByText('Proponer un trato'));
    const proponer = screen.getByRole('button', { name: 'Proponer' });
    expect(proponer).toBeDisabled();

    const ofrezcoMadera = screen.getAllByLabelText('madera')[0]!;
    await usuario.clear(ofrezcoMadera);
    await usuario.type(ofrezcoMadera, '2');
    expect(proponer).toBeDisabled();
    const pidoOveja = screen.getAllByLabelText('oveja')[1]!;
    await usuario.clear(pidoOveja);
    await usuario.type(pidoOveja, '1');
    await usuario.selectOptions(screen.getByLabelText('Para'), 'j2');
    await usuario.click(proponer);

    expect(alAccionar).toHaveBeenCalledWith({
      tipo: 'PROPONER_TRATO',
      entrega: { MADERA: 2 },
      pide: { OVEJA: 1 },
      destinatario: 'j2',
    });
  });

  it('no ofrece proponer fuera de mi turno', () => {
    render(panel(vistaDePrueba()));
    expect(screen.queryByText('Proponer un trato')).not.toBeInTheDocument();
    expect(screen.getByText('No hay tratos abiertos.')).toBeInTheDocument();
  });
});

describe('Registro', () => {
  it('muestra lo último primero y se salta lo que no merece una línea', () => {
    render(
      <Registro
        nombreDe={nombreDe}
        eventos={[
          { tipo: 'POBLADO_COLOCADO', jugador: 'j1' },
          { tipo: 'FASE_CAMBIADA' },
          { tipo: 'TURNO_TERMINADO', jugador: 'j2' },
        ]}
      />,
    );
    const lineas = screen.getAllByRole('listitem').map((l) => l.textContent);
    expect(lineas).toEqual(['Beto terminó su turno', 'Ana puso un poblado']);
  });

  it('sin eventos lo dice', () => {
    render(<Registro nombreDe={nombreDe} eventos={[]} />);
    expect(screen.getByText('Aún no ha pasado nada.')).toBeInTheDocument();
  });
});
