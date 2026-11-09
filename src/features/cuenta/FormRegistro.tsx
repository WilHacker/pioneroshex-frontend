'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';
import { PanelCuenta } from '@/components/PanelCuenta';
import { registrar } from '@/lib/cuentas';
import { ErrorApi } from '@/lib/http';
import { CodigosDeRecuperacion } from './CodigosDeRecuperacion';
import { AVISO, BOTON, CAMPO, ENLACE_EN_TEXTO, ETIQUETA } from './estilos';

const CONTRASENA_MIN = 8;
const ESTADO_REGISTRO_CERRADO = 403;

export function FormRegistro() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [repetida, setRepetida] = useState('');
  const [codigoCasa, setCodigoCasa] = useState('');
  const [pedirCodigoCasa, setPedirCodigoCasa] = useState(false);
  const [codigos, setCodigos] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  if (codigos) {
    return (
      <PanelCuenta titulo="Cuenta creada">
        <CodigosDeRecuperacion
          codigos={codigos}
          textoContinuar="Ir a jugar"
          onContinuar={() => router.push('/jugar')}
        />
      </PanelCuenta>
    );
  }

  const problema =
    contrasena.length > 0 && contrasena.length < CONTRASENA_MIN
      ? `La contraseña necesita al menos ${CONTRASENA_MIN} caracteres`
      : repetida !== '' && repetida !== contrasena
        ? 'Las contraseñas no coinciden'
        : null;

  async function enviar(evento: SyntheticEvent): Promise<void> {
    evento.preventDefault();
    setOcupado(true);
    setError(null);
    try {
      const r = await registrar(nombre.trim(), contrasena, codigoCasa.trim() || undefined);
      setCodigos(r.codigos);
    } catch (e: unknown) {
      // Con el registro cerrado, el servidor pide el código de la casa: se muestra el campo.
      if (e instanceof ErrorApi && e.estado === ESTADO_REGISTRO_CERRADO) setPedirCodigoCasa(true);
      setError(e instanceof Error ? e.message : 'Algo salió mal');
      setOcupado(false);
    }
  }

  return (
    <PanelCuenta titulo="Crear cuenta">
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
            autoComplete="new-password"
            maxLength={128}
            className={CAMPO}
          />
        </label>
        <label className={ETIQUETA}>
          Repite la contraseña
          <input
            type="password"
            value={repetida}
            onChange={(e) => setRepetida(e.target.value)}
            autoComplete="new-password"
            maxLength={128}
            className={CAMPO}
          />
        </label>
        {pedirCodigoCasa && (
          <label className={ETIQUETA}>
            Código de la casa
            <input
              value={codigoCasa}
              onChange={(e) => setCodigoCasa(e.target.value)}
              autoComplete="off"
              className={CAMPO}
            />
          </label>
        )}
        {(problema ?? error) && (
          <p role="alert" className={AVISO}>
            {problema ?? error}
          </p>
        )}
        <button
          type="submit"
          disabled={
            ocupado ||
            problema !== null ||
            nombre.trim().length < 3 ||
            contrasena.length < CONTRASENA_MIN ||
            repetida !== contrasena
          }
          className={`${BOTON} self-start`}
        >
          Crear cuenta
        </button>
      </form>
      <p className="text-sm">
        ¿Ya tienes cuenta?{' '}
        <Link href="/entrar" className={ENLACE_EN_TEXTO}>
          Entrar
        </Link>
      </p>
    </PanelCuenta>
  );
}
