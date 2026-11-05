'use client';

import { useState } from 'react';
import { SalaDeEspera, type EntradaPartida } from '@/features/lobby/SalaDeEspera';
import { Partida } from '@/features/partida/Partida';

/** Antes de empezar se ve la sala de espera; cuando empieza, la partida. */
export function Sala({ salaId }: { salaId: string }) {
  const [entrada, setEntrada] = useState<EntradaPartida | null>(null);
  if (entrada) return <Partida credencial={entrada.credencial} nombres={entrada.nombres} />;
  return <SalaDeEspera salaId={salaId} onEmpezada={setEntrada} />;
}
