import { EstadoServidor } from '@/components/EstadoServidor';

export default function Inicio() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">PionerosHex</h1>
      <EstadoServidor />
    </main>
  );
}
