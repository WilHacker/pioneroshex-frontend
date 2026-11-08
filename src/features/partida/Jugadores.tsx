'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { IconoEstrella } from '@/components/arte/IconosEstado';
import { IconoRecurso } from '@/components/arte/IconoRecurso';
import { colorDeJugador } from '@/lib/colores';
import { RECURSOS, type JugadorVista, type Presencia, type Vista } from '@/lib/esquemas';
import { NOMBRE_RECURSO } from '@/lib/mensajes';
import { estadoDePresencia, ETIQUETA_DE_PRESENCIA, type EstadoDePresencia } from './presencia';

type Props = {
  vista: Vista;
  nombreDe: (jugadorId: string) => string;
  indiceDe: (jugadorId: string) => number;
  /** Quién está conectado; sin ella no se marca a nadie. */
  presencia?: Presencia | null;
};

/** Una fila ocupa más cuando es la tuya: el avatar, las cartas y los iconos crecen. */
type Escala = 'normal' | 'grande';

const MEDIDAS = {
  normal: { avatar: 'size-11 text-xl', carta: [30, 42], icono: 30, nombre: 'text-sm' },
  grande: { avatar: 'size-16 text-3xl', carta: [38, 53], icono: 38, nombre: 'text-lg' },
} as const;

/** Número encima de otro elemento, en la esquina de arriba a la derecha. */
function Insignia({ valor }: { valor: number }) {
  return (
    <span className="absolute -top-1.5 -right-1.5 z-10 flex min-w-5 items-center justify-center rounded-full bg-[#2d6bd0] px-1 text-[0.7rem] leading-5 font-extrabold text-white ring-2 ring-white">
      {valor}
    </span>
  );
}

type ReversoProps = { src: string; cantidad: number; titulo: string; escala: Escala };

/** El reverso de una carta con cuántas tiene: se ve la cantidad, no el contenido (es secreto). */
function Reverso({ src, cantidad, titulo, escala }: ReversoProps) {
  const [ancho, alto] = MEDIDAS[escala].carta;
  return (
    <span className="relative shrink-0" title={titulo}>
      <Image src={src} alt="" width={ancho} height={alto} unoptimized className="drop-shadow" />
      <Insignia valor={cantidad} />
      <span className="sr-only">{titulo}</span>
    </span>
  );
}

type ContadorProps = {
  imagen: string;
  valor: number;
  titulo: string;
  escala: Escala;
  /** Quien tiene la carta especial: el icono se resalta y la lleva escrita para lectores de pantalla. */
  especial?: { nombre: string; titulo: string };
};

/** Un icono con su cuenta debajo (caballeros jugados, caminos construidos). */
function Contador({ imagen, valor, titulo, escala, especial }: ContadorProps) {
  const lado = MEDIDAS[escala].icono;
  return (
    <span className="relative flex shrink-0 flex-col items-center" title={titulo}>
      <span
        className={`flex items-center justify-center rounded-full ${especial ? 'bg-azafran ring-2 ring-azafran-claro' : ''}`}
      >
        <Image
          src={imagen}
          alt=""
          width={lado}
          height={lado}
          unoptimized
          className="object-contain"
        />
      </span>
      {especial && (
        <span
          title={especial.titulo}
          className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-tinta ring-1 ring-white"
        >
          <IconoEstrella tamano={11} etiqueta={especial.nombre} />
        </span>
      )}
      <span className="text-sm leading-none font-extrabold">{valor}</span>
      <span className="sr-only">{titulo}</span>
    </span>
  );
}

type AvatarProps = { nombre: string; color: string; escala: Escala; enTurno: boolean };

