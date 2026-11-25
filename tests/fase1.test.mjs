import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = new URL('../js/', import.meta.url).href;
const dades = await import(`${base}dades.js?v=17`);
const progres = await import(`${base}progres.js?v=17`);
const repas = await import(`${base}repas.js?v=17`);
const fitxer = new URL('../contingut/phrasals.json', import.meta.url);
const dadesReals = JSON.parse(readFileSync(fitxer, 'utf8'));

function storageFake(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    map
  };
}

function elementFake(tag = 'div') {
  return {
    tagName: tag.toUpperCase(),
    nodeType: 1,
    textContent: '',
    children: [],
    attributes: {},
    dataset: {},
    style: {},
    hidden: false,
    listeners: {},
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener(tipus, funcio) { (this.listeners[tipus] ??= []).push(funcio); },
    clica() { for (const funcio of this.listeners.click ?? []) funcio({ preventDefault() {} }); },
    append(...nodes) { this.children.push(...nodes); },
    replaceChildren(...nodes) { this.children = nodes; },
    setAttribute(clau, valor) { this.attributes[clau] = valor; },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    focus() {}
  };
}

function domFake() {
  const nodes = new Map();
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, elementFake());
      return nodes.get(id);
    },
    createElement: (tag) => elementFake(tag),
    createTextNode: (text) => ({ nodeType: 3, textContent: text }),
    querySelector: () => elementFake(),
    querySelectorAll: () => [],
    addEventListener() {},
    activeElement: null
  };
  return { nodes, document };
}

const petit = [
  { id: 'a', phrasal: 'get up', verb: 'get', particula: 'up', tema: 'quotidia', nivell: 1, significat: 'aixecar-se' },
  { id: 'b', phrasal: 'get on', verb: 'get', particula: 'on', tema: 'quotidia', nivell: 2, significat: 'pujar' },
  { id: 'c', phrasal: 'look up', verb: 'look', particula: 'up', tema: 'estudis', nivell: 1, significat: 'buscar' },
  { id: 'd', phrasal: 'turn off', verb: 'turn', particula: 'off', tema: 'tecnologia', nivell: 3, significat: 'apagar' }
];

test('carregaConjunt demana la ruta relativa amb versió', async () => {
  const original = globalThis.fetch;
  let url;
  globalThis.fetch = async (u) => {
    url = u;
    return { ok: true, json: async () => dadesReals };
  };
  try {
    const resultat = await dades.carregaConjunt('phrasals');
    assert.equal(url, 'contingut/phrasals.json?v=3');
    assert.equal(resultat.phrasals.length, 161);
  } finally {
    globalThis.fetch = original;
  }
});

test('VERSIO_DADES és 3 perquè les dades han canviat', () => {
  assert.equal(dades.VERSIO_DADES, 3);
});

test('carregaConjunt rebutja una resposta fallida', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 404 });
  try {
    await assert.rejects(() => dades.carregaConjunt('phrasals'), /contingut\/phrasals/);
  } finally {
    globalThis.fetch = original;
  }
});

test('comptaPerVerb troba 12 phrasals amb verb get', () => {
  const comptatge = dades.comptaPerVerb(dadesReals.phrasals);
  assert.equal(comptatge.find((x) => x.valor === 'get').quantitat, 12);
  assert.deepEqual(comptatge.map((x) => x.quantitat), [...comptatge.map((x) => x.quantitat)].sort((a, b) => b - a));
});

test('filtraConjunt filtra per verb, tema, nivell, preferits i fallats', () => {
  const estat = { preferits: ['a'], leitner: { b: { caixa: 1 }, c: { caixa: 2 } } };
  assert.equal(dades.filtraConjunt(dadesReals.phrasals, 'verb:get', estat).length, 12);
  assert.deepEqual(dades.filtraConjunt(petit, 'tema:estudis', estat).map((x) => x.id), ['c']);
  assert.deepEqual(dades.filtraConjunt(petit, 'nivell:3', estat).map((x) => x.id), ['d']);
  assert.deepEqual(dades.filtraConjunt(petit, 'favorits', estat).map((x) => x.id), ['a']);
  assert.deepEqual(dades.filtraConjunt(petit, 'fallats', estat).map((x) => x.id), ['b']);
  assert.equal(dades.filtraConjunt(petit, 'tots', estat).length, 4);
});

