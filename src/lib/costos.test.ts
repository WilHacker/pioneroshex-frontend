import { costoDe, faltaPara, textoDeFalta } from './costos';

const mano = { MADERA: 0, LADRILLO: 0, OVEJA: 0, TRIGO: 0, MINERAL: 0 };

describe('costoDe', () => {
  it('lista solo los recursos que cuesta cada pieza, en el orden de siempre', () => {
    expect(costoDe('CAMINO')).toEqual([
      { recurso: 'MADERA', cantidad: 1 },
      { recurso: 'LADRILLO', cantidad: 1 },
    ]);
    expect(costoDe('CIUDAD')).toEqual([
      { recurso: 'TRIGO', cantidad: 2 },
      { recurso: 'MINERAL', cantidad: 3 },
    ]);
    expect(costoDe('POBLADO')).toHaveLength(4);
  });
});

describe('textoDeFalta', () => {
  it('une lo que falta con comas y «y», en el orden de los recursos', () => {
    expect(textoDeFalta({ TRIGO: 2 })).toBe('2 de trigo');
    expect(textoDeFalta({ LADRILLO: 1, MADERA: 1 })).toBe('1 de madera y 1 de ladrillo');
    expect(textoDeFalta({ MINERAL: 3, MADERA: 1, OVEJA: 2 })).toBe(
      '1 de madera, 2 de oveja y 3 de mineral',
    );
  });

  it('ignora lo que no falta y devuelve vacío si no falta nada', () => {
    expect(textoDeFalta({})).toBe('');
    expect(textoDeFalta({ MADERA: 0 })).toBe('');
  });
});

describe('faltaPara', () => {
  it('si alcanza, no falta nada', () => {
    expect(faltaPara({ ...mano, MADERA: 1, LADRILLO: 3 }, 'CAMINO')).toEqual({});
  });

  it('dice cuánto falta de cada recurso, y solo de los que faltan', () => {
    expect(faltaPara({ ...mano, MADERA: 1, TRIGO: 1 }, 'POBLADO')).toEqual({
      LADRILLO: 1,
      OVEJA: 1,
    });
    expect(faltaPara({ ...mano, TRIGO: 1, MINERAL: 1 }, 'CIUDAD')).toEqual({
      TRIGO: 1,
      MINERAL: 2,
    });
  });

  it('con la mano desconocida falta todo', () => {
    expect(faltaPara(null, 'CAMINO')).toEqual({ MADERA: 1, LADRILLO: 1 });
  });
});
