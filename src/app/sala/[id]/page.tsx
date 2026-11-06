import { Sala } from './Sala';

export default async function PaginaSala({ params }: PageProps<'/sala/[id]'>) {
  const { id } = await params;
  return (
    <div className="flex flex-1 flex-col">
      <Sala salaId={id} />
    </div>
  );
}
