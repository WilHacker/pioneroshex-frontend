import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Ayuda } from './Ayuda';

const dibujar = () =>
  render(
    <div>
      <Ayuda tema="Puntos para ganar">Quien llegue primero a esos puntos gana.</Ayuda>
      <button type="button">Otro</button>
    </div>,
  );

describe('Ayuda', () => {
  it('es un botón con nombre claro y el texto empieza oculto', () => {
    dibujar();
    const boton = screen.getByRole('button', { name: 'Qué significa «Puntos para ganar»' });
    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Quien llegue primero/)).not.toBeInTheDocument();
  });

  it('al tocarlo muestra la explicación y lo vuelve a ocultar al tocarlo otra vez', async () => {
    const usuario = userEvent.setup();
    dibujar();
    const boton = screen.getByRole('button', { name: /Puntos para ganar/ });

    await usuario.click(boton);
    expect(screen.getByText(/Quien llegue primero/)).toBeInTheDocument();
    expect(boton).toHaveAttribute('aria-expanded', 'true');

    await usuario.click(boton);
    expect(screen.queryByText(/Quien llegue primero/)).not.toBeInTheDocument();
  });

  it('se puede usar con el teclado y se cierra con Escape', async () => {
    const usuario = userEvent.setup();
    dibujar();
    await usuario.tab();
    await usuario.keyboard('{Enter}');
    expect(screen.getByText(/Quien llegue primero/)).toBeInTheDocument();

    await usuario.keyboard('{Escape}');
    expect(screen.queryByText(/Quien llegue primero/)).not.toBeInTheDocument();
  });

  it('se cierra al tocar fuera', async () => {
    const usuario = userEvent.setup();
    dibujar();
    await usuario.click(screen.getByRole('button', { name: /Puntos para ganar/ }));
    await usuario.click(screen.getByRole('button', { name: 'Otro' }));
    expect(screen.queryByText(/Quien llegue primero/)).not.toBeInTheDocument();
  });

  it('el botón queda asociado a la explicación para los lectores de pantalla', async () => {
    const usuario = userEvent.setup();
    dibujar();
    const boton = screen.getByRole('button', { name: /Puntos para ganar/ });
    await usuario.click(boton);
    const texto = screen.getByText(/Quien llegue primero/);
    expect(boton).toHaveAttribute('aria-controls', texto.id);
  });

  it('dos ayudas a la vez no comparten identificador', async () => {
    const usuario = userEvent.setup();
    render(
      <div>
        <Ayuda tema="A">uno</Ayuda>
        <Ayuda tema="B">dos</Ayuda>
      </div>,
    );
    await usuario.click(screen.getByRole('button', { name: /«A»/ }));
    await usuario.click(screen.getByRole('button', { name: /«B»/ }));
    // Abrir la segunda cierra la primera: solo hay una explicación a la vez.
    expect(screen.queryByText('uno')).not.toBeInTheDocument();
    expect(screen.getByText('dos')).toBeInTheDocument();
  });
});
