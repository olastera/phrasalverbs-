import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const arrel = new URL('../', import.meta.url);
const base = new URL('../js/', import.meta.url).href;
const llegir = (nom) => readFileSync(new URL(nom, arrel), 'utf8');
const carregaDiccionari = () => import(`${base}diccionari.js?v=17`);
const dades = await import(`${base}dades.js?v=17`);
const progres = await import(`${base}progres.js?v=17`);
const dadesReals = JSON.parse(llegir('contingut/phrasals.json')).phrasals;

function fills(node) {
  return (node?.children ?? [])
    .filter((fill) => fill.nodeType !== 3)
    .flatMap((fill) => [fill, ...fills(fill)]);
}

function textDe(node) {
  if (!node) return '';
  if (node.nodeType === 3) return node.textContent;
  if (!node.children?.length) return node.textContent ?? '';
  return node.children.map(textDe).join('');
}

function elementFake(tag = 'div') {
  const classes = new Set();
  return {
    tagName: tag.toUpperCase(),
    nodeType: 1,
    textContent: '',
    set className(valor) {
      classes.clear();
      String(valor).split(/\s+/).filter(Boolean).forEach((classe) => classes.add(classe));
    },
    get className() { return [...classes].join(' '); },
    children: [],
    attributes: {},
    dataset: {},
    style: {},
    hidden: false,
    disabled: false,
    value: '',
    listeners: {},
    classList: {
      add(classe) { classes.add(classe); },
      remove(classe) { classes.delete(classe); },
      contains(classe) { return classes.has(classe); },
      toggle(classe, forcat) {
        const actiu = forcat ?? !classes.has(classe);
        if (actiu) classes.add(classe);
        else classes.delete(classe);
        return actiu;
      }
    },
    addEventListener(tipus, funcio) { (this.listeners[tipus] ??= []).push(funcio); },
    dispara(tipus, esdeveniment = {}) {
      for (const funcio of this.listeners[tipus] ?? []) {
        funcio({ preventDefault() {}, target: this, ...esdeveniment });
      }
    },
    clica() { this.dispara('click'); },
    append(...nodes) { this.children.push(...nodes); },
    replaceChildren(...nodes) { this.children = nodes; },
    setAttribute(clau, valor) { this.attributes[clau] = String(valor); },
    getAttribute(clau) { return this.attributes[clau]; },
    querySelectorAll(selector) {
      if (selector === '.xip') return fills(this).filter((fill) => fill.classList.contains('xip'));
      return [];
    },
    querySelector() { return null; },
    scrollIntoView(opcions) { this.scroll = opcions; },
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
    addEventListener(tipus, funcio) { (this.listeners ??= {})[tipus] ??= []; this.listeners[tipus].push(funcio); },
    dispara(tipus, esdeveniment = {}) {
      for (const funcio of this.listeners?.[tipus] ?? []) funcio({ preventDefault() {}, ...esdeveniment });
    },
    activeElement: null
  };
  return { nodes, document };
}

async function prepara(options = {}) {
  const globals = {
    document: globalThis.document,
    location: globalThis.location,
    speechSynthesis: globalThis.speechSynthesis,
    SpeechSynthesisUtterance: globalThis.SpeechSynthesisUtterance
  };
  const dom = domFake();
  globalThis.document = dom.document;
  globalThis.location = { hash: '#diccionari' };
  const estat = progres.estatPerDefecte();
  Object.assign(estat.leitner, options.leitner ?? {});
  Object.assign(estat.preferits, options.preferits ?? []);
  const navegacions = [];
  const repasses = [];
  const parles = [];
  const desades = [];
  const avisos = [];
  const repas = {
    comenca(...args) { repasses.push(args); },
    mostra() { repasses.push(['mostra']); }
  };
  const { iniciaDiccionari } = await carregaDiccionari();
  const opcions = {
    estat,
    phrasals: options.phrasals ?? dadesReals,
    desa: () => desades.push(true),
    avisa: (text) => avisos.push(text),
    navega: (hash) => { navegacions.push(hash); globalThis.location.hash = hash; },
    repas,
    aleatori: () => 0.5
  };
  if (!options.senseInjeccio) {
    opcions.parla = (text) => parles.push(text);
    opcions.teVeuAnglesa = options.teVeuAnglesa ?? (() => true);
  }
  const diccionari = iniciaDiccionari(opcions);
  diccionari.mostra();
  const api = {
    diccionari, dom, estat, navegacions, repasses, parles, desades, avisos,
    neteja() {
      for (const [clau, valor] of Object.entries(globals)) {
        if (valor === undefined) delete globalThis[clau];
        else globalThis[clau] = valor;
      }
    }
  };
  return api;
}

