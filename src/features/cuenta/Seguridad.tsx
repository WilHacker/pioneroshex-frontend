'use client';

import { useRouter } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';
import { borrarCuenta, cambiarContrasena, regenerarCodigos } from '@/lib/cuentas';
import { CodigosDeRecuperacion } from './CodigosDeRecuperacion';
import { AVISO, BOTON, BOTON_PELIGRO, BOTON_SECUNDARIO, CAMPO, ETIQUETA } from './estilos';

const CONTRASENA_MIN = 8;
const POCOS_CODIGOS = 2;

const mensajeDe = (e: unknown): string => (e instanceof Error ? e.message : 'Algo salió mal');

type Props = { codigosRestantes: number };

/** Una acción que pide la contraseña actual: el campo, el botón y el aviso de error. */
function ConContrasena({
  etiqueta,
  boton,
  peligro = false,
  onEnviar,
}: {
  etiqueta: string;
  boton: string;
  peligro?: boolean;
  onEnviar: (contrasena: string) => Promise<void>;
}) {
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(evento: SyntheticEvent): Promise<void> {
    evento.preventDefault();
    setOcupado(true);
    setError(null);
    try {
      await onEnviar(contrasena);
    } catch (e: unknown) {
      setError(mensajeDe(e));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={(e) => void enviar(e)} className="flex flex-col gap-2">
      <label className={ETIQUETA}>
        {etiqueta}
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
        disabled={ocupado || contrasena === ''}
        className={`${peligro ? BOTON_PELIGRO : BOTON_SECUNDARIO} self-start`}
      >
        {boton}
      </button>
    </form>
  );
}

function CodigosSeccion({ restantes }: { restantes: number }) {
  const [nuevos, setNuevos] = useState<string[] | null>(null);
  const [contados, setContados] = useState(restantes);

  if (nuevos) {
    return (
      <CodigosDeRecuperacion
        codigos={nuevos}
        textoContinuar="Listo"
        onContinuar={() => {
          setContados(nuevos.length);
          setNuevos(null);
        }}
      />
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="font-bold">
        Te {contados === 1 ? 'queda' : 'quedan'} {contados} {contados === 1 ? 'código' : 'códigos'}{' '}
        de recuperación.
        {contados <= POCOS_CODIGOS && ' Pide unos nuevos antes de quedarte sin ninguno.'}
      </p>
      <ConContrasena
        etiqueta="Tu contraseña, para pedir 8 códigos nuevos"
        boton="Pedir códigos nuevos"
        onEnviar={async (contrasena) => setNuevos(await regenerarCodigos(contrasena))}
      />
    </div>
  );
}

function CambiarContrasena() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(evento: SyntheticEvent): Promise<void> {
    evento.preventDefault();
    setOcupado(true);
    setError(null);
    setHecho(false);
    try {
      await cambiarContrasena(actual, nueva);
      setHecho(true);
      setActual('');
      setNueva('');
    } catch (e: unknown) {
      setError(mensajeDe(e));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={(e) => void enviar(e)} className="flex flex-col gap-2">
      <label className={ETIQUETA}>
        Contraseña actual
        <input
          type="password"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          autoComplete="current-password"
          maxLength={128}
          className={CAMPO}
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
      {hecho && <output className="font-bold text-hoja">Contraseña cambiada.</output>}
      <button
        type="submit"
        disabled={ocupado || actual === '' || nueva.length < CONTRASENA_MIN}
        className={`${BOTON} self-start`}
      >
        Cambiar contraseña
      </button>
    </form>
  );
}

function BorrarCuenta() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={`${BOTON_SECUNDARIO} self-start`}
      >
        Borrar mi cuenta
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-2xl border-2 border-coral/50 p-3">
      <p className="font-bold text-coral">
        Se borran tu cuenta y tus códigos. Tus partidas quedan, pero ya sin tu nombre. No se puede
        deshacer.
      </p>
      <ConContrasena
        etiqueta="Escribe tu contraseña para confirmar"
        boton="Sí, borrar mi cuenta"
        peligro
        onEnviar={async (contrasena) => {
          await borrarCuenta(contrasena);
          router.push('/');
        }}
      />
      <button
        type="button"
        onClick={() => setAbierto(false)}
        className={`${BOTON_SECUNDARIO} self-start`}
      >
        Cancelar
      </button>
    </div>
  );
}

/** Todo lo delicado de la cuenta, cada cosa en su bloque y pidiendo la contraseña. */
export function Seguridad({ codigosRestantes }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="titulo-codigos" className="flex flex-col gap-2">
        <h2 id="titulo-codigos" className="text-lg font-extrabold">
          Códigos de recuperación
        </h2>
        <CodigosSeccion restantes={codigosRestantes} />
      </section>
      <section aria-labelledby="titulo-contrasena" className="flex flex-col gap-2">
        <h2 id="titulo-contrasena" className="text-lg font-extrabold">
          Cambiar contraseña
        </h2>
        <CambiarContrasena />
      </section>
      <section aria-labelledby="titulo-borrar" className="flex flex-col gap-2">
        <h2 id="titulo-borrar" className="text-lg font-extrabold">
          Borrar la cuenta
        </h2>
        <BorrarCuenta />
      </section>
    </div>
  );
}
