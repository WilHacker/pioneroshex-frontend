import { render, screen } from '@testing-library/react';
import { consultarSalud } from '@/lib/api';
import { EstadoServidor } from './EstadoServidor';

vi.mock('@/lib/api');

describe('EstadoServidor', () => {
  it('muestra "verificando" mientras espera la respuesta', () => {
    vi.mocked(consultarSalud).mockReturnValue(new Promise(() => {}));

    render(<EstadoServidor />);

    expect(screen.getByRole('status')).toHaveTextContent('Verificando servidor…');
  });

  it.each([
    ['conectado', 'Servidor conectado'],
    ['baseDatosCaida', 'Servidor activo, pero la base de datos no responde'],
    ['inaccesible', 'No se pudo conectar con el servidor'],
  ] as const)('muestra el mensaje del estado %s', async (estado, mensaje) => {
    vi.mocked(consultarSalud).mockResolvedValue(estado);

    render(<EstadoServidor />);

    expect(await screen.findByText(mensaje)).toBeInTheDocument();
  });

  it('cancela la petición al desmontarse', () => {
    vi.mocked(consultarSalud).mockReturnValue(new Promise(() => {}));

    const { unmount } = render(<EstadoServidor />);
    const senal = vi.mocked(consultarSalud).mock.calls[0]?.[0];
    unmount();

    expect(senal?.aborted).toBe(true);
  });
});
