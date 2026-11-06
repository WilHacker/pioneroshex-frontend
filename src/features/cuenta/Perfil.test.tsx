import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  borrarCuenta,
  cambiarContrasena,
  codigosRestantes,
  estadisticas,
  regenerarCodigos,
  salir,
  yo,
} from '@/lib/cuentas';
import { ErrorApi } from '@/lib/http';
import { CodigosDeRecuperacion } from './CodigosDeRecuperacion';
import { Perfil } from './Perfil';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/lib/cuentas');

const ana = { id: 'u1', nombre: 'Ana' };
const vacias = { partidas: 0, victorias: 0, promedioPuntos: 0, ultimas: [] };
const conPartidas = {
  partidas: 3,
  victorias: 2,
  promedioPuntos: 8.5,
  ultimas: [
    {
      partidaId: 'p1',
      terminadaEn: 1_700_000_000_000,
      puntos: 10,
      gano: true,
      ganador: 'Ana',
      jugadores: 3,
    },
    {
      partidaId: 'p2',
      terminadaEn: 1_690_000_000_000,
      puntos: 6,
      gano: false,
      ganador: 'Beto',
      jugadores: 4,
    },
  ],
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(yo).mockResolvedValue(ana);
  vi.mocked(estadisticas).mockResolvedValue(vacias);
  vi.mocked(codigosRestantes).mockResolvedValue(8);
});

