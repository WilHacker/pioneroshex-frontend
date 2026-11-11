import { SIN_SITIOS, V1, vistaDePrueba } from '@/lib/pruebas';
import {
  accionDeArista,
  accionDeLadron,
  accionDeSitioRapido,
  accionDeVertice,
  disponible,
  esMiTurno,
  mensajeDeFase,
  modoEfectivo,
  objetivoDe,
  puedeConstruirAlDobleClic,
  sitiosDe,
  TEXTO_DE_SITIO,
} from './logica';

const nombre = (id: string): string => ({ j1: 'Ana', j2: 'Beto' })[id] ?? id;

describe('doble clic para construir en el mapa', () => {
  it('solo vale en mi turno, en la fase principal y sin otra herramienta elegida', () => {
    expect(puedeConstruirAlDobleClic(vistaDePrueba(), null)).toBe(true);
    expect(puedeConstruirAlDobleClic(vistaDePrueba(), 'POBLADO')).toBe(false);
    expect(puedeConstruirAlDobleClic(vistaDePrueba({ turnoDe: 'j2' }), null)).toBe(false);
    expect(puedeConstruirAlDobleClic(vistaDePrueba({ fase: 'PRE_TIRADA' }), null)).toBe(false);
    expect(puedeConstruirAlDobleClic(vistaDePrueba({ fase: 'PREPARACION_POBLADO' }), null)).toBe(
      false,
    );
    expect(puedeConstruirAlDobleClic(vistaDePrueba({ fase: 'MOVER_LADRON' }), null)).toBe(false);
  });

  it('también en la construcción especial, cuando me toca', () => {
    const vista = vistaDePrueba({
      fase: 'CONSTRUCCION_ESPECIAL',
      turnoDe: 'j2',
      turnoEspecialDe: 'j1',
    });
    expect(puedeConstruirAlDobleClic(vista, null)).toBe(true);
  });

  it('cada sitio se traduce en la jugada que se envía al confirmar', () => {
    expect(accionDeSitioRapido({ tipo: 'POBLADO', id: V1 })).toEqual({
      tipo: 'CONSTRUIR_POBLADO',
      vertice: V1,
    });
    expect(accionDeSitioRapido({ tipo: 'CIUDAD', id: V1 })).toEqual({
      tipo: 'CONSTRUIR_CIUDAD',
      vertice: V1,
    });
    expect(accionDeSitioRapido({ tipo: 'CAMINO', id: 'a1' })).toEqual({
      tipo: 'CONSTRUIR_CAMINO',
      arista: 'a1',
    });
  });

  it('cada pieza tiene su título para el cartel y su nombre para los avisos', () => {
    expect(TEXTO_DE_SITIO.POBLADO).toEqual({ titulo: 'Poner un poblado', pieza: 'un poblado' });
    expect(TEXTO_DE_SITIO.CIUDAD).toEqual({ titulo: 'Mejorar a ciudad', pieza: 'una ciudad' });
    expect(TEXTO_DE_SITIO.CAMINO).toEqual({ titulo: 'Poner un camino', pieza: 'un camino' });
  });
});

describe('esMiTurno', () => {
  it('en el turno normal, cuando turnoDe soy yo', () => {
    expect(esMiTurno(vistaDePrueba())).toBe(true);
    expect(esMiTurno(vistaDePrueba({ turnoDe: 'j2' }))).toBe(false);
  });

  it('en la construcción especial manda turnoEspecialDe, no turnoDe', () => {
    const base = { fase: 'CONSTRUCCION_ESPECIAL' as const, turnoDe: 'j1' };
    expect(esMiTurno(vistaDePrueba({ ...base, turnoEspecialDe: 'j2' }))).toBe(false);
    expect(esMiTurno(vistaDePrueba({ ...base, turnoEspecialDe: 'j1' }))).toBe(true);
  });

  it('con la partida terminada o como espectador nunca es mi turno', () => {
    expect(esMiTurno(vistaDePrueba({ fase: 'FIN', turnoDe: null }))).toBe(false);
    expect(esMiTurno(vistaDePrueba({ yo: null }))).toBe(false);
  });
});

describe('modoEfectivo', () => {
  it('en la preparación y al mover el ladrón lo fija la fase, no el jugador', () => {
    expect(modoEfectivo(vistaDePrueba({ fase: 'PREPARACION_POBLADO' }), 'CAMINO')).toBe('POBLADO');
    expect(modoEfectivo(vistaDePrueba({ fase: 'PREPARACION_CAMINO' }), null)).toBe('CAMINO');
    expect(modoEfectivo(vistaDePrueba({ fase: 'MOVER_LADRON' }), null)).toBe('LADRON');
  });

  it('en la fase principal respeta lo que eligió el jugador', () => {
    expect(modoEfectivo(vistaDePrueba(), 'CIUDAD')).toBe('CIUDAD');
    expect(modoEfectivo(vistaDePrueba(), null)).toBeNull();
  });

  it('sin turno no hay modo, elija lo que elija', () => {
    expect(modoEfectivo(vistaDePrueba({ turnoDe: 'j2' }), 'POBLADO')).toBeNull();
    expect(modoEfectivo(vistaDePrueba({ fase: 'FIN', turnoDe: null }), 'POBLADO')).toBeNull();
  });
});

describe('objetivoDe', () => {
  it.each([
    ['POBLADO', 'POBLADOS'],
    ['CIUDAD', 'CIUDADES'],
    ['CAMINO', 'ARISTAS'],
    ['CARRETERAS', 'ARISTAS'],
    ['LADRON', 'CASILLAS'],
    ['CABALLERO', 'CASILLAS'],
    [null, null],
  ] as const)('%s → %s', (modo, objetivo) => {
    expect(objetivoDe(modo)).toBe(objetivo);
  });
});

