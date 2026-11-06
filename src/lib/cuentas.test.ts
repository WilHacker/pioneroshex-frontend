import {
  borrarCuenta,
  cambiarContrasena,
  codigosRestantes,
  entrar,
  estadisticas,
  recuperar,
  regenerarCodigos,
  registrar,
  salir,
  yo,
} from './cuentas';
import { ErrorApi } from './http';

const ana = { id: 'u1', nombre: 'Ana' };

function responder(cuerpo: unknown, status = 200): void {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status }),
  );
}

const llamada = (): [string, RequestInit] => {
  const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
  return [url, init];
};

afterEach(() => vi.restoreAllMocks());

describe('cliente de cuentas', () => {
  it('todas las peticiones mandan la cookie de sesión', async () => {
    responder(ana);
    await yo();

    expect(llamada()[1]).toMatchObject({ credentials: 'include', method: 'GET' });
  });

  it('yo devuelve el usuario, o null si no hay sesión (401), y lanza si es otro fallo', async () => {
    responder(ana);
    await expect(yo()).resolves.toEqual(ana);

    responder({ message: 'No has iniciado sesión' }, 401);
    await expect(yo()).resolves.toBeNull();

    responder({ message: 'boom' }, 500);
    await expect(yo()).rejects.toBeInstanceOf(ErrorApi);
  });

  it('registrar manda el código de la casa solo si lo hay y valida los 8 códigos', async () => {
    responder({ usuario: ana, codigos: ['AAAAA-BBBBB'] }, 201);
    await expect(registrar('Ana', 'una clave larga')).resolves.toEqual({
      usuario: ana,
      codigos: ['AAAAA-BBBBB'],
    });
    expect(llamada()[1].body).toBe(
      JSON.stringify({ nombre: 'Ana', contrasena: 'una clave larga' }),
    );

    vi.restoreAllMocks();
    responder({ usuario: ana, codigos: [] }, 201);
    await registrar('Ana', 'una clave larga', 'familia');
    expect(llamada()[1].body).toContain('"codigoRegistro":"familia"');
  });

  it('entrar devuelve el usuario y un error del servidor llega con su mensaje', async () => {
    responder({ usuario: ana });
    await expect(entrar('Ana', 'una clave larga')).resolves.toEqual(ana);

    responder({ message: 'Nombre o contraseña incorrectos' }, 401);
    await expect(entrar('Ana', 'mala')).rejects.toMatchObject({
      estado: 401,
      message: 'Nombre o contraseña incorrectos',
    });
  });

  it('salir, cambiar contraseña y borrar la cuenta usan la ruta y el método correctos', async () => {
    responder(undefined, 204);
    await salir();
    expect(llamada()[0]).toBe('http://localhost:3001/cuentas/salir');

    vi.restoreAllMocks();
    responder(undefined, 204);
    await cambiarContrasena('vieja clave', 'nueva clave larga');
    expect(llamada()[0]).toBe('http://localhost:3001/cuentas/contrasena');
    expect(llamada()[1].body).toBe(
      JSON.stringify({ actual: 'vieja clave', nueva: 'nueva clave larga' }),
    );

    vi.restoreAllMocks();
    responder(undefined, 204);
    await borrarCuenta('clave');
    expect(llamada()[0]).toBe('http://localhost:3001/cuentas/yo');
    expect(llamada()[1].method).toBe('DELETE');
  });

  it('recuperar, códigos restantes y regenerar validan lo que devuelve el servidor', async () => {
    responder({ usuario: ana, codigosRestantes: 7 });
    await expect(recuperar('Ana', 'AAAAA-BBBBB', 'una clave nueva')).resolves.toEqual({
      usuario: ana,
      codigosRestantes: 7,
    });

    responder({ restantes: 5 });
    await expect(codigosRestantes()).resolves.toBe(5);

    responder({ codigos: ['AAAAA-BBBBB', 'CCCCC-DDDDD'] });
    await expect(regenerarCodigos('clave')).resolves.toEqual(['AAAAA-BBBBB', 'CCCCC-DDDDD']);

    responder({ restantes: 'muchos' });
    await expect(codigosRestantes()).rejects.toMatchObject({ estado: 502 });
  });

  it('estadísticas valida la forma de cada partida', async () => {
    const e = {
      partidas: 2,
      victorias: 1,
      promedioPuntos: 8.5,
      ultimas: [
        { partidaId: 'p1', terminadaEn: 5, puntos: 10, gano: true, ganador: 'Ana', jugadores: 3 },
      ],
    };
    responder(e);
    await expect(estadisticas()).resolves.toEqual(e);

    responder({ ...e, ultimas: [{ partidaId: 'p1' }] });
    await expect(estadisticas()).rejects.toMatchObject({ estado: 502 });
  });
});
