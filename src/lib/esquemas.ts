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
  /** Quienes dijeron que sí y esperan a que el proponente cierre el trato con alguno. */
  aceptadoPor: z.array(z.string()),
});
export type Trato = z.infer<typeof esquemaTrato>;

const esquemaJugadorVista = z.object({
  id: z.string(),
  totalCartas: z.number(),
  totalCartasDesarrollo: z.number(),
  caballerosJugados: z.number(),
  piezasRestantes: z.object({ caminos: z.number(), poblados: z.number(), ciudades: z.number() }),
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
  config: z.object({
    puntosVictoria: z.number(),
    ordenDeTurno: z.enum(['ALEATORIO', 'TIRADA', 'ENTRADA']).optional(),
    ladronAmistoso: z.boolean().optional(),
    modoComercio: z.enum(['LIBRE', 'PRIVADO', 'SOLO_BANCO']).optional(),
    maxOfertasPorTurno: z.number().optional(),
    arranqueProtegido: z.boolean().optional(),
    ocultarBanco: z.boolean().optional(),
    manosVisibles: z.boolean().optional(),
  }),
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
  /** `null` con la regla «ocultar banco»: el servidor no lo manda. */
  banco: esquemaCantidades.nullable(),
  tamanoMazo: z.number().nullable(),
  granEjercito: z.string().nullable(),
  granRuta: z.string().nullable(),
  longitudGranRuta: z.number(),
  ladron: esquemaHex.nullable(),
  dados: z.tuple([z.number(), z.number()]).nullable(),
  descartesPendientes: z.record(z.string(), z.number()),
  ganador: z.string().nullable(),
  /** El sorteo del orden de turno por dados, ronda a ronda (vacío si no se sorteó). */
  sorteo: z.array(
    z.array(z.object({ jugador: z.string(), dados: z.tuple([z.number(), z.number()]) })),
  ),
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

/** Dónde puede actuar el jugador ahora (lo calcula el servidor). Casillas como `"q,r"`. */
export const esquemaSitios = z.object({
  poblados: z.array(z.string()),
  ciudades: z.array(z.string()),
  caminos: z.array(z.string()),
  ladron: z.array(z.string()),
  caballero: z.array(z.string()),
  carreteras: z.array(z.string()),
});
export type Sitios = z.infer<typeof esquemaSitios>;

export const esquemaNotificacion = z.object({
  vista: esquemaVista,
  eventos: z.array(esquemaEvento),
  acciones: z.array(esquemaAccionDisponible),
  sitios: esquemaSitios,
  /** Milisegundos que le quedan a quien debe actuar; `null` si la sala no tiene límite de tiempo. */
  reloj: z.number().nullish(),
});
export type Notificacion = z.infer<typeof esquemaNotificacion>;

/** Quién está conectado y a quién juega el piloto automático (ids de jugador). */
export const esquemaPresencia = z.object({
  conectados: z.array(z.string()),
  piloto: z.array(z.string()),
  /** Quienes dejaron la partida a propósito. */
  abandonaron: z.array(z.string()),
});
export type Presencia = z.infer<typeof esquemaPresencia>;

export const esquemaInicio = z.object({
  jugadorId: z.string(),
  mesa: esquemaMesa,
  vista: esquemaVista,
  acciones: z.array(esquemaAccionDisponible),
  sitios: esquemaSitios,
  reloj: z.number().nullish(),
  presencia: esquemaPresencia.optional(),
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
  publica: z.boolean(),
  /** Jugadores que admite esta sala: el tope del juego o el del mapa elegido. Lo manda el servidor. */
  maximo: z.number(),
  opciones: z.object({
    /** El id de un mapa del catálogo; `null` o ausente es el mapa automático. */
    mapa: z.string().nullable().optional(),
    puntosVictoria: z.number().optional(),
    turnRuleMode: z.enum(['A', 'B']).optional(),
    modoDados: z.enum(['AZAR', 'EQUILIBRADO', 'BARAJA', 'SIN_RACHAS']).optional(),
    arranqueProtegido: z.boolean().optional(),
    ocultarBanco: z.boolean().optional(),
    manosVisibles: z.boolean().optional(),
    ordenDeTurno: z.enum(['ALEATORIO', 'TIRADA', 'ENTRADA']).optional(),
    ladronAmistoso: z.boolean().optional(),
    modoComercio: z.enum(['LIBRE', 'PRIVADO', 'SOLO_BANCO']).optional(),
    maxOfertasPorTurno: z.number().optional(),
    robberHandLimit: z.number().optional(),
    turnoSegundos: z.number().optional(),
    /** Jugadores que el anfitrión eligió admitir (sin él, el máximo del juego o del mapa). */
    maxJugadores: z.number().optional(),
  }),
});
export type SalaPublica = z.infer<typeof esquemaSalaPublica>;
export type OpcionesDeSala = SalaPublica['opciones'];

/** Lo que el servidor propone para una sala de cierto número de jugadores. */
export const esquemaRecomendado = z.object({
  puntosVictoria: z.number(),
  turnoSegundos: z.number(),
  robberHandLimit: z.number(),
  turnRuleMode: z.enum(['A', 'B']),
  modoDados: z.enum(['AZAR', 'EQUILIBRADO', 'BARAJA', 'SIN_RACHAS']),
});
export type Recomendado = z.infer<typeof esquemaRecomendado>;

/** Un mapa del catálogo: su tamaño, sus rangos de jugadores y su forma para la vista previa. */
export const esquemaInfoDeMapa = z.object({
  id: z.string(),
  nombre: z.string(),
  descripcion: z.string(),
  casillas: z.number(),
  vertices: z.number(),
  maximoTecnico: z.number(),
  maximoRecomendado: z.number(),
  minimoRecomendado: z.number(),
  /** Una pareja `[q, r]` por casilla. */
  forma: z.array(z.tuple([z.number(), z.number()])),
});
export type InfoDeMapa = z.infer<typeof esquemaInfoDeMapa>;

/** Una fila de la lista de salas abiertas. */
export const esquemaSalaAbierta = z.object({
  id: z.string(),
  anfitrion: z.string(),
  jugadores: z.number(),
  maximo: z.number(),
});
export type SalaAbierta = z.infer<typeof esquemaSalaAbierta>;
