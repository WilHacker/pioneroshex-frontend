import { renderHook, waitFor } from '@testing-library/react';
import { yo } from '@/lib/cuentas';
import { ErrorApi } from '@/lib/http';
import { useCuenta } from './useCuenta';

vi.mock('@/lib/cuentas');

beforeEach(() => vi.resetAllMocks());

describe('useCuenta', () => {
  it('empieza cargando y luego dice quién tiene la sesión', async () => {
    vi.mocked(yo).mockResolvedValue({ id: 'u1', nombre: 'Ana' });

    const { result } = renderHook(() => useCuenta());

    expect(result.current).toEqual({ cargando: true, usuario: null });
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.usuario).toEqual({ id: 'u1', nombre: 'Ana' });
  });

  it('sin sesión, o si el servidor no responde, se trata como invitado sin bloquear', async () => {
    vi.mocked(yo).mockResolvedValueOnce(null);
    const sinSesion = renderHook(() => useCuenta());
    await waitFor(() => expect(sinSesion.result.current.cargando).toBe(false));
    expect(sinSesion.result.current.usuario).toBeNull();

    vi.mocked(yo).mockRejectedValueOnce(new ErrorApi(0, 'sin red'));
    const caido = renderHook(() => useCuenta());
    await waitFor(() => expect(caido.result.current.cargando).toBe(false));
    expect(caido.result.current.usuario).toBeNull();
  });

  it('al desmontarse cancela la petición', () => {
    vi.mocked(yo).mockReturnValue(new Promise(() => {}));

    const { unmount } = renderHook(() => useCuenta());
    const senal = vi.mocked(yo).mock.calls[0]?.[0];
    unmount();

    expect(senal?.aborted).toBe(true);
  });
});
