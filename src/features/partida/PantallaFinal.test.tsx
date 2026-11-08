import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vistaDePrueba } from '@/lib/pruebas';
import { pedirRevancha } from '@/lib/salas';
import { guardarCredencial } from '@/lib/sesion';
import { PantallaFinal } from './PantallaFinal';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/lib/salas');
vi.mock('@/lib/sesion');

const credencial = { salaId: 'viejo1234', jugadorId: 'j2', token: 'tok-beto' };
const nueva = { salaId: 'nuevo5678', jugadorId: 'j1', token: 'tok-nuevo' };
const nombres: Record<string, string> = { j1: 'Ana', j2: 'Beto', j3: 'Cleo' };
const nombreDe = (id: string): string => nombres[id] ?? id;

/** La vista final de una partida a tres: Beto gana con 10, Ana 7 y Cleo 7. */
function final() {
  const base = vistaDePrueba({ fase: 'FIN', turnoDe: null, ganador: 'j2' });
  const puntos: Record<string, number> = { j1: 7, j2: 10, j3: 7 };
  const jugadores = ['j1', 'j2', 'j3'].map((id) => {
    const original = base.jugadores.find((j) => j.id === id) ?? base.jugadores[0]!;
    return { ...original, id, puntos: puntos[id]! };
  });
  return { ...base, jugadores };
}

beforeEach(() => vi.resetAllMocks());

describe('PantallaFinal', () => {
  it('anuncia al ganador y clasifica de más a menos puntos, con empates en orden de turno', () => {
    render(<PantallaFinal vista={final()} credencial={credencial} nombreDe={nombreDe} />);

    expect(screen.getByText('¡Ganó Beto!')).toBeInTheDocument();
    const filas = within(screen.getByRole('list', { name: 'Clasificación' })).getAllByRole(
      'listitem',
    );
    expect(filas.map((f) => f.textContent)).toEqual([
      expect.stringContaining('Beto10 puntos'),
      expect.stringContaining('Ana7 puntos'),
      expect.stringContaining('Cleo7 puntos'),
    ]);
  });

  it('un solo punto va en singular', () => {
    const vista = final();
    render(
      <PantallaFinal
        vista={{ ...vista, jugadores: vista.jugadores.map((j) => ({ ...j, puntos: 1 })) }}
        credencial={credencial}
        nombreDe={nombreDe}
      />,
    );
    expect(screen.getAllByText('1 punto')).toHaveLength(3);
  });

  it('ofrece volver al inicio', () => {
    render(<PantallaFinal vista={final()} credencial={credencial} nombreDe={nombreDe} />);
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
  });

  it('«Revancha» pide la sala con mi token, guarda la credencial nueva y va a ella', async () => {
    vi.mocked(pedirRevancha).mockResolvedValue(nueva);
    render(<PantallaFinal vista={final()} credencial={credencial} nombreDe={nombreDe} />);

    await userEvent.click(screen.getByRole('button', { name: 'Revancha' }));

    expect(pedirRevancha).toHaveBeenCalledWith('viejo1234', 'tok-beto');
    expect(guardarCredencial).toHaveBeenCalledWith(nueva);
    expect(push).toHaveBeenCalledWith('/sala/nuevo5678');
  });

  it('si el servidor la rechaza, lo dice y se puede reintentar', async () => {
    vi.mocked(pedirRevancha).mockRejectedValue(new Error('La partida ya empezó'));
    render(<PantallaFinal vista={final()} credencial={credencial} nombreDe={nombreDe} />);

    await userEvent.click(screen.getByRole('button', { name: 'Revancha' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La partida ya empezó');
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Revancha' })).toBeEnabled();
  });

  it('mientras espera la respuesta no deja pedirla otra vez', async () => {
    let responder: (c: typeof nueva) => void = () => undefined;
    vi.mocked(pedirRevancha).mockReturnValue(new Promise((r) => (responder = r)));
    render(<PantallaFinal vista={final()} credencial={credencial} nombreDe={nombreDe} />);

    await userEvent.click(screen.getByRole('button', { name: 'Revancha' }));
    expect(screen.getByRole('button', { name: 'Revancha' })).toBeDisabled();
    responder(nueva);
  });
});
