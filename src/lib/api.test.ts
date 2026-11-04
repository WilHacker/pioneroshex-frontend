import { consultarSalud } from './api';

function responder(cuerpo: unknown, status = 200): void {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(cuerpo), { status }));
}

describe('consultarSalud', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('informa conectado cuando el backend y su base de datos responden', async () => {
    responder({ estado: 'ok', baseDatos: 'ok' });

    await expect(consultarSalud()).resolves.toBe('conectado');
  });

  it('consulta la URL configurada sin usar caché', async () => {
    responder({ estado: 'ok', baseDatos: 'ok' });

    await consultarSalud();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/health',
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('informa baseDatosCaida cuando el backend responde 503', async () => {
    responder({ estado: 'error', baseDatos: 'caida' }, 503);

    await expect(consultarSalud()).resolves.toBe('baseDatosCaida');
  });

  it('informa inaccesible cuando el backend falla sin culpar a la base de datos', async () => {
    responder({ estado: 'error', baseDatos: 'ok' }, 500);

    await expect(consultarSalud()).resolves.toBe('inaccesible');
  });

  it('informa inaccesible cuando la respuesta no tiene la forma esperada', async () => {
    responder({ algo: 'distinto' });

    await expect(consultarSalud()).resolves.toBe('inaccesible');
  });

  it('informa inaccesible cuando la respuesta no es JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html>', { status: 502 }));

    await expect(consultarSalud()).resolves.toBe('inaccesible');
  });

  it('informa inaccesible cuando falla la red', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(consultarSalud()).resolves.toBe('inaccesible');
  });

  it('propaga la señal de cancelación a la petición', async () => {
    responder({ estado: 'ok', baseDatos: 'ok' });
    const controlador = new AbortController();

    await consultarSalud(controlador.signal);
    controlador.abort();

    const opciones = vi.mocked(fetch).mock.calls[0]?.[1];
    expect(opciones?.signal?.aborted).toBe(true);
  });
});
