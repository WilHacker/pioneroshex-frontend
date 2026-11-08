/** Qué significa cada ajuste de la sala, explicado para quien nunca ha jugado. */
export const AYUDAS = {
  puntosVictoria:
    'Los puntos de victoria que hay que juntar para ganar. Cada poblado vale 1, cada ciudad 2, y también cuentan algunas cartas y premios. Con más jugadores conviene subirlos: la partida dura más y hay más competencia por cada sitio.',
  dados:
    '«Azar»: cada tirada es independiente, como dados reales (puede haber rachas raras). «Parejo»: cada 36 tiradas salen todas las combinaciones exactamente una vez, así que ningún número se atrasa ni se repite de más. «Baraja»: como sacar cartas de una baraja de 36 sin devolverlas, y se rebaraja antes de acabarla para que no se pueda contar lo que falta. «Sin rachas»: azar, pero el mismo total nunca sale tres veces seguidas.',
  descarte:
    'Cuando sale un 7, quien tenga más cartas que este número tiene que descartar la mitad. Un número alto deja guardar más recursos; uno bajo obliga a gastar rápido.',
  turnoSegundos:
    'Los segundos que tiene cada jugador para actuar. Si se acaban, el juego juega por él para que los demás no esperen. «∞» significa sin límite. Con muchos jugadores conviene un tiempo corto.',
  turnos:
    '«A»: un turno tras otro. «B»: entre un turno y el siguiente, los demás pueden construir y comprar (construcción especial). Solo está disponible desde 5 jugadores, para que nadie espere demasiado.',
  ordenDeTurno:
    '«Aleatorio»: se baraja y listo. «Por dados»: como en el Monopoly, cada jugador tira dos dados, el más alto juega primero y el orden baja; si hay empate, repiten solo los empatados. «Por llegada»: se juega en el orden en que entraron a la sala, empezando por el anfitrión.',
  modoComercio:
    '«Libre»: ofertas abiertas o dirigidas, que ven todos. «Privado»: cada oferta va dirigida a un jugador y solo la ven los dos (ni el registro la cuenta al resto). «Solo banco»: no hay tratos entre jugadores, solo se cambia con el banco. Las cartas de desarrollo (como el monopolio) siguen funcionando igual.',
  ofertasPorTurno:
    'Cuántas ofertas puede proponer quien tiene el turno. «∞» es sin límite. Cancelar una oferta no devuelve el intento, y las contraofertas de los demás no cuentan. Cambiar con el banco nunca cuenta.',
  sala: '«Privada»: solo entra quien tenga el código o el enlace. «Pública»: aparece en la lista de salas abiertas y cualquiera puede unirse.',
  jugadores:
    'Cuántas personas podrán entrar a la sala. Con este número se proponen puntos, tiempo y turnos equilibrados, y solo se pueden elegir mapas en los que caben. Se puede empezar con menos si no llegan todos.',
  mapa: 'La forma del tablero. «Automático» usa el hexágono que corresponde al número de jugadores. Cada mapa indica para cuántos jugadores va mejor; los que no caben aparecen bloqueados.',
} as const;
