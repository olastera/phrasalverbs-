import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const arrel = new URL('../', import.meta.url);
const llegir = (p) => readFileSync(new URL(p, arrel), 'utf8');
const existeix = (p) => existsSync(new URL(p, arrel));

function versioIndex() {
  const html = llegir('index.html');
  const m = html.match(/js\/app\.js\?v=(\d+)/);
  assert.ok(m, 'index.html ha de tenir js/app.js?v=N');
  return m[1];
}

function midaPng(buf) {
  // PNG signature 8 bytes, IHDR chunk: length(4) type(4) width(4) height(4)
  assert.equal(buf.toString('hex', 0, 8), '89504e470d0a1a0a', 'signatura PNG');
  assert.equal(buf.toString('ascii', 12, 16), 'IHDR');
  return { amplada: buf.readUInt32BE(16), alcada: buf.readUInt32BE(20) };
}

test('manifest.webmanifest és JSON vàlid amb els camps de la fase 5', () => {
  const manifest = JSON.parse(llegir('manifest.webmanifest'));
  assert.equal(manifest.name, 'Phrasal Hero');
  assert.equal(manifest.short_name, 'Phrasal Hero');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.lang, 'ca');
  assert.equal(manifest.background_color, '#120a2e');
  assert.equal(manifest.theme_color, '#120a2e');
  assert.ok(Array.isArray(manifest.icons));
  const m192 = manifest.icons.find((i) => i.src === 'icon-192.png');
  const m512 = manifest.icons.find((i) => i.src === 'icon-512.png');
  assert.ok(m192, 'falta icon-192.png al manifest');
  assert.ok(m512, 'falta icon-512.png al manifest');
  assert.equal(m192.purpose, 'any maskable');
  assert.equal(m512.purpose, 'any maskable');
});

test('les icones existeixen amb la mida correcta', () => {
  for (const [nom, mida] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
    assert.ok(existeix(nom), `falta ${nom}`);
    const buf = readFileSync(new URL(nom, arrel));
    const dim = midaPng(buf);
    assert.equal(dim.amplada, mida, `${nom} amplada`);
    assert.equal(dim.alcada, mida, `${nom} alçada`);
  }
});

test('sw.js té el nom de memòria cau amb la mateixa versió que index.html', () => {
  const v = versioIndex();
  const sw = llegir('sw.js');
  assert.match(sw, new RegExp(`phrasalhero-v${v}\\b`), 'nom de cache amb versió');
});

test('sw.js llista fitxers existents i sense rutes absolutes', () => {
  const sw = llegir('sw.js');
  const llistaMatch = sw.match(/const SHELL\s*=\s*\[(.*?)\];/s);
  assert.ok(llistaMatch, 'no s’ha trobat SHELL');
  const entrades = [...llistaMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(entrades.length > 0);
  for (const e of entrades) {
    assert.doesNotMatch(e, /^https?:/i, `ruta absoluta http: ${e}`);
    assert.equal(e.startsWith('/'), false, `ruta absoluta /: ${e}`);
    const rutaFitxer = e.replace(/[?#].*$/, '');
    assert.ok(existeix(rutaFitxer), `falta fitxer de SHELL: ${rutaFitxer}`);
  }
});

test('sw.js comprova api/ abans de respondWith i només GET del mateix origen', () => {
  const sw = llegir('sw.js');
  const idxApi = sw.indexOf('/api/');
  const idxRespond = sw.indexOf('respondWith');
  assert.ok(idxApi !== -1, 'falta comprovació /api/');
  assert.ok(idxRespond !== -1, 'falta respondWith');
  assert.ok(idxApi < idxRespond, 'la comprovació api/ ha d’anar abans de respondWith');
  assert.match(sw, /event\.request\.method\s*!==\s*'GET'/);
});

test('index.html enllaça manifest i apple-touch-icon; app.js registra sw.js amb versió actual', () => {
  const v = versioIndex();
  const html = llegir('index.html');
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /<link rel="apple-touch-icon" href="apple-touch-icon\.png">/);
  assert.match(html, /apple-mobile-web-app-capable/);
  assert.match(html, /apple-mobile-web-app-title/);
  const app = llegir('js/app.js');
  assert.match(app, new RegExp(`serviceWorker\\.register\\('sw\\.js\\?v=${v}'\\)`));
  assert.match(app, /serviceWorker'\s+in\s+navigator/);
});
