import { guardarCredencial, leerCredencial, type Almacen } from './sesion';

function almacenEnMemoria(
  inicial: Record<string, string> = {},
): Almacen & { datos: Record<string, string> } {
  const datos = { ...inicial };
  return {
    datos,
    getItem: (clave) => datos[clave] ?? null,
    setItem: (clave, valor) => {
      datos[clave] = valor;
    },
  };
}

const ana = { salaId: 'sala1111', jugadorId: 'j1', token: 'tok-ana' };
const beto = { salaId: 'sala2222', jugadorId: 'j2', token: 'tok-beto' };

describe('sesión de sala', () => {
  it('guarda y recupera la credencial de cada sala por separado', () => {
    const almacen = almacenEnMemoria();
    guardarCredencial(ana, almacen);
    guardarCredencial(beto, almacen);
    expect(leerCredencial('sala1111', almacen)).toEqual(ana);
    expect(leerCredencial('sala2222', almacen)).toEqual(beto);
    expect(leerCredencial('otra', almacen)).toBeNull();
  });

  it('guardar de nuevo en la misma sala reemplaza la credencial', () => {
    const almacen = almacenEnMemoria();
    guardarCredencial(ana, almacen);
    guardarCredencial({ ...ana, token: 'nuevo' }, almacen);
    expect(leerCredencial('sala1111', almacen)?.token).toBe('nuevo');
  });

  it('un almacén corrupto se trata como vacío en lugar de romper', () => {
    expect(
      leerCredencial('x', almacenEnMemoria({ 'pioneroshex:sesiones': '{no es json' })),
    ).toBeNull();
    expect(leerCredencial('x', almacenEnMemoria({ 'pioneroshex:sesiones': '{"x":5}' }))).toBeNull();
  });

  it('sin almacenamiento disponible no hace nada ni lanza', () => {
    expect(() => guardarCredencial(ana, null)).not.toThrow();
    expect(leerCredencial('sala1111', null)).toBeNull();
  });

  it('si el almacenamiento rechaza escribir (cuota o modo privado), no lanza', () => {
    const lleno: Almacen = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('cuota', 'QuotaExceededError');
      },
    };
    expect(() => guardarCredencial(ana, lleno)).not.toThrow();
  });

  it('por defecto usa sessionStorage del navegador', () => {
    sessionStorage.clear();
    guardarCredencial(ana);
    expect(leerCredencial('sala1111')).toEqual(ana);
  });
});
