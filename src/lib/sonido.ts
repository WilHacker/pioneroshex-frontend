import type { Almacen } from './sesion';

/** Los sonidos del juego. Se generan con Web Audio: no hay archivos de audio ni licencias. */
export type Efecto =
  'clic' | 'dados' | 'colocar' | 'ganar' | 'oferta' | 'turno' | 'error' | 'victoria';

/** Una nota o un soplo de ruido: `inicio` y `duracion` en segundos, `hasta` desliza el tono. */
interface Nota {
  readonly onda?: OscillatorType;
  readonly ruido?: boolean;
  readonly desde: number;
  readonly hasta?: number;
  readonly inicio: number;
  readonly duracion: number;
  readonly volumen: number;
}

const CLAVE_SILENCIO = 'pioneroshex:silencio';
const VOLUMEN_GENERAL = 0.5;

const traqueteo = (n: number): Nota[] =>
  Array.from({ length: n }, (_, i) => ({
    ruido: true,
    desde: 1800 + ((i * 631) % 1400),
    inicio: i * 0.055 + ((i * 7) % 3) * 0.008,
    duracion: 0.05,
    volumen: 0.5 - i * 0.04,
  }));

const EFECTOS: Readonly<Record<Efecto, readonly Nota[]>> = {
  clic: [{ onda: 'triangle', desde: 660, hasta: 520, inicio: 0, duracion: 0.07, volumen: 0.35 }],
  dados: traqueteo(9),
  colocar: [
    { onda: 'sine', desde: 180, hasta: 90, inicio: 0, duracion: 0.12, volumen: 0.7 },
    { ruido: true, desde: 2600, inicio: 0, duracion: 0.04, volumen: 0.3 },
  ],
  ganar: [
    { onda: 'sine', desde: 784, inicio: 0, duracion: 0.12, volumen: 0.4 },
    { onda: 'sine', desde: 1175, inicio: 0.09, duracion: 0.18, volumen: 0.35 },
  ],
  oferta: [
    { onda: 'triangle', desde: 523, inicio: 0, duracion: 0.12, volumen: 0.4 },
    { onda: 'triangle', desde: 659, inicio: 0.14, duracion: 0.16, volumen: 0.4 },
  ],
  turno: [
    { onda: 'sine', desde: 440, inicio: 0, duracion: 0.1, volumen: 0.4 },
    { onda: 'sine', desde: 587, inicio: 0.1, duracion: 0.1, volumen: 0.4 },
    { onda: 'sine', desde: 880, inicio: 0.2, duracion: 0.22, volumen: 0.4 },
  ],
  error: [{ onda: 'square', desde: 150, hasta: 110, inicio: 0, duracion: 0.18, volumen: 0.25 }],
  victoria: [523, 659, 784, 1047].map((desde, i): Nota => ({
    onda: 'triangle',
    desde,
    inicio: i * 0.13,
    duracion: i === 3 ? 0.5 : 0.16,
    volumen: 0.45,
  })),
};

export interface Sonido {
  reproducir: (efecto: Efecto) => void;
  readonly silenciado: boolean;
  /** Cambia entre con sonido y sin sonido, y lo recuerda. Devuelve el nuevo estado. */
  alternarSilencio: () => boolean;
}

/** El contexto de audio del navegador, o `null` si no hay (servidor, navegadores sin soporte). */
function contextoDelNavegador(): AudioContext | null {
  return typeof AudioContext === 'undefined' ? null : new AudioContext();
}

function almacenLocal(): Almacen | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function tocar(contexto: AudioContext, nota: Nota): void {
  const ahora = contexto.currentTime + nota.inicio;
  const fin = ahora + nota.duracion;
  const ganancia = contexto.createGain();
  ganancia.gain.setValueAtTime(nota.volumen * VOLUMEN_GENERAL, ahora);
  ganancia.gain.exponentialRampToValueAtTime(0.0001, fin);
  ganancia.connect(contexto.destination);

  if (nota.ruido) {
    const largo = Math.max(1, Math.floor(contexto.sampleRate * nota.duracion));
    const memoria = contexto.createBuffer(1, largo, contexto.sampleRate);
    const datos = memoria.getChannelData(0);
    for (let i = 0; i < largo; i++) datos[i] = Math.random() * 2 - 1;
    const fuente = contexto.createBufferSource();
    const filtro = contexto.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.frequency.value = nota.desde;
    fuente.buffer = memoria;
    fuente.connect(filtro);
    filtro.connect(ganancia);
    fuente.start(ahora);
    return;
  }

  const oscilador = contexto.createOscillator();
  oscilador.type = nota.onda ?? 'sine';
  oscilador.frequency.setValueAtTime(nota.desde, ahora);
  if (nota.hasta !== undefined) oscilador.frequency.exponentialRampToValueAtTime(nota.hasta, fin);
  oscilador.connect(ganancia);
  oscilador.start(ahora);
  oscilador.stop(fin);
}

/**
 * Crea el reproductor de efectos. El contexto de audio se abre en el primer sonido (los
 * navegadores solo lo permiten tras un gesto del jugador). Si no hay audio, no hace nada.
 */
export function crearSonido(
  fabrica: () => AudioContext | null = contextoDelNavegador,
  almacen: Almacen | null = almacenLocal(),
): Sonido {
  let silenciado = false;
  try {
    silenciado = almacen?.getItem(CLAVE_SILENCIO) === '1';
  } catch {
    // Sin almacenamiento se empieza con sonido.
  }
  let contexto: AudioContext | null | undefined;

  return {
    get silenciado() {
      return silenciado;
    },
    alternarSilencio() {
      silenciado = !silenciado;
      try {
        almacen?.setItem(CLAVE_SILENCIO, silenciado ? '1' : '0');
      } catch {
        // No se pudo recordar: solo vale para esta visita.
      }
      return silenciado;
    },
    reproducir(efecto) {
      if (silenciado) return;
      try {
        contexto ??= fabrica();
        if (!contexto) return;
        if (contexto.state === 'suspended') void contexto.resume();
        for (const nota of EFECTOS[efecto]) tocar(contexto, nota);
      } catch {
        // Un fallo de audio nunca debe romper la partida.
      }
    },
  };
}

let compartido: Sonido | undefined;

/** El reproductor único de la aplicación. */
export function sonidoDelJuego(): Sonido {
  compartido ??= crearSonido();
  return compartido;
}