/** El círculo del jugador con su inicial; un aro azafrán marca de quién es el turno. */
function Avatar({ nombre, color, escala, enTurno }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-extrabold text-white ring-4 ${MEDIDAS[escala].avatar} ${enTurno ? 'ring-azafran' : 'ring-white'}`}
      style={{ backgroundColor: color }}
    >
      {nombre.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Los puntos de victoria en una cinta blanca debajo del avatar. */
function Cinta({ valor }: { valor: number }) {
  return (
    <span
      className="relative z-10 -mt-2 flex items-center gap-0.5 rounded-md bg-white px-2.5 text-sm leading-5 font-extrabold text-tinta shadow ring-1 ring-black/40"
      title="Puntos de victoria"
    >
      <IconoEstrella tamano={13} />
      {valor}
      <span className="sr-only">puntos</span>
    </span>
  );
}

/** «Turno»: color y palabra juntos, para que el color no sea la única señal. */
function EtiquetaTurno() {
  return (
    <span className="absolute -top-2.5 right-3 z-20 flex items-center gap-1 rounded-full bg-azafran px-2 py-0.5 text-xs font-extrabold text-tinta shadow ring-2 ring-[#101c28]">
      <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-tinta" />
      Turno
    </span>
  );
}

/** Las cartas de recursos de un rival cuando la sala las deja a la vista (regla «cartas a la vista»). */
function ManoVisible({ recursos }: { recursos: NonNullable<JugadorVista['recursos']> }) {
  const conCartas = RECURSOS.filter((r) => recursos[r] > 0);
  // Un grupo de imágenes, no una lista: dentro de la lista de rivales no debe haber más elementos de lista.
  return (
    <fieldset
      aria-label="Cartas en mano"
      className="m-0 mt-0.5 flex max-w-[4.5rem] min-w-0 flex-wrap justify-center gap-x-1 border-0 p-0"
    >
      {conCartas.length === 0 && (
        <span className="text-[0.65rem] font-bold text-tinta/70">sin cartas</span>
      )}
      {conCartas.map((r) => (
        <span
          key={r}
          title={`${recursos[r]} de ${NOMBRE_RECURSO[r]}`}
          className="flex items-center text-[0.7rem] font-extrabold"
        >
          <span aria-hidden="true" className="flex items-center">
            <IconoRecurso recurso={r} tamano={14} />
            {recursos[r]}
          </span>
          <span className="sr-only">
            {recursos[r]} de {NOMBRE_RECURSO[r]}
          </span>
        </span>
      ))}
    </fieldset>
  );
}

/** «Desconectado» o «Piloto automático»: la palabra va siempre, el color solo acompaña. */
function EtiquetaDePresencia({ estado }: { estado: EstadoDePresencia }) {
  const { texto, ayuda } = ETIQUETA_DE_PRESENCIA[estado];
  return (
    <span
      title={ayuda}
      className={`mt-0.5 rounded-full px-1.5 text-[0.65rem] leading-4 font-extrabold ${estado === 'piloto' ? 'bg-azafran text-tinta' : 'bg-tinta/80 text-white'}`}
    >
      {texto}
    </span>
  );
}

type FilaProps = {
  jugador: JugadorVista;
  vista: Vista;
  nombre: string;
  color: string;
  caminos: number;
  enTurno: boolean;
  escala: Escala;
  /** Solo para la fila propia: el «(tú)» junto al nombre. */
  soyYo?: boolean;
  /** Si el jugador está desconectado o en piloto automático (`null`: conectado o no se sabe). */
  presencia?: EstadoDePresencia | null;
};

/** Todo lo de un jugador en una fila: quién es, sus cartas ocultas, su ejército y sus caminos. */
function Fila({
  jugador,
  vista,
  nombre,
  color,
  caminos,
  enTurno,
  escala,
  soyYo = false,
  presencia = null,
}: FilaProps) {
  const { nombre: tamanoNombre } = MEDIDAS[escala];
  const Raiz = soyYo ? 'article' : 'li';
  return (
    <Raiz
      data-jugador-id={jugador.id}
      data-en-turno={enTurno ? 'true' : undefined}
      data-apagado={enTurno ? undefined : 'true'}
      data-presencia={presencia ?? undefined}
      aria-current={enTurno ? 'true' : undefined}
      className={`relative flex items-center gap-2 rounded-xl border-[3px] border-[#101c28] px-2 py-2 text-tinta shadow-md ${enTurno ? 'bg-[#fff1c9] ring-2 ring-azafran' : 'bg-[#c3c7cb] opacity-90'}`}
    >
      {enTurno && <EtiquetaTurno />}
      <div className="flex w-[4.5rem] shrink-0 flex-col items-center">
        <p className={`max-w-full truncate leading-tight font-extrabold ${tamanoNombre}`}>
          {nombre}
          {soyYo && <span className="font-medium text-tinta-suave"> (tú)</span>}
          {enTurno && <span className="sr-only"> · en turno</span>}
        </p>
        <Avatar nombre={nombre} color={color} escala={escala} enTurno={enTurno} />
        <Cinta valor={jugador.puntos} />
        {presencia && <EtiquetaDePresencia estado={presencia} />}
        {!soyYo && jugador.recursos !== null && <ManoVisible recursos={jugador.recursos} />}
      </div>
      <Reverso
        src="/cartas/reverso-recursos.svg"
        cantidad={jugador.totalCartas}
        titulo="cartas en mano"
        escala={escala}
      />
      <Reverso
        src="/cartas/reverso-desarrollo.svg"
        cantidad={jugador.totalCartasDesarrollo}
        titulo="cartas de desarrollo"
        escala={escala}
      />
      <div className="ml-auto flex items-start gap-2.5">
        <Contador
          imagen="/insignias/gran-ejercito.svg"
          valor={jugador.caballerosJugados}
          titulo="caballeros jugados"
          escala={escala}
          {...(vista.granEjercito === jugador.id && {
            especial: { nombre: 'Gran ejército', titulo: 'Gran ejército' },
          })}
        />
        <Contador
          imagen="/insignias/gran-ruta.svg"
          valor={caminos}
          titulo="caminos construidos"
          escala={escala}
          {...(vista.granRuta === jugador.id && {
            especial: {
              nombre: 'Gran ruta',
              titulo: `Gran ruta: ${vista.longitudGranRuta} ${vista.longitudGranRuta === 1 ? 'camino' : 'caminos'}`,
            },
          })}
        />
      </div>
      {soyYo && enTurno && <span className="sr-only">tu turno</span>}
    </Raiz>
  );
}

