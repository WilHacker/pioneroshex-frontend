import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mapasDePrueba } from '@/lib/pruebas';
import { listarMapas, verRecomendado } from '@/lib/salas';
import { CrearSala } from './CrearSala';

vi.mock('@/lib/salas');

const para = (n: number) => ({
  puntosVictoria: n <= 4 ? 10 : n <= 8 ? 14 : 18,
  turnoSegundos: n <= 4 ? 90 : n <= 8 ? 60 : 30,
  robberHandLimit: n >= 7 ? 9 : 7,
  turnRuleMode: n >= 5 ? ('B' as const) : ('A' as const),
  modoDados: n > 4 ? ('EQUILIBRADO' as const) : ('AZAR' as const),
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(verRecomendado).mockImplementation(async (n) => para(n));
  vi.mocked(listarMapas).mockResolvedValue(mapasDePrueba);
});

function dibujar(cambios: { deshabilitado?: boolean } = {}) {
  const onCrear = vi.fn();
  render(<CrearSala deshabilitado={false} onCrear={onCrear} {...cambios} />);
  return { onCrear, usuario: userEvent.setup() };
}

/** Espera a que lo recomendado para `n` jugadores esté a la vista. */
const recomendadoPara = (n: number) =>
  waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(`Recomendado para ${n} jugadores`),
  );

const pulsado = (nombre: string | RegExp) =>
  screen.getByRole('button', { name: nombre }).getAttribute('aria-pressed') === 'true';

const jugadores = (n: number) =>
  screen.getByRole('group', { name: 'Jugadores' }).querySelector(`button[data-n="${n}"]`)!;

describe('CrearSala', () => {
  it('pregunta primero cuántos jugadores y propone 4 con lo recomendado para 4', async () => {
    dibujar();

    expect(jugadores(4)).toHaveAttribute('aria-pressed', 'true');
    await recomendadoPara(4);
    expect(verRecomendado).toHaveBeenCalledWith(4, expect.anything());
    expect(pulsado('10')).toBe(true);
    expect(pulsado('1:30')).toBe(true);
  });

  it('ofrece de 2 a 12 jugadores', () => {
    dibujar();
    const botones = screen
      .getByRole('group', { name: 'Jugadores' })
      .querySelectorAll('button[data-n]');
    expect(botones).toHaveLength(11);
  });

  it('al subir a 12 jugadores sube los puntos, acorta el tiempo y activa el modo B', async () => {
    const { usuario } = dibujar();
    await usuario.click(jugadores(12));

    await recomendadoPara(12);
    expect(pulsado('18')).toBe(true);
    expect(pulsado('30 s')).toBe(true);
    expect(pulsado('B')).toBe(true);
    expect(pulsado('Parejo')).toBe(true);
  });

  it('lo que el anfitrión cambia a mano se conserva al cambiar el número de jugadores', async () => {
    const { usuario } = dibujar();
    await recomendadoPara(4);

    await usuario.click(screen.getByRole('button', { name: '12' }));
    await usuario.click(jugadores(8));

    await recomendadoPara(8);
    expect(pulsado('12')).toBe(true); // lo suyo
    expect(pulsado('14')).toBe(false); // no lo recomendado
    expect(pulsado('1 min')).toBe(true); // lo que no tocó sí sigue la recomendación
  });

  it('«Volver a lo recomendado» descarta sus cambios', async () => {
    const { usuario } = dibujar();
    await recomendadoPara(4);
    await usuario.click(screen.getByRole('button', { name: '12' }));

    await usuario.click(screen.getByRole('button', { name: 'Volver a lo recomendado' }));

    expect(pulsado('10')).toBe(true);
    expect(pulsado('12')).toBe(false);
  });

  it('crea la sala con el tope y todas las reglas en una sola llamada', async () => {
    const { usuario, onCrear } = dibujar();
    await usuario.click(jugadores(6));
    await recomendadoPara(6);

    await usuario.click(screen.getByRole('button', { name: 'Crear sala' }));

    expect(onCrear).toHaveBeenCalledTimes(1);
    expect(onCrear).toHaveBeenCalledWith(false, {
      maxJugadores: 6,
      puntosVictoria: 14,
      turnoSegundos: 60,
      robberHandLimit: 7,
      turnRuleMode: 'B',
      modoDados: 'EQUILIBRADO',
    });
  });

  it('la sala pública y el mapa elegido viajan con ella', async () => {
    const { usuario, onCrear } = dibujar();
    await recomendadoPara(4);
    await usuario.click(screen.getByRole('button', { name: 'Pública' }));
    await usuario.click(await screen.findByRole('button', { name: /Grande/ }));

    await usuario.click(screen.getByRole('button', { name: 'Crear sala' }));

    expect(onCrear).toHaveBeenCalledWith(true, expect.objectContaining({ mapa: 'grande' }));
  });

  it('si al subir los jugadores el mapa elegido ya no cabe, vuelve al automático', async () => {
    const { usuario, onCrear } = dibujar();
    await recomendadoPara(4);
    await usuario.click(await screen.findByRole('button', { name: /Clásico/ }));
    expect(pulsado(/Clásico/)).toBe(true);

    await usuario.click(jugadores(10)); // el clásico admite 7 como mucho

    expect(pulsado(/Automático/)).toBe(true);
    await usuario.click(screen.getByRole('button', { name: 'Crear sala' }));
    expect(onCrear.mock.calls[0]![1]).not.toHaveProperty('mapa');
  });

  it('si no hay respuesta con lo recomendado avisa y deja crear con valores normales', async () => {
    vi.mocked(verRecomendado).mockRejectedValue(new Error('sin conexión'));
    const { usuario, onCrear } = dibujar();

    expect(await screen.findByText(/No se pudo cargar lo recomendado/)).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Crear sala' }));

    expect(onCrear).toHaveBeenCalledWith(false, expect.objectContaining({ maxJugadores: 4 }));
  });

  it('no deja crear si está ocupada o falta el nombre (deshabilitado)', () => {
    dibujar({ deshabilitado: true });
    expect(screen.getByRole('button', { name: 'Crear sala' })).toBeDisabled();
  });

  it('el modo B no se puede elegir con menos de 5 jugadores', async () => {
    dibujar();
    await recomendadoPara(4);
    expect(screen.getByRole('button', { name: 'B' })).toBeDisabled();
  });

  it('«Jugadores» tiene su icono de información', async () => {
    const { usuario } = dibujar();
    await usuario.click(screen.getByRole('button', { name: 'Qué significa «Jugadores»' }));
    expect(screen.getByRole('note')).toHaveTextContent(/mapa/i);
  });

  it('no deja crear hasta que llega lo recomendado, para no mandar una sala sin ajustar', async () => {
    let llegar: (r: ReturnType<typeof para>) => void = () => undefined;
    vi.mocked(verRecomendado).mockReturnValue(new Promise((resolver) => (llegar = resolver)));
    dibujar();

    expect(screen.getByRole('button', { name: 'Crear sala' })).toBeDisabled();
    llegar(para(4));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Crear sala' })).toBeEnabled());
  });

  it('las reglas especiales que se activan viajan con la sala', async () => {
    const { usuario, onCrear } = dibujar();
    await recomendadoPara(4);
    await usuario.click(screen.getByRole('button', { name: /Ladrón amistoso/ }));
    await usuario.click(screen.getByRole('button', { name: 'Crear sala' }));
    expect(onCrear).toHaveBeenCalledWith(false, expect.objectContaining({ ladronAmistoso: true }));
  });
});
