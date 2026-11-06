'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';
import { PanelCuenta } from '@/components/PanelCuenta';
import { entrar } from '@/lib/cuentas';
import { AVISO, BOTON, CAMPO, ENLACE, ETIQUETA } from './estilos';

export function FormEntrar() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(evento: SyntheticEvent): Promise<void> {
    evento.preventDefault();
    setOcupado(true);
    setError(null);
    try {
      await entrar(nombre.trim(), contrasena);
      router.push('/jugar');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Algo salió mal');
      setOcupado(false);
    }
  }

  return (
    <PanelCuenta titulo="Entrar">
      <form onSubmit={(e) => void enviar(e)} className="flex flex-col gap-3">
        <label className={ETIQUETA}>
          Nombre
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoComplete="username"
            maxLength={20}
            className={CAMPO}
          />
        </label>
        <label className={ETIQUETA}>
          Contraseña
          <input
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            autoComplete="current-password"
            maxLength={128}
            className={CAMPO}
          />
        </label>
        {error && (
          <p role="alert" className={AVISO}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={ocupado || nombre.trim() === '' || contrasena === ''}
          className={`${BOTON} self-start`}
        >
          Entrar
        </button>
      </form>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link href="/registro" className={ENLACE}>
          Crear cuenta
        </Link>
        <Link href="/recuperar" className={ENLACE}>
          Olvidé mi contraseña
        </Link>
      </p>
    </PanelCuenta>
  );
}