describe('Perfil', () => {
  it('sin sesión invita a entrar', async () => {
    vi.mocked(yo).mockResolvedValue(null);
    render(<Perfil />);

    expect(await screen.findByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar');
  });

  it('con partidas muestra el resumen y cada resultado en palabras', async () => {
    vi.mocked(estadisticas).mockResolvedValue(conPartidas);
    render(<Perfil />);

    const resumen = await screen.findByRole('list', { name: 'Resumen' });
    expect(within(resumen).getByText('3')).toBeInTheDocument();
    expect(within(resumen).getByText('Victorias')).toBeInTheDocument();
    const ultimas = screen.getByRole('list', { name: 'Últimas partidas' });
    expect(within(ultimas).getByText('Ganaste')).toBeInTheDocument();
    expect(within(ultimas).getByText('Ganó Beto')).toBeInTheDocument();
  });

  it('sin partidas lo dice, y si el servidor falla avisa', async () => {
    const { unmount } = render(<Perfil />);
    expect(await screen.findByText(/Todavía no has terminado ninguna partida/)).toBeInTheDocument();
    unmount();

    vi.mocked(estadisticas).mockRejectedValue(new ErrorApi(0, 'sin red'));
    render(<Perfil />);
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar tus datos');
  });

  it('cerrar sesión llama al servidor y vuelve al inicio', async () => {
    vi.mocked(salir).mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    render(<Perfil />);

    await usuario.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(salir).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/');
  });

  it('cuenta los códigos que quedan y avisa cuando son pocos', async () => {
    vi.mocked(codigosRestantes).mockResolvedValue(1);
    render(<Perfil />);

    expect(await screen.findByText(/Te queda 1 código de recuperación/)).toBeInTheDocument();
    expect(screen.getByText(/Pide unos nuevos antes de quedarte sin ninguno/)).toBeInTheDocument();
  });

  it('pedir códigos nuevos pide la contraseña, los muestra y al terminar actualiza la cuenta', async () => {
    vi.mocked(regenerarCodigos).mockResolvedValue(['NNNN-NNNN-NNNN-NNNN']);
    const usuario = userEvent.setup();
    render(<Perfil />);

    await usuario.type(
      await screen.findByLabelText(/para pedir 8 códigos nuevos/),
      'una clave larga',
    );
    await usuario.click(screen.getByRole('button', { name: 'Pedir códigos nuevos' }));

    expect(regenerarCodigos).toHaveBeenCalledWith('una clave larga');
    expect(await screen.findByText('NNNN-NNNN-NNNN-NNNN')).toBeInTheDocument();
    await usuario.click(screen.getByRole('checkbox', { name: 'Ya los guardé' }));
    await usuario.click(screen.getByRole('button', { name: 'Listo' }));
    expect(await screen.findByText(/Te queda 1 código de recuperación/)).toBeInTheDocument();
  });

  it('una contraseña mala al pedir códigos muestra el error del servidor', async () => {
    vi.mocked(regenerarCodigos).mockRejectedValue(new ErrorApi(401, 'Contraseña incorrecta'));
    const usuario = userEvent.setup();
    render(<Perfil />);

    await usuario.type(await screen.findByLabelText(/para pedir 8 códigos nuevos/), 'mala');
    await usuario.click(screen.getByRole('button', { name: 'Pedir códigos nuevos' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Contraseña incorrecta');
  });

  it('cambia la contraseña y lo confirma; el botón espera a que la nueva sea larga', async () => {
    vi.mocked(cambiarContrasena).mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    render(<Perfil />);
    const boton = await screen.findByRole('button', { name: 'Cambiar contraseña' });

    expect(boton).toBeDisabled();
    await usuario.type(screen.getByLabelText('Contraseña actual'), 'una clave larga');
    await usuario.type(screen.getByLabelText('Contraseña nueva'), 'una clave nueva');
    await usuario.click(boton);

    expect(cambiarContrasena).toHaveBeenCalledWith('una clave larga', 'una clave nueva');
    expect(await screen.findByText('Contraseña cambiada.')).toBeInTheDocument();
  });

  it('borrar la cuenta tiene dos pasos, pide la contraseña y vuelve al inicio', async () => {
    vi.mocked(borrarCuenta).mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    render(<Perfil />);

    await usuario.click(await screen.findByRole('button', { name: 'Borrar mi cuenta' }));
    expect(screen.getByText(/No se puede deshacer/)).toBeInTheDocument();
    await usuario.type(
      screen.getByLabelText('Escribe tu contraseña para confirmar'),
      'una clave larga',
    );
    await usuario.click(screen.getByRole('button', { name: 'Sí, borrar mi cuenta' }));

    expect(borrarCuenta).toHaveBeenCalledWith('una clave larga');
    expect(push).toHaveBeenCalledWith('/');
  });

  it('se puede cancelar el borrado', async () => {
    const usuario = userEvent.setup();
    render(<Perfil />);

    await usuario.click(await screen.findByRole('button', { name: 'Borrar mi cuenta' }));
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByRole('button', { name: 'Borrar mi cuenta' })).toBeInTheDocument();
    expect(borrarCuenta).not.toHaveBeenCalled();
  });
});

describe('CodigosDeRecuperacion', () => {
  it('copia todos los códigos, uno por línea', async () => {
    const usuario = userEvent.setup();
    render(
      <CodigosDeRecuperacion
        codigos={['AAAA-BBBB-CCCC-DDDD', 'EEEE-FFFF-GGGG-HHHH']}
        textoContinuar="Seguir"
        onContinuar={vi.fn()}
      />,
    );
    const escribir = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await usuario.click(screen.getByRole('button', { name: 'Copiar' }));

    expect(escribir).toHaveBeenCalledWith('AAAA-BBBB-CCCC-DDDD\nEEEE-FFFF-GGGG-HHHH');
    expect(await screen.findByRole('button', { name: '¡Copiados!' })).toBeInTheDocument();
  });

  it('descargar crea un archivo de texto y no falla sin portapapeles', async () => {
    const usuario = userEvent.setup();
    const crear = vi.fn().mockReturnValue('blob:x');
    const revocar = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: crear, revokeObjectURL: revocar });
    render(
      <CodigosDeRecuperacion
        codigos={['AAAA-BBBB-CCCC-DDDD']}
        textoContinuar="Seguir"
        onContinuar={vi.fn()}
      />,
    );
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denegado'));

    await usuario.click(screen.getByRole('button', { name: 'Descargar' }));
    await usuario.click(screen.getByRole('button', { name: 'Copiar' }));

    expect(crear).toHaveBeenCalledOnce();
    expect(revocar).toHaveBeenCalledWith('blob:x');
    expect(screen.getByRole('button', { name: 'Copiar' })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
