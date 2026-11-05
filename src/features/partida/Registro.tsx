import type { EventoJuego } from '@/lib/esquemas';
import { describirEvento } from '@/lib/mensajes';

type Props = {
  eventos: readonly EventoJuego[];
  nombreDe: (jugadorId: string) => string;
};

const LINEAS_MAX = 14;

/** Lo último que pasó, lo más nuevo arriba. Los eventos sin interés para el jugador no salen. */
export function Registro({ eventos, nombreDe }: Props) {
  const lineas = eventos
    .map((evento, posicion) => ({ posicion, texto: describirEvento(evento, nombreDe) }))
    .filter((l): l is { posicion: number; texto: string } => l.texto !== null)
    .slice(-LINEAS_MAX)
    .reverse();

  return (
    <section
      aria-labelledby="titulo-registro"
      className="rounded-lg border border-zinc-300 p-3 dark:border-zinc-700"
    >
      <h2 id="titulo-registro" className="mb-2 text-sm font-semibold tracking-wide uppercase">
        Registro
      </h2>
      {lineas.length === 0 ? (
        <p className="text-sm text-zinc-500">Aún no ha pasado nada.</p>
      ) : (
        <ol className="flex flex-col gap-0.5 text-sm">
          {lineas.map((linea, i) => (
            <li key={linea.posicion} className={i === 0 ? 'font-semibold' : 'text-zinc-500'}>
              {linea.texto}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
