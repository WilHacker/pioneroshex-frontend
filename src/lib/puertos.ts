import type { Mesa, Recurso, Vista } from './esquemas';

/**
 * Las reglas de los puertos, igual que las aplica el servidor (`core/reglas/puertos.ts`). Aquí solo
 * sirven para mostrar al jugador lo que va a pasar: quien decide si el cambio vale es el servidor.
 */

const RAZON_SIN_PUERTO = 4;
const RAZON_GENERICA = 3;
const RAZON_ESPECIFICA = 2;

type MesaConPuertos = Pick<Mesa, 'puertos'>;
type VistaConEdificios = Pick<Vista, 'edificios' | 'yo'>;

/** Los vértices donde tengo un poblado o una ciudad (vacío si soy espectador). */
function verticesPropios(vista: VistaConEdificios): ReadonlySet<string> {
  if (vista.yo === null) return new Set();
  return new Set(
    Object.entries(vista.edificios)
      .filter(([, edificio]) => edificio.dueno === vista.yo)
      .map(([vertice]) => vertice),
  );
}

/**
 * Cuántas cartas iguales cuesta cambiar por 1 con la banca: 2 con el puerto de ese recurso, 3 con
 * un puerto genérico y 4 sin puerto. Un puerto solo cuenta si hay una casa mía en uno de sus dos
 * vértices (el muelle que une el barco con la costa).
 */
export function razonDeBanca(
  mesa: MesaConPuertos,
  vista: VistaConEdificios,
  recurso: Recurso,
): 2 | 3 | 4 {
  const propios = verticesPropios(vista);
  const mios = mesa.puertos.filter((p) => p.vertices.some((v) => propios.has(v)));
  if (mios.some((p) => p.tipo === recurso)) return RAZON_ESPECIFICA;
  if (mios.some((p) => p.tipo === 'GENERICO')) return RAZON_GENERICA;
  return RAZON_SIN_PUERTO;
}

/**
 * Los puertos que puedo usar, con el vértice (o los dos) por donde estoy conectado: ahí está mi
 * casa y ese muelle es el que se resalta en el tablero. La clave es la arista del puerto.
 */
export function puertosConectados(
  mesa: MesaConPuertos,
  vista: VistaConEdificios,
): ReadonlyMap<string, readonly string[]> {
  const propios = verticesPropios(vista);
  const conectados = new Map<string, readonly string[]>();
  for (const puerto of mesa.puertos) {
    const mios = puerto.vertices.filter((v) => propios.has(v));
    if (mios.length > 0) conectados.set(puerto.arista, mios);
  }
  return conectados;
}
