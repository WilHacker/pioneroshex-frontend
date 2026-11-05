import { conectar, type Manejadores } from './conexion';
import { inicioDePrueba, vistaDePrueba } from './pruebas';

type Escucha = (...args: unknown[]) => void;

const { socketFalso, io } = vi.hoisted(() => {
  const escuchas = new Map<string, Escucha>();
  const socket = {
    escuchas,
    on: vi.fn((evento: string, f: Escucha) => {
      escuchas.set(evento, f);
    }),
    disconnect: vi.fn(),
    emitWithAck: vi.fn(),
    timeout: vi.fn(),
  };
  socket.timeout.mockReturnValue(socket);
  return { socketFalso: socket, io: vi.fn(() => socket) };
});
vi.mock('socket.io-client', () => ({ io }));

function manejadores(): Manejadores {
  return { alInicio: vi.fn(), alNotificar: vi.fn(), alRechazar: vi.fn(), alCambiarEstado: vi.fn() };
}
const emitir = (evento: string, ...args: unknown[]): void =>
  socketFalso.escuchas.get(evento)?.(...args);

beforeEach(() => {
  socketFalso.escuchas.clear();
  vi.clearAllMocks();
  socketFalso.timeout.mockReturnValue(socketFalso);
});

describe('conectar', () => {
  it('se conecta al backend con la sala y el token, solo por websocket', () => {
    const m = manejadores();
    conectar({ salaId: 'abcd1234', token: 'tok' }, m);
    expect(io).toHaveBeenCalledWith('http://localhost:3001', {
      auth: { salaId: 'abcd1234', token: 'tok' },
      transports: ['websocket'],
    });
    expect(m.alCambiarEstado).toHaveBeenCalledWith('conectando');
  });

  it('traduce connect y disconnect a estados de conexión', () => {
    const m = manejadores();
    conectar({ salaId: 's', token: 't' }, m);
    emitir('connect');
    emitir('disconnect', 'transport close');
    emitir('disconnect', 'io client disconnect');
    expect(vi.mocked(m.alCambiarEstado).mock.calls.map(([e]) => e)).toEqual([
      'conectando',
      'conectado',
      'reconectando',
      'cerrado',
    ]);
  });

  it('entrega el inicio y las notificaciones válidas', () => {
    const m = manejadores();
    conectar({ salaId: 's', token: 't' }, m);
    const inicio = inicioDePrueba();
    emitir('juego:inicio', inicio);
    expect(m.alInicio).toHaveBeenCalledWith(inicio);
    const notificacion = {
      vista: vistaDePrueba(),
      eventos: [{ tipo: 'TURNO_TERMINADO' }],
      acciones: [],
    };
    emitir('juego:notificacion', notificacion);
    expect(m.alNotificar).toHaveBeenCalledWith(notificacion);
  });

  it('lo que llega con otra forma se avisa como rechazo y no se entrega', () => {
    const m = manejadores();
    conectar({ salaId: 's', token: 't' }, m);
    emitir('juego:inicio', { basura: true });
    emitir('juego:notificacion', 42);
    expect(m.alInicio).not.toHaveBeenCalled();
    expect(m.alNotificar).not.toHaveBeenCalled();
    expect(m.alRechazar).toHaveBeenCalledTimes(2);
    expect(m.alRechazar).toHaveBeenCalledWith('RESPUESTA_INVALIDA');
  });

  it('un juego:error del servidor llega como motivo, con respaldo si viene mal formado', () => {
    const m = manejadores();
    conectar({ salaId: 's', token: 't' }, m);
    emitir('juego:error', { motivo: 'PARTIDA_NO_EMPEZADA' });
    emitir('juego:error', null);
    expect(vi.mocked(m.alRechazar).mock.calls.map(([x]) => x)).toEqual([
      'PARTIDA_NO_EMPEZADA',
      'NO_AUTORIZADO',
    ]);
  });
});

describe('enviar y cerrar', () => {
  it('manda la acción con un tiempo máximo y devuelve el acuse validado', async () => {
    socketFalso.emitWithAck.mockResolvedValue({ ok: true });
    const conexion = conectar({ salaId: 's', token: 't' }, manejadores());
    await expect(conexion.enviar({ tipo: 'TIRAR_DADOS' })).resolves.toEqual({ ok: true });
    expect(socketFalso.timeout).toHaveBeenCalledWith(5000);
    expect(socketFalso.emitWithAck).toHaveBeenCalledWith('juego:accion', { tipo: 'TIRAR_DADOS' });
  });

  it('devuelve el rechazo del servidor tal cual', async () => {
    socketFalso.emitWithAck.mockResolvedValue({ ok: false, motivo: 'NO_ES_TU_TURNO' });
    const conexion = conectar({ salaId: 's', token: 't' }, manejadores());
    await expect(conexion.enviar({})).resolves.toEqual({ ok: false, motivo: 'NO_ES_TU_TURNO' });
  });

  it('un acuse con otra forma o sin respuesta a tiempo se vuelve un rechazo local', async () => {
    const conexion = conectar({ salaId: 's', token: 't' }, manejadores());
    socketFalso.emitWithAck.mockResolvedValueOnce('raro');
    await expect(conexion.enviar({})).resolves.toEqual({ ok: false, motivo: 'RESPUESTA_INVALIDA' });
    socketFalso.emitWithAck.mockRejectedValueOnce(new Error('timeout'));
    await expect(conexion.enviar({})).resolves.toEqual({ ok: false, motivo: 'SIN_RESPUESTA' });
  });

  it('cerrar desconecta el socket', () => {
    conectar({ salaId: 's', token: 't' }, manejadores()).cerrar();
    expect(socketFalso.disconnect).toHaveBeenCalled();
  });
});
