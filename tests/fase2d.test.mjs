import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = new URL('../js/', import.meta.url).href;
const carrega = (nom) => import(`${base}${nom}.js?v=14`);
const progres = await carrega('progres');
const dadesReals = JSON.parse(readFileSync(new URL('../contingut/phrasals.json', import.meta.url), 'utf8'));
const perId = new Map(dadesReals.phrasals.map((entry) => [entry.id, entry]));

function estatAmb(...records) {
  const estat = progres.estatPerDefecte();
  estat.records = records.map((punts) => ({ punts, encerts: 1, data: '2026-11-24T18:03:00' }));
  return estat;
}

function factoriaAudioFake() {
  const osciladors = [];
  let resumeCount = 0;
  class AudioContextFake {
    constructor() {
      this.currentTime = 0;
      this.state = 'suspended';
      this.destination = {};
      Contextos.push(this);
    }
    resume() { resumeCount += 1; this.state = 'running'; return Promise.resolve(); }
    createOscillator() {
      const oscilador = {
        frequency: { value: 0, setValueAtTime(valor) { this.value = valor; } },
        connect() {}, start() {}, stop() {}, tipus: ''
      };
      osciladors.push(oscilador);
      return oscilador;
    }
    createGain() {
      return { gain: { value: 0 }, connect() {} };
    }
  }
  const Contextos = [];
  return {
    AudioContextFake,
    osciladors,
    contexts: Contextos,
    get resumeCount() { return resumeCount; }
  };
}

test('un error al joc posa el phrasal a la caixa 1 i els encerts no la canvien', () => {
  const estat = estatAmb();
  estat.leitner = { 'get-up': { caixa: 3, vist: '2026-11-01' }, 'put-off': { caixa: 2, vist: '2026-11-01' } };
  progres.registraPartida(estat, {
    punts: 30, encerts: 4, errors: 1, fallats: ['get-up'], data: '2026-11-25T18:03:00', dia: '2026-11-25'
  });
  assert.equal(estat.leitner['get-up'].caixa, 1);
  assert.deepEqual(estat.leitner['put-off'], { caixa: 2, vist: '2026-11-01' });
});

test('en acabar una partida es desa el rècord, les estadístiques i la ratxa', () => {
  const estat = estatAmb(100, 300, 200, 250, 150, 400);
  progres.registraPartida(estat, {
    punts: 180, encerts: 12, errors: 3, fallats: [], data: '2026-11-25T18:03:00', dia: '2026-11-25'
  });
  assert.deepEqual(estat.records.map((r) => r.punts), [400, 300, 250, 200, 180]);
  assert.deepEqual(estat.records[4], { punts: 180, encerts: 12, data: '2026-11-25T18:03:00' });
  assert.deepEqual(estat.estadistiques, { partides: 1, encerts: 12, errors: 3 });
  assert.deepEqual(estat.ratxaDies, { ultimDia: '2026-11-25', dies: 1 });
});

test('nou rècord només si supera l’anterior i els punts són positius', () => {
  const estat = estatAmb(150);
  assert.equal(progres.registraPartida(estat, {
    punts: 150, encerts: 1, errors: 0, fallats: [], data: '2026-11-25T10:00:00', dia: '2026-11-25'
  }).nouRecord, false, 'empat amb el rècord anterior');
  assert.equal(progres.registraPartida(estat, {
    punts: 0, encerts: 0, errors: 3, fallats: [], data: '2026-11-25T10:00:00', dia: '2026-11-25'
  }).nouRecord, false, 'zero punts');
  assert.equal(progres.registraPartida(estat, {
    punts: 140, encerts: 1, errors: 1, fallats: [], data: '2026-11-25T10:00:00', dia: '2026-11-25'
  }).nouRecord, false, 'no supera el rècord empatat');
  assert.equal(progres.registraPartida(estat, {
    punts: 160, encerts: 2, errors: 0, fallats: [], data: '2026-11-25T10:00:00', dia: '2026-11-25'
  }).nouRecord, true, 'supera el rècord anterior');
});