test('ordenaPerLeitner agrupa caixa 1, nous, caixa 2 i caixa 3 i aplica el límit', () => {
  const leitner = { a: { caixa: 1 }, b: { caixa: 2 }, c: { caixa: 3 } };
  const ids = dades.ordenaPerLeitner(petit, leitner, 20, () => 0.5).map((x) => x.id);
  const grup = { a: 0, d: 1, b: 2, c: 3 };
  assert.deepEqual(ids.slice().sort(), ['a', 'b', 'c', 'd']);
  for (let i = 1; i < ids.length; i++) {
    assert.ok(grup[ids[i - 1]] <= grup[ids[i]], `ordre incorrecte: ${ids}`);
  }
  assert.equal(dades.ordenaPerLeitner(petit, leitner, 2, () => 0.5).length, 2);
});

test('l’exempleMarcat posa en negreta els trossos senars', () => {
  const documentAnterior = globalThis.document;
  const dom = domFake();
  globalThis.document = dom.document;
  globalThis.location = { hash: '#repas' };
  const entrada = {
    id: 'drop-off', phrasal: 'drop off', verb: 'drop', particula: 'off',
    significat: 'deixar', sinonim: 'leave', similars: [],
    exemple: 'My dad drops me off at school',
    exempleMarcat: 'My dad **drops** me **off** at school',
    forat: 'My dad ___ me ___ at school', traduccio: 'El meu pare em deixa a l’escola',
    tema: 'quotidia', nivell: 1
  };
  try {
    repas.iniciaRepas({ estat: progres.estatPerDefecte(), phrasals: [entrada], desa() {}, avisa() {} });
    dom.nodes.get('repas-comenca').clica();
    const fills = dom.nodes.get('targeta-exemple').children;
    assert.deepEqual(fills.map((fill) => fill.textContent), ['My dad ', 'drops', ' me ', 'off', ' at school']);
    assert.deepEqual(fills.map((fill) => fill.tagName ?? 'text'), ['text', 'STRONG', 'text', 'STRONG', 'text']);
  } finally {
    globalThis.document = documentAnterior;
  }
});

test('en continuar una sessió es conserven els fallats d’abans de la pausa', () => {
  const documentAnterior = globalThis.document;
  const aleatoriAnterior = Math.random;
  const storage = storageFake();
  globalThis.location = { hash: '#repas' };
  Math.random = () => 0.99;
  const targetes = [1, 2].map((n) => ({
    id: `prova-${n}`, phrasal: `prova ${n}`, verb: 'prova', particula: String(n),
    significat: `prova ${n}`, sinonim: 'test', similars: [], exemple: `Prova ${n}.`,
    exempleMarcat: `**Prova** ${n}.`, forat: `___ ${n}.`, traduccio: `Prova ${n}.`,
    tema: 'estudis', nivell: 1
  }));
  try {
    const dom1 = domFake();
    globalThis.document = dom1.document;
    const estat1 = progres.estatPerDefecte();
    repas.iniciaRepas({
      estat: estat1, phrasals: targetes,
      desa: () => progres.desaEstat(estat1, storage), avisa() {}
    });
    dom1.nodes.get('repas-comenca').clica();
    dom1.nodes.get('targeta').clica();
    dom1.nodes.get('boto-encara-no').clica();

    const dom2 = domFake();
    globalThis.document = dom2.document;
    const estat2 = progres.carregaEstat(storage);
    repas.iniciaRepas({
      estat: estat2, phrasals: targetes,
      desa: () => progres.desaEstat(estat2, storage), avisa() {}
    });
    dom2.nodes.get('repas-continuar').clica();
    dom2.nodes.get('targeta').clica();
    dom2.nodes.get('boto-encara-no').clica();
    assert.equal(dom2.nodes.get('repas-resum-text').textContent, '✅ 0 · ❌ 2');
    dom2.nodes.get('repas-repassa-fallats').clica();
    assert.equal(dom2.nodes.get('repas-progres').textContent, '1/2');
  } finally {
    globalThis.document = documentAnterior;
    Math.random = aleatoriAnterior;
  }
});

test('actualitzaLeitner puja, baixa i limita la caixa', () => {
  const estat = progres.estatPerDefecte();
  progres.actualitzaLeitner(estat, 'x', true, '2026-11-24');
  assert.equal(estat.leitner.x.caixa, 2);
  progres.actualitzaLeitner(estat, 'x', true, '2026-11-24');
  assert.equal(estat.leitner.x.caixa, 3);
  progres.actualitzaLeitner(estat, 'x', true, '2026-11-24');
  assert.equal(estat.leitner.x.caixa, 3);
  progres.actualitzaLeitner(estat, 'x', false, '2026-11-25');
  assert.deepEqual(estat.leitner.x, { caixa: 1, vist: '2026-11-25' });
});

