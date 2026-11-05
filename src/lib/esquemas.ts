import { z } from 'zod';

// Contrato con el backend (ver pioneroshex-backend/src/core/estado). El cliente solo valida lo que
// usa; los campos de más se ignoran. Cualquier cambio de forma se coordina en los dos repos.

export const RECURSOS = ['MADERA', 'LADRILLO', 'OVEJA', 'TRIGO', 'MINERAL'] as const;
export const esquemaRecurso = z.enum(RECURSOS);
export type Recurso = z.infer<typeof esquemaRecurso>;
export type Cantidades = Record<Recurso, number>;
const esquemaCantidades = z.record(esquemaRecurso, z.number());

export const esquemaHex = z.object({ q: z.number(), r: z.number(), s: z.number() });
export type Hex = z.infer<typeof esquemaHex>;
const esquemaPunto = z.object({ x: z.number(), y: z.number() });
export type Punto = z.infer<typeof esquemaPunto>;

export const esquemaTerreno = z.enum(['BOSQUE', 'PASTO', 'CAMPO', 'COLINA', 'MONTANA', 'DESIERTO']);
export type Terreno = z.infer<typeof esquemaTerreno>;

const esquemaCarta = z.enum([
  'CABALLERO',
  'PUNTO_VICTORIA',
  'CONSTRUCCION_CARRETERAS',
  'ABUNDANCIA',
  'MONOPOLIO',
]);
export type Carta = z.infer<typeof esquemaCarta>;

const esquemaPar = z.tuple([z.string(), z.string()]);

export const esquemaMesa = z.object({
  radio: z.number(),
  casillas: z.array(
    z.object({
      hex: esquemaHex,
      terreno: esquemaTerreno,
      ficha: z.number().nullable(),
      centro: esquemaPunto,
    }),
  ),
  vertices: z.array(
    z.object({ id: z.string(), posicion: esquemaPunto, vecinos: z.array(z.string()) }),
  ),
  aristas: z.array(z.object({ id: z.string(), vertices: esquemaPar })),
  puertos: z.array(
    z.object({
      arista: z.string(),
      vertices: esquemaPar,
      tipo: z.union([z.literal('GENERICO'), esquemaRecurso]),
    }),
  ),
});
export type Mesa = z.infer<typeof esquemaMesa>;

export const esquemaTrato = z.object({
  id: z.string(),
  proponente: z.string(),
  destinatario: z.string().nullable(),
  entrega: esquemaCantidades,
  pide: esquemaCantidades,
  rechazadoPor: z.array(z.string()),
});
export type Trato = z.infer<typeof esquemaTrato>;

const esquemaJugadorVista = z.object({
  id: z.string(),
  totalCartas: z.number(),
  totalCartasDesarrollo: z.number(),
  caballerosJugados: z.number(),
  puntos: z.number(),
  recursos: esquemaCantidades.nullable(),
  cartasDesarrollo: z.array(esquemaCarta).nullable(),
});
export type JugadorVista = z.infer<typeof esquemaJugadorVista>;

export const FASES = [
  'PREPARACION_POBLADO',
  'PREPARACION_CAMINO',
  'PRE_TIRADA',
  'DESCARTE',
  'MOVER_LADRON',
  'FASE_PRINCIPAL',
  'CONSTRUCCION_ESPECIAL',
  'FIN',
] as const;
export type Fase = (typeof FASES)[number];

export const esquemaVista = z.object({
  config: z.object({ puntosVictoria: z.number() }),
  yo: z.string().nullable(),
  jugadores: z.array(esquemaJugadorVista),
  fase: z.enum(FASES),
  turnoDe: z.string().nullable(),
  turnoEspecialDe: z.string().nullable(),
  tratos: z.array(esquemaTrato),
  edificios: z.record(
    z.string(),
    z.object({ dueno: z.string(), tipo: z.enum(['POBLADO', 'CIUDAD']) }),
  ),
  caminos: z.record(z.string(), z.string()),
  banco: esquemaCantidades,
  tamanoMazo: z.number(),
  granEjercito: z.string().nullable(),
  granRuta: z.string().nullable(),
  longitudGranRuta: z.number(),
  ladron: esquemaHex.nullable(),
  dados: z.tuple([z.number(), z.number()]).nullable(),
  descartesPendientes: z.record(z.string(), z.number()),
  ganador: z.string().nullable(),
  version: z.number(),
});
export type Vista = z.infer<typeof esquemaVista>;

export const esquemaAccionDisponible = z.object({
  tipo: z.string(),
  disponible: z.boolean(),
  motivo: z.string().optional(),
});
export type AccionDisponible = z.infer<typeof esquemaAccionDisponible>;

/** Un evento cualquiera: se lee por `tipo` y el resto de campos se consulta con cuidado. */
export const esquemaEvento = z.looseObject({ tipo: z.string() });
export type EventoJuego = z.infer<typeof esquemaEvento>;

export const esquemaNotificacion = z.object({
  vista: esquemaVista,
  eventos: z.array(esquemaEvento),
  acciones: z.array(esquemaAccionDisponible),
});
export type Notificacion = z.infer<typeof esquemaNotificacion>;

export const esquemaInicio = z.object({
  jugadorId: z.string(),
  mesa: esquemaMesa,
  vista: esquemaVista,
  acciones: z.array(esquemaAccionDisponible),
});
export type Inicio = z.infer<typeof esquemaInicio>;

export const esquemaRespuestaAccion = z.union([
  z.object({ ok: z.literal(true) }),
  z.object({ ok: z.literal(false), motivo: z.string(), detalle: z.looseObject({}).optional() }),
]);
export type RespuestaAccion = z.infer<typeof esquemaRespuestaAccion>;

export const esquemaCredencial = z.object({
  salaId: z.string(),
  jugadorId: z.string(),
  token: z.string(),
});
export type Credencial = z.infer<typeof esquemaCredencial>;

export const esquemaSalaPublica = z.object({
  id: z.string(),
  empezada: z.boolean(),
  anfitrion: z.string(),
  jugadores: z.array(z.object({ id: z.string(), nombre: z.string() })),
});
export type SalaPublica = z.infer<typeof esquemaSalaPublica>;