test('creaSo no toca Web Audio fins a un gest i després desperta el context', async () => {
  const { creaSo } = await carrega('so');
  const audio = factoriaAudioFake();
  const so = creaSo({ activat: true, factoria: audio.AudioContextFake, navegador: {} });
  assert.equal(audio.contexts.length, 0);
  so.desperta();
  assert.equal(audio.contexts.length, 1);
  assert.equal(audio.resumeCount, 1);
  so.desperta();
  assert.equal(audio.contexts.length, 1);
});

test('creaSo genera sons d’encert, error, pujada i game over amb les freqüències esperades', async () => {
  const { creaSo } = await carrega('so');
  const audio = factoriaAudioFake();
  const so = creaSo({ activat: true, factoria: audio.AudioContextFake, navegador: {} });
  so.encert();
  assert.equal(audio.osciladors.length, 1);
  so.error();
  assert.equal(audio.osciladors.length, 2);
  const abansPujada = audio.osciladors.length;
  so.pujada();
  const freqsPujada = audio.osciladors.slice(abansPujada).map((o) => o.frequency.value);
  assert.equal(freqsPujada.length, 3);
  assert.deepEqual(freqsPujada, [...freqsPujada].sort((a, b) => a - b));
  const abansFi = audio.osciladors.length;
  so.gameOver();
  const freqsFi = audio.osciladors.slice(abansFi).map((o) => o.frequency.value);
  assert.equal(freqsFi.length, 4);
  assert.deepEqual(freqsFi, [...freqsFi].sort((a, b) => b - a));
});

test('creaSo vibra 80 ms en fallar només si el so està activat', async () => {
  const { creaSo } = await carrega('so');
  const vibracions = [];
  const navegador = { vibrate: (ms) => vibracions.push(ms) };
  const audio = factoriaAudioFake();
  const silenciat = creaSo({ activat: false, factoria: audio.AudioContextFake, navegador });
  silenciat.error();
  silenciat.desperta();
  assert.deepEqual(vibracions, []);
  assert.equal(audio.contexts.length, 0);
  const actiu = creaSo({ activat: true, factoria: audio.AudioContextFake, navegador });
  actiu.error();
  assert.deepEqual(vibracions, [80]);
});

test('creaSo no peta si no hi ha Web Audio ni vibrate i respecta un estat canviant', async () => {
  const { creaSo } = await carrega('so');
  let actiu = true;
  const so = creaSo({ activat: () => actiu, factoria: undefined, navegador: {} });
  assert.doesNotThrow(() => { so.desperta(); so.encert(); so.error(); so.pujada(); so.gameOver(); });
  actiu = false;
  assert.doesNotThrow(() => { so.encert(); so.error(); });
});

