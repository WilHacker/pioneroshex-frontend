'use client';

import { useEffect, useState } from 'react';
import { yo, type Usuario } from '@/lib/cuentas';

export interface EstadoDeCuenta {
  /** Todavía no se sabe si hay sesión (se está preguntando al servidor). */
  readonly cargando: boolean;
  /** Quien tiene la sesión abierta, o `null` si juega de invitado. */
  readonly usuario: Usuario | null;
}

/**
 * Pregunta al servidor quién tiene la sesión abierta (la cookie es HttpOnly: JavaScript no la
 * ve). Si el servidor no responde se trata como invitado: nunca bloquea la pantalla.
 */
export function useCuenta(): EstadoDeCuenta {
  const [estado, setEstado] = useState<EstadoDeCuenta>({ cargando: true, usuario: null });

  useEffect(() => {
    const controlador = new AbortController();
    yo(controlador.signal).then(
      (usuario) => setEstado({ cargando: false, usuario }),
      () => {
        if (!controlador.signal.aborted) setEstado({ cargando: false, usuario: null });
      },
    );
    return () => controlador.abort();
  }, []);

  return estado;
}
