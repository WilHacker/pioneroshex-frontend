import { z } from 'zod';
import { env } from '@/config/env';

export type EstadoBackend = 'conectado' | 'baseDatosCaida' | 'inaccesible';

const TIEMPO_MAXIMO_MS = 5000;

// Forma de la respuesta de GET /health del backend.
const esquemaSalud = z.object({
  estado: z.enum(['ok', 'error']),
  baseDatos: z.enum(['ok', 'caida']),
});

/**
 * Consulta el /health del backend. Nunca lanza: cualquier fallo (red, CORS, tiempo agotado,
 * petición cancelada o respuesta con otra forma) se representa como `inaccesible`, porque es
 * un estado que la interfaz debe mostrar.
 */
export async function consultarSalud(signal?: AbortSignal): Promise<EstadoBackend> {
  const senales = [AbortSignal.timeout(TIEMPO_MAXIMO_MS), ...(signal ? [signal] : [])];
  try {
    const respuesta = await fetch(`${env.NEXT_PUBLIC_API_URL}/health`, {
      cache: 'no-store',
      signal: AbortSignal.any(senales),
    });
    const cuerpo = esquemaSalud.safeParse(await respuesta.json());
    if (!cuerpo.success) return 'inaccesible';
    if (respuesta.ok && cuerpo.data.baseDatos === 'ok') return 'conectado';
    if (cuerpo.data.baseDatos === 'caida') return 'baseDatosCaida';
    return 'inaccesible';
  } catch {
    return 'inaccesible';
  }
}
