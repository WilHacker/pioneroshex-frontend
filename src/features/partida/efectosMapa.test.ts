import { describe, expect, it } from 'vitest';
import { efectosDeMapa } from './efectosMapa';

const reparto = (
  jugador: string,
  recurso: string,
  cantidad: number,
  fuentes: unknown,
  extra: Record<string, unknown> = {},
) => ({
  tipo: 'RECURSOS_REPARTIDOS',
  jugador,
  recurso,
  cantidad,
  causa: { tipo: 'PRODUCCION', tirada: 5, fuentes },
  ...extra,
});

describe('efectosDeMapa: recursos que llegan a cada edificio', () => {
  it('uno por edificio que cobra, con su jugador, su recurso y su cantidad', () => {
    expect(
      efectosDeMapa([
        reparto('j1', 'OVEJA', 3, [
          { casilla: '0,0', vertice: 'va', edificio: 'CIUDAD', cantidad: 2 },
          { casilla: '1,0', vertice: 'vb', edificio: 'POBLADO', cantidad: 1 },
        ]),
        reparto('j2', 'MADERA', 1, [
          { casilla: '0,0', vertice: 'vc', edificio: 'POBLADO', cantidad: 1 },
        ]),
      ]),
    ).toEqual([
      { clase: 'RECURSO', vertice: 'va', jugador: 'j1', recurso: 'OVEJA', cantidad: 2 },
      { clase: 'RECURSO', vertice: 'vb', jugador: 'j1', recurso: 'OVEJA', cantidad: 1 },
      { clase: 'RECURSO', vertice: 'vc', jugador: 'j2', recurso: 'MADERA', cantidad: 1 },
    ]);
  });

  it('junta lo del mismo edificio y recurso (dos casillas con el mismo número)', () => {
    const efectos = efectosDeMapa([
      reparto('j1', 'TRIGO', 2, [
        { casilla: '0,0', vertice: 'va', cantidad: 1 },
        { casilla: '1,0', vertice: 'va', cantidad: 1 },
      ]),
    ]);
    expect(efectos).toEqual([
      { clase: 'RECURSO', vertice: 'va', jugador: 'j1', recurso: 'TRIGO', cantidad: 2 },
    ]);
  });

  it('con el banco corto muestra solo lo que de verdad se entregó, en orden', () => {
    const efectos = efectosDeMapa([
      reparto(
        'j1',
        'MINERAL',
        1,
        [
          { casilla: '0,0', vertice: 'va', cantidad: 2 },
          { casilla: '1,0', vertice: 'vb', cantidad: 1 },
        ],
        { pedido: 3, recortado: 2 },
      ),
    ]);
    expect(efectos).toEqual([
      { clase: 'RECURSO', vertice: 'va', jugador: 'j1', recurso: 'MINERAL', cantidad: 1 },
    ]);
  });

  it('en la preparación, el recurso inicial sale del vértice del poblado', () => {
    const efectos = efectosDeMapa([
      {
        tipo: 'RECURSOS_REPARTIDOS',
        jugador: 'j3',
        recurso: 'LADRILLO',
        cantidad: 1,
        causa: { tipo: 'PREPARACION', vertice: 'vz', casilla: '0,0' },
      },
    ]);
    expect(efectos).toEqual([
      { clase: 'RECURSO', vertice: 'vz', jugador: 'j3', recurso: 'LADRILLO', cantidad: 1 },
    ]);
  });
});

describe('efectosDeMapa: puntos de las construcciones', () => {
  it('un poblado nuevo y la mejora a ciudad valen 1 punto cada uno, en su vértice', () => {
    expect(
      efectosDeMapa([
        { tipo: 'POBLADO_COLOCADO', jugador: 'j1', vertice: 'va' },
        { tipo: 'CIUDAD_COLOCADA', jugador: 'j2', vertice: 'vb' },
      ]),
    ).toEqual([
      { clase: 'PUNTO', vertice: 'va', jugador: 'j1', puntos: 1 },
      { clase: 'PUNTO', vertice: 'vb', jugador: 'j2', puntos: 1 },
    ]);
  });

  it('un camino no da puntos', () => {
    expect(efectosDeMapa([{ tipo: 'CAMINO_COLOCADO', jugador: 'j1', arista: 'a1' }])).toEqual([]);
  });
});

describe('efectosDeMapa: eventos mal formados', () => {
  it('se ignoran sin romper nada', () => {
    expect(
      efectosDeMapa([
        { tipo: 'DADOS_TIRADOS', jugador: 'j1', dados: [2, 3] },
        { tipo: 'RECURSOS_REPARTIDOS', recurso: 'OVEJA', cantidad: 1 },
        reparto('j1', 'NADA', 1, []),
        reparto('j1', 'OVEJA', 0, []),
        reparto('j1', 'OVEJA', 1, 'no-es-una-lista'),
        reparto('j1', 'OVEJA', 1, [
          null,
          { vertice: 5, cantidad: 1 },
          { vertice: 'v', cantidad: 0 },
        ]),
        { tipo: 'POBLADO_COLOCADO', jugador: 'j1' },
      ]),
    ).toEqual([]);
  });
});
