import { esquemaMesa, type Hex, type Mesa, type Vista } from './esquemas';
import mesaCruda from './mesa-demo.json';
import planCrudo from './plan-demo.json';

// Tablero de adorno para la portada: lo generó el backend con una semilla fija y se guardó aquí,
// así la portada se ve aunque el servidor esté apagado. Cuatro jugadores con ocho edificios.

export const mesaDemo: Mesa = esquemaMesa.parse(mesaCruda);

export const edificiosDemo: Vista['edificios'] = planCrudo.edificios as Vista['edificios'];
export const caminosDemo: Vista['caminos'] = planCrudo.caminos;
export const ladronDemo: Hex = planCrudo.ladron;

/** Los jugadores del adorno, en orden de color. */
export const JUGADORES_DEMO = ['j1', 'j2', 'j3', 'j4'] as const;
