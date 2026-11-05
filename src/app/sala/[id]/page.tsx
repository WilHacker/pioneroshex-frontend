import { Sala } from './Sala';

export default async function PaginaSala({ params }: PageProps<'/sala/[id]'>) {
  const { id } = await params;
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center gap-4 p-4">
      <Sala salaId={id} />
    </main>
  );
}
