import { suscribirPortada, suscribirSala, type ManejadoresDeSala } from './lobby';

type Escucha = (...args: unknown[]) => void;

const { socketFalso, io } = vi.hoisted(() => {
  const escuchas = new Map<string, Escucha>();
  const socket = {
    escuchas,
    on: vi.fn((evento: string, f: Escucha) => {
      escuchas.set(evento, f);
    }),
    disconnect: vi.fn(),
  };
  return { socketFalso: socket, io: vi.fn(() => socket) };
});
vi.mock('socket.io-client', () => ({ io }));

const emitir = (evento: string, ...args: unknown[]): void =>
  socketFalso.escuchas.get(evento)?.(...args);

const sala = {
  id: 'abcd1234',
  empezada: false,
  anfitrion: 'j1',
  jugadores: [{ id: 'j1', nombre: 'Ana' }],
  publica: false,
  maximo: 12,
  opciones: {},
  conectados: ['j1'],
};

function manejadores(): ManejadoresDeSala {
  return { alEstado: vi.fn(), alCerrarse: vi.fn(), alRechazar: vi.fn() };
}

beforeEach(() => {
  socketFalso.escuchas.clear();
  vi.clearAllMocks();
});

describe('suscribirSala', () => {
  it('se conecta al namespace /lobby con la sala y el token, solo por websocket', () => {
    suscribirSala({ salaId: 'abcd1234', token: 'tok' }, manejadores());
    expect(io).toHaveBeenCalledWith('http://localhost:3001/lobby', {
      auth: { salaId: 'abcd1234', token: 'tok' },
      transports: ['websocket'],
    });
  });

  it('sin token no manda el campo: mira la sala sin figurar como conectado', () => {
    suscribirSala({ salaId: 'abcd1234' }, manejadores());
    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ auth: { salaId: 'abcd1234' } }),
    );
  });

  it('entrega el estado validado de cada aviso', () => {
    const m = manejadores();
    suscribirSala({ salaId: 'abcd1234' }, m);
    emitir('sala:estado', sala);
    expect(m.alEstado).toHaveBeenCalledWith(sala);
  });

  it('un estado con otra forma se avisa como rechazo, no rompe la pantalla', () => {
    const m = manejadores();
    suscribirSala({ salaId: 'abcd1234' }, m);
    emitir('sala:estado', { id: 5 });
    expect(m.alEstado).not.toHaveBeenCalled();
    expect(m.alRechazar).toHaveBeenCalledWith('RESPUESTA_INVALIDA');
  });

  it('avisa cuando la sala se cierra y cuando el servidor la rechaza', () => {
    const m = manejadores();
    suscribirSala({ salaId: 'abcd1234' }, m);
    emitir('sala:cerrada');
    emitir('lobby:error', { motivo: 'SALA_NO_EXISTE' });
    expect(m.alCerrarse).toHaveBeenCalledTimes(1);
    expect(m.alRechazar).toHaveBeenCalledWith('SALA_NO_EXISTE');
  });

  it('un rechazo sin motivo legible se trata como respuesta inválida', () => {
    const m = manejadores();
    suscribirSala({ salaId: 'abcd1234' }, m);
    emitir('lobby:error', 7);
    expect(m.alRechazar).toHaveBeenCalledWith('RESPUESTA_INVALIDA');
  });

  it('al darse de baja cierra el socket y ya no entrega nada más', () => {
    const m = manejadores();
    const cerrar = suscribirSala({ salaId: 'abcd1234' }, m);
    cerrar();
    expect(socketFalso.disconnect).toHaveBeenCalled();
    emitir('sala:estado', sala);
    emitir('sala:cerrada');
    expect(m.alEstado).not.toHaveBeenCalled();
    expect(m.alCerrarse).not.toHaveBeenCalled();
  });
});

describe('suscribirPortada', () => {
  const portada = {
    salas: [{ id: 'abcd1234', anfitrion: 'Ana', jugadores: 1, maximo: 12 }],
    resumen: { salasAbiertas: 1, partidasEnCurso: 0, jugadores: 1 },
  };

  it('se conecta sin sala y entrega la portada validada', () => {
    const alDatos = vi.fn();
    suscribirPortada({ alDatos, alFallar: vi.fn() });
    expect(io).toHaveBeenCalledWith('http://localhost:3001/lobby', {
      auth: {},
      transports: ['websocket'],
    });
    emitir('portada:salas', portada);
    expect(alDatos).toHaveBeenCalledWith(portada);
  });

  it('si el servidor manda otra forma, o no se puede conectar, avisa que falló', () => {
    const alFallar = vi.fn();
    suscribirPortada({ alDatos: vi.fn(), alFallar });
    emitir('portada:salas', { salas: 'no' });
    emitir('connect_error', new Error('sin red'));
    expect(alFallar).toHaveBeenCalledTimes(2);
  });

  it('al darse de baja cierra el socket', () => {
    const alDatos = vi.fn();
    const cerrar = suscribirPortada({ alDatos, alFallar: vi.fn() });
    cerrar();
    expect(socketFalso.disconnect).toHaveBeenCalled();
    emitir('portada:salas', portada);
    expect(alDatos).not.toHaveBeenCalled();
  });
});
