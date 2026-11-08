import {
  cambiarSala,
  cederAnfitrion,
  crearSala,
  empezarSala,
  ErrorApi,
  expulsarDeSala,
  listarMapas,
  pedirRevancha,
  salirDeSala,
  unirseASala,
} from './salas';

const credencial = { salaId: 'abcd1234', jugadorId: 'j1', token: 'secreto' };

function responder(cuerpo: unknown, status = 200): void {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status }),
  );
}

afterEach(() => vi.restoreAllMocks());

describe('crearSala', () => {
  it('manda el nombre por POST y valida la credencial recibida', async () => {
    responder(credencial, 201);
    await expect(crearSala('Ana')).resolves.toEqual(credencial);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/salas',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ nombre: 'Ana' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('un formato inesperado del servidor es un error claro', async () => {
    responder({ otra: 'cosa' }, 201);
    await expect(crearSala('Ana')).rejects.toMatchObject({ estado: 502 });
  });

  it('un cuerpo que no es JSON también es un error claro', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html>', { status: 201 }));
    await expect(crearSala('Ana')).rejects.toBeInstanceOf(ErrorApi);
  });
});

describe('errores del servidor', () => {
  it('usa el mensaje del backend (texto o lista)', async () => {
    responder({ message: 'La sala no existe', statusCode: 404 }, 404);
    await expect(unirseASala('x', 'Ana')).rejects.toMatchObject({
      estado: 404,
      message: 'La sala no existe',
    });
    responder({ message: ['nombre: muy largo', 'otro: mal'] }, 400);
    await expect(unirseASala('x', 'Ana')).rejects.toMatchObject({
      message: 'nombre: muy largo; otro: mal',
    });
  });

  it('si el error no trae mensaje, dice el código', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('boom', { status: 500 }));
    await expect(listarMapas()).rejects.toMatchObject({ message: 'El servidor respondió 500' });
  });

  it('si no hay red, avisa que no se pudo conectar', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(crearSala('Ana')).rejects.toMatchObject({
      estado: 0,
      message: 'No se pudo conectar con el servidor',
    });
  });

  it('si el llamador cancela, propaga la cancelación sin disfrazarla', async () => {
    const controlador = new AbortController();
    controlador.abort();
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('abortado', 'AbortError'));
    await expect(listarMapas(controlador.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('unirseASala', () => {
  it('escapan el id en la ruta', async () => {
    responder(credencial, 201);
    await unirseASala('a/b', 'Ana');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/salas/a%2Fb/unirse',
      expect.anything(),
    );
  });
});

describe('empezarSala', () => {
  it('manda el token como Bearer y acepta la respuesta vacía', async () => {
    responder(undefined, 204);
    await expect(
      empezarSala('abcd1234', 'secreto', { puntosVictoria: 8 }),
    ).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/salas/abcd1234/empezar',
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer secreto' },
        body: JSON.stringify({ puntosVictoria: 8 }),
      }),
    );
  });

  it('propaga el rechazo (por ejemplo, faltan jugadores)', async () => {
    responder({ message: 'Hacen falta al menos 2 jugadores' }, 409);
    await expect(empezarSala('x', 't')).rejects.toMatchObject({ estado: 409 });
  });
});

describe('salas públicas y opciones', () => {
  it('crearSala manda publica solo cuando es pública', async () => {
    responder(credencial, 201);
    await crearSala('Ana', true);

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/salas',
      expect.objectContaining({ body: JSON.stringify({ nombre: 'Ana', publica: true }) }),
    );
  });

  it('cambiarSala hace PATCH con el token del anfitrión', async () => {
    responder(undefined, 204);
    await cambiarSala('abcd1234', 'secreto', { puntosVictoria: 12, publica: true });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/salas/abcd1234',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ puntosVictoria: 12, publica: true }),
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer secreto' },
      }),
    );
  });
});

describe('listarMapas', () => {
  const mapa = {
    id: 'clasico',
    nombre: 'Clásico',
    descripcion: 'El hexágono de 19 casillas de siempre.',
    casillas: 1,
    vertices: 6,
    maximoTecnico: 7,
    maximoRecomendado: 4,
    minimoRecomendado: 2,
    forma: [[0, 0]],
  };

  it('pide GET /mapas y valida la forma de cada mapa', async () => {
    responder([mapa]);
    await expect(listarMapas()).resolves.toEqual([mapa]);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/mapas',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('un mapa con la forma mal escrita es un error claro del servidor', async () => {
    responder([{ ...mapa, forma: [[0, 'x']] }]);
    await expect(listarMapas()).rejects.toMatchObject({ estado: 502 });
  });

  it('un formato que no es una lista también', async () => {
    responder({ mapas: [mapa] });
    await expect(listarMapas()).rejects.toMatchObject({ estado: 502 });
  });

  it('cambiarSala puede mandar el id de un mapa o null para el automático', async () => {
    responder(undefined, 204);
    await cambiarSala('abcd1234', 'secreto', { mapa: 'lagos' });
    expect(fetch).toHaveBeenLastCalledWith(
      'http://localhost:3001/salas/abcd1234',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ mapa: 'lagos' }) }),
    );
    await cambiarSala('abcd1234', 'secreto', { mapa: null });
    expect(fetch).toHaveBeenLastCalledWith(
      'http://localhost:3001/salas/abcd1234',
      expect.objectContaining({ body: JSON.stringify({ mapa: null }) }),
    );
  });
});

describe('salir, expulsar y ceder el anfitrión', () => {
  it('salirDeSala hace POST a /salir con el token de quien sale', async () => {
    responder(undefined, 204);
    await salirDeSala('abcd1234', 'secreto');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/salas/abcd1234/salir',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer secreto' },
      }),
    );
  });

  it('expulsarDeSala hace DELETE al jugador con el token del anfitrión', async () => {
    responder(undefined, 204);
    await expulsarDeSala('abcd1234', 'secreto', 'j2');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/salas/abcd1234/jugadores/j2',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('cederAnfitrion hace POST a /anfitrion con el id del nuevo anfitrión', async () => {
    responder(undefined, 204);
    await cederAnfitrion('abcd1234', 'secreto', 'j3');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/salas/abcd1234/anfitrion',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ jugadorId: 'j3' }) }),
    );
  });

  it('codifica en la ruta lo que no es seguro', async () => {
    responder(undefined, 204);
    await expulsarDeSala('a/b', 'secreto', 'j 2');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/salas/a%2Fb/jugadores/j%202',
      expect.anything(),
    );
  });

  it('un rechazo del servidor llega como ErrorApi con su estado', async () => {
    responder({ message: 'Solo el anfitrión puede cambiar o empezar la partida' }, 403);
    await expect(expulsarDeSala('abcd1234', 'x', 'j2')).rejects.toMatchObject({ estado: 403 });
  });
});

describe('pedirRevancha', () => {
  it('hace POST a /revancha con el token y valida la credencial de la sala nueva', async () => {
    const nueva = { salaId: 'nuevo5678', jugadorId: 'j1', token: 'otro' };
    responder(nueva, 201);

    await expect(pedirRevancha('abcd1234', 'secreto')).resolves.toEqual(nueva);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/salas/abcd1234/revancha',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer secreto' }),
      }),
    );
  });

  it('propaga el rechazo (la partida aún no terminó)', async () => {
    responder({ message: 'La partida aún no terminó' }, 409);
    await expect(pedirRevancha('x', 't')).rejects.toMatchObject({ estado: 409 });
  });
});