function node(api, id) {
  return api.dom.nodes.get(id);
}

function files(api) {
  return node(api, 'diccionari-llista').children;
}

function botons(api, text) {
  return fills(node(api, 'diccionari-llista')).filter((fill) => fill.tagName === 'BUTTON' && textDe(fill) === text);
}

function xip(api, valor) {
  return fills(node(api, 'diccionari-filtres')).find((fill) => fill.dataset.filtre === valor);
}

test('normalitza treu accents, majúscules, guions, apòstrofs, l·l i espais', async () => {
  const { normalitza } = await carregaDiccionari();
  assert.equal(normalitza('Rendir-SE!'), 'rendir se');
  assert.equal(normalitza('  DON’T   stop  '), 'don t stop');
  assert.equal(normalitza("L'ÀNIMA l·luminosa"), 'l anima lluminosa');
  assert.equal(normalitza('ÀÉÍÓÚÇÑ'), 'aeioucn');
  assert.equal(normalitza('   '), '');
});

test('cercaPhrasals troba give up en anglès amb majúscules i en català', async () => {
  const { cercaPhrasals } = await carregaDiccionari();
  assert.equal(cercaPhrasals(dadesReals, 'give up')[0].id, 'give-up');
  assert.equal(cercaPhrasals(dadesReals, 'GIVE UP')[0].id, 'give-up');
  assert.ok(cercaPhrasals(dadesReals, 'rendir').some((entry) => entry.id === 'give-up'));
});

test('cercaPhrasals troba put-off per sinònim i per significat', async () => {
  const { cercaPhrasals } = await carregaDiccionari();
  assert.equal(cercaPhrasals(dadesReals, 'postpone')[0].id, 'put-off');
  assert.equal(cercaPhrasals(dadesReals, 'ajornar')[0].id, 'put-off');
});

test('cercaPhrasals amb consulta buida retorna els 161 per ordre alfabètic', async () => {
  const { cercaPhrasals } = await carregaDiccionari();
  const resultat = cercaPhrasals(dadesReals, '   ');
  assert.equal(resultat.length, 161);
  const ordenats = resultat.map((entry) => entry.phrasal).sort((a, b) => a.localeCompare(b, 'ca'));
  assert.deepEqual(resultat.map((entry) => entry.phrasal), ordenats);
  assert.equal(resultat[0].phrasal, 'back up');
});

test('cercaPhrasals amb una consulta absurda retorna una llista buida', async () => {
  const { cercaPhrasals } = await carregaDiccionari();
  assert.deepEqual(cercaPhrasals(dadesReals, 'zzzzzzqqq'), []);
});

test('cercaPhrasals ordena per rellevància i després alfabèticament', async () => {
  const { cercaPhrasals } = await carregaDiccionari();
  const phrasals = [
    { id: 'exemple', phrasal: 'zzz', sinonim: 'x', significat: 'x', exemple: 'prova', traduccio: 'x' },
    { id: 'significat', phrasal: 'yyy', sinonim: 'x', significat: 'prova', exemple: 'x', traduccio: 'x' },
    { id: 'sinonim', phrasal: 'xxx', sinonim: 'prova', significat: 'x', exemple: 'x', traduccio: 'x' },
    { id: 'conté', phrasal: 'la prova', sinonim: 'x', significat: 'x', exemple: 'x', traduccio: 'x' },
    { id: 'comença', phrasal: 'prova ja', sinonim: 'x', significat: 'x', exemple: 'x', traduccio: 'x' },
    { id: 'traduccio', phrasal: 'www', sinonim: 'x', significat: 'x', exemple: 'x', traduccio: 'prova' }
  ];
  assert.deepEqual(cercaPhrasals(phrasals, 'prova').map((entry) => entry.id), [
    'comença', 'conté', 'sinonim', 'significat', 'exemple', 'traduccio'
  ]);
});

