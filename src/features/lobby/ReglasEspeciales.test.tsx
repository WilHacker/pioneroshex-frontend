import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReglasEspeciales } from './ReglasEspeciales';

const dibujar = (cambios: Partial<Parameters<typeof ReglasEspeciales>[0]> = {}) => {
  const onCambiar = vi.fn();
  render(<ReglasEspeciales opciones={{}} editable onCambiar={onCambiar} {...cambios} />);
  return { onCambiar, usuario: userEvent.setup() };
};

describe('ReglasEspeciales', () => {
  it('ofrece el ladrón amistoso con su explicación a la vista, apagado por defecto', () => {
    dibujar();
    const carta = screen.getByRole('button', { name: /Ladrón amistoso/ });
    expect(carta).toHaveAttribute('aria-pressed', 'false');
    expect(carta).toHaveAccessibleDescription(/menos de 3 puntos/i);
  });

  it('se ve activada cuando la sala ya la tiene', () => {
    dibujar({ opciones: { ladronAmistoso: true } });
    expect(screen.getByRole('button', { name: /Ladrón amistoso/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('al tocarla la activa y al volver a tocarla la apaga', async () => {
    const { usuario, onCambiar } = dibujar();
    await usuario.click(screen.getByRole('button', { name: /Ladrón amistoso/ }));
    expect(onCambiar).toHaveBeenLastCalledWith({ ladronAmistoso: true });
  });

  it('si ya estaba activa, tocarla manda falso', async () => {
    const { usuario, onCambiar } = dibujar({ opciones: { ladronAmistoso: true } });
    await usuario.click(screen.getByRole('button', { name: /Ladrón amistoso/ }));
    expect(onCambiar).toHaveBeenLastCalledWith({ ladronAmistoso: false });
  });

  it('quien no es anfitrión la ve pero no la puede cambiar', async () => {
    const { usuario, onCambiar } = dibujar({ editable: false });
    const carta = screen.getByRole('button', { name: /Ladrón amistoso/ });
    expect(carta).toBeDisabled();
    await usuario.click(carta);
    expect(onCambiar).not.toHaveBeenCalled();
  });

  it('es un grupo con nombre, para lectores de pantalla', () => {
    dibujar();
    expect(screen.getByRole('group', { name: 'Reglas especiales' })).toBeInTheDocument();
  });

  describe.each([
    ['Arranque protegido', 'arranqueProtegido', /sin 7/i],
    ['Ocultar cartas del Banco', 'ocultarBanco', /no se muestra cuántas cartas/i],
    ['Cartas a la vista', 'manosVisibles', /todos ven/i],
  ] as const)('%s', (titulo, clave, descripcion) => {
    it('sale apagada, con su explicación a la vista', () => {
      dibujar();
      const carta = screen.getByRole('button', { name: new RegExp(titulo) });
      expect(carta).toHaveAttribute('aria-pressed', 'false');
      expect(carta).toHaveAccessibleDescription(descripcion);
    });

    it('al tocarla manda su campo; si ya estaba activa, lo apaga', async () => {
      const apagada = dibujar();
      await apagada.usuario.click(screen.getByRole('button', { name: new RegExp(titulo) }));
      expect(apagada.onCambiar).toHaveBeenLastCalledWith({ [clave]: true });
    });

    it('se ve activada cuando la sala ya la tiene y se apaga al tocarla', async () => {
      const { usuario, onCambiar } = dibujar({ opciones: { [clave]: true } });
      const carta = screen.getByRole('button', { name: new RegExp(titulo) });
      expect(carta).toHaveAttribute('aria-pressed', 'true');
      await usuario.click(carta);
      expect(onCambiar).toHaveBeenLastCalledWith({ [clave]: false });
    });
  });

  it('las reglas son independientes: activar una no enciende otra', () => {
    dibujar({ opciones: { ocultarBanco: true } });
    expect(screen.getByRole('button', { name: /Ocultar cartas del Banco/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /Cartas a la vista/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: /Ladrón amistoso/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
