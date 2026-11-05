import type { Inicio, Mesa, Vista } from './esquemas';

// Datos de ejemplo con la forma real del backend, para los tests de lib/ y features/.

const RAIZ_DE_3 = Math.sqrt(3);
export const V1 = '0,0|1,0|0,1';
export const V2 = '0,0|1,-1|1,0';
export const V3 = '1,0|1,-1|2,-1';

export const mesaDePrueba: Mesa = {
  radio: 0,
  casillas: [
    { hex: { q: 0, r: 0, s: 0 }, terreno: 'BOSQUE', ficha: 8, centro: { x: 0, y: 0 } },
    {
      hex: { q: 1, r: 0, s: -1 },
      terreno: 'DESIERTO',
      ficha: null,
      centro: { x: RAIZ_DE_3, y: 0 },
    },
  ],
  vertices: [
    { id: V1, posicion: { x: RAIZ_DE_3 / 2, y: 0.5 }, vecinos: [V2] },
    { id: V2, posicion: { x: RAIZ_DE_3 / 2, y: -0.5 }, vecinos: [V1, V3] },
    { id: V3, posicion: { x: RAIZ_DE_3, y: -1 }, vecinos: [V2] },
  ],
  aristas: [
    { id: 'a1', vertices: [V1, V2] },
    { id: 'a2', vertices: [V2, V3] },
  ],
  puertos: [{ arista: 'a2', vertices: [V2, V3], tipo: 'GENERICO' }],
};

const sinRecursos = { MADERA: 0, LADRILLO: 0, OVEJA: 0, TRIGO: 0, MINERAL: 0 };

export function vistaDePrueba(cambios: Partial<Vista> = {}): Vista {
  return {
    config: { puntosVictoria: 10 },
    yo: 'j1',
    jugadores: [
      {
        id: 'j1',
        totalCartas: 3,
        totalCartasDesarrollo: 0,
        caballerosJugados: 0,
        puntos: 2,
        recursos: { ...sinRecursos, MADERA: 2, TRIGO: 1 },
        cartasDesarrollo: [],
      },
      {
        id: 'j2',
        totalCartas: 4,
        totalCartasDesarrollo: 1,
        caballerosJugados: 0,
        puntos: 2,
        recursos: null,
        cartasDesarrollo: null,
      },
      {
        id: 'j3',
        totalCartas: 0,
        totalCartasDesarrollo: 0,
        caballerosJugados: 0,
        puntos: 2,
        recursos: null,
        cartasDesarrollo: null,
      },
    ],
    fase: 'FASE_PRINCIPAL',
    turnoDe: 'j1',
    turnoEspecialDe: null,
    tratos: [],
    edificios: {},
    caminos: {},
    banco: { MADERA: 19, LADRILLO: 19, OVEJA: 19, TRIGO: 19, MINERAL: 19 },
    tamanoMazo: 25,
    granEjercito: null,
    granRuta: null,
    longitudGranRuta: 0,
    ladron: { q: 1, r: 0, s: -1 },
    dados: [3, 4],
    descartesPendientes: {},
    ganador: null,
    version: 7,
    ...cambios,
  };
}

export function inicioDePrueba(cambios: Partial<Inicio> = {}): Inicio {
  return {
    jugadorId: 'j1',
    mesa: mesaDePrueba,
    vista: vistaDePrueba(),
    acciones: [
      { tipo: 'TERMINAR_TURNO', disponible: true },
      { tipo: 'TIRAR_DADOS', disponible: false, motivo: 'FASE_INCORRECTA' },
    ],
    ...cambios,
  };
}
