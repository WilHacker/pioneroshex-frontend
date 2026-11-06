import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { entrar, recuperar, registrar } from '@/lib/cuentas';
import { ErrorApi } from '@/lib/http';
import { FormEntrar } from './FormEntrar';
import { FormRecuperar } from './FormRecuperar';
import { FormRegistro } from './FormRegistro';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/lib/cuentas');

const ana = { id: 'u1', nombre: 'Ana' };
const CODIGOS = ['AAAA-BBBB-CCCC-DDDD', 'EEEE-FFFF-GGGG-HHHH'];

beforeEach(() => vi.resetAllMocks());

describe('FormEntrar', () => {
  it('entra con el nombre y la contraseña y va a jugar', async () => {
    vi.mocked(entrar).mockResolvedValue(ana);
    const usuario = userEvent.setup();
    render(<FormEntrar />);

    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled();
    await usuario.type(screen.getByLabelText('Nombre'), ' Ana ');
    await usuario.type(screen.getByLabelText('Contraseña'), 'una clave larga');
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(entrar).toHaveBeenCalledWith('Ana', 'una clave larga');
    expect(push).toHaveBeenCalledWith('/jugar');
  });

  it('si el servidor rechaza, muestra el motivo y deja reintentar', async () => {
    vi.mocked(entrar).mockRejectedValue(new ErrorApi(401, 'Nombre o contraseña incorrectos'));
    const usuario = userEvent.setup();
    render(<FormEntrar />);

    await usuario.type(screen.getByLabelText('Nombre'), 'Ana');
    await usuario.type(screen.getByLabelText('Contraseña'), 'mala');
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Nombre o contraseña incorrectos');
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
    expect(push).not.toHaveBeenCalled();
  });

  it('enlaza a crear cuenta y a recuperar la contraseña', () => {
    render(<FormEntrar />);

    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '/registro');
    expect(screen.getByRole('link', { name: 'Olvidé mi contraseña' })).toHaveAttribute(
      'href',
      '/recuperar',
    );
  });
});

describe('FormRegistro', () => {
  async function rellenar(usuario: ReturnType<typeof userEvent.setup>, clave = 'una clave larga') {
    await usuario.type(screen.getByLabelText('Nombre'), 'Ana');
    await usuario.type(screen.getByLabelText('Contraseña'), clave);
    await usuario.type(screen.getByLabelText('Repite la contraseña'), clave);
  }

  it('no deja crear si la contraseña es corta o no coincide, y lo dice', async () => {
    const usuario = userEvent.setup();
    render(<FormRegistro />);

    await usuario.type(screen.getByLabelText('Nombre'), 'Ana');
    await usuario.type(screen.getByLabelText('Contraseña'), 'corta');
    expect(screen.getByRole('alert')).toHaveTextContent('al menos 8 caracteres');
    await usuario.clear(screen.getByLabelText('Contraseña'));
    await usuario.type(screen.getByLabelText('Contraseña'), 'una clave larga');
    await usuario.type(screen.getByLabelText('Repite la contraseña'), 'otra clave larga');

    expect(screen.getByRole('alert')).toHaveTextContent('no coinciden');
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeDisabled();
  });

  it('crea la cuenta, muestra los códigos y solo deja seguir tras confirmar que se guardaron', async () => {
    vi.mocked(registrar).mockResolvedValue({ usuario: ana, codigos: CODIGOS });
    const usuario = userEvent.setup();
    render(<FormRegistro />);

    await rellenar(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(registrar).toHaveBeenCalledWith('Ana', 'una clave larga', undefined);
    expect(await screen.findByText('AAAA-BBBB-CCCC-DDDD')).toBeInTheDocument();
    const seguir = screen.getByRole('button', { name: 'Ir a jugar' });
    expect(seguir).toBeDisabled();
    await usuario.click(screen.getByRole('checkbox', { name: 'Ya los guardé' }));
    await usuario.click(seguir);
    expect(push).toHaveBeenCalledWith('/jugar');
  });

  it('con el registro cerrado, pide el código de la casa y lo manda', async () => {
    vi.mocked(registrar)
      .mockRejectedValueOnce(new ErrorApi(403, 'El registro está cerrado'))
      .mockResolvedValueOnce({ usuario: ana, codigos: CODIGOS });
    const usuario = userEvent.setup();
    render(<FormRegistro />);

    await rellenar(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    await usuario.type(await screen.findByLabelText('Código de la casa'), 'familia-2026');
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(registrar).toHaveBeenLastCalledWith('Ana', 'una clave larga', 'familia-2026');
    expect(await screen.findByText('AAAA-BBBB-CCCC-DDDD')).toBeInTheDocument();
  });

  it('un nombre repetido muestra el aviso del servidor', async () => {
    vi.mocked(registrar).mockRejectedValue(new ErrorApi(409, 'Ese nombre ya está en uso'));
    const usuario = userEvent.setup();
    render(<FormRegistro />);

    await rellenar(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Ese nombre ya está en uso');
  });
});

describe('FormRecuperar', () => {
  it('cambia la contraseña con un código y dice cuántos quedan', async () => {
    vi.mocked(recuperar).mockResolvedValue({ usuario: ana, codigosRestantes: 1 });
    const usuario = userEvent.setup();
    render(<FormRecuperar />);

    await usuario.type(screen.getByLabelText('Nombre'), 'Ana');
    await usuario.type(screen.getByLabelText('Código de recuperación'), 'aaaa-bbbb-cccc-dddd');
    await usuario.type(screen.getByLabelText('Contraseña nueva'), 'una clave nueva');
    await usuario.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    expect(recuperar).toHaveBeenCalledWith('Ana', 'aaaa-bbbb-cccc-dddd', 'una clave nueva');
    expect(await screen.findByText(/Te quedan 1 código\./)).toBeInTheDocument();
    expect(screen.getByText(/Pide unos nuevos en tu perfil/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a mi perfil' })).toHaveAttribute('href', '/perfil');
  });

  it('un código malo muestra el motivo', async () => {
    vi.mocked(recuperar).mockRejectedValue(new ErrorApi(401, 'Nombre o código incorrectos'));
    const usuario = userEvent.setup();
    render(<FormRecuperar />);

    await usuario.type(screen.getByLabelText('Nombre'), 'Ana');
    await usuario.type(screen.getByLabelText('Código de recuperación'), 'xxxx');
    await usuario.type(screen.getByLabelText('Contraseña nueva'), 'una clave nueva');
    await usuario.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Nombre o código incorrectos');
  });
});