test('carregaEstat retorna l’estat per defecte si no hi ha res desat', () => {
  const estat = progres.carregaEstat(storageFake());
  assert.equal(estat.versio, 1);
  assert.deepEqual(estat.leitner, {});
  assert.equal(estat.so, true);
});

test('carregaEstat reinicia si la versió no coincideix o el JSON està corrupte', () => {
  const storage = storageFake({ 'phrasalhero:v1': '{"versio":99,"leitner":{"x":{"caixa":3}}}' });
  assert.deepEqual(progres.carregaEstat(storage).leitner, {});
  const corrupte = storageFake({ 'phrasalhero:v1': '{no és json' });
  assert.deepEqual(progres.carregaEstat(corrupte).leitner, {});
});

test('carregaEstat sobreviu a un localStorage que llança excepcions', () => {
  const bloquejat = {
    getItem() { throw new Error('bloquejat'); },
    setItem() { throw new Error('bloquejat'); },
    removeItem() { throw new Error('bloquejat'); }
  };
  assert.equal(progres.carregaEstat(bloquejat).versio, 1);
  assert.equal(progres.desaEstat({ versio: 1 }, bloquejat), false);
});

test('desaEstat desa sota la clau única', () => {
  const storage = storageFake();
  const estat = progres.estatPerDefecte();
  assert.equal(progres.desaEstat(estat, storage), true);
  assert.equal(JSON.parse(storage.getItem('phrasalhero:v1')).versio, 1);
});

test('registraActivitat compta la ratxa de dies', () => {
  const estat = progres.estatPerDefecte();
  progres.registraActivitat(estat, '2026-11-24');
  assert.deepEqual(estat.ratxaDies, { ultimDia: '2026-11-24', dies: 1 });
  progres.registraActivitat(estat, '2026-11-24');
  assert.equal(estat.ratxaDies.dies, 1);
  progres.registraActivitat(estat, '2026-11-25');
  assert.equal(estat.ratxaDies.dies, 2);
  progres.registraActivitat(estat, '2026-11-28');
  assert.equal(estat.ratxaDies.dies, 1);
});

test('afegeixRecord conserva els cinc millors', () => {
  const estat = progres.estatPerDefecte();
  for (const punts of [100, 500, 200, 400, 300, 600, 50]) {
    progres.afegeixRecord(estat, { punts, encerts: 1, data: '2026-11-24T18:03:00' });
  }
  assert.deepEqual(estat.records.map((r) => r.punts), [600, 500, 400, 300, 200]);
});

test('alternaPreferit afegeix i treu', () => {
  const estat = progres.estatPerDefecte();
  progres.alternaPreferit(estat, 'put-off');
  assert.deepEqual(estat.preferits, ['put-off']);
  progres.alternaPreferit(estat, 'put-off');
  assert.deepEqual(estat.preferits, []);
});

test('la sessió de repàs es desa, es llegeix i s’esborra', () => {
  const storage = storageFake();
  const estat = progres.estatPerDefecte();
  progres.desaRepasEnCurs(estat, { ids: ['a', 'b'], index: 1, ok: 0, ko: 1, filtre: 'verb:get' });
  progres.desaEstat(estat, storage);
  assert.deepEqual(progres.llegeixRepasEnCurs(progres.carregaEstat(storage)), {
    ids: ['a', 'b'], index: 1, ok: 0, ko: 1, fallats: [], filtre: 'verb:get'
  });
  progres.desaRepasEnCurs(estat, null);
  progres.desaEstat(estat, storage);
  assert.equal(progres.llegeixRepasEnCurs(progres.carregaEstat(storage)), null);
});

test('llegeixRepasEnCurs recupera els fallats i accepta sessions sense aquest camp', () => {
  const estat = progres.estatPerDefecte();
  progres.desaRepasEnCurs(estat, { ids: ['a', 'b'], index: 1, ok: 0, ko: 1, fallats: ['a'], filtre: 'tots' });
  const storage = storageFake();
  progres.desaEstat(estat, storage);
  assert.deepEqual(progres.llegeixRepasEnCurs(progres.carregaEstat(storage)).fallats, ['a']);
  progres.desaRepasEnCurs(estat, { ids: ['a', 'b'], index: 1, ok: 0, ko: 1, filtre: 'tots' });
  assert.deepEqual(progres.llegeixRepasEnCurs(estat).fallats, []);
});

test('esborraProgres buida la clau i retorna l’estat inicial', () => {
  const storage = storageFake({ 'phrasalhero:v1': JSON.stringify(progres.estatPerDefecte()) });
  progres.esborraProgres(storage);
  assert.equal(storage.getItem('phrasalhero:v1'), null);
});