test('semblants és simètric, sense repetits, sense ell mateix ni ids inexistents', async () => {
  const { semblants } = await carregaDiccionari();
  const phrasals = [
    { id: 'a', phrasal: 'z zeta', similars: ['b', 'fantasma', 'a', 'b'] },
    { id: 'b', phrasal: 'b beta', similars: [] },
    { id: 'c', phrasal: 'c gamma', similars: ['a'] }
  ];
  assert.deepEqual(semblants(phrasals, 'a').map((entry) => entry.id), ['b', 'c']);
  assert.deepEqual(semblants(phrasals, 'b').map((entry) => entry.id), ['a']);
  assert.deepEqual(semblants(phrasals, 'fantasma'), []);
});

test('semblants amb dades reals retorna go on i keep on per a carry-on', async () => {
  const { semblants } = await carregaDiccionari();
  assert.deepEqual(semblants(dadesReals, 'carry-on').map((entry) => entry.id), ['go-on', 'keep-on']);
});

test('index.html té la pantalla, el quart botó i la capçalera del diccionari', () => {
  const html = llegir('index.html');
  assert.match(html, /<section id="diccionari" class="pantalla"/);
  assert.match(html, /<h2 id="titul-diccionari">📖 Diccionari<\/h2>/);
  assert.match(html, /href="#inici">← Inici/);
  assert.match(html, /id="diccionari-cerca"[^>]*type="search"|type="search"[^>]*id="diccionari-cerca"/);
  assert.match(html, /placeholder="Busca en anglès o en català…"/);
  assert.match(html, /autocomplete="off"/);
  assert.match(html, /enterkeyhint="search"/);
  const menu = html.match(/<div class="menu-principal">([\s\S]*?)<\/div>/)[1];
  const botons = [...menu.matchAll(/data-ruta="#([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(botons, ['repas', 'joc', 'ranking', 'diccionari']);
  assert.match(menu, /📖 <span>Diccionari<\/span>/);
});

test('totes les versions estàtiques són ?v=17', () => {
  const html = llegir('index.html');
  const css = llegir('css/estils.css');
  const app = llegir('js/app.js');
  const sw = llegir('sw.js');
  const versio = html.match(/js\/app\.js\?v=(\d+)/)[1];
  assert.match(html, /css\/estils\.css\?v=17/);
  assert.match(html, /js\/app\.js\?v=17/);
  assert.match(app, /dades\.js\?v=17/);
  assert.match(app, /diccionari\.js\?v=17/);
  assert.match(app, /repas\.js\?v=17/);
  assert.match(app, /ranking\.js\?v=17/);
  assert.match(app, /serviceWorker\.register\('sw\.js\?v=17'\)/);
  assert.match(sw, /phrasalhero-v17\b/);
  assert.match(sw, /js\/diccionari\.js\?v=17/);
  assert.match(sw, /css\/estils\.css\?v=17/);
  for (const fitxer of ['index.html', 'css/estils.css', 'js/app.js', 'js/dades.js', 'js/repas.js',
    'js/joc.js', 'js/progres.js', 'js/ranking.js', 'js/frases.js', 'js/so.js', 'js/filtres.js',
    'js/diccionari.js', 'sw.js']) {
    const codi = llegir(fitxer);
    assert.doesNotMatch(codi, /\?v=15\b/, `${fitxer} encara té ?v=15`);
    if (fitxer.endsWith('.js') && fitxer !== 'sw.js' && fitxer !== 'js/ranking.js') {
      for (const imp of codi.matchAll(/from '\.\/[\w-]+\.js\?v=(\d+)'/g)) {
        assert.equal(imp[1], versio, `import antic a ${fitxer}`);
      }
    }
  }
});

test('sw.js inclou el mòdul nou i la fitxa continua sent accessible sense connexió', () => {
  const sw = llegir('sw.js');
  const entrades = [...sw.match(/const SHELL\s*=\s*\[(.*?)\];/s)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(entrades.includes('js/diccionari.js?v=17'));
  assert.ok(entrades.includes('index.html'));
  assert.ok(existsSync(new URL('../js/diccionari.js', import.meta.url)));
});

test('el CSS del diccionari i el menú de 4 botons funcionen a 360 px', () => {
  const css = llegir('css/estils.css');
  assert.match(css, /\.menu-principal \{[^}]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/s);
  assert.match(css, /\.diccionari-phrasal \{[^}]*overflow-wrap: anywhere/s);
  assert.match(css, /\.diccionari-significat \{[^}]*text-overflow: ellipsis/s);
  assert.match(css, /\.diccionari-fila \{[^}]*min-width: 0/s);
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('mostra pinta els 161 phrasals amb recompte i emoji de caixa Leitner', async () => {
  const api = await prepara({ leitner: { 'give-up': { caixa: 3 } } });
  try {
    assert.equal(files(api).length, 161);
    assert.equal(node(api, 'diccionari-compta').textContent, '161 phrasals');
    const fila = files(api).find((entry) => textDe(entry).includes('give up'));
    assert.ok(fila);
    assert.match(textDe(fila), /🧠/);
    assert.equal(fila.children[0].getAttribute('aria-expanded'), 'false');
    const nova = files(api).find((entry) => textDe(entry).includes('put off'));
    assert.match(textDe(nova), /🆕/);
  } finally {
    api.neteja();
  }
});

test('mostra reutilitza els xips de Repassar i els té plegats sota 🎛️ Filtres', async () => {
  const api = await prepara();
  try {
    assert.equal(node(api, 'diccionari-filtres').hidden, true);
    assert.equal(node(api, 'diccionari-filtres-boto').getAttribute('aria-expanded'), 'false');
    node(api, 'diccionari-filtres-boto').clica();
    assert.equal(node(api, 'diccionari-filtres').hidden, false);
    assert.equal(node(api, 'diccionari-filtres-boto').getAttribute('aria-expanded'), 'true');
    const grups = fills(node(api, 'diccionari-filtres')).filter((fill) => fill.classList.contains('grup-filtres'));
    assert.equal(grups.length, 4);
    assert.deepEqual(grups.map((grup) => textDe(grup.children[0])), [
      '🎯 Resultats', '🔤 Per verb base', '🏷️ Per tema', '📈 Per nivell'
    ]);
    assert.ok(xip(api, 'tots'));
    assert.ok(xip(api, 'favorits'));
    assert.ok(xip(api, 'fallats'));
    assert.ok(xip(api, 'verb:get'));
    assert.ok(xip(api, 'tema:estudis'));
    assert.ok(xip(api, 'nivell:1'));
  } finally {
    api.neteja();
  }
});

test('la cerca respon a cada input i Esc buida el camp', async () => {
  const api = await prepara();
  try {
    const cerca = node(api, 'diccionari-cerca');
    cerca.value = 'GIVE UP';
    cerca.dispara('input');
    assert.equal(files(api)[0].children[0].getAttribute('data-id'), 'give-up');
    assert.match(node(api, 'diccionari-compta').textContent, /resultats/);
    globalThis.document.activeElement = cerca;
    globalThis.document.dispara('keydown', { key: 'Escape' });
    assert.equal(cerca.value, '');
    assert.equal(files(api).length, 161);
    assert.equal(node(api, 'diccionari-compta').textContent, '161 phrasals');
  } finally {
    api.neteja();
  }
});

test('el filtre i la cerca es combinen i es posen a zero en tornar-hi', async () => {
  const api = await prepara();
  try {
    xip(api, 'verb:get').clica();
    assert.equal(files(api).length, 12);
    assert.equal(node(api, 'diccionari-compta').textContent, '12 resultats');
    node(api, 'diccionari-cerca').value = 'up';
    node(api, 'diccionari-cerca').dispara('input');
    assert.ok(files(api).length > 0 && files(api).length < 12);
    assert.ok(files(api).every((fila) => textDe(fila).includes('get')));
    globalThis.location.hash = '#inici';
    globalThis.location.hash = '#diccionari';
    api.diccionari.mostra();
    assert.equal(files(api).length, 161);
    assert.equal(node(api, 'diccionari-cerca').value, '');
    assert.equal(xip(api, 'tots').getAttribute('aria-pressed'), 'true');
  } finally {
    api.neteja();
  }
});

test('la fitxa mostra exemple en negreta, etiquetes i només una resta oberta', async () => {
  const api = await prepara({ phrasals: dadesReals.filter((entry) => ['give-up', 'put-off'].includes(entry.id)) });
  try {
    const primer = files(api)[0].children[0];
    primer.clica();
    assert.equal(primer.getAttribute('aria-expanded'), 'true');
    const detall = files(api)[0].children[1];
    assert.equal(detall.hidden, false);
    assert.ok(textDe(detall).includes('rendir-se'));
    assert.ok(textDe(detall).includes('≈'));
    assert.ok(textDe(detall).includes('🟢 Fàcil'));
    assert.ok(textDe(detall).includes('🥹 Sentiments'));
    const exemple = fills(detall).find((fill) => fill.classList.contains('diccionari-exemple'));
    assert.ok(fills(exemple).some((fill) => fill.tagName === 'STRONG' && fill.textContent === 'give up'));
    const segon = files(api)[1].children[0];
    segon.clica();
    assert.equal(primer.getAttribute('aria-expanded'), 'false');
    assert.equal(files(api)[0].children[1].hidden, true);
    assert.equal(segon.getAttribute('aria-expanded'), 'true');
    segon.clica();
    assert.equal(segon.getAttribute('aria-expanded'), 'false');
    assert.equal(files(api)[1].children[1].hidden, true);
  } finally {
    api.neteja();
  }
});

test('la ⭐ alterna el preferit, desa i actualitza el filtre ⭐', async () => {
  const api = await prepara({ phrasals: [dadesReals.find((entry) => entry.id === 'give-up')] });
  try {
    files(api)[0].children[0].clica();
    const estrella = botons(api, '⭐')[0];
    assert.ok(estrella);
    estrella.clica();
    assert.deepEqual(api.estat.preferits, ['give-up']);
    assert.equal(api.desades.length, 1);
    assert.equal(node(api, 'diccionari-cerca').value, '');
    const xipPreferits = xip(api, 'favorits');
    assert.match(textDe(xipPreferits), /1/);
    const estrellaNova = botons(api, '🌟')[0];
    assert.equal(estrellaNova.getAttribute('aria-pressed'), 'true');
    estrellaNova.clica();
    assert.deepEqual(api.estat.preferits, []);
  } finally {
    api.neteja();
  }
});

test('els botons 🔊 apareixen amb veu anglesa i cancel·len abans de parlar', async () => {
  globalThis.speechSynthesis = {
    cancel() { globalThis.cancelat = true; },
    speak(utterance) { globalThis.parlat = utterance; },
    getVoices: () => [{ lang: 'en-GB' }],
    addEventListener() {}
  };
  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) { this.text = text; }
  };
  const api = await prepara({ phrasals: [dadesReals.find((entry) => entry.id === 'give-up')] });
  try {
    files(api)[0].children[0].clica();
    assert.equal(botons(api, '🔊').length, 2);
    botons(api, '🔊')[0].clica();
    assert.deepEqual(api.parles, ['give up']);
    globalThis.cancelat = false;
    globalThis.parlat = null;
    globalThis.speechSynthesis.cancel = () => { globalThis.cancelat = true; };
    globalThis.speechSynthesis.speak = (utterance) => { globalThis.parlat = utterance; };
    const segon = await prepara({ phrasals: [dadesReals[0]], senseInjeccio: true });
    try {
      files(segon)[0].children[0].clica();
      botons(segon, '🔊')[0].clica();
    } finally {
      segon.neteja();
    }
    assert.equal(globalThis.cancelat, true);
    assert.equal(globalThis.parlat.text, dadesReals[0].phrasal);
    assert.equal(globalThis.parlat.lang, 'en-GB');
    assert.equal(globalThis.parlat.rate, 0.9);
  } finally {
    delete globalThis.cancelat;
    delete globalThis.parlat;
    api.neteja();
  }
});

test('sense veu anglesa no apareix cap botó 🔊', async () => {
  globalThis.speechSynthesis = { getVoices: () => [{ lang: 'es-ES' }], addEventListener() {} };
  const api = await prepara({ phrasals: [dadesReals.find((entry) => entry.id === 'give-up')], teVeuAnglesa: () => false });
  try {
    files(api)[0].children[0].clica();
    assert.equal(botons(api, '🔊').length, 0);
  } finally {
    api.neteja();
  }
});

test('🔗 obre el similar, buida cerca i filtre i hi fa scroll', async () => {
  const api = await prepara({ preferits: ['carry-on'] });
  try {
    node(api, 'diccionari-cerca').value = 'carry on';
    node(api, 'diccionari-cerca').dispara('input');
    xip(api, 'favorits').clica();
    files(api)[0].children[0].clica();
    const enllaç = botons(api, 'go on')[0];
    assert.ok(enllaç);
    enllaç.clica();
    assert.equal(node(api, 'diccionari-cerca').value, '');
    assert.equal(xip(api, 'tots').getAttribute('aria-pressed'), 'true');
    const fila = files(api).find((entry) => entry.children[0].getAttribute('data-id') === 'go-on');
    assert.equal(fila.children[0].getAttribute('aria-expanded'), 'true');
    assert.deepEqual(fila.scroll, { block: 'nearest' });
  } finally {
    api.neteja();
  }
});

test('un phrasal sense semblants no mostra l’apartat 🔗', async () => {
  const entrada = dadesReals.find((entry) => entry.id === 'put-off');
  const api = await prepara({ phrasals: [entrada] });
  try {
    files(api)[0].children[0].clica();
    assert.equal(botons(api, 'put off').length, 0);
    assert.doesNotMatch(textDe(files(api)[0].children[1]), /Es confon amb/);
  } finally {
    api.neteja();
  }
});

test('Repassa aquests ordena per Leitner, agafa 20 ids i obre Repassar', async () => {
  const api = await prepara({ leitner: { 'put-off': { caixa: 1 } } });
  try {
    const boto = node(api, 'diccionari-repassa');
    assert.equal(boto.textContent, "📚 Repassa'n 20");
    boto.clica();
    assert.deepEqual(api.navegacions, ['#repas']);
    const esperats = dades.ordenaPerLeitner(dadesReals, api.estat.leitner, 20, () => 0.5).map((entry) => entry.id);
    assert.deepEqual(api.repasses[0], [esperats, 'diccionari']);
    assert.deepEqual(api.repasses[1], ['mostra']);
    assert.equal(esperats.length, 20);
    assert.equal(esperats[0], 'put-off');
  } finally {
    api.neteja();
  }
});

test('Repassa aquests es desactiva sense resultats i torna a dir Repassa aquests amb pocs', async () => {
  const api = await prepara({ phrasals: [dadesReals[0], dadesReals[1]] });
  try {
    assert.equal(node(api, 'diccionari-repassa').textContent, '📚 Repassa aquests');
    node(api, 'diccionari-cerca').value = 'zzzzqqq';
    node(api, 'diccionari-cerca').dispara('input');
    assert.equal(node(api, 'diccionari-repassa').disabled, true);
    assert.equal(node(api, 'diccionari-buit').hidden, false);
    assert.match(textDe(node(api, 'diccionari-buit')), /🤷 Cap phrasal amb/);
    assert.match(textDe(node(api, 'diccionari-buit')), /zzzzqqq/);
  } finally {
    api.neteja();
  }
});

test('el text de l’usuari es posa amb textContent, mai amb innerHTML', async () => {
  const codi = llegir('js/diccionari.js');
  assert.doesNotMatch(codi, /innerHTML/);
  assert.doesNotMatch(codi, /localStorage/);
  const maliciós = {
    id: 'xss', phrasal: '<img src=x onerror=alert(1)>', verb: 'get', particula: 'x',
    sinonim: 'x', significat: '<script>alert(1)</script>', exemple: 'x', exempleMarcat: '**x**',
    traduccio: 'x', tema: 'estudis', nivell: 1, similars: []
  };
  const api = await prepara({ phrasals: [maliciós] });
  try {
    assert.equal(fills(node(api, 'diccionari-llista')).some((fill) => fill.tagName === 'IMG'), false);
    assert.ok(textDe(files(api)[0]).includes('<img src=x onerror=alert(1)>'));
    node(api, 'diccionari-cerca').value = '<img src=x onerror=alert(1)>';
    node(api, 'diccionari-cerca').dispara('input');
    assert.equal(fills(node(api, 'diccionari-llista')).some((fill) => fill.tagName === 'IMG'), false);
  } finally {
    api.neteja();
  }
});

test('consultar el diccionari no canvia la caixa Leitner ni desa res', async () => {
  const api = await prepara({ leitner: { 'give-up': { caixa: 1 } } });
  try {
    files(api)[0].children[0].clica();
    const details = files(api)[0].children[1];
    assert.deepEqual(api.estat.leitner, { 'give-up': { caixa: 1 } });
    assert.equal(api.desades.length, 0);
    assert.ok(textDe(details).includes('😵 El falles'));
  } finally {
    api.neteja();
  }
});
