import { describe, expect, it } from 'vitest';
import type { Mesa, Vista } from './esquemas';
import { puertosConectados, razonDeBanca } from './puertos';

type Edificios = Vista['edificios'];

const puerto = (arista: string, a: string, b: string, tipo: Mesa['puertos'][number]['tipo']) => ({
  arista,
  vertices: [a, b] as [string, string],
  tipo,
});

const MESA: Pick<Mesa, 'puertos'> = {
  puertos: [
    puerto('p1', 'v1', 'v2', 'GENERICO'),
    puerto('p2', 'v3', 'v4', 'MADERA'),
    puerto('p3', 'v5', 'v6', 'MINERAL'),
  ],
};

const vista = (
  edificios: Edificios,
  yo: string | null = 'j1',
): Pick<Vista, 'edificios' | 'yo'> => ({
  edificios,
  yo,
});

const mio = (tipo: 'POBLADO' | 'CIUDAD' = 'POBLADO') => ({ dueno: 'j1', tipo });
const ajeno = { dueno: 'j2', tipo: 'POBLADO' as const };

describe('razonDeBanca: lo que cuesta cambiar con la banca', () => {
  it('sin ningún puerto se cambian 4 cartas iguales por 1', () => {
    for (const recurso of ['MADERA', 'LADRILLO', 'OVEJA', 'TRIGO', 'MINERAL'] as const) {
      expect(razonDeBanca(MESA, vista({}), recurso)).toBe(4);
    }
  });

  it('con una casa en un puerto genérico cualquier recurso baja a 3', () => {
    expect(razonDeBanca(MESA, vista({ v1: mio() }), 'OVEJA')).toBe(3);
    expect(razonDeBanca(MESA, vista({ v2: mio('CIUDAD') }), 'TRIGO')).toBe(3);
  });

  it('con una casa en el puerto de un recurso, ese recurso baja a 2 y los demás siguen en 4', () => {
    const edificios = { v3: mio() };
    expect(razonDeBanca(MESA, vista(edificios), 'MADERA')).toBe(2);
    expect(razonDeBanca(MESA, vista(edificios), 'LADRILLO')).toBe(4);
  });

  it('el puerto de un recurso no mejora a los otros: con el de mineral, la madera cuesta 4', () => {
    expect(razonDeBanca(MESA, vista({ v5: mio() }), 'MADERA')).toBe(4);
    expect(razonDeBanca(MESA, vista({ v6: mio() }), 'MINERAL')).toBe(2);
  });

  it('con puerto genérico y uno de ese recurso gana el 2:1', () => {
    expect(razonDeBanca(MESA, vista({ v1: mio(), v4: mio() }), 'MADERA')).toBe(2);
    expect(razonDeBanca(MESA, vista({ v1: mio(), v4: mio() }), 'OVEJA')).toBe(3);
  });

  it('solo cuentan mis casas: el puerto de otro jugador no me sirve', () => {
    expect(razonDeBanca(MESA, vista({ v1: ajeno, v3: ajeno }), 'MADERA')).toBe(4);
  });

  it('un espectador no tiene puertos', () => {
    expect(razonDeBanca(MESA, vista({ v1: mio() }, null), 'MADERA')).toBe(4);
  });

  it('una casa cerca pero no en un vértice del puerto no cuenta', () => {
    expect(razonDeBanca(MESA, vista({ v9: mio() }), 'MADERA')).toBe(4);
  });
});

describe('puertosConectados: qué barcos puedo usar y por qué muelle', () => {
  it('sin casas no hay ninguno', () => {
    expect(puertosConectados(MESA, vista({})).size).toBe(0);
  });

  it('un puerto está conectado por el vértice donde tengo una casa', () => {
    const conectados = puertosConectados(MESA, vista({ v4: mio() }));
    expect([...conectados.keys()]).toEqual(['p2']);
    expect(conectados.get('p2')).toEqual(['v4']);
  });

  it('con casas en los dos vértices de un puerto se conectan los dos muelles', () => {
    const conectados = puertosConectados(MESA, vista({ v5: mio(), v6: mio('CIUDAD') }));
    expect(conectados.get('p3')).toEqual(['v5', 'v6']);
  });

  it('no cuentan las casas de otros jugadores ni las de un espectador', () => {
    expect(puertosConectados(MESA, vista({ v1: ajeno })).size).toBe(0);
    expect(puertosConectados(MESA, vista({ v1: mio() }, null)).size).toBe(0);
  });
});
