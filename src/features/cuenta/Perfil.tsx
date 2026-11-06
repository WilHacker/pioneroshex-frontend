'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PanelCuenta } from '@/components/PanelCuenta';
import { useCuenta } from '@/components/useCuenta';
import { codigosRestantes, estadisticas, salir, type Estadisticas as Datos } from '@/lib/cuentas';
import { aclarar, colorDeJugador } from '@/lib/colores';
import { Estadisticas } from './Estadisticas';
import { AVISO, BOTON, BOTON_SECUNDARIO } from './estilos';
import { Seguridad } from './Seguridad';

interface Cargado {
  readonly datos: Datos;
  readonly codigos: number;
}

/** Los datos del perfil; `fallo` si el servidor no respondió. */
function useDatosDePerfil(hayUsuario: boolean): { cargado: Cargado | null; fallo: boolean } {
  const [cargado, setCargado] = useState<Cargado | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    if (!hayUsuario) return;
    const controlador = new AbortController();
    Promise.all([estadisticas(controlador.signal), codigosRestantes(controlador.signal)]).then(
      ([datos, codigos]) => setCargado({ datos, codigos }),
      () => {
        if (!controlador.signal.aborted) setFallo(true);
      },
    );
    return () => controlador.abort();
  }, [hayUsuario]);

  return { cargado, fallo };
}

export function Perfil() {
  const router = useRouter();
  const { cargando, usuario } = useCuenta();
  const { cargado, fallo } = useDatosDePerfil(usuario !== null);
  const [errorAlSalir, setErrorAlSalir] = useState<string | null>(null);

  async function cerrarSesion(): Promise<void> {
    try {
      await salir();
      router.push('/');
    } catch (e: unknown) {
      setErrorAlSalir(e instanceof Error ? e.message : 'Algo salió mal');
    }
  }

  if (cargando) {
    return (
      <PanelCuenta titulo="Mi perfil">
        <output className="font-bold text-tinta/70">Cargando…</output>
      </PanelCuenta>
    );
  }
  if (!usuario) {
    return (
      <PanelCuenta titulo="Mi perfil">
        <p className="font-bold">Entra con tu cuenta para ver tu perfil.</p>
        <Link href="/entrar" className={`${BOTON} self-start`}>
          Entrar
        </Link>
      </PanelCuenta>
    );
  }

  const color = colorDeJugador(0);
  return (
    <PanelCuenta titulo="Mi perfil">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-3">
          <span
            aria-hidden="true"
            style={{ background: `linear-gradient(145deg, ${aclarar(color, 0.25)}, ${color})` }}
            className="flex size-14 items-center justify-center rounded-full text-2xl font-extrabold text-white shadow-md"
          >
            {usuario.nombre.charAt(0).toUpperCase()}
          </span>
          <span className="text-xl font-extrabold">{usuario.nombre}</span>
        </span>
        <button type="button" onClick={() => void cerrarSesion()} className={BOTON_SECUNDARIO}>
          Cerrar sesión
        </button>
      </div>
      {errorAlSalir && (
        <p role="alert" className={AVISO}>
          {errorAlSalir}
        </p>
      )}
      {fallo && (
        <p role="alert" className={AVISO}>
          No se pudieron cargar tus datos.
        </p>
      )}
      {cargado && (
        <>
          <Estadisticas datos={cargado.datos} />
          <Seguridad codigosRestantes={cargado.codigos} />
        </>
      )}
    </PanelCuenta>
  );
}
