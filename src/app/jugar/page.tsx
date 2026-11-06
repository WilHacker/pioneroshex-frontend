import { EstadoServidor } from '@/components/EstadoServidor';
import { Inicio } from '@/features/lobby/Inicio';

export default function PaginaJugar() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl font-bold">PionerosHex</h1>
      <Inicio />
      <EstadoServidor />
    </main>
  );
}
