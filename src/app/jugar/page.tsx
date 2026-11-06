import { EstadoServidor } from '@/components/EstadoServidor';
import { Lobby } from '@/features/lobby/Lobby';

export default function PaginaJugar() {
  return (
    <main className="mar flex flex-1 flex-col items-center justify-center gap-5 p-4 text-white">
      <h1 className="text-3xl font-extrabold tracking-tight">PionerosHex</h1>
      <Lobby />
      <EstadoServidor />
    </main>
  );
}
