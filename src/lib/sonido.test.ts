import { COSTOS } from './costos';
import { crearSonido, sonidoDelJuego, type Efecto } from './sonido';
import type { Almacen } from './sesion';

function contextoFalso(estado: 'running' | 'suspended' = 'running') {
  const cuenta = { osciladores: 0, ruidos: 0, reanudado: false };
  const parametro = () => ({
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    value: 0,
  });
  const nodo = () => ({ connect: vi.fn(), gain: parametro() });
  const contexto = {
    currentTime: 0,
    sampleRate: 8000,
    state: estado,
    destination: {},
    resume: vi.fn(() => {
      cuenta.reanudado = true;
      return Promise.resolve();
    }),
    createGain: nodo,
    createOscillator: () => {
      cuenta.osciladores++;
      return { ...nodo(), type: 'sine', frequency: parametro(), start: vi.fn(), stop: vi.fn() };
    },
    createBuffer: (_c: number, largo: number) => ({
      getChannelData: () => new Float32Array(largo),
    }),
    createBufferSource: () => {
      cuenta.ruidos++;
      return { ...nodo(), buffer: null, start: vi.fn() };
    },
    createBiquadFilter: () => ({ ...nodo(), type: 'lowpass', frequency: { value: 0 } }),
  };
  return { contexto: contexto as unknown as AudioContext, cuenta };
}

function almacen(
  inicial: Record<string, string> = {},
): Almacen & { datos: Record<string, string> } {
  const datos = { ...inicial };
  return {
    datos,
    getItem: (k) => datos[k] ?? null,
    setItem: (k, v) => {
      datos[k] = v;
    },
  };
}

describe('crearSonido', () => {
  it('abre el contexto en el primer sonido y lo reutiliza', () => {
    const { contexto } = contextoFalso();
    const fabrica = vi.fn(() => contexto);
    const sonido = crearSonido(fabrica, almacen());
    expect(fabrica).not.toHaveBeenCalled();
    sonido.reproducir('clic');
    sonido.reproducir('turno');
    expect(fabrica).toHaveBeenCalledTimes(1);
  });

  it.each(['clic', 'colocar', 'ganar', 'oferta', 'turno', 'error', 'victoria'] as Efecto[])(
    'el efecto %s hace sonar algo',
    (efecto) => {
      const { contexto, cuenta } = contextoFalso();
      crearSonido(() => contexto, almacen()).reproducir(efecto);
      expect(cuenta.osciladores + cuenta.ruidos).toBeGreaterThan(0);
    },
  );

  it('los dados suenan como un traqueteo de ruido', () => {
    const { contexto, cuenta } = contextoFalso();
    crearSonido(() => contexto, almacen()).reproducir('dados');
    expect(cuenta.ruidos).toBeGreaterThan(4);
  });

  it('si el contexto está suspendido, lo reanuda', () => {
    const { contexto, cuenta } = contextoFalso('suspended');
    crearSonido(() => contexto, almacen()).reproducir('clic');
    expect(cuenta.reanudado).toBe(true);
  });

  it('en silencio no abre el contexto ni suena nada', () => {
    const fabrica = vi.fn();
    const sonido = crearSonido(fabrica, almacen({ 'pioneroshex:silencio': '1' }));
    expect(sonido.silenciado).toBe(true);
    sonido.reproducir('dados');
    expect(fabrica).not.toHaveBeenCalled();
  });

  it('alternar el silencio se recuerda para la próxima visita', () => {
    const guardado = almacen();
    const sonido = crearSonido(() => null, guardado);
    expect(sonido.alternarSilencio()).toBe(true);
    expect(guardado.datos['pioneroshex:silencio']).toBe('1');
    expect(crearSonido(() => null, guardado).silenciado).toBe(true);
    expect(sonido.alternarSilencio()).toBe(false);
    expect(guardado.datos['pioneroshex:silencio']).toBe('0');
  });

  it('sin audio disponible no hace nada ni lanza', () => {
    expect(() => crearSonido(() => null, almacen()).reproducir('victoria')).not.toThrow();
  });

  it('un fallo del navegador al sonar nunca rompe la partida', () => {
    const sonido = crearSonido(() => {
      throw new Error('audio bloqueado');
    }, almacen());
    expect(() => sonido.reproducir('clic')).not.toThrow();
  });

  it('sin almacenamiento, o con uno que falla, sigue funcionando', () => {
    const roto: Almacen = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    };
    const sonido = crearSonido(() => null, roto);
    expect(sonido.silenciado).toBe(false);
    expect(sonido.alternarSilencio()).toBe(true);
    expect(crearSonido(() => null, null).silenciado).toBe(false);
  });

  it('el reproductor del juego es único', () => {
    expect(sonidoDelJuego()).toBe(sonidoDelJuego());
  });
});

describe('COSTOS', () => {
  it('coinciden con las reglas del juego', () => {
    expect(COSTOS.CAMINO).toEqual({ MADERA: 1, LADRILLO: 1 });
    expect(COSTOS.POBLADO).toEqual({ MADERA: 1, LADRILLO: 1, OVEJA: 1, TRIGO: 1 });
    expect(COSTOS.CIUDAD).toEqual({ TRIGO: 2, MINERAL: 3 });
    expect(COSTOS.CARTA).toEqual({ OVEJA: 1, TRIGO: 1, MINERAL: 1 });
  });
});
