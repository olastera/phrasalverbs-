import test from 'node:test';
import assert from 'node:assert/strict';
import { iniciaAnalitica, registra, registraPantalla, GA_ID } from '../js/analitica.js?v=17';

function finestraFalsa(hostname) {
  const afegits = [];
  return {
    location: { hostname },
    document: { createElement: () => ({}), head: { append: (el) => afegits.push(el) } },
    afegits
  };
}

test('fora de producció (Pi, local) no carrega res', () => {
  for (const host of ['pi.iespai.com', 'localhost', '127.0.0.1']) {
    const f = finestraFalsa(host);
    assert.equal(iniciaAnalitica({ finestra: f }), false);
    assert.equal(f.gtag, undefined);
    assert.equal(f.afegits.length, 0);
  }
});

test('a producció carrega GA4 sense galetes ni senyals de Google', () => {
  const f = finestraFalsa('www.iespai.com');
  assert.equal(iniciaAnalitica({ finestra: f }), true);
  assert.equal(f.afegits.length, 1);
  assert.equal(f.afegits[0].src, `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);
  const config = [...f.dataLayer].map((a) => [...a]).find((a) => a[0] === 'config');
  assert.equal(config[1], GA_ID);
  assert.equal(config[2].client_storage, 'none');
  assert.equal(config[2].allow_google_signals, false);
  assert.equal(config[2].allow_ad_personalization_signals, false);
  assert.equal(config[2].send_page_view, false);
});

test('registra no fa res sense gtag i no llança mai', () => {
  assert.doesNotThrow(() => registra('x', {}, {}));
  assert.doesNotThrow(() => registra('x', {}, { gtag() { throw new Error('bloquejat'); } }));
  const crides = [];
  const f = { gtag: (...a) => crides.push(a) };
  registraPantalla('diccionari', f);
  assert.deepEqual(crides[0][0], 'event');
  assert.equal(crides[0][1], 'page_view');
  assert.match(crides[0][2].page_location, /phrasalverbs\/#diccionari$/);
});