/**
 * Quién juega: los rivales en una lista con scroll, en orden de turno, y tú abajo del todo, más
 * grande. Quien no tiene el turno se ve apagado y el del turno se ilumina con la palabra «Turno».
 */
export function Jugadores({ vista, nombreDe, indiceDe, presencia = null }: Props) {
  const turno = vista.fase === 'CONSTRUCCION_ESPECIAL' ? vista.turnoEspecialDe : vista.turnoDe;
  const mio = vista.jugadores.find((j) => j.id === vista.yo);
  const rivales = vista.jugadores.filter((j) => j.id !== vista.yo);
  const zona = useRef<HTMLElement>(null);
  const caminosDe = (id: string): number =>
    Object.values(vista.caminos).filter((dueno) => dueno === id).length;

  // Con muchos jugadores la lista tiene scroll: al cambiar el turno se centra a quien juega.
  useEffect(() => {
    const lista = zona.current;
    if (!lista || typeof lista.scrollTo !== 'function') return;
    if (turno === null) return;
    const fila = [...lista.querySelectorAll<HTMLElement>('[data-jugador-id]')].find(
      (el) => el.dataset.jugadorId === turno,
    );
    if (!fila) return;
    lista.scrollTo({
      top: fila.offsetTop - (lista.clientHeight - fila.offsetHeight) / 2,
      behavior: 'smooth',
    });
  }, [turno]);

  return (
    <section aria-label="Jugadores" className="flex flex-col gap-2 lg:min-h-0 lg:flex-1">
      <section
        ref={zona}
        aria-label="Lista de rivales"
        // Una zona con scroll debe poder recorrerse con el teclado.
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className="relative max-h-[34vh] overflow-y-auto overscroll-contain px-1 pt-3 pb-1 outline-none focus-visible:ring-2 focus-visible:ring-azafran lg:max-h-none lg:min-h-0 lg:flex-1"
      >
        <ul className="flex flex-col gap-3">
          {rivales.map((j) => (
            <Fila
              key={j.id}
              jugador={j}
              vista={vista}
              nombre={nombreDe(j.id)}
              color={colorDeJugador(indiceDe(j.id))}
              caminos={caminosDe(j.id)}
              enTurno={j.id === turno}
              escala="normal"
              presencia={estadoDePresencia(presencia, j.id, vista.yo)}
            />
          ))}
        </ul>
      </section>

      {mio && (
        <Fila
          jugador={mio}
          vista={vista}
          nombre={nombreDe(mio.id)}
          color={colorDeJugador(indiceDe(mio.id))}
          caminos={caminosDe(mio.id)}
          enTurno={mio.id === turno}
          escala="grande"
          soyYo
        />
      )}
    </section>
  );
}
