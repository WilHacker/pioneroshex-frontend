import type { EventoJuego, Recurso } from './esquemas';

export const NOMBRE_RECURSO: Record<Recurso, string> = {
  MADERA: 'madera',
  LADRILLO: 'ladrillo',
  OVEJA: 'oveja',
  TRIGO: 'trigo',
  MINERAL: 'mineral',
};

const MOTIVOS: Record<string, string> = {
  PARTIDA_TERMINADA: 'La partida ya terminó',
  NO_ES_TU_TURNO: 'No es tu turno',
  FASE_INCORRECTA: 'Eso no se puede hacer en esta fase',
  SIN_PIEZAS: 'Ya no te quedan piezas de ese tipo',
  RECURSOS_INSUFICIENTES: 'No tienes recursos suficientes',
  NO_DEBES_DESCARTAR: 'No tienes que descartar',
  CANTIDAD_DESCARTE_INCORRECTA: 'Debes descartar exactamente la cantidad indicada',
  DESTINO_INVALIDO: 'Ese destino no es válido',
  MISMO_DESTINO: 'El ladrón ya está ahí: elige otra casilla',
  VICTIMA_INVALIDA: 'No puedes robar a ese jugador',
  VICTIMA_REQUERIDA: 'Elige a quién robar',
  SIN_VICTIMA_POSIBLE: 'No hay a quién robar en esa casilla',
  BANCO_AGOTADO: 'El banco no tiene suficiente de ese recurso',
  MISMO_RECURSO: 'Elige recursos distintos',
  VERTICE_OCUPADO: 'Ya hay un edificio ahí',
  ARISTA_OCUPADA: 'Ya hay un camino ahí',
  DEMASIADO_CERCA: 'Está demasiado cerca de otro poblado (regla de distancia)',
  SIN_CONEXION: 'Tiene que conectar con tus caminos',
  CAMINO_CORTADO: 'Un edificio rival corta ese camino',
  CAMINO_NO_ADYACENTE: 'El camino inicial debe tocar tu poblado recién puesto',
  NO_ES_TU_POBLADO: 'Solo puedes mejorar tus propios poblados',
  SIN_LUGAR_VALIDO: 'No queda un lugar válido',
  TRATO_INEXISTENTE: 'Ese trato ya no existe',
  NO_ES_TU_TRATO: 'Ese trato no es tuyo',
  DESTINATARIO_INVALIDO: 'Ese jugador no puede recibir el trato',
  OFERTA_VACIA: 'Tienes que ofrecer algo',
  PETICION_VACIA: 'Tienes que pedir algo',
  INTERCAMBIO_SOLAPADO: 'No puedes pedir y ofrecer el mismo recurso',
  TRATO_NO_DIRIGIDO_A_TI: 'Ese trato no es para ti',
  YA_RECHAZADO: 'Ya rechazaste ese trato',
  NO_PUEDES_COMERCIAR: 'No puedes comerciar ahora',
  MAZO_AGOTADO: 'No quedan cartas de desarrollo',
  NO_TIENES_ESA_CARTA: 'No tienes esa carta (o la compraste este turno)',
  CARTA_COMPRADA_ESTE_TURNO: 'No puedes jugar una carta que compraste este turno',
  YA_JUGASTE_CARTA_ESTE_TURNO: 'Solo puedes jugar una carta por turno',
  ARISTAS_INVALIDAS: 'Esos caminos no son válidos',
  ACCION_INVALIDA: 'Esa jugada no tiene un formato válido',
  DEMASIADAS_ACCIONES: 'Vas muy rápido: espera un momento',
  NO_AUTORIZADO: 'No estás autorizado en esta partida',
  PARTIDA_NO_EMPEZADA: 'La partida todavía no ha empezado',
  SIN_RESPUESTA: 'El servidor no respondió: inténtalo de nuevo',
  RESPUESTA_INVALIDA: 'El servidor respondió con un formato inesperado',
  ERROR_INTERNO: 'El servidor tuvo un problema con esa jugada',
};

/** Texto en español para un motivo de rechazo del servidor. */
export function textoDeMotivo(motivo: string): string {
  return MOTIVOS[motivo] ?? `No se pudo hacer esa jugada (${motivo})`;
}

const texto = (valor: unknown): string => (typeof valor === 'string' ? valor : '');
const numero = (valor: unknown): number => (typeof valor === 'number' ? valor : 0);
const recurso = (valor: unknown): string => NOMBRE_RECURSO[valor as Recurso] ?? texto(valor);

