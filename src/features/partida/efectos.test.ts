import { efectoDe } from './efectos';

describe('efectoDe', () => {
  it.each([
    [{ tipo: 'DADOS_TIRADOS' }, 'dados'],
    [{ tipo: 'POBLADO_COLOCADO' }, 'colocar'],
    [{ tipo: 'CIUDAD_COLOCADA' }, 'colocar'],
    [{ tipo: 'CAMINO_COLOCADO' }, 'colocar'],
    [{ tipo: 'LADRON_MOVIDO' }, 'colocar'],
    [{ tipo: 'CABALLERO_JUGADO' }, 'colocar'],
    [{ tipo: 'CONSTRUCCION_CARRETERAS_JUGADA' }, 'colocar'],
    [{ tipo: 'PARTIDA_GANADA' }, 'victoria'],
  ])('%j suena como %s', (evento, efecto) => {
    expect(efectoDe(evento, 'j1')).toBe(efecto);
  });

  it('recibir recursos solo suena si los recibo yo', () => {
    expect(efectoDe({ tipo: 'RECURSOS_REPARTIDOS', jugador: 'j1' }, 'j1')).toBe('ganar');
    expect(efectoDe({ tipo: 'RECURSOS_REPARTIDOS', jugador: 'j2' }, 'j1')).toBeNull();
  });

  it('una oferta de otro suena; la mía no', () => {
    expect(efectoDe({ tipo: 'TRATO_PROPUESTO', trato: { proponente: 'j2' } }, 'j1')).toBe('oferta');
    expect(efectoDe({ tipo: 'TRATO_PROPUESTO', trato: { proponente: 'j1' } }, 'j1')).toBeNull();
    expect(efectoDe({ tipo: 'TRATO_PROPUESTO' }, 'j1')).toBe('oferta');
  });

  it('lo demás no suena', () => {
    expect(efectoDe({ tipo: 'FASE_CAMBIADA' }, 'j1')).toBeNull();
    expect(efectoDe({ tipo: 'EVENTO_FUTURO' }, null)).toBeNull();
  });
});