function elementFake(tag = 'div') {
  const classes = new Set();
  return {
    tagName: tag.toUpperCase(),
    nodeType: 1,
    textContent: '',
    children: [],
    attributes: {},
    dataset: {},
    classes,
    style: {},
    hidden: false,
    listeners: {},
    parentElement: null,
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
      toggle: (c, forca) => {
        const posar = forca ?? !classes.has(c);
        if (posar) classes.add(c);
        else classes.delete(c);
      }
    },
    addEventListener(tipus, funcio) { (this.listeners[tipus] ??= []).push(funcio); },
    clica() { for (const funcio of this.listeners.click ?? []) funcio({ preventDefault() {} }); },
    append(...nodes) { this.children.push(...nodes); },
    replaceChildren(...nodes) { this.children = nodes; },
    setAttribute(clau, valor) { this.attributes[clau] = valor; },
    querySelectorAll: () => [],
    querySelector: () => elementFake(),
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

function rellotgeFake() {
  let ara = 0;
  let interval = null;
  let properId = 2;
  const timeouts = [];
  return {
    ara: () => ara,
    cada: (ms, funcio) => { interval = { ms, funcio }; return 1; },
    atura: (id) => { if (id === 1) interval = null; },
    despres: (ms, funcio) => {
      const id = properId++;
      timeouts.push({ id, ms, funcio });
      return id;
    },
    cancela: (id) => {
      const index = timeouts.findIndex((pendent) => pendent.id === id);
      if (index >= 0) timeouts.splice(index, 1);
    },
    avanca(ms) {
      const fi = ara + ms;
      while (interval && ara + interval.ms <= fi) {
        ara += interval.ms;
        interval.funcio();
      }
      ara = fi;
    },
    disparaTimeout() { timeouts.shift()?.funcio(); },
    pendents() { return timeouts.length; },
    tempsPendent() { return timeouts[0]?.ms ?? null; }
  };
}

function soSpy() {
  const crides = [];
  return {
    crides,
    desperta() { crides.push('desperta'); },
    encert() { crides.push('encert'); },
    error() { crides.push('error'); },
    pujada() { crides.push('pujada'); },
    gameOver() { crides.push('gameOver'); }
  };
}

function entornJoc(opcions = {}) {
  const dom = domFake();
  const rellotge = rellotgeFake();
  const desats = [];
  const estat = progres.estatPerDefecte();
  const resultat = { navegat: null };
  return {
    dom,
    rellotge,
    desats,
    estat,
    resultat,
    node: (id) => dom.document.getElementById(id),
    opcions: {
      phrasals: dadesReals.phrasals,
      dom: dom.document,
      rellotge,
      estat,
      desa: () => desats.push(true),
      so: soSpy(),
      redueixMoviment: () => true,
      navega: (hash) => { resultat.navegat = hash; },
      aleatori: () => 0.5,
      ...opcions
    }
  };
}

function textDe(node) {
  if (!node) return '';
  return [node.textContent ?? '', ...(node.children ?? []).map(textDe)].join(' ');
}

function clicaResposta(entorn, correcte) {
  const preguntaNode = entorn.node('joc-pregunta');
  const entrada = entorn.opcions.phrasals.find((item) => item.id === preguntaNode.dataset.id);
  assert.ok(entrada, `Id desconegut: ${preguntaNode.dataset.id}`);
  const valor = preguntaNode.dataset.tipus === 'A'
    ? entrada.significat
    : preguntaNode.dataset.tipus === 'B'
      ? entrada.particula
      : entrada.phrasal;
  const botons = entorn.node('joc-opcions').children;
  const index = botons.findIndex((boto) => boto.textContent === valor);
  assert.notEqual(index, -1, `No s'ha trobat la resposta correcta: ${valor}`);
  botons[correcte ? index : (index === 0 ? 1 : 0)].clica();
  entorn.rellotge.disparaTimeout();
  return entrada;
}

const dosPhrasals = [
  { id: 'a', phrasal: 'get up', verb: 'get', particula: 'up', significat: 'aixecar-se', nivell: 1, similars: [] },
  { id: 'b', phrasal: 'get on', verb: 'get', particula: 'on', significat: 'pujar', nivell: 1, similars: [] }
];

test('els phrasals fallats surten al Game Over sense repetits i amb el significat', async () => {
  const entorn = entornJoc({ phrasals: dosPhrasals, aleatori: () => 0 });
  const joc = await carrega('joc');
  const partida = joc.iniciaJoc(entorn.opcions);
  partida.mostra();
  for (let i = 0; i < 3; i++) clicaResposta(entorn, false);
  assert.equal(entorn.resultat.navegat, '#gameover');
  assert.deepEqual(partida.fallats(), ['a', 'b']);
  const fills = entorn.node('gameover-fallats').children;
  assert.equal(fills.length, 2, `Fallats repetits: ${fills.map(textDe).join(' | ')}`);
  assert.ok(textDe(fills[0]).includes('aixecar-se'));
  assert.ok(textDe(fills[1]).includes('pujar'));
  assert.equal(entorn.node('gameover-repassa').hidden, false);
  assert.equal(entorn.estat.leitner.a.caixa, 1);
  assert.equal(entorn.estat.leitner.b.caixa, 1);
  assert.equal(entorn.desats.length, 1);
});

test('si no hi ha fallats, el Game Over mostra un missatge positiu i amaga el repàs', async () => {
  const entorn = entornJoc();
  const joc = await carrega('joc');
  joc.iniciaJoc(entorn.opcions).mostra();
  for (let i = 0; i < 3; i++) clicaResposta(entorn, true);
  entorn.rellotge.avanca(90000);
  assert.equal(entorn.resultat.navegat, '#gameover');
  assert.equal(entorn.node('gameover-fallats').children.length, 0);
  assert.equal(entorn.node('gameover-repassa').hidden, true);
  assert.equal(entorn.node('gameover-sense-fallats').hidden, false);
  assert.match(textDe(entorn.node('gameover-sense-fallats')), /cap fallat|perfecte|brutal/i);
});

test('els punts finals compten de 0 al total en un segon o directament amb moviment reduït', async () => {
  const joc = await carrega('joc');
  const entorn = entornJoc({ redueixMoviment: () => false });
  joc.iniciaJoc(entorn.opcions).mostra();
  for (let i = 0; i < 3; i++) clicaResposta(entorn, true);
  const total = Number(entorn.node('joc-punts').textContent);
  entorn.rellotge.avanca(90000);
  assert.equal(entorn.node('gameover-punts').textContent, '0');
  assert.ok(entorn.rellotge.pendents() >= 20);
  while (Number(entorn.node('gameover-punts').textContent) < total && entorn.rellotge.pendents() > 0) {
    entorn.rellotge.disparaTimeout();
  }
  assert.equal(entorn.node('gameover-punts').textContent, String(total));

  const directe = entornJoc();
  joc.iniciaJoc(directe.opcions).mostra();
  for (let i = 0; i < 3; i++) clicaResposta(directe, true);
  const totalDirecte = Number(directe.node('joc-punts').textContent);
  directe.rellotge.avanca(90000);
  assert.equal(directe.node('gameover-punts').textContent, String(totalDirecte));
  assert.equal(directe.rellotge.pendents(), 0);
});

test('el millor ratxa i els encerts i errors finals es mostren al Game Over', async () => {
  const entorn = entornJoc();
  const joc = await carrega('joc');
  joc.iniciaJoc(entorn.opcions).mostra();
  clicaResposta(entorn, true);
  clicaResposta(entorn, true);
  clicaResposta(entorn, false);
  entorn.rellotge.avanca(90000);
  assert.equal(entorn.node('gameover-encerts').textContent, '2');
  assert.equal(entorn.node('gameover-errors').textContent, '1');
  assert.equal(entorn.node('gameover-ratxa').textContent, '🔥 2');
});

test('nou rècord mostra avís i confeti només si supera l’anterior i no amb zero punts', async () => {
  const joc = await carrega('joc');
  const entorn = entornJoc({ redueixMoviment: () => false });
  joc.iniciaJoc(entorn.opcions).mostra();
  for (let i = 0; i < 3; i++) clicaResposta(entorn, true);
  entorn.rellotge.avanca(90000);
  assert.equal(entorn.node('gameover-record').hidden, false);
  assert.match(textDe(entorn.node('gameover-record')), /NOU RÈCORD PERSONAL/);
  assert.ok(entorn.node('gameover-confeti').children.length > 0);

  const vell = entornJoc();
  vell.estat.records = [{ punts: 100000, encerts: 10, data: '2026-11-24T18:03:00' }];
  joc.iniciaJoc(vell.opcions).mostra();
  for (let i = 0; i < 3; i++) clicaResposta(vell, true);
  vell.rellotge.avanca(90000);
  assert.equal(vell.node('gameover-record').hidden, true);
  assert.equal(vell.node('gameover-confeti').children.length, 0);

  const zero = entornJoc();
  joc.iniciaJoc(zero.opcions).mostra();
  for (let i = 0; i < 3; i++) clicaResposta(zero, false);
  assert.equal(zero.node('gameover-record').hidden, true);
});

test('el joc crida el so d’encert, error, pujada i game over injectat', async () => {
  const joc = await carrega('joc');
  const entorn = entornJoc();
  const partida = joc.iniciaJoc(entorn.opcions);
  partida.mostra();
  for (let i = 0; i < 3; i++) clicaResposta(entorn, true);
  const crides = entorn.opcions.so.crides;
  assert.equal(crides.filter((crida) => crida === 'encert').length, 3);
  assert.equal(crides.filter((crida) => crida === 'pujada').length, 1);
  clicaResposta(entorn, false);
  assert.equal(crides.filter((crida) => crida === 'error').length, 1);
  assert.ok(!entorn.opcions.so.crides.includes('gameOver'));
  entorn.rellotge.avanca(90000);
  assert.equal(entorn.opcions.so.crides.at(-1), 'gameOver');
});

test('amb so desactivat el joc no genera cap so ni vibració', async () => {
  const { creaSo } = await carrega('so');
  const audio = factoriaAudioFake();
  const vibracions = [];
  const so = creaSo({
    activat: false,
    factoria: audio.AudioContextFake,
    navegador: { vibrate: (ms) => vibracions.push(ms) }
  });
  const joc = await carrega('joc');
  const entorn = entornJoc({ so });
  joc.iniciaJoc(entorn.opcions).mostra();
  clicaResposta(entorn, true);
  clicaResposta(entorn, false);
  entorn.rellotge.avanca(90000);
  assert.equal(audio.contexts.length, 0);
  assert.equal(audio.osciladors.length, 0);
  assert.deepEqual(vibracions, []);
});

test('Repassar els fallats comença una sessió només amb els ids indicats', async () => {
  const repas = await carrega('repas');
  const dom = domFake();
  const documentAnterior = globalThis.document;
  const hashAnterior = globalThis.location?.hash;
  globalThis.document = dom.document;
  globalThis.location = { hash: '#repas' };
  const targetes = ['a', 'b', 'c'].map((id) => ({
    id, phrasal: `prova ${id}`, verb: 'prova', particula: id, significat: `significat ${id}`,
    sinonim: 'test', similars: [], exemple: `Prova ${id}.`, exempleMarcat: `**Prova** ${id}.`,
    forat: `___ ${id}.`, traduccio: `Prova ${id}.`, tema: 'estudis', nivell: 1
  }));
  try {
    const sessio = repas.iniciaRepas({
      estat: progres.estatPerDefecte(), phrasals: targetes, desa() {}, avisa() {}
    });
    sessio.comenca(['c', 'a'], 'fallats');
    assert.equal(dom.document.getElementById('repas-progres').textContent, '1/2');
    assert.equal(dom.document.getElementById('targeta-phrasal').textContent, 'prova c');
    dom.document.getElementById('targeta').clica();
    dom.document.getElementById('boto-mel-se').clica();
    assert.equal(dom.document.getElementById('targeta-phrasal').textContent, 'prova a');
    sessio.mostra();
    assert.equal(dom.document.getElementById('repas-sessio').hidden, false);
    assert.equal(dom.document.getElementById('repas-progres').textContent, '2/2');
  } finally {
    globalThis.document = documentAnterior;
    if (hashAnterior !== undefined) globalThis.location.hash = hashAnterior;
  }
});

test('l’aplicació connecta el Game Over amb el repàs, el rànquing i el resum de l’Inici', () => {
  const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="gameover-repassa"/);
  assert.match(html, /id="gameover-ranking"/);
  assert.match(app, /gameover-repassa[\s\S]{0,240}repas\?\.comenca/);
  assert.match(app, /gameover-ranking[\s\S]{0,240}(avisProperament|Properament)/);
  assert.match(app, /repas-a-jugar[\s\S]{0,160}location\.hash = '#joc'/);
  assert.match(app, /activa === 'inici'[\s\S]{0,80}renderResum\(\)/);
});
