'use client';

import { useState } from 'react';
import { BOTON, BOTON_SECUNDARIO } from './estilos';

type Props = {
  codigos: readonly string[];
  /** Lo que dice el botón de seguir, p. ej. «Ir a jugar». */
  textoContinuar: string;
  onContinuar: () => void;
};

const AVISO_COPIADO_MS = 1800;

/**
 * Los códigos de recuperación se muestran una sola vez: sin ellos, olvidar la contraseña significa
 * perder la cuenta. Por eso no se puede seguir sin confirmar que se guardaron.
 */
export function CodigosDeRecuperacion({ codigos, textoContinuar, onContinuar }: Props) {
  const [guardados, setGuardados] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const texto = codigos.join('\n');

  async function copiar(): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), AVISO_COPIADO_MS);
    } catch {
      // Sin permiso para el portapapeles quedan «Descargar» y copiar a mano.
    }
  }

  function descargar(): void {
    const archivo = new Blob([`Códigos de recuperación de PionerosHex\n\n${texto}\n`], {
      type: 'text/plain',
    });
    const direccion = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');
    enlace.href = direccion;
    enlace.download = 'pioneroshex-codigos.txt';
    enlace.click();
    URL.revokeObjectURL(direccion);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="font-bold">
        Guarda estos {codigos.length} códigos. Cada uno sirve una vez para recuperar tu cuenta si
        olvidas la contraseña. No se vuelven a mostrar.
      </p>
      <ul
        aria-label="Códigos de recuperación"
        className="grid grid-cols-2 gap-2 rounded-2xl bg-tinta p-4 font-mono text-lg font-extrabold tracking-wider text-espuma"
      >
        {codigos.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void copiar()} className={BOTON_SECUNDARIO}>
          {copiado ? '¡Copiados!' : 'Copiar'}
        </button>
        <button type="button" onClick={descargar} className={BOTON_SECUNDARIO}>
          Descargar
        </button>
      </div>
      <label className="flex items-center gap-2 font-bold">
        <input
          type="checkbox"
          checked={guardados}
          onChange={(e) => setGuardados(e.target.checked)}
          className="size-5 accent-azafran"
        />
        Ya los guardé
      </label>
      <button type="button" disabled={!guardados} onClick={onContinuar} className={BOTON}>
        {textoContinuar}
      </button>
    </div>
  );
}
