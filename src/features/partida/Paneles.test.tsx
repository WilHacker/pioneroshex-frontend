import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dado } from '@/components/arte/Dado';
import { Dado3D, ORIENTACION } from '@/components/arte/Dado3D';
import type { AccionDisponible, Cantidades, Carta, Mesa, Trato, Vista } from '@/lib/esquemas';
import { V1, V2, V3, mesaDePrueba, vistaDePrueba } from '@/lib/pruebas';
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

describe('CartaRecurso mini', () => {
  it('es una carta más chica que la pequeña, con su cantidad y su nombre', () => {
    render(<CartaRecurso recurso="TRIGO" tamano="mini" cantidad={2} />);
    const carta = screen.getByRole('img', { name: '2 de trigo' });
    expect(carta).toHaveClass('w-[1.65rem]');
    expect(carta).toHaveTextContent('2');
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

  it('muestra lo que cuesta cada pieza con cartas pequeñas de los recursos', () => {
    paleta();
    const costos = screen.getAllByRole('tooltip');
    expect(costos).toHaveLength(4);
    // Camino: 1 madera y 1 ladrillo; sin contador cuando es una sola carta.
    expect(within(costos[0]!).getByRole('img', { name: 'madera' })).toBeInTheDocument();
    expect(within(costos[0]!).getByRole('img', { name: 'ladrillo' })).toBeInTheDocument();
    // Ciudad: 2 de trigo y 3 de mineral, con el número en la esquina de la carta.
    expect(within(costos[2]!).getByRole('img', { name: '2 de trigo' })).toBeInTheDocument();
    expect(within(costos[2]!).getByRole('img', { name: '3 de mineral' })).toBeInTheDocument();
  });

  it('el botón de comerciar lleva la carta de intercambio', () => {
    paleta();
    const boton = screen.getByRole('button', { name: 'Comerciar' });
    expect(boton.querySelector('image')).toHaveAttribute('href', '/ui/intercambio.svg');
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

  it('con el mazo oculto, la carta de desarrollo no enseña cuántas quedan', () => {
    paleta({ vista: vistaDePrueba({ tamanoMazo: null }) });
    const boton = screen.getByRole('button', { name: /Carta de desarrollo/ });
    expect(boton).toBeEnabled();
    expect(within(boton).queryByText('25')).not.toBeInTheDocument();
  });
});

describe('Dados', () => {
  it('muestra la última tirada cuando no me toca tirar', () => {
    render(
      <Dados dados={[3, 4]} tirada={1} puedeTirar={false} ocupado={false} onTirar={vi.fn()} />,
    );
    expect(screen.getByLabelText('Dados')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Dado: 3' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Dado: 4' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('muestra la suma de la tirada en grande, y el 7 avisa del ladrón', () => {
    const { rerender } = render(
      <Dados dados={[3, 4]} tirada={1} puedeTirar={false} ocupado={false} onTirar={vi.fn()} />,
    );
    expect(screen.getByText('7')).toHaveAttribute('title', 'Siete: se mueve el ladrón');
    rerender(
      <Dados dados={[2, 6]} tirada={2} puedeTirar={false} ocupado={false} onTirar={vi.fn()} />,
    );
    expect(screen.getByText('8')).toHaveAttribute('title', 'Suma: 8');
  });

  it('los dados son caras 2D que ruedan, no cubos 3D', () => {
    const { container } = render(
      <Dados dados={[3, 4]} tirada={1} puedeTirar={false} ocupado={false} onTirar={vi.fn()} />,
    );
    expect(container.querySelector('.dado3d-cubo')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.dado-rodando')).toHaveLength(2);
  });

  it('sin tirada todavía no hay suma', () => {
    render(<Dados dados={null} tirada={0} puedeTirar={false} ocupado={false} onTirar={vi.fn()} />);
    expect(screen.queryByText(/suma de los dados/)).not.toBeInTheDocument();
  });

  it('cuando me toca tirar son un botón', async () => {
    const alTirar = vi.fn();
    render(<Dados dados={null} tirada={0} puedeTirar ocupado={false} onTirar={alTirar} />);
    expect(screen.getAllByRole('img', { name: 'Dado sin tirar' })).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: /Tirar dados/ }));
    expect(alTirar).toHaveBeenCalled();
  });

  it('mientras se espera al servidor no se puede tirar de nuevo', () => {
    render(<Dados dados={null} tirada={0} puedeTirar ocupado onTirar={vi.fn()} />);
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
  /** Con 4 de cada uno alcanza para cambiar cualquier recurso con la banca sin puerto. */
  const MUCHAS = { MADERA: 4, LADRILLO: 4, OVEJA: 4, TRIGO: 4, MINERAL: 4 };
  const acciones: AccionDisponible[] = [
    { tipo: 'PROPONER_TRATO', disponible: true },
    { tipo: 'CAMBIAR_CON_BANCA', disponible: true },
  ];
  const MANO = { MADERA: 3, LADRILLO: 0, OVEJA: 1, TRIGO: 0, MINERAL: 0 };
  const vistaConMano = (recursos: Cantidades = MANO, edificios: Vista['edificios'] = {}) => {
    const base = vistaDePrueba();
    return {
      ...base,
      edificios,
      jugadores: base.jugadores.map((j) => (j.id === 'j1' ? { ...j, recursos } : j)),
    };
  };

  function abrir(
    parcial: {
      acciones?: AccionDisponible[];
      ocupado?: boolean;
      mano?: Cantidades;
      edificios?: Vista['edificios'];
      mesa?: Mesa;
      config?: Partial<Vista['config']>;
    } = {},
  ) {
    const alAccionar = vi.fn();
    const alCerrar = vi.fn();
    const vista = vistaConMano(parcial.mano, parcial.edificios);
    render(
      <Comercio
        mesa={parcial.mesa ?? mesaDePrueba}
        vista={{ ...vista, config: { ...vista.config, ...parcial.config } }}
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

  it('el panel se abre con la carta de intercambio y su título', () => {
    abrir();
    const panel = screen.getByRole('region', { name: 'Comerciar' });
    expect(panel.querySelector('image[href="/ui/intercambio.svg"]')).toBeInTheDocument();
    expect(within(panel).getByRole('heading', { name: 'Comerciar' })).toBeInTheDocument();
  });

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

  it('con la banca se da un recurso, se pide otro y se cambia', async () => {
    const { alAccionar } = abrir({ mano: MUCHAS });
    await userEvent.click(screen.getByRole('button', { name: 'Banca' }));
    await userEvent.click(screen.getByRole('button', { name: 'Doy: añadir oveja' }));
    await userEvent.click(screen.getByRole('button', { name: 'Pido: añadir mineral' }));
    await userEvent.click(screen.getByRole('button', { name: 'Enviar oferta' }));
    expect(alAccionar).toHaveBeenCalledWith({
      tipo: 'CAMBIAR_CON_BANCA',
      entrega: { OVEJA: 4 },
      recibe: { MINERAL: 1 },
    });
  });

  describe('con la banca se pueden mezclar recursos y repetir cambios', () => {
    /** Ocho de madera para poder dar dos razones de una vez. */
    const RICA = { ...MUCHAS, MADERA: 8 };
    const banca = async (manoInicial: Cantidades = RICA) => {
      const { alAccionar } = abrir({ mano: manoInicial });
      await userEvent.click(screen.getByRole('button', { name: 'Banca' }));
      return alAccionar;
    };
    const tocar = async (nombre: string, veces = 1) => {
      for (let i = 0; i < veces; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await userEvent.click(screen.getByRole('button', { name: nombre }));
      }
    };
    const enviar = () => screen.getByRole('button', { name: 'Enviar oferta' });
    const pista = () => document.querySelector('[data-pista-banca]')!;

    it('4 de madera + 4 de trigo por 2 de oveja', async () => {
      const alAccionar = await banca();
      await tocar('Doy: añadir madera');
      await tocar('Doy: añadir trigo');
      await tocar('Pido: añadir oveja', 2);
      await userEvent.click(enviar());
      expect(alAccionar).toHaveBeenCalledWith({
        tipo: 'CAMBIAR_CON_BANCA',
        entrega: { MADERA: 4, TRIGO: 4 },
        recibe: { OVEJA: 2 },
      });
    });

    it('8 de madera + 4 de trigo por 2 de oveja y 1 de ladrillo', async () => {
      const alAccionar = await banca();
      await tocar('Doy: añadir madera', 2);
      await tocar('Doy: añadir trigo');
      await tocar('Pido: añadir oveja', 2);
      await tocar('Pido: añadir ladrillo');
      expect(pista()).toHaveTextContent('3 cambios: listo para enviar.');
      await userEvent.click(enviar());
      expect(alAccionar).toHaveBeenCalledWith({
        tipo: 'CAMBIAR_CON_BANCA',
        entrega: { MADERA: 8, TRIGO: 4 },
        recibe: { OVEJA: 2, LADRILLO: 1 },
      });
    });

    it('no se envía hasta que las cartas pedidas son tantas como cambios', async () => {
      await banca();
      expect(enviar()).toBeDisabled();
      expect(pista()).toHaveTextContent('Elige qué das');
      await tocar('Doy: añadir madera', 2);
      expect(pista()).toHaveTextContent('Elige 2 cartas más.');
      await tocar('Pido: añadir oveja');
      expect(enviar()).toBeDisabled();
      expect(pista()).toHaveTextContent('Elige 1 carta más.');
      await tocar('Pido: añadir ladrillo');
      expect(enviar()).toBeEnabled();
      expect(pista()).toHaveTextContent('2 cambios: listo para enviar.');
    });

    it('no deja pedir más cartas que cambios', async () => {
      await banca();
      await tocar('Doy: añadir madera');
      await tocar('Pido: añadir oveja');
      expect(screen.getByRole('button', { name: 'Pido: añadir trigo' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Pido: añadir oveja' })).toBeDisabled();
    });

    it('sin nada que dar tampoco se puede pedir', async () => {
      await banca();
      expect(screen.getByRole('button', { name: 'Pido: añadir oveja' })).toBeDisabled();
    });

    it('si se quita lo que se da y sobran cartas pedidas, avisa y no se envía', async () => {
      await banca();
      await tocar('Doy: añadir madera', 2);
      await tocar('Pido: añadir oveja', 2);
      await tocar('Doy: quitar madera');
      expect(enviar()).toBeDisabled();
      expect(pista()).toHaveTextContent('Pides 1 de más');
    });

    it('un recurso que se da no se puede pedir, ni uno que se pide darlo', async () => {
      await banca();
      await tocar('Doy: añadir madera');
      expect(screen.getByRole('button', { name: 'Pido: añadir madera' })).toBeDisabled();
      await tocar('Pido: añadir oveja');
      expect(screen.getByRole('button', { name: 'Doy: añadir oveja' })).toBeDisabled();
    });

    it('cada toque en «Doy» suma una razón completa y el signo menos la quita', async () => {
      await banca();
      await tocar('Doy: añadir madera', 2);
      expect(screen.getByRole('button', { name: 'Doy: añadir madera' })).toHaveTextContent('8');
      await tocar('Doy: quitar madera');
      expect(screen.getByRole('button', { name: 'Doy: añadir madera' })).toHaveTextContent('4');
    });

    it('no deja dar más razones completas de las que se tienen (7 de madera: solo una)', async () => {
      await banca({ ...RICA, MADERA: 7 });
      await tocar('Doy: añadir madera');
      expect(screen.getByRole('button', { name: 'Doy: añadir madera' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Doy: añadir madera' })).toHaveTextContent('4');
    });
  });

  it('con la banca no se puede pedir el mismo recurso que se entrega', async () => {
    abrir({ mano: MUCHAS });
    await userEvent.click(screen.getByRole('button', { name: 'Banca' }));
    await userEvent.click(screen.getByRole('button', { name: 'Doy: añadir madera' }));
    expect(screen.getByRole('button', { name: 'Pido: añadir madera' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enviar oferta' })).toBeDisabled();
  });

  describe('con la banca se cobra según los puertos', () => {
    const MESA_CON_PUERTOS: Mesa = {
      ...mesaDePrueba,
      puertos: [
        { arista: 'a2', vertices: [V2, V3], tipo: 'GENERICO' },
        { arista: 'a1', vertices: [V1, V2], tipo: 'MADERA' },
      ],
    };
    const poblado = { dueno: 'j1', tipo: 'POBLADO' as const };

    const cobrado = async (cambios: Parameters<typeof abrir>[0]) => {
      const { alAccionar } = abrir(cambios);
      await userEvent.click(screen.getByRole('button', { name: 'Banca' }));
      return alAccionar;
    };

    it('sin puerto se dan 4 cartas iguales por 1', async () => {
      const alAccionar = await cobrado({ mano: MUCHAS });
      await userEvent.click(screen.getByRole('button', { name: 'Doy: añadir oveja' }));
      expect(screen.getByRole('button', { name: 'Doy: añadir oveja' })).toHaveTextContent('4');
      await userEvent.click(screen.getByRole('button', { name: 'Pido: añadir trigo' }));
      await userEvent.click(screen.getByRole('button', { name: 'Enviar oferta' }));
      expect(alAccionar).toHaveBeenCalledWith({
        tipo: 'CAMBIAR_CON_BANCA',
        entrega: { OVEJA: 4 },
        recibe: { TRIGO: 1 },
      });
    });

    it('un recurso del que tengo menos de 4 queda apagado: no alcanza para la banca', async () => {
      await cobrado({ mano: { ...MUCHAS, MADERA: 3 } });
      expect(screen.getByRole('button', { name: 'Doy: añadir madera' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Doy: añadir oveja' })).toBeEnabled();
    });

    it('con una casa en un puerto genérico se dan 3', async () => {
      await cobrado({
        mano: { ...MUCHAS, OVEJA: 3 },
        mesa: MESA_CON_PUERTOS,
        edificios: { [V3]: poblado },
      });
      await userEvent.click(screen.getByRole('button', { name: 'Doy: añadir oveja' }));
      expect(screen.getByRole('button', { name: 'Doy: añadir oveja' })).toHaveTextContent('3');
    });

    it('con una casa en el puerto de un recurso se dan 2 de ese recurso', async () => {
      await cobrado({
        mano: { ...MUCHAS, MADERA: 2 },
        mesa: MESA_CON_PUERTOS,
        edificios: { [V1]: poblado },
      });
      await userEvent.click(screen.getByRole('button', { name: 'Doy: añadir madera' }));
      expect(screen.getByRole('button', { name: 'Doy: añadir madera' })).toHaveTextContent('2');
    });

    it('cada carta de «Doy» muestra su razón: 4:1, 3:1 o 2:1', async () => {
      await cobrado({
        mano: MUCHAS,
        mesa: MESA_CON_PUERTOS,
        edificios: { [V2]: poblado },
      });
      // En V2 hay casa: toca el puerto genérico (3:1) y el de madera (2:1).
      expect(screen.getByTitle('Madera: 2 cartas por 1')).toHaveTextContent('2:1');
      expect(screen.getByTitle('Oveja: 3 cartas por 1')).toHaveTextContent('3:1');
    });

    it('la razón solo se muestra al comerciar con la banca', () => {
      abrir({ mano: MUCHAS });
      expect(screen.queryByText('4:1')).not.toBeInTheDocument();
    });
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
  describe('según las reglas de comercio de la sala', () => {
    const SOLO_BANCO: AccionDisponible[] = [
      { tipo: 'PROPONER_TRATO', disponible: false, motivo: 'NO_PUEDES_COMERCIAR' },
      { tipo: 'CAMBIAR_CON_BANCA', disponible: true },
    ];
    const TOPE: AccionDisponible[] = [
      { tipo: 'PROPONER_TRATO', disponible: false, motivo: 'DEMASIADAS_OFERTAS' },
      { tipo: 'CAMBIAR_CON_BANCA', disponible: true },
    ];

    it('solo banco: se abre ya en la banca, no se puede ofrecer a nadie y se explica por qué', () => {
      abrir({ acciones: SOLO_BANCO, mano: MUCHAS, config: { modoComercio: 'SOLO_BANCO' } });
      expect(screen.getByRole('button', { name: 'Banca' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Todos' })).toBeDisabled();
      expect(screen.getByRole('status')).toHaveTextContent(/banco/i);
    });

    it('con el tope de ofertas alcanzado se explica y se puede seguir con la banca', async () => {
      abrir({ acciones: TOPE, mano: MUCHAS });
      expect(screen.getByRole('status')).toHaveTextContent(/ofertas/i);
      expect(screen.getByRole('button', { name: 'Banca' })).toBeEnabled();
    });

    it('privado: no hay «Todos» y se empieza eligiendo a un jugador', () => {
      abrir({ config: { modoComercio: 'PRIVADO' } });
      expect(screen.queryByRole('button', { name: 'Todos' })).not.toBeInTheDocument();
      const rivales = screen.getAllByRole('button', { name: /Ofrecer solo a/ });
      expect(rivales[0]).toHaveAttribute('aria-pressed', 'true');
    });

    it('privado: la oferta sale dirigida al jugador elegido', async () => {
      const { alAccionar } = abrir({ config: { modoComercio: 'PRIVADO' } });
      await userEvent.click(screen.getByRole('button', { name: 'Doy: añadir madera' }));
      await userEvent.click(screen.getByRole('button', { name: 'Pido: añadir mineral' }));
      await userEvent.click(screen.getByRole('button', { name: 'Enviar oferta' }));
      expect(alAccionar).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'PROPONER_TRATO', destinatario: expect.any(String) }),
      );
    });

    it('libre: todo igual que antes, con «Todos» y sin avisos', () => {
      abrir();
      expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
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
    aceptadoPor: [],
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

  const nombresDeCartas = (fila: HTMLElement): (string | null)[] =>
    within(fila)
      .getAllByRole('img')
      .map((img) => img.getAttribute('aria-label'))
      .filter((nombre) => nombre !== null && /^\d+ de /.test(nombre));

  it('la cabecera muestra a quién va la oferta y marca con una cruz a quien ya rechazó', () => {
    oferta([{ ...trato, rechazadoPor: ['j3'] }]);
    const fila = screen.getByRole('listitem', { name: 'Oferta de Beto' });
    // Ana aparece en la cabecera y en su fila de «da»; Caro, solo en la cabecera y con su cruz.
    expect(within(fila).getAllByText('Ana (tú)').length).toBeGreaterThan(0);
    expect(within(fila).getByText('Caro rechazó')).toBeInTheDocument();
    expect(within(fila).queryByText('Caro')).not.toBeInTheDocument();
  });

  it('quien responde ve primero lo que recibe del proponente y luego lo que da', () => {
    oferta([trato]);
    const fila = screen.getByRole('listitem', { name: 'Oferta de Beto' });
    expect(nombresDeCartas(fila)).toEqual(['1 de madera', '2 de oveja']);
    expect(
      within(fila)
        .getAllByText(/^(recibe|da)$/)
        .map((e) => e.textContent),
    ).toEqual(['recibe', 'da']);
  });

  it('en mi oferta primero va lo que pido al grupo y luego lo que doy', () => {
    oferta([{ ...trato, proponente: 'j1' }]);
    const fila = screen.getByRole('listitem', { name: 'Oferta de Ana' });
    expect(nombresDeCartas(fila)).toEqual(['2 de oveja', '1 de madera']);
    expect(within(fila).getByText('Todos')).toBeInTheDocument();
    expect(
      within(fila)
        .getAllByText(/^(recibe|da)$/)
        .map((e) => e.textContent),
    ).toEqual(['recibe', 'da']);
  });

  it('una oferta a un solo jugador muestra a ese jugador como quien recibe', () => {
    oferta([{ ...trato, proponente: 'j1', destinatario: 'j2' }]);
    const fila = screen.getByRole('listitem', { name: 'Oferta de Ana' });
    expect(within(fila).queryByText('Todos')).not.toBeInTheDocument();
    expect(within(fila).getAllByText('Beto').length).toBeGreaterThan(0);
  });

  describe('elegir con quién se cierra', () => {
    it('quienes ya aceptaron llevan un check en la cabecera', () => {
      oferta([{ ...trato, aceptadoPor: ['j3'] }]);
      const fila = screen.getByRole('listitem', { name: 'Oferta de Beto' });
      expect(within(fila).getByText('Caro aceptó')).toBeInTheDocument();
    });

    it('quien ya aceptó no puede responder otra vez y ve que espera al proponente', () => {
      oferta([{ ...trato, aceptadoPor: ['j1'] }]);
      expect(screen.queryByRole('button', { name: 'Aceptar' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument();
      expect(
        screen.getByText('Aceptaste. Esperando a que Beto cierre el trato.'),
      ).toBeInTheDocument();
      // Sigue viendo la oferta desde su lado: primero lo que recibe, luego lo que da.
      const fila = screen.getByRole('listitem', { name: 'Oferta de Beto' });
      expect(nombresDeCartas(fila)).toEqual(['1 de madera', '2 de oveja']);
    });

    it('el proponente ve a quienes aceptaron y cierra con uno pulsando su check', async () => {
      const alAccionar = oferta([{ ...trato, proponente: 'j1', aceptadoPor: ['j2', 'j3'] }]);
      const lista = screen.getByRole('list', { name: 'Quienes aceptaron' });
      expect(within(lista).getAllByRole('listitem')).toHaveLength(2);
      expect(screen.getByText('Aceptaron varios: elige con quién cerrar')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Cerrar el trato con Caro' }));
      expect(alAccionar).toHaveBeenCalledExactlyOnceWith({
        tipo: 'CONFIRMAR_TRATO',
        tratoId: 't1',
        con: 'j3',
      });
    });

    it('con un solo aceptante también se cierra con su check, sin esperar a los demás', async () => {
      const alAccionar = oferta([{ ...trato, proponente: 'j1', aceptadoPor: ['j2'] }]);
      expect(screen.getByText('Aceptó: ciérralo con el check')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Cerrar el trato con Beto' }));
      expect(alAccionar).toHaveBeenCalledWith({
        tipo: 'CONFIRMAR_TRATO',
        tratoId: 't1',
        con: 'j2',
      });
    });

    it('mientras nadie acepta no hay lista de aceptantes', () => {
      oferta([{ ...trato, proponente: 'j1' }]);
      expect(screen.queryByRole('list', { name: 'Quienes aceptaron' })).not.toBeInTheDocument();
    });

    it('solo el proponente puede cerrar: los demás no ven los checks de cierre', () => {
      oferta([{ ...trato, aceptadoPor: ['j3'] }]);
      expect(screen.queryByRole('list', { name: 'Quienes aceptaron' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Cerrar el trato con/ })).not.toBeInTheDocument();
    });

    it('la lista de aceptantes se esconde al plegar la oferta', async () => {
      oferta([{ ...trato, proponente: 'j1', aceptadoPor: ['j2'] }]);
      await userEvent.click(screen.getByRole('button', { name: 'Plegar la oferta' }));
      expect(screen.queryByRole('list', { name: 'Quienes aceptaron' })).not.toBeInTheDocument();
    });
  });

  it('se pliega a solo la cabecera y se vuelve a desplegar', async () => {
    oferta([trato]);
    const plegador = screen.getByRole('button', { name: 'Plegar la oferta' });
    expect(plegador).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(plegador);
    expect(screen.queryByRole('button', { name: 'Aceptar' })).not.toBeInTheDocument();
    const desplegador = screen.getByRole('button', { name: 'Desplegar la oferta' });
    expect(desplegador).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(desplegador);
    expect(screen.getByRole('button', { name: 'Aceptar' })).toBeInTheDocument();
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

  it('es una caja con scroll y guarda mucho más que las últimas jugadas', () => {
    const eventos = Array.from({ length: 40 }, (_, i) => ({
      tipo: 'POBLADO_COLOCADO',
      jugador: i % 2 === 0 ? 'j1' : 'j2',
    }));
    dibujar(eventos);
    expect(screen.getAllByRole('listitem')).toHaveLength(40);
    const caja = screen.getByRole('region', { name: 'Registro' });
    expect(caja).toHaveClass('overflow-y-auto');
    expect(caja).toHaveAttribute('tabindex', '0');
  });

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
    expect(screen.getByRole('img', { name: '2 de trigo' })).toBeInTheDocument();
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
    // Cada lado de un cambio o de un trato son cartas pequeñas con su cantidad.
    expect(screen.getByRole('img', { name: '4 de madera' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '1 de mineral' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '1 de madera' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '1 de oveja' })).toBeInTheDocument();
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

describe('Dado3D', () => {
  it('es una imagen con su valor, y tiene las seis caras', () => {
    const { container } = render(<Dado3D valor={5} />);
    expect(screen.getByRole('img', { name: 'Dado: 5' })).toBeInTheDocument();
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(6);
  });

  it('sin valor es un dado con un interrogante', () => {
    render(<Dado3D valor={null} />);
    expect(screen.getByRole('img', { name: 'Dado sin tirar' })).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('cada valor gira el cubo hasta la orientación de su cara', () => {
    const { container } = render(<Dado3D valor={3} />);
    const cubo = container.querySelector('.dado3d-cubo') as HTMLElement;
    const [x, y] = ORIENTACION[3]!;
    expect(cubo.style.getPropertyValue('--fx')).toBe(`${x}deg`);
    expect(cubo.style.getPropertyValue('--fy')).toBe(`${y}deg`);
  });

  it('las caras opuestas suman 7', () => {
    const opuestas = (a: number, b: number): number => a + b;
    const [x1, y1] = ORIENTACION[1]!;
    const [x6, y6] = ORIENTACION[6]!;
    expect(opuestas(1, 6)).toBe(7);
    expect(Math.abs(y6 - y1)).toBe(180);
    expect(x1).toBe(x6);
  });

  it('cada dado rueda hacia un lado distinto', () => {
    const { container } = render(
      <>
        <Dado3D valor={2} giro={1} />
        <Dado3D valor={2} giro={-1} />
      </>,
    );
    const giros = [...container.querySelectorAll<HTMLElement>('.dado3d-cubo')].map((c) =>
      c.style.getPropertyValue('--giro'),
    );
    expect(giros).toEqual(['1', '-1']);
  });
});
