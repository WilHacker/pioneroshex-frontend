import { z } from 'zod';

// Mensajes de validación de Zod en español.
z.config(z.locales.es());

const esquemaEnv = z.object({
  NEXT_PUBLIC_API_URL: z.url().transform((url) => url.replace(/\/+$/, '')),
});

export type Env = z.infer<typeof esquemaEnv>;

/** Valida las variables públicas y falla con un mensaje claro si algo falta o es inválido. */
export function validarEnv(entrada: Record<string, unknown>): Env {
  const resultado = esquemaEnv.safeParse(entrada);
  if (!resultado.success) {
    const detalle = resultado.error.issues
      .map((problema) => `  - ${problema.path.join('.')}: ${problema.message}`)
      .join('\n');
    throw new Error(`Configuración de entorno inválida:\n${detalle}`);
  }
  return resultado.data;
}

// Next solo inyecta las NEXT_PUBLIC_* si se leen una por una (no con process.env completo).
export const env: Env = validarEnv({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