describe('acciones del tablero', () => {
  it('poblado: inicial en la preparación, normal después', () => {
    expect(accionDeVertice(vistaDePrueba({ fase: 'PREPARACION_POBLADO' }), 'POBLADO', 'v')).toEqual(
      {
        tipo: 'COLOCAR_POBLADO_INICIAL',
        vertice: 'v',
      },
    );
    expect(accionDeVertice(vistaDePrueba(), 'POBLADO', 'v')).toEqual({
      tipo: 'CONSTRUIR_POBLADO',
      vertice: 'v',
    });
    expect(accionDeVertice(vistaDePrueba(), 'CIUDAD', 'v')).toEqual({
      tipo: 'CONSTRUIR_CIUDAD',
      vertice: 'v',
    });
    expect(accionDeVertice(vistaDePrueba(), 'CAMINO', 'v')).toBeNull();
  });

  it('camino: inicial en la preparación, normal después', () => {
    expect(accionDeArista(vistaDePrueba({ fase: 'PREPARACION_CAMINO' }), 'CAMINO', 'a')).toEqual({
      tipo: 'COLOCAR_CAMINO_INICIAL',
      arista: 'a',
    });
    expect(accionDeArista(vistaDePrueba(), 'CAMINO', 'a')).toEqual({
      tipo: 'CONSTRUIR_CAMINO',
      arista: 'a',
    });
    expect(accionDeArista(vistaDePrueba(), 'POBLADO', 'a')).toBeNull();
  });

  it('ladrón: mover o jugar caballero, con o sin víctima', () => {
    const destino = { q: 1, r: 0, s: -1 };
    expect(accionDeLadron('LADRON', destino, 'j2')).toEqual({
      tipo: 'MOVER_LADRON',
      destino,
      victima: 'j2',
    });
    expect(accionDeLadron('CABALLERO', destino, null)).toEqual({
      tipo: 'JUGAR_CABALLERO',
      destino,
      victima: null,
    });
    expect(accionDeLadron('POBLADO', destino, null)).toBeNull();
  });
});

describe('disponible', () => {
  const acciones = [
    { tipo: 'TIRAR_DADOS', disponible: true },
    { tipo: 'TERMINAR_TURNO', disponible: false, motivo: 'FASE_INCORRECTA' },
  ];

  it('es verdadero solo si el servidor la marca disponible', () => {
    expect(disponible(acciones, 'TIRAR_DADOS')).toBe(true);
    expect(disponible(acciones, 'TERMINAR_TURNO')).toBe(false);
    expect(disponible(acciones, 'NO_EXISTE')).toBe(false);
  });
});

describe('mensajeDeFase', () => {
  it('dice qué hacer en cada fase de mi turno', () => {
    const v = (fase: Parameters<typeof vistaDePrueba>[0] & object) => vistaDePrueba(fase);
    expect(mensajeDeFase(v({ fase: 'PREPARACION_POBLADO' }), nombre)).toMatch(/poblado/i);
    expect(mensajeDeFase(v({ fase: 'PREPARACION_CAMINO' }), nombre)).toMatch(/camino/i);
    expect(mensajeDeFase(v({ fase: 'PRE_TIRADA' }), nombre)).toMatch(/dados/i);
    expect(mensajeDeFase(v({ fase: 'MOVER_LADRON' }), nombre)).toMatch(/ladrón/i);
    expect(mensajeDeFase(v({ fase: 'FASE_PRINCIPAL' }), nombre)).toBe('Tu turno');
    expect(
      mensajeDeFase(v({ fase: 'CONSTRUCCION_ESPECIAL', turnoEspecialDe: 'j1' }), nombre),
    ).toMatch(/especial/i);
  });

  it('si no es mi turno, dice de quién es', () => {
    expect(mensajeDeFase(vistaDePrueba({ turnoDe: 'j2' }), nombre)).toBe('Turno de Beto');
  });

  it('avisa del descarte pendiente aunque no sea mi turno', () => {
    const vista = vistaDePrueba({
      fase: 'DESCARTE',
      turnoDe: 'j2',
      descartesPendientes: { j1: 4 },
    });
    expect(mensajeDeFase(vista, nombre)).toBe('Descarta 4');
    const otros = vistaDePrueba({
      fase: 'DESCARTE',
      turnoDe: 'j2',
      descartesPendientes: { j3: 2 },
    });
    expect(mensajeDeFase(otros, nombre)).toBe('Esperando descartes');
  });

  it('al terminar, anuncia al ganador', () => {
    const vista = vistaDePrueba({ fase: 'FIN', turnoDe: null, ganador: 'j2' });
    expect(mensajeDeFase(vista, nombre)).toBe('¡Ganó Beto!');
  });
});

describe('sitiosDe', () => {
  const sitios = {
    poblados: ['v1'],
    ciudades: ['v2'],
    caminos: ['a1'],
    ladron: ['0,0'],
    caballero: ['1,0'],
    carreteras: ['a2'],
  };

  it.each([
    ['POBLADO', ['v1']],
    ['CIUDAD', ['v2']],
    ['CAMINO', ['a1']],
    ['CARRETERAS', ['a2']],
    ['LADRON', ['0,0']],
    ['CABALLERO', ['1,0']],
    [null, []],
  ] as const)('en modo %s resalta %j', (modo, esperado) => {
    expect(sitiosDe(modo, sitios)).toEqual(esperado);
  });

  it('sin sitios no hay nada que resaltar', () => {
    expect(sitiosDe('POBLADO', SIN_SITIOS)).toEqual([]);
  });
});
