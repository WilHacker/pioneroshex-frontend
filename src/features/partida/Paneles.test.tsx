import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dado } from '@/components/arte/Dado';
import type { AccionDisponible, Carta, Trato } from '@/lib/esquemas';
import { vistaDePrueba } from '@/lib/pruebas';
import { Banco } from './Banco';
import { CartaRecurso } from './CartaRecurso';
import { CartasDesarrollo } from './CartasDesarrollo';
import { Comercio } from './Comercio';
import { Dados } from './Dados';
import { Jugadores } from './Jugadores';
import { ManoCartas } from './ManoCartas';
import { Ofertas } from './Ofertas';
import { PanelDescarte } from './PanelDescarte';
import { Paleta } from './Paleta';
import { Registro } from './Registro';

const nombreDe = (id: string): string => ({ j1: 'Ana', j2: 'Beto', j3: 'Caro' })[id] ?? id;
const indiceDe = (id: string): number => Number(id.slice(1)) - 1;
const mano = { MADERA: 3, LADRILLO: 0, OVEJA: 1, TRIGO: 0, MINERAL: 0 };

describe('CartaRecurso', () => {
  it('sin acción es una imagen con su cantidad y su nombre', () => {
    render(<CartaRecurso recurso="MADERA" cantidad={3} />);
    expect(screen.getByRole('img', { name: '3 de madera' })).toBeInTheDocument();
  });

  it('con acción es un botón que se toca', async () => {
    const alTocar = vi.fn();
    render(<CartaRecurso recurso="OVEJA" etiqueta="Elegir oveja" onClick={alTocar} />);
    await userEvent.click(screen.getByRole('button', { name: 'Elegir oveja' }));
    expect(alTocar).toHaveBeenCalled();
  });

  it('desactivada no se puede tocar', () => {
    render(<CartaRecurso recurso="OVEJA" etiqueta="Elegir oveja" desactivada onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Elegir oveja' })).toBeDisabled();
  });
});

describe('PanelDescarte', () => {
  it('se descarta tocando cartas hasta llegar a la cantidad pedida', async () => {
    const alDescartar = vi.fn();
    const usuario = userEvent.setup();
    render(<PanelDescarte cantidad={2} mano={mano} ocupado={false} onDescartar={alDescartar} />);
    const confirmar = screen.getByRole('button', { name: /Descartar \(/ });

    expect(screen.getByRole('heading', { name: 'Descarta 2' })).toBeInTheDocument();
    expect(confirmar).toBeDisabled();
    await usuario.click(screen.getByRole('button', { name: 'Añadir madera' }));
    expect(confirmar).toBeDisabled();
    await usuario.click(screen.getByRole('button', { name: 'Añadir madera' }));
    expect(confirmar).toBeEnabled();
    await usuario.click(confirmar);

    expect(alDescartar).toHaveBeenCalledWith({ MADERA: 2 });
  });

  it('las cartas elegidas bajan a la fila de abajo y se pueden devolver', async () => {
    const usuario = userEvent.setup();
    render(<PanelDescarte cantidad={3} mano={mano} ocupado={false} onDescartar={vi.fn()} />);
    await usuario.click(screen.getByRole('button', { name: 'Añadir madera' }));
    expect(screen.getByRole('button', { name: 'Quitar madera' })).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Quitar madera' }));
    expect(screen.queryByRole('button', { name: 'Quitar madera' })).not.toBeInTheDocument();
  });

  it('no deja descartar más de lo que se tiene', async () => {
    const usuario = userEvent.setup();
    render(<PanelDescarte cantidad={5} mano={mano} ocupado={false} onDescartar={vi.fn()} />);
    await usuario.click(screen.getByRole('button', { name: 'Añadir oveja' }));
    expect(screen.getByRole('button', { name: 'Añadir oveja' })).toBeDisabled();
  });
});

describe('Jugadores', () => {
  it('pone a quien juega primero y marca el turno y las insignias con icono y texto accesible', () => {
    render(
      <Jugadores
        vista={vistaDePrueba({ turnoDe: 'j2', granRuta: 'j3', granEjercito: 'j2' })}
        nombreDe={nombreDe}
        indiceDe={indiceDe}
      />,
    );
    expect(screen.getByText('(tú)')).toBeInTheDocument();
    expect(screen.getByText('Beto')).toBeInTheDocument();
    expect(screen.getByText(/en turno/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Gran ruta' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Gran ejército' })).toBeInTheDocument();
  });

  it('muestra las cartas, el desarrollo y los caballeros como número con icono', () => {
    render(<Jugadores vista={vistaDePrueba()} nombreDe={nombreDe} indiceDe={indiceDe} />);
    expect(screen.getAllByText('cartas en mano').length).toBeGreaterThan(0);
    expect(screen.getAllByText('cartas de desarrollo').length).toBeGreaterThan(0);
    expect(screen.getAllByText('caballeros jugados').length).toBeGreaterThan(0);
  });

  it('en mi turno lo dice para lectores de pantalla', () => {
    render(<Jugadores vista={vistaDePrueba()} nombreDe={nombreDe} indiceDe={indiceDe} />);
    expect(screen.getByText('tu turno')).toBeInTheDocument();
  });

  it('en la construcción especial manda el jugador especial', () => {
    render(
      <Jugadores
        vista={vistaDePrueba({
          fase: 'CONSTRUCCION_ESPECIAL',
          turnoDe: 'j1',
          turnoEspecialDe: 'j3',
        })}
        nombreDe={nombreDe}
        indiceDe={indiceDe}
      />,
    );
    expect(screen.getByText(/en turno/)).toBeInTheDocument();
    expect(screen.queryByText('tu turno')).not.toBeInTheDocument();
  });

  it('un espectador ve solo a los jugadores', () => {
    render(
      <Jugadores vista={vistaDePrueba({ yo: null })} nombreDe={nombreDe} indiceDe={indiceDe} />,
    );
    expect(screen.queryByText('(tú)')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});

describe('Banco', () => {
  it('muestra lo que queda de cada recurso y el mazo', () => {
    render(<Banco vista={vistaDePrueba()} />);
    expect(screen.getByLabelText('19 de madera en el banco')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });
});

describe('ManoCartas', () => {
  it('muestra solo los recursos que tengo, con su cantidad', () => {
    render(<ManoCartas recursos={mano} />);
    expect(screen.getByRole('img', { name: '3 de madera' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '1 de oveja' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /de ladrillo/ })).not.toBeInTheDocument();
  });

  it('sin cartas, o sin mano (espectador), lo dice', () => {
    const { rerender } = render(
      <ManoCartas recursos={{ MADERA: 0, LADRILLO: 0, OVEJA: 0, TRIGO: 0, MINERAL: 0 }} />,
    );
    expect(screen.getByText('Tu mano está vacía')).toBeInTheDocument();
    rerender(<ManoCartas recursos={null} />);
    expect(screen.getByText('Tu mano está vacía')).toBeInTheDocument();
  });
});

describe('Paleta', () => {
  const acciones: AccionDisponible[] = [
    { tipo: 'CONSTRUIR_CAMINO', disponible: true },
    { tipo: 'CONSTRUIR_POBLADO', disponible: true },
    { tipo: 'CONSTRUIR_CIUDAD', disponible: false, motivo: 'RECURSOS_INSUFICIENTES' },
    { tipo: 'COMPRAR_CARTA_DESARROLLO', disponible: true },
    { tipo: 'PROPONER_TRATO', disponible: true },
    { tipo: 'TERMINAR_TURNO', disponible: true },
  ];

  function paleta(parcial: Partial<Parameters<typeof Paleta>[0]> = {}) {
    const alModo = vi.fn();
    const alAccionar = vi.fn();
    const alComercio = vi.fn();
    render(
      <Paleta
        vista={vistaDePrueba()}
        acciones={acciones}
        modo={null}
        ocupado={false}
        color="#e0344f"
        comercioAbierto={false}
        onModo={alModo}
        onAccion={alAccionar}
        onComercio={alComercio}
        {...parcial}
      />,
    );
    return { alModo, alAccionar, alComercio };
  }

  it('muestra cuántas piezas quedan y cuántas cartas hay en el mazo', () => {
    paleta();
    expect(screen.getByRole('button', { name: /Camino/ })).toHaveTextContent('13');
    expect(screen.getByRole('button', { name: /Poblado/ })).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: /Ciudad/ })).toHaveTextContent('4');
    expect(screen.getByRole('button', { name: /Carta/ })).toHaveTextContent('25');
  });

  it('pulsar una pieza activa su modo, y volver a pulsarla lo quita', async () => {
    const { alModo } = paleta();
    await userEvent.click(screen.getByRole('button', { name: /Poblado/ }));
    expect(alModo).toHaveBeenCalledWith('POBLADO');
  });

  it('con la pieza ya activa, pulsarla otra vez desactiva el modo', async () => {
    const { alModo } = paleta({ modo: 'CAMINO' });
    const camino = screen.getByRole('button', { name: /Camino/ });
    expect(camino).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(camino);
    expect(alModo).toHaveBeenCalledWith(null);
  });

  it('comprar una carta se hace de una vez, sin elegir sitio', async () => {
    const { alAccionar } = paleta();
    await userEvent.click(screen.getByRole('button', { name: /Carta/ }));
    expect(alAccionar).toHaveBeenCalledWith({ tipo: 'COMPRAR_CARTA_DESARROLLO' });
  });

  it('lo que el servidor no permite queda deshabilitado y explica por qué', () => {
    paleta();
    const ciudad = screen.getByRole('button', { name: /Ciudad/ });
    expect(ciudad).toBeDisabled();
    expect(ciudad).toHaveAttribute('title', 'No tienes recursos suficientes');
  });

  it('muestra lo que cuesta cada pieza con los iconos de los recursos', () => {
    paleta();
    expect(screen.getAllByRole('tooltip')).toHaveLength(4);
    expect(screen.getAllByRole('img', { name: 'Madera' }).length).toBeGreaterThan(0);
  });

  it('terminar el turno manda la acción', async () => {
    const { alAccionar } = paleta();
    await userEvent.click(screen.getByRole('button', { name: 'Terminar turno' }));
    expect(alAccionar).toHaveBeenCalledWith({ tipo: 'TERMINAR_TURNO' });
  });

  it('el botón de comerciar abre y cierra el panel', async () => {
    const { alComercio } = paleta();
    await userEvent.click(screen.getByRole('button', { name: 'Comerciar' }));
    expect(alComercio).toHaveBeenCalled();
  });

  it('sin poder comerciar el botón queda deshabilitado, salvo que el panel ya esté abierto', () => {
    const { alComercio } = paleta({ acciones: [] });
    expect(screen.getByRole('button', { name: 'Comerciar' })).toBeDisabled();
    expect(alComercio).not.toHaveBeenCalled();
  });

  it('mientras se espera al servidor no se puede pulsar nada', () => {
    paleta({ ocupado: true });
    expect(screen.getByRole('button', { name: /Poblado/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Terminar turno' })).toBeDisabled();
  });

  it('"Pasar" solo aparece en la construcción especial', async () => {
    const { alAccionar } = paleta({
      acciones: [...acciones, { tipo: 'PASAR_CONSTRUCCION_ESPECIAL', disponible: true }],
    });
    await userEvent.click(screen.getByRole('button', { name: 'Pasar' }));
    expect(alAccionar).toHaveBeenCalledWith({ tipo: 'PASAR_CONSTRUCCION_ESPECIAL' });
  });
});

describe('Dados', () => {
  it('muestra la última tirada cuando no me toca tirar', () => {
    render(<Dados dados={[3, 4]} puedeTirar={false} ocupado={false} onTirar={vi.fn()} />);
    expect(screen.getByLabelText('Dados')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Dado: 3' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Dado: 4' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('cuando me toca tirar son un botón', async () => {
    const alTirar = vi.fn();
    render(<Dados dados={null} puedeTirar ocupado={false} onTirar={alTirar} />);
    expect(screen.getAllByRole('img', { name: 'Dado sin tirar' })).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: /Tirar dados/ }));
    expect(alTirar).toHaveBeenCalled();
  });

  it('mientras se espera al servidor no se puede tirar de nuevo', () => {
    render(<Dados dados={null} puedeTirar ocupado onTirar={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Tirar dados/ })).toBeDisabled();
  });
});

describe('Dado', () => {
  it.each([1, 2, 3, 4, 5, 6])('la cara %i tiene ese número de puntos', (valor) => {
    const { container } = render(<Dado valor={valor} />);
    expect(container.querySelectorAll('circle')).toHaveLength(valor);
  });

  it('un valor fuera de rango se dibuja en blanco', () => {
    const { container } = render(<Dado valor={9} />);
    expect(container.querySelectorAll('circle')).toHaveLength(0);
  });
});

describe('CartasDesarrollo', () => {
  function vistaConCartas(cartas: Carta[]) {
    const base = vistaDePrueba();
    return {
      ...base,
      jugadores: base.jugadores.map((j) =>
        j.id === 'j1' ? { ...j, cartasDesarrollo: cartas } : j,
      ),
    };
  }
  const dibujar = (cartas: Carta[], puedeJugar = true) => {
    const alModo = vi.fn();
    const alAccionar = vi.fn();
    const { container } = render(
      <CartasDesarrollo
        vista={vistaConCartas(cartas)}
        puedeJugar={puedeJugar}
        onModo={alModo}
        onAccion={alAccionar}
      />,
    );
    return { alModo, alAccionar, container };
  };

  it('sin cartas no muestra nada', () => {
    expect(dibujar([]).container).toBeEmptyDOMElement();
  });

  it('el caballero y las carreteras piden elegir sitio en el tablero', async () => {
    const { alModo } = dibujar(['CABALLERO', 'CONSTRUCCION_CARRETERAS']);
    await userEvent.click(screen.getByRole('button', { name: /Jugar Caballero/ }));
    await userEvent.click(screen.getByRole('button', { name: /Jugar Construcción de carreteras/ }));
    expect(alModo).toHaveBeenNthCalledWith(1, 'CABALLERO');
    expect(alModo).toHaveBeenNthCalledWith(2, 'CARRETERAS');
  });

  it('el monopolio pide un recurso tocando una carta', async () => {
    const { alAccionar } = dibujar(['MONOPOLIO']);
    await userEvent.click(screen.getByRole('button', { name: /Jugar Monopolio/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Elegir oveja' }));
    expect(alAccionar).toHaveBeenCalledWith({ tipo: 'JUGAR_MONOPOLIO', recurso: 'OVEJA' });
  });

  it('la abundancia pide dos recursos tocando dos cartas', async () => {
    const { alAccionar } = dibujar(['ABUNDANCIA']);
    await userEvent.click(screen.getByRole('button', { name: /Jugar Abundancia/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Elegir madera' }));
    expect(alAccionar).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Elegir mineral' }));
    expect(alAccionar).toHaveBeenCalledWith({
      tipo: 'JUGAR_ABUNDANCIA',
      recursos: ['MADERA', 'MINERAL'],
    });
  });

  it('se puede cancelar la elección de recursos', async () => {
    dibujar(['MONOPOLIO']);
    await userEvent.click(screen.getByRole('button', { name: /Jugar Monopolio/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('button', { name: 'Elegir oveja' })).not.toBeInTheDocument();
  });

  it('el punto de victoria se muestra pero no se juega', () => {
    dibujar(['PUNTO_VICTORIA']);
    expect(screen.getByRole('img', { name: /Punto de victoria ×1/ })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('fuera de mi turno no se puede jugar ninguna', () => {
    dibujar(['CABALLERO'], false);
    expect(screen.getByRole('button', { name: /Jugar Caballero/ })).toBeDisabled();
  });
});

describe('Comercio', () => {
  const acciones: AccionDisponible[] = [
    { tipo: 'PROPONER_TRATO', disponible: true },
    { tipo: 'CAMBIAR_CON_BANCA', disponible: true },
  ];
  const vistaConMano = () => {
    const base = vistaDePrueba();
    return {
      ...base,
      jugadores: base.jugadores.map((j) =>
        j.id === 'j1'
          ? { ...j, recursos: { MADERA: 3, LADRILLO: 0, OVEJA: 1, TRIGO: 0, MINERAL: 0 } }
          : j,
      ),
    };
  };

  function abrir(parcial: { acciones?: AccionDisponible[]; ocupado?: boolean } = {}) {
    const alAccionar = vi.fn();
    const alCerrar = vi.fn();
    render(
      <Comercio
        vista={vistaConMano()}
        acciones={parcial.acciones ?? acciones}
        nombreDe={nombreDe}
        indiceDe={indiceDe}
        ocupado={parcial.ocupado ?? false}
        onAccion={alAccionar}
        onCerrar={alCerrar}
      />,
    );
    return { alAccionar, alCerrar };
  }

  it('se arma una oferta tocando cartas y se manda a todos', async () => {
    const { alAccionar, alCerrar } = abrir();
    const enviar = screen.getByRole('button', { name: 'Enviar oferta' });
    expect(enviar).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Doy: añadir madera' }));
    await userEvent.click(screen.getByRole('button', { name: 'Doy: añadir madera' }));
    await userEvent.click(screen.getByRole('button', { name: 'Pido: añadir mineral' }));
    expect(enviar).toBeEnabled();
    await userEvent.click(enviar);

    expect(alAccionar).toHaveBeenCalledWith({
      tipo: 'PROPONER_TRATO',
      entrega: { MADERA: 2 },
      pide: { MINERAL: 1 },
    });
    expect(alCerrar).toHaveBeenCalled();
  });

  it('no deja ofrecer más cartas de las que tengo, y las que no tengo están apagadas', async () => {
    abrir();
    expect(screen.getByRole('button', { name: 'Doy: añadir ladrillo' })).toBeDisabled();
    const oveja = screen.getByRole('button', { name: 'Doy: añadir oveja' });
    await userEvent.click(oveja);
    await userEvent.click(oveja);
    expect(oveja).toHaveTextContent('1');
  });

  it('el signo menos quita una carta de la oferta', async () => {
    abrir();
    const quitar = screen.getByRole('button', { name: 'Pido: quitar trigo' });
    expect(quitar).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Pido: añadir trigo' }));
    expect(quitar).toBeEnabled();
    await userEvent.click(quitar);
    expect(quitar).toBeDisabled();
  });

  it('se puede ofrecer solo a un jugador', async () => {
    const { alAccionar } = abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Ofrecer solo a Beto' }));
    await userEvent.click(screen.getByRole('button', { name: 'Doy: añadir madera' }));
    await userEvent.click(screen.getByRole('button', { name: 'Pido: añadir trigo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Enviar oferta' }));
    expect(alAccionar).toHaveBeenCalledWith({
      tipo: 'PROPONER_TRATO',
      entrega: { MADERA: 1 },
      pide: { TRIGO: 1 },
      destinatario: 'j2',
    });
  });

  it('con la banca se elige una carta de cada lado y se cambia', async () => {
    const { alAccionar } = abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Banca' }));
    await userEvent.click(screen.getByRole('button', { name: 'Doy: añadir madera' }));
    await userEvent.click(screen.getByRole('button', { name: 'Doy: añadir oveja' }));
    await userEvent.click(screen.getByRole('button', { name: 'Pido: añadir mineral' }));
    await userEvent.click(screen.getByRole('button', { name: 'Enviar oferta' }));
    expect(alAccionar).toHaveBeenCalledWith({
      tipo: 'CAMBIAR_CON_BANCA',
      entrega: 'OVEJA',
      recibe: 'MINERAL',
    });
  });

  it('con la banca no se puede pedir el mismo recurso que se entrega', async () => {
    abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Banca' }));
    await userEvent.click(screen.getByRole('button', { name: 'Doy: añadir madera' }));
    await userEvent.click(screen.getByRole('button', { name: 'Pido: añadir madera' }));
    expect(screen.getByRole('button', { name: 'Enviar oferta' })).toBeDisabled();
  });

  it('cambiar de destino limpia la oferta', async () => {
    abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Doy: añadir madera' }));
    await userEvent.click(screen.getByRole('button', { name: 'Banca' }));
    expect(screen.queryByRole('img', { name: /de madera/ })).not.toBeInTheDocument();
  });

  it('lo que el servidor no permite queda deshabilitado', () => {
    abrir({ acciones: [] });
    expect(screen.getByRole('button', { name: 'Banca' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Todos' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Ofrecer solo a Beto' })).toBeDisabled();
  });

  it('se puede cerrar sin enviar nada', async () => {
    const { alAccionar, alCerrar } = abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar comercio' }));
    expect(alCerrar).toHaveBeenCalled();
    expect(alAccionar).not.toHaveBeenCalled();
  });

  it('mientras se espera al servidor no se puede enviar', async () => {
    abrir({ ocupado: true });
    await userEvent.click(screen.getByRole('button', { name: 'Doy: añadir madera' }));
    await userEvent.click(screen.getByRole('button', { name: 'Pido: añadir trigo' }));
    expect(screen.getByRole('button', { name: 'Enviar oferta' })).toBeDisabled();
  });
});

describe('Ofertas', () => {
  const trato: Trato = {
    id: 't1',
    proponente: 'j2',
    destinatario: null,
    entrega: { MADERA: 1, LADRILLO: 0, OVEJA: 0, TRIGO: 0, MINERAL: 0 },
    pide: { MADERA: 0, LADRILLO: 0, OVEJA: 2, TRIGO: 0, MINERAL: 0 },
    rechazadoPor: [],
  };
  const oferta = (tratos: Trato[], onAccion = vi.fn()) => {
    render(
      <Ofertas
        vista={vistaDePrueba({ tratos })}
        nombreDe={nombreDe}
        indiceDe={indiceDe}
        ocupado={false}
        onAccion={onAccion}
      />,
    );
    return onAccion;
  };

  it('sin ofertas no muestra nada', () => {
    const { container } = render(
      <Ofertas
        vista={vistaDePrueba()}
        nombreDe={nombreDe}
        indiceDe={indiceDe}
        ocupado={false}
        onAccion={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('una oferta ajena muestra sus cartas y se acepta o se rechaza con iconos', async () => {
    const alAccionar = oferta([trato]);
    const fila = screen.getByRole('listitem', { name: 'Oferta de Beto' });
    expect(within(fila).getByRole('img', { name: '1 de madera' })).toBeInTheDocument();
    expect(within(fila).getByRole('img', { name: '2 de oveja' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Aceptar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Rechazar' }));
    expect(alAccionar).toHaveBeenNthCalledWith(1, { tipo: 'ACEPTAR_TRATO', tratoId: 't1' });
    expect(alAccionar).toHaveBeenNthCalledWith(2, { tipo: 'RECHAZAR_TRATO', tratoId: 't1' });
  });

  it('una oferta que ya rechacé o que es para otro no se puede responder', () => {
    oferta([
      { ...trato, rechazadoPor: ['j1'] },
      { ...trato, id: 't2', destinatario: 'j3' },
    ]);
    expect(screen.queryByRole('button', { name: 'Aceptar' })).not.toBeInTheDocument();
    expect(screen.getByText('para Caro')).toBeInTheDocument();
  });

  it('mi propia oferta solo se puede cancelar', async () => {
    const alAccionar = oferta([{ ...trato, proponente: 'j1' }]);
    expect(screen.queryByRole('button', { name: 'Aceptar' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(alAccionar).toHaveBeenCalledWith({ tipo: 'CANCELAR_TRATO', tratoId: 't1' });
  });
});

describe('Registro', () => {
  const dibujar = (eventos: Record<string, unknown>[]) =>
    render(
      <Registro
        nombreDe={nombreDe}
        indiceDe={indiceDe}
        eventos={eventos as { tipo: string; [k: string]: unknown }[]}
      />,
    );

  it('muestra lo último primero y se salta lo que no merece una línea', () => {
    dibujar([
      { tipo: 'POBLADO_COLOCADO', jugador: 'j1' },
      { tipo: 'FASE_CAMBIADA' },
      { tipo: 'TURNO_TERMINADO', jugador: 'j2' },
    ]);
    const filas = screen.getAllByRole('listitem');
    expect(filas).toHaveLength(2);
    expect(filas[0]).toHaveTextContent('Beto');
    expect(filas[1]).toHaveTextContent('Ana');
  });

  it('cuenta los dados, los recursos y las piezas con dibujos', () => {
    dibujar([
      { tipo: 'DADOS_TIRADOS', jugador: 'j1', dados: [3, 4] },
      { tipo: 'RECURSOS_REPARTIDOS', jugador: 'j2', recurso: 'TRIGO', cantidad: 2 },
      { tipo: 'CIUDAD_COLOCADA', jugador: 'j1' },
    ]);
    expect(screen.getByRole('img', { name: 'Dado: 3' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Dado: 4' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Trigo' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ciudad' })).toBeInTheDocument();
  });

  it('los cambios y los tratos muestran las cartas con una flecha de intercambio', () => {
    dibujar([
      {
        tipo: 'CAMBIO_CON_BANCA_REALIZADO',
        jugador: 'j1',
        entrega: 'MADERA',
        cantidadEntregada: 4,
        recibe: 'MINERAL',
      },
      {
        tipo: 'TRATO_ACEPTADO',
        aceptante: 'j2',
        proponente: 'j1',
        entrega: { MADERA: 1, LADRILLO: 0, OVEJA: 0, TRIGO: 0, MINERAL: 0 },
        pide: { MADERA: 0, LADRILLO: 0, OVEJA: 1, TRIGO: 0, MINERAL: 0 },
      },
    ]);
    expect(screen.getAllByRole('img', { name: 'Madera' })).toHaveLength(2);
    expect(screen.getByRole('img', { name: 'Mineral' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Oveja' })).toBeInTheDocument();
  });

  it('las cartas de desarrollo y la compra tienen su icono', () => {
    dibujar([
      { tipo: 'CARTA_DESARROLLO_COMPRADA', jugador: 'j1' },
      { tipo: 'CABALLERO_JUGADO', jugador: 'j1' },
      { tipo: 'CONSTRUCCION_CARRETERAS_JUGADA', jugador: 'j1' },
      { tipo: 'ABUNDANCIA_JUGADA', jugador: 'j1' },
      { tipo: 'MONOPOLIO_JUGADO', jugador: 'j1', recurso: 'OVEJA', cantidadRobada: 3 },
      { tipo: 'POBLADO_COLOCADO', jugador: 'j2' },
      { tipo: 'CAMINO_COLOCADO', jugador: 'j2' },
    ]);
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
  });

  it('un evento sin dibujo se cuenta con una frase corta', () => {
    dibujar([{ tipo: 'LADRON_MOVIDO', jugador: 'j2' }]);
    expect(screen.getByText('Beto movió el ladrón')).toBeInTheDocument();
  });

  it('sin eventos lo dice', () => {
    dibujar([]);
    expect(screen.getByText('Aún no ha pasado nada.')).toBeInTheDocument();
  });
});
