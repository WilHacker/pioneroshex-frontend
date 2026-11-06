import { entregasDe, parQueSuma, sumasQueEntregan } from './produccion';
import { mesaDePrueba, V1, V2 } from './pruebas';
import type { Vista } from './esquemas';

type Edificios = Vista['edificios'];

// mesaDePrueba: casilla 0,0 de BOSQUE con ficha 8 y un desierto en 1,0.
const poblado: Edificios = { [V1]: { dueno: 'j1', tipo: 'POBLADO' } };

describe('entregasDe', () => {
  it('entrega el recurso del terreno a quien tiene un edificio en la casilla', () => {
    const entregas = entregasDe(mesaDePrueba, poblado, null, 8);

    expect(entregas).toEqual([
      { clave: '0,0', centro: { x: 0, y: 0 }, recurso: 'MADERA', cantidad: 1 },
    ]);
  });

  it('una ciudad entrega el doble y los edificios de la misma casilla se suman', () => {
    const edificios: Edificios = {
      [V1]: { dueno: 'j1', tipo: 'CIUDAD' },
      [V2]: { dueno: 'j2', tipo: 'POBLADO' },
    };

    expect(entregasDe(mesaDePrueba, edificios, null, 8)[0]?.cantidad).toBe(3);
  });

  it('no entrega si sale otro número, si no hay edificios o si el ladrón está encima', () => {
    expect(entregasDe(mesaDePrueba, poblado, null, 6)).toEqual([]);
    expect(entregasDe(mesaDePrueba, {}, null, 8)).toEqual([]);
    expect(entregasDe(mesaDePrueba, poblado, { q: 0, r: 0, s: 0 }, 8)).toEqual([]);
  });
});

describe('sumasQueEntregan', () => {
  it('lista, sin repetir y ordenadas, las sumas que producirían algo', () => {
    expect(sumasQueEntregan(mesaDePrueba, poblado, null)).toEqual([8]);
    expect(sumasQueEntregan(mesaDePrueba, {}, null)).toEqual([]);
  });
});

describe('parQueSuma', () => {
  it('siempre da dos dados válidos que suman lo pedido, con cualquier azar', () => {
    for (let suma = 2; suma <= 12; suma += 1) {
      for (const azar of [0, 0.5, 0.999]) {
        const [a, b] = parQueSuma(suma, () => azar);

        expect(a + b).toBe(suma);
        expect([a, b].every((d) => d >= 1 && d <= 6)).toBe(true);
      }
    }
  });
});
