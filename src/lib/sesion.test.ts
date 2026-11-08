import {
  enlaceDeSala,
  guardarCredencial,
  guardarNombre,
  leerCredencial,
  leerNombre,
  marcarSorteoVisto,
  olvidarCredencial,
  yaVioElSorteo,
  type Almacen,
} from './sesion';

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

describe('nombre del jugador', () => {
  it('se recuerda entre visitas y, sin nada guardado, es vacío', () => {
    const almacen = almacenEnMemoria();

    expect(leerNombre(almacen)).toBe('');
    guardarNombre('  Ana ', almacen);
    expect(leerNombre(almacen)).toBe('Ana');
  });

  it('sin almacenamiento no falla', () => {
    expect(() => guardarNombre('Ana', null)).not.toThrow();
    expect(leerNombre(null)).toBe('');
  });

  it('si el almacenamiento lanza, se ignora', () => {
    const roto: Almacen = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    };

    expect(() => guardarNombre('Ana', roto)).not.toThrow();
    expect(leerNombre(roto)).toBe('');
  });
});

describe('enlaceDeSala', () => {
  it('arma la dirección de invitación con el origen actual', () => {
    expect(enlaceDeSala('http://192.168.1.20:3000', 'abcd1234')).toBe(
      'http://192.168.1.20:3000/sala/abcd1234',
    );
  });
});

describe('olvidarCredencial', () => {
  it('borra solo la sala indicada', () => {
    const almacen = almacenEnMemoria();
    guardarCredencial(ana, almacen);
    guardarCredencial(beto, almacen);
    olvidarCredencial('sala1111', almacen);
    expect(leerCredencial('sala1111', almacen)).toBeNull();
    expect(leerCredencial('sala2222', almacen)).toEqual(beto);
  });

  it('si no había nada guardado no hace nada ni falla', () => {
    const almacen = almacenEnMemoria();
    expect(() => olvidarCredencial('sala1111', almacen)).not.toThrow();
    expect(() => olvidarCredencial('sala1111', null)).not.toThrow();
  });
});

describe('sorteo visto', () => {
  it('al principio no se ha visto y, una vez marcado, sí, solo para esa partida', () => {
    const almacen = almacenEnMemoria();
    expect(yaVioElSorteo('sala1111', almacen)).toBe(false);
    marcarSorteoVisto('sala1111', almacen);
    expect(yaVioElSorteo('sala1111', almacen)).toBe(true);
    expect(yaVioElSorteo('sala2222', almacen)).toBe(false);
  });

  it('marcar dos veces no duplica y varias partidas conviven', () => {
    const almacen = almacenEnMemoria();
    marcarSorteoVisto('a', almacen);
    marcarSorteoVisto('a', almacen);
    marcarSorteoVisto('b', almacen);
    expect(JSON.parse(almacen.getItem('pioneroshex:sorteo-visto')!)).toEqual(['a', 'b']);
  });

  it('aguanta un almacén roto o ausente sin fallar', () => {
    const roto = almacenEnMemoria({ 'pioneroshex:sorteo-visto': 'esto no es json' });
    expect(yaVioElSorteo('a', roto)).toBe(false);
    expect(() => marcarSorteoVisto('a', roto)).not.toThrow();
    expect(yaVioElSorteo('a', null)).toBe(false);
    expect(() => marcarSorteoVisto('a', null)).not.toThrow();
  });
});
