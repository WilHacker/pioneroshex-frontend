import { validarEnv } from './env';

describe('validarEnv', () => {
  it('acepta una URL válida', () => {
    expect(validarEnv({ NEXT_PUBLIC_API_URL: 'http://localhost:3001' })).toEqual({
      NEXT_PUBLIC_API_URL: 'http://localhost:3001',
    });
  });

  it('quita la barra final de la URL', () => {
    const env = validarEnv({ NEXT_PUBLIC_API_URL: 'https://api.ejemplo.com/' });

    expect(env.NEXT_PUBLIC_API_URL).toBe('https://api.ejemplo.com');
  });

  it('falla indicando la variable cuando falta NEXT_PUBLIC_API_URL', () => {
    expect(() => validarEnv({})).toThrow(/NEXT_PUBLIC_API_URL/);
  });

  it('rechaza una URL inválida', () => {
    expect(() => validarEnv({ NEXT_PUBLIC_API_URL: 'no-es-url' })).toThrow(/NEXT_PUBLIC_API_URL/);
  });
});
