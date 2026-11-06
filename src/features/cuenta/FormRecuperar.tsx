'use client';

import Link from 'next/link';
import { useState, type SyntheticEvent } from 'react';
import { PanelCuenta } from '@/components/PanelCuenta';
import { recuperar } from '@/lib/cuentas';
import { AVISO, BOTON, CAMPO, ENLACE, ETIQUETA } from './estilos';

const CONTRASENA_MIN = 8;
/** Con tan pocos códigos, conviene pedir unos nuevos desde el perfil. */
const POCOS_CODIGOS = 2;

export function FormRecuperar() {
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nueva, setNueva] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [restantes, setRestantes] = useState<number | null>(null);

  async function enviar(evento: SyntheticEvent): Promise<void> {
    evento.preventDefault();
    setOcupado(true);
    setError(null);
    try {
      const r = await recuperar(nombre.trim(), codigo.trim(), nueva);
      setRestantes(r.codigosRestantes);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Algo salió mal');
      setOcupado(false);
    }
  }

  if (restantes !== null) {
    return (
      <PanelCuenta titulo="Contraseña cambiada">
        <p className="font-bold">Ya entraste con tu cuenta. Ese código ya no sirve.</p>
        <p>
          Te quedan {restantes} {restantes === 1 ? 'código' : 'códigos'}.
          {restantes <= POCOS_CODIGOS && ' Pide unos nuevos en tu perfil antes de que se acaben.'}
        </p>
        <Link href="/perfil" className={`${BOTON} self-start`}>
          Ir a mi perfil
        </Link>
      </PanelCuenta>
    );
  }

  return (
    <PanelCuenta titulo="Recuperar mi cuenta">
      <p className="text-sm">
        Usa uno de los códigos que guardaste al crear la cuenta y elige una contraseña nueva.
      </p>
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
          Código de recuperación
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder="ABCD-EFGH-JKLM-NPQR"
            className={`${CAMPO} font-mono`}
          />
        </label>
        <label className={ETIQUETA}>
          Contraseña nueva
          <input
            type="password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            autoComplete="new-password"
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
          disabled={
            ocupado || nombre.trim() === '' || codigo.trim() === '' || nueva.length < CONTRASENA_MIN
          }
          className={`${BOTON} self-start`}
        >
          Cambiar contraseña
        </button>
      </form>
      <Link href="/entrar" className={`${ENLACE} text-sm`}>
        Volver a entrar
      </Link>
    </PanelCuenta>
  );
}
