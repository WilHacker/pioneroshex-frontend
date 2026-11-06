import { Portada } from '@/features/landing/Portada';
import { TableroDemo } from '@/features/partida/TableroDemo';

export default function PaginaInicio() {
  return <Portada tablero={<TableroDemo />} />;
}
