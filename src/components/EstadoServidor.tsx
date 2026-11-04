'use client';

import { useEffect, useState } from 'react';
import { consultarSalud, type EstadoBackend } from '@/lib/api';

type Estado = 'verificando' | EstadoBackend;

const MENSAJES: Record<Estado, string> = {
  verificando: 'Verificando servidor…',
  conectado: 'Servidor conectado',
  baseDatosCaida: 'Servidor activo, pero la base de datos no responde',
  inaccesible: 'No se pudo conectar con el servidor',
};

const COLORES: Record<Estado, string> = {
  verificando: 'bg-zinc-400',
  conectado: 'bg-green-500',
  baseDatosCaida: 'bg-amber-500',
  inaccesible: 'bg-red-500',
};

export function EstadoServidor() {
  const [estado, setEstado] = useState<Estado>('verificando');

  useEffect(() => {
    const controlador = new AbortController();
    void consultarSalud(controlador.signal).then((resultado) => {
      if (!controlador.signal.aborted) setEstado(resultado);
    });
    return () => controlador.abort();
  }, []);

  return (
    <output className="flex items-center gap-2 text-sm">
      {/* El color acompaña al texto, nunca lo sustituye. */}
      <span aria-hidden="true" className={`size-2.5 rounded-full ${COLORES[estado]}`} />
      {MENSAJES[estado]}
    </output>
  );
}
