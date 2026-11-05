'use client';

import { useRouter } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';
import type { Credencial } from '@/lib/esquemas';
import { crearSala, unirseASala } from '@/lib/salas';
import { guardarCredencial } from '@/lib/sesion';

const NOMBRE_MAX = 20;

/** Pantalla de entrada: crear una sala nueva o unirse a una con su código. */
export function Inicio() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function entrar(pedir: () => Promise<Credencial>): Promise<void> {
    setOcupado(true);
    setError(null);
    try {
      const credencial = await pedir();
      guardarCredencial(credencial);
      router.push(`/sala/${encodeURIComponent(credencial.salaId)}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Algo salió mal');
      setOcupado(false);
    }
  }

  const alUnirse = (evento: SyntheticEvent): void => {
    evento.preventDefault();
    void entrar(() => unirseASala(codigo.trim().toLowerCase(), nombre.trim()));
  };

  const sinNombre = nombre.trim() === '';

  return (
    <form onSubmit={alUnirse} className="flex w-full max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Tu nombre
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={NOMBRE_MAX}
          autoComplete="name"
          className="rounded border bg-transparent px-3 py-2"
        />
      </label>
      <button
        type="button"
        disabled={ocupado || sinNombre}
        onClick={() => void entrar(() => crearSala(nombre.trim()))}
        className="rounded bg-zinc-900 px-3 py-2 font-medium text-white enabled:hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Crear una sala nueva
      </button>

      <p className="text-center text-sm text-zinc-500">o entra con el código que te pasaron</p>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Código de la sala
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="rounded border bg-transparent px-3 py-2 font-mono"
        />
      </label>
      <button
        type="submit"
        disabled={ocupado || sinNombre || codigo.trim() === ''}
        className="rounded border px-3 py-2 font-medium enabled:hover:bg-zinc-100 enabled:hover:text-zinc-900 disabled:opacity-40"
      >
        Unirme
      </button>

      {error && (
        <p role="alert" className="rounded border border-red-500 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