function listaDeRecursos(valor: unknown): string {
  if (typeof valor !== 'object' || valor === null) return 'nada';
  const partes = Object.entries(valor)
    .filter(([, cantidad]) => numero(cantidad) > 0)
    .map(([nombre, cantidad]) => `${numero(cantidad)} ${recurso(nombre)}`);
  return partes.length > 0 ? partes.join(', ') : 'nada';
}

const CARTAS: Record<string, string> = {
  CABALLERO: 'un caballero',
  PUNTO_VICTORIA: 'un punto de victoria',
  CONSTRUCCION_CARRETERAS: 'construcción de carreteras',
  ABUNDANCIA: 'abundancia',
  MONOPOLIO: 'monopolio',
};

/** Una frase para el registro de la partida, o `null` si el evento no merece una línea. */
export function describirEvento(e: EventoJuego, nombre: (id: string) => string): string | null {
  const quien = nombre(texto(e.jugador));
  switch (e.tipo) {
    case 'POBLADO_COLOCADO':
      return `${quien} puso un poblado`;
    case 'CIUDAD_COLOCADA':
      return `${quien} mejoró un poblado a ciudad`;
    case 'CAMINO_COLOCADO':
      return `${quien} puso un camino`;
    case 'DADOS_TIRADOS': {
      const dados = Array.isArray(e.dados) ? e.dados.map(numero) : [];
      const total = dados.reduce((suma, d) => suma + d, 0);
      return `${quien} sacó ${dados.join(' + ')} = ${total}`;
    }
    case 'RECURSOS_REPARTIDOS':
      return `${quien} recibe ${numero(e.cantidad)} de ${recurso(e.recurso)}`;
    case 'PRODUCCION_BLOQUEADA':
      return `El banco no alcanza para repartir ${recurso(e.recurso)}`;
    case 'DESCARTE_REQUERIDO':
      return `${quien} debe descartar ${numero(e.cantidad)} cartas`;
    case 'RECURSOS_DESCARTADOS':
      return `${quien} descartó ${listaDeRecursos(e.recursos)}`;
    case 'LADRON_MOVIDO':
      return `${quien} movió el ladrón`;
    case 'CARTA_ROBADA':
      return `${nombre(texto(e.ladron))} robó una carta a ${nombre(texto(e.victima))}`;
    case 'CAMBIO_CON_BANCA_REALIZADO':
      return `${quien} cambió ${numero(e.cantidadEntregada)} de ${recurso(e.entrega)} por 1 de ${recurso(e.recibe)}`;
    case 'TRATO_PROPUESTO':
      return `${nombre(texto((e.trato as { proponente?: unknown } | undefined)?.proponente))} propuso un trato`;
    case 'TRATO_ACEPTADO':
      return `${nombre(texto(e.aceptante))} aceptó el trato de ${nombre(texto(e.proponente))}`;
    case 'TRATO_RECHAZADO':
      return `${quien} rechazó un trato`;
    case 'TRATO_CANCELADO':
      return 'Se canceló un trato';
    case 'CARTA_DESARROLLO_COMPRADA':
      return `${quien} compró una carta de desarrollo`;
    case 'CABALLERO_JUGADO':
      return `${quien} jugó un caballero`;
    case 'CONSTRUCCION_CARRETERAS_JUGADA':
      return `${quien} jugó construcción de carreteras`;
    case 'ABUNDANCIA_JUGADA':
      return `${quien} jugó abundancia`;
    case 'MONOPOLIO_JUGADO':
      return `${quien} jugó monopolio de ${recurso(e.recurso)} y robó ${numero(e.cantidadRobada)}`;
    case 'GRAN_EJERCITO_CAMBIADO':
      return `${nombre(texto(e.nuevoTitular))} tiene el gran ejército`;
    case 'GRAN_RUTA_CAMBIADA':
      return e.nuevoTitular
        ? `${nombre(texto(e.nuevoTitular))} tiene la gran ruta (${numero(e.longitud)})`
        : 'Nadie tiene ya la gran ruta';
    case 'FASE_ESPECIAL_INICIADA':
      return 'Empieza la construcción especial';
    case 'CONSTRUCCION_ESPECIAL_PASADA':
      return `${quien} pasó en la construcción especial`;
    case 'TURNO_TERMINADO':
      return `${quien} terminó su turno`;
    case 'PARTIDA_GANADA':
      return `${quien} ganó la partida con ${numero(e.puntos)} puntos`;
    default:
      return null;
  }
}

export const nombreDeCarta = (carta: string): string => CARTAS[carta] ?? carta;
