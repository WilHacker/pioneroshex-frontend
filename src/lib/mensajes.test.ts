import { describirEvento, nombreDeCarta, textoDeMotivo } from './mensajes';

const nombre = (id: string): string => ({ j1: 'Ana', j2: 'Beto' })[id] ?? id;
const describir = (e: Record<string, unknown> & { tipo: string }): string | null =>
  describirEvento(e, nombre);

describe('textoDeMotivo', () => {
  it('traduce los motivos conocidos y no inventa los desconocidos', () => {
    expect(textoDeMotivo('NO_ES_TU_TURNO')).toBe('No es tu turno');
    expect(textoDeMotivo('MOTIVO_NUEVO')).toBe('No se pudo hacer esa jugada (MOTIVO_NUEVO)');
  });
});

describe('describirEvento', () => {
  it.each([
    [{ tipo: 'POBLADO_COLOCADO', jugador: 'j1' }, 'Ana puso un poblado'],
    [{ tipo: 'CIUDAD_COLOCADA', jugador: 'j2' }, 'Beto mejoró un poblado a ciudad'],
    [{ tipo: 'CAMINO_COLOCADO', jugador: 'j1' }, 'Ana puso un camino'],
    [{ tipo: 'DADOS_TIRADOS', jugador: 'j1', dados: [3, 4] }, 'Ana sacó 3 + 4 = 7'],
    [
      { tipo: 'RECURSOS_REPARTIDOS', jugador: 'j2', recurso: 'TRIGO', cantidad: 2 },
      'Beto recibe 2 de trigo',
    ],
    [
      { tipo: 'PRODUCCION_BLOQUEADA', recurso: 'MADERA' },
      'El banco no alcanza para repartir madera',
    ],
    [{ tipo: 'DESCARTE_REQUERIDO', jugador: 'j1', cantidad: 4 }, 'Ana debe descartar 4 cartas'],
    [
      { tipo: 'RECURSOS_DESCARTADOS', jugador: 'j1', recursos: { MADERA: 2, OVEJA: 0, TRIGO: 1 } },
      'Ana descartó 2 madera, 1 trigo',
    ],
    [{ tipo: 'RECURSOS_DESCARTADOS', jugador: 'j1', recursos: {} }, 'Ana descartó nada'],
    [{ tipo: 'LADRON_MOVIDO', jugador: 'j2' }, 'Beto movió el ladrón'],
    [{ tipo: 'CARTA_ROBADA', ladron: 'j1', victima: 'j2' }, 'Ana robó una carta a Beto'],
    [
      {
        tipo: 'CAMBIO_CON_BANCA_REALIZADO',
        jugador: 'j1',
        entrega: 'MADERA',
        cantidadEntregada: 4,
        recibe: 'MINERAL',
      },
      'Ana cambió 4 de madera por 1 de mineral',
    ],
    [{ tipo: 'TRATO_PROPUESTO', trato: { proponente: 'j2' } }, 'Beto propuso un trato'],
    [{ tipo: 'TRATO_ACEPTADO', aceptante: 'j1', proponente: 'j2' }, 'Ana aceptó el trato de Beto'],
    [{ tipo: 'TRATO_RECHAZADO', jugador: 'j1' }, 'Ana rechazó un trato'],
    [{ tipo: 'TRATO_CANCELADO' }, 'Se canceló un trato'],
    [{ tipo: 'CARTA_DESARROLLO_COMPRADA', jugador: 'j1' }, 'Ana compró una carta de desarrollo'],
    [{ tipo: 'CABALLERO_JUGADO', jugador: 'j1' }, 'Ana jugó un caballero'],
    [
      { tipo: 'CONSTRUCCION_CARRETERAS_JUGADA', jugador: 'j1' },
      'Ana jugó construcción de carreteras',
    ],
    [{ tipo: 'ABUNDANCIA_JUGADA', jugador: 'j1' }, 'Ana jugó abundancia'],
    [
      { tipo: 'MONOPOLIO_JUGADO', jugador: 'j1', recurso: 'OVEJA', cantidadRobada: 5 },
      'Ana jugó monopolio de oveja y robó 5',
    ],
    [{ tipo: 'GRAN_EJERCITO_CAMBIADO', nuevoTitular: 'j2' }, 'Beto tiene el gran ejército'],
    [{ tipo: 'GRAN_RUTA_CAMBIADA', nuevoTitular: 'j1', longitud: 6 }, 'Ana tiene la gran ruta (6)'],
    [{ tipo: 'GRAN_RUTA_CAMBIADA', nuevoTitular: null }, 'Nadie tiene ya la gran ruta'],
    [{ tipo: 'FASE_ESPECIAL_INICIADA' }, 'Empieza la construcción especial'],
    [
      { tipo: 'CONSTRUCCION_ESPECIAL_PASADA', jugador: 'j2' },
      'Beto pasó en la construcción especial',
    ],
    [{ tipo: 'TURNO_TERMINADO', jugador: 'j1' }, 'Ana terminó su turno'],
    [{ tipo: 'PARTIDA_GANADA', jugador: 'j1', puntos: 10 }, 'Ana ganó la partida con 10 puntos'],
  ])('describe %j', (evento, esperado) => {
    expect(describir(evento)).toBe(esperado);
  });

  it('no escribe nada para los eventos de ruido interno', () => {
    expect(describir({ tipo: 'FASE_CAMBIADA' })).toBeNull();
    expect(describir({ tipo: 'EVENTO_FUTURO' })).toBeNull();
  });

  it('no se rompe con campos ausentes o de otro tipo', () => {
    expect(describir({ tipo: 'DADOS_TIRADOS', dados: 'x' })).toBe(' sacó  = 0');
    expect(describir({ tipo: 'RECURSOS_DESCARTADOS', jugador: 'j1', recursos: 5 })).toBe(
      'Ana descartó nada',
    );
    expect(describir({ tipo: 'TRATO_PROPUESTO' })).toBe(' propuso un trato');
  });
});

describe('nombreDeCarta', () => {
  it('traduce las cartas y deja pasar las desconocidas', () => {
    expect(nombreDeCarta('MONOPOLIO')).toBe('monopolio');
    expect(nombreDeCarta('OTRA')).toBe('OTRA');
  });
});
