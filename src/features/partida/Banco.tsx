'use client';

import Image from 'next/image';
import { useEffect, useId, useState } from 'react';
import { IconoBanco } from '@/components/arte/IconoBanco';
import { RECURSOS, type Recurso, type Vista } from '@/lib/esquemas';
import { NOMBRE_RECURSO } from '@/lib/mensajes';
import { GuiaDeDesarrollo } from './GuiaDeDesarrollo';

type Props = {
  vista: Vista;
};

const CARTA: Record<Recurso, string> = {
  MADERA: '/cartas/madera.svg',
  LADRILLO: '/cartas/ladrillo.svg',
  OVEJA: '/cartas/oveja.svg',
  TRIGO: '/cartas/trigo.svg',
  MINERAL: '/cartas/mineral.svg',
};

/** Con tan pocas cartas en el banco el contador se pone rojo: pronto no alcanzará para repartir. */
const POCAS_CARTAS = 2;

type CartaProps = {
  /** Lo que lee un lector de pantalla: toda la información de la carta. */
  descripcion: string;
  imagen: string;
  cantidad: number;
  /** Se pone rojo y apaga la carta cuando casi no quedan. */
  agotandose?: boolean;
  agotada?: boolean;
  recurso?: Recurso;
  /** Si hay, la carta es un botón que abre o cierra algo (la guía del mazo). */
  boton?: { abierta: boolean; controla: string; alPulsar: () => void };
};

/** Una carta del banco con su contador en la esquina de arriba a la derecha. */
function CartaDelBanco({
  descripcion,
  imagen,
  cantidad,
  agotandose,
  agotada,
  recurso,
  boton,
}: CartaProps) {
  const contenido = (
    <>
      <Image
        src={imagen}
        alt=""
        width={44}
        height={61}
        unoptimized
        className={`h-auto w-full max-w-11 drop-shadow-md ${agotada ? 'opacity-30 grayscale' : ''}`}
      />
      <span
        className={`absolute -top-1.5 -right-0.5 z-10 flex min-w-5 items-center justify-center rounded-full px-1 text-[0.7rem] leading-5 font-extrabold text-white ring-2 ring-white ${agotandose ? 'bg-coral' : 'bg-[#2d6bd0]'}`}
      >
        {cantidad}
      </span>
      {agotada && (
        <span className="absolute top-1/3 rounded bg-black/70 px-1 text-[10px] font-bold text-white uppercase">
          agotado
        </span>
      )}
    </>
  );
  const clases = 'relative flex min-w-0 flex-1 justify-center';

  if (boton) {
    return (
      <li className={clases}>
        <button
          type="button"
          aria-label={descripcion}
          aria-expanded={boton.abierta}
          aria-controls={boton.controla}
          title="Ver qué hace cada carta de desarrollo"
          onClick={boton.alPulsar}
          className="relative flex w-full justify-center rounded-md transition outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-azafran"
        >
          {contenido}
        </button>
      </li>
    );
  }
  return (
    <li
      {...(recurso && { 'data-banco-recurso': recurso })}
      aria-label={descripcion}
      className={clases}
    >
      {contenido}
    </li>
  );
}

/**
 * El banco: su edificio y, en una fila, una carta por recurso y el mazo de desarrollo, cada una con
 * lo que queda. Las cartas de recurso son el punto de salida del reparto animado. Tocar el mazo
 * abre la guía de las cartas de desarrollo.
 */
export function Banco({ vista }: Props) {
  const [guiaAbierta, setGuiaAbierta] = useState(false);
  const idGuia = useId();

  useEffect(() => {
    if (!guiaAbierta) return;
    const alTeclear = (evento: KeyboardEvent): void => {
      if (evento.key === 'Escape') setGuiaAbierta(false);
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [guiaAbierta]);

  return (
    <section
      aria-label="Banco"
      className="relative flex items-center gap-2 rounded-2xl border-[3px] border-[#101c28] bg-[#f5efe0] px-2 py-2.5 text-tinta shadow-lg"
    >
      <IconoBanco tamano={40} />
      <ul className="flex min-w-0 flex-1 gap-1.5">
        {RECURSOS.map((r) => (
          <CartaDelBanco
            key={r}
            recurso={r}
            imagen={CARTA[r]}
            cantidad={vista.banco[r]}
            descripcion={`${vista.banco[r]} de ${NOMBRE_RECURSO[r]} en el banco`}
            agotandose={vista.banco[r] <= POCAS_CARTAS}
            agotada={vista.banco[r] === 0}
          />
        ))}
        <CartaDelBanco
          imagen="/cartas/reverso-desarrollo.svg"
          cantidad={vista.tamanoMazo}
          descripcion={`${vista.tamanoMazo} cartas de desarrollo en el mazo`}
          agotandose={vista.tamanoMazo <= POCAS_CARTAS}
          boton={{
            abierta: guiaAbierta,
            controla: idGuia,
            alPulsar: () => setGuiaAbierta((abierta) => !abierta),
          }}
        />
      </ul>

      {guiaAbierta && (
        <section
          id={idGuia}
          aria-label="Cartas de desarrollo"
          className="absolute top-full right-0 z-30 mt-2 w-[min(26rem,92vw)] rounded-2xl border-[3px] border-[#101c28] bg-[#245f9e] p-3 text-white shadow-2xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-extrabold">Cartas de desarrollo</h3>
            <button
              type="button"
              aria-label="Cerrar la guía"
              onClick={() => setGuiaAbierta(false)}
              className="flex size-8 items-center justify-center rounded-full bg-white/15 text-lg font-extrabold hover:bg-white/30"
            >
              ×
            </button>
          </div>
          <GuiaDeDesarrollo
            jugadores={vista.jugadores.length}
            puntosVictoria={vista.config.puntosVictoria}
          />
        </section>
      )}
    </section>
  );
}
