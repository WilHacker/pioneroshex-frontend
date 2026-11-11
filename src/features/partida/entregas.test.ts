import { describe, expect, it } from 'vitest';
import { cartasPorCasilla, entregasDe } from './entregas';

describe('cartasPorCasilla', () => {
  const reparto = (cantidad: number, fuentes: unknown) => ({
    tipo: 'RECURSOS_REPARTIDOS',
    jugador: 'j1',
    recurso: 'OVEJA',
    cantidad,
    causa: { tipo: 'PRODUCCION', tirada: 5, fuentes },
  });

  it('suma lo que salió de cada casilla, aunque cobren varios jugadores', () => {
    const mapa = cartasPorCasilla([
      reparto(3, [
        { casilla: '0,0', cantidad: 1 },
        { casilla: '0,0', cantidad: 2 },
      ]),
      { ...reparto(1, [{ casilla: '0,0', cantidad: 1 }]), jugador: 'j2' },
      reparto(2, [{ casilla: '1,-1', cantidad: 2 }]),
    ]);
    expect(Object.fromEntries(mapa)).toEqual({ '0,0': 4, '1,-1': 2 });
  });

  it('ignora lo que no es un reparto o viene mal formado, sin romper', () => {
    const mapa = cartasPorCasilla([
      { tipo: 'DADOS_TIRADOS', dados: [2, 3] },
      { tipo: 'RECURSOS_REPARTIDOS', jugador: 'j1', recurso: 'OVEJA', cantidad: 1 },
      reparto(1, 'no-es-una-lista'),
      reparto(1, [null, { casilla: 5, cantidad: 1 }, { casilla: '2,2', cantidad: 0 }]),
    ]);
    expect(mapa.size).toBe(0);
  });
});

describe('entregasDe', () => {
  it('lee a quién reparte el banco, qué recurso y cuántas cartas', () => {
    expect(
      entregasDe([{ tipo: 'RECURSOS_REPARTIDOS', jugador: 'j1', recurso: 'MADERA', cantidad: 2 }]),
    ).toEqual([{ jugador: 'j1', recurso: 'MADERA', cantidad: 2 }]);
  });

  it('junta lo que recibe el mismo jugador del mismo recurso en una sola entrega', () => {
    expect(
      entregasDe([
        { tipo: 'RECURSOS_REPARTIDOS', jugador: 'j1', recurso: 'TRIGO', cantidad: 1 },
        { tipo: 'RECURSOS_REPARTIDOS', jugador: 'j1', recurso: 'TRIGO', cantidad: 2 },
      ]),
    ).toEqual([{ jugador: 'j1', recurso: 'TRIGO', cantidad: 3 }]);
  });

  it('separa jugadores y recursos distintos, en el orden en que llegaron', () => {
    const entregas = entregasDe([
      { tipo: 'RECURSOS_REPARTIDOS', jugador: 'j2', recurso: 'OVEJA', cantidad: 1 },
      { tipo: 'RECURSOS_REPARTIDOS', jugador: 'j1', recurso: 'OVEJA', cantidad: 1 },
      { tipo: 'RECURSOS_REPARTIDOS', jugador: 'j2', recurso: 'MINERAL', cantidad: 1 },
    ]);
    expect(entregas.map((e) => `${e.jugador}:${e.recurso}`)).toEqual([
      'j2:OVEJA',
      'j1:OVEJA',
      'j2:MINERAL',
    ]);
  });

  it('ignora los eventos que no son un reparto', () => {
    expect(entregasDe([{ tipo: 'DADOS_TIRADOS', dados: [3, 4] }])).toEqual([]);
  });

  it('ignora repartos mal formados en vez de romper la pantalla', () => {
    expect(
      entregasDe([
        { tipo: 'RECURSOS_REPARTIDOS', jugador: 'j1', recurso: 'ORO', cantidad: 2 },
        { tipo: 'RECURSOS_REPARTIDOS', jugador: 7, recurso: 'MADERA', cantidad: 2 },
        { tipo: 'RECURSOS_REPARTIDOS', jugador: 'j1', recurso: 'MADERA', cantidad: 0 },
        { tipo: 'RECURSOS_REPARTIDOS', jugador: 'j1', recurso: 'MADERA', cantidad: 'dos' },
        { tipo: 'RECURSOS_REPARTIDOS', jugador: 'j1', recurso: 'MADERA' },
      ]),
    ).toEqual([]);
  });
});
