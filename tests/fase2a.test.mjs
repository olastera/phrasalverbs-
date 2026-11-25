import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = new URL('../js/', import.meta.url).href;
const carrega = (nom) => import(`${base}${nom}.js?v=17`);
const dadesReals = JSON.parse(readFileSync(new URL('../contingut/phrasals.json', import.meta.url), 'utf8'));

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
    focus() {}
  };
}

function domFake() {
  const nodes = new Map();
  return {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, elementFake());
      return nodes.get(id);
    },
    createElement: (tag) => elementFake(tag),
    createTextNode: (text) => ({ nodeType: 3, textContent: text })
  };
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
    tempsPendent() { return timeouts.length ? timeouts[0].ms : null; }
  };
}

function entornJoc(opcions = {}) {
  const dom = domFake();
  const rellotge = rellotgeFake();
  const estat = { navegat: null, enBonus: false, respostes: 0 };
  const aleatori = opcions.aleatori ?? (() => 0.99);
  return {
    dom,
    rellotge,
    estat,
    node: (id) => dom.getElementById(id),
    opcions: {
      phrasals: dadesReals.phrasals,
      dom,
      rellotge,
      navega: (hash) => { estat.navegat = hash; },
      ...opcions,
      aleatori: () => (estat.enBonus ? 0.5 : aleatori())
    }
  };
}

function respostaCorrecta(entorn) {
  const preguntaNode = entorn.node('joc-pregunta');
  const dades = preguntaNode.dataset ?? {};
  const entrada = entorn.opcions.phrasals.find((entry) => entry.id === dades.id)
    ?? entorn.opcions.phrasals.find((entry) => entry.phrasal === preguntaNode.textContent);
  if (!entrada) return null;
  if (dades.tipus === 'B') return entrada.particula;
  if (dades.tipus === 'C') return entrada.phrasal;
  return entrada.significat;
}

function clicaResposta(entorn, correcte) {
  const valor = respostaCorrecta(entorn);
  const opcionsNodes = entorn.node('joc-opcions').children;
  const index = opcionsNodes.findIndex((boto) => boto.textContent === valor);
  assert.notEqual(index, -1, `No s'ha trobat la resposta correcta: ${valor}`);
  const boto = opcionsNodes[correcte ? index : (index === 0 ? 1 : 0)];
  boto.clica();
  return boto;
}

function passaBonus(entorn) {
  if (!entorn.node('joc-preguntes').hidden) return;
  entorn.rellotge.avanca(parseInt(entorn.node('bonus-temps').textContent, 10) * 1000);
  entorn.rellotge.disparaTimeout();
}

function respon(entorn, correcte) {
  const boto = clicaResposta(entorn, correcte);
  if ((entorn.estat.respostes + 1) % 8 === 0) entorn.estat.enBonus = true;
  entorn.rellotge.disparaTimeout();
  entorn.estat.enBonus = false;
  passaBonus(entorn);
  entorn.estat.respostes += 1;
  return boto;
}

function teLaCorrecta(entorn) {
  const valor = respostaCorrecta(entorn);
  return entorn.node('joc-opcions').children.some(
    (boto) => boto.textContent === valor && boto.classes.has('correcta')
  );
}

const sintetics = [
  { id: 'get-up', phrasal: 'get up', verb: 'get', significat: 'aixecar-se', nivell: 2, similars: [] },
  { id: 'get-on', phrasal: 'get on', verb: 'get', significat: 'pujar', nivell: 2, similars: [] },
  { id: 'get-off', phrasal: 'get off', verb: 'get', significat: 'baixar', nivell: 2, similars: [] },
  { id: 'get-over', phrasal: 'get over', verb: 'get', significat: 'superar', nivell: 2, similars: [] },
  { id: 'look-up', phrasal: 'look up', verb: 'look', significat: 'buscar', nivell: 1, similars: [] },
  { id: 'turn-off', phrasal: 'turn off', verb: 'turn', significat: 'apagar', nivell: 3, similars: [] }
];

test('multiplicador segons la ratxa: x1, x2, x3 i x4', async () => {
  const p = await carrega('preguntes');
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20].map((n) => p.multiplicador(n)),
    [1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4]);
});

test('puntsEncert aplica el bonus de 5 abans del multiplicador', async () => {
  const p = await carrega('preguntes');
  assert.equal(p.puntsEncert(1, 0.5), 15);
  assert.equal(p.puntsEncert(1, 3), 10);
  assert.equal(p.puntsEncert(3, 1), 30);
  assert.equal(p.puntsEncert(10, 5), 40);
  assert.equal(p.puntsEncert(10, 0), 60);
});

test('generaPreguntaA dóna 4 opcions diferents amb una sola de correcta per als 161 phrasals', async () => {
  const p = await carrega('preguntes');
  for (const entry of dadesReals.phrasals) {
    const pregunta = p.generaPreguntaA(dadesReals.phrasals, { aleatori: () => 0.42, id: entry.id });
    assert.equal(pregunta.tipus, 'A');
    assert.equal(pregunta.id, entry.id);
    assert.equal(pregunta.phrasal, entry.phrasal);
    assert.equal(pregunta.correcta, entry.significat);
    assert.equal(pregunta.opcions.length, 4);
    assert.equal(new Set(pregunta.opcions).size, 4, `Opcions repetides a ${entry.id}`);
    assert.equal(pregunta.opcions.filter((text) => text === pregunta.correcta).length, 1);
  }
});

test('generaPreguntaA exclou els similars de la resposta per als 161 phrasals', async () => {
  const p = await carrega('preguntes');
  const perId = new Map(dadesReals.phrasals.map((entry) => [entry.id, entry]));
  for (const entry of dadesReals.phrasals) {
    const similars = new Set(entry.similars ?? []);
    const significatsProhibits = new Set(
      [...similars].map((id) => perId.get(id)).filter(Boolean).map((similar) => similar.significat)
    );
    for (const valor of [0, 0.25, 0.5, 0.75, 0.99]) {
      const pregunta = p.generaPreguntaA(dadesReals.phrasals, { aleatori: () => valor, id: entry.id });
      const incorrectes = pregunta.opcions.filter((opcio) => opcio !== pregunta.correcta);
      assert.ok(
        incorrectes.every((opcio) => !significatsProhibits.has(opcio)),
        `${entry.id} ofereix un similar: ${incorrectes.filter((opcio) => significatsProhibits.has(opcio))}`
      );
    }
  }
});

test('generaPreguntaA prioritza distractors del mateix verb a partir del nivell 2', async () => {
  const p = await carrega('preguntes');
  const pregunta = p.generaPreguntaA(sintetics, { aleatori: () => 0.5, id: 'get-up' });
  const perSignificat = new Map(sintetics.map((entry) => [entry.significat, entry]));
  const distractors = pregunta.opcions.filter((text) => text !== pregunta.correcta);
  assert.equal(distractors.length, 3);
  assert.ok(distractors.every((text) => perSignificat.get(text).verb === 'get'),
    `Distractors d'un altre verb: ${distractors}`);
});

test('generaPreguntaA canvia la posició de la correcta segons aleatori', async () => {
  const p = await carrega('preguntes');
  const posicions = [0, 0.25, 0.5, 0.75, 0.99].map((valor) => {
    const pregunta = p.generaPreguntaA(dadesReals.phrasals, { aleatori: () => valor, id: 'put-off' });
    return pregunta.opcions.indexOf(pregunta.correcta);
  });
  assert.ok(new Set(posicions).size >= 2, `Posició sempre la mateixa: ${posicions}`);
});

test('generaPreguntaA evita els ids ja usats mentre queden candidats', async () => {
  const p = await carrega('preguntes');
  const usats = [];
  for (let i = 0; i < 5; i++) {
    const pregunta = p.generaPreguntaA(sintetics, { aleatori: () => 0.5, exclosos: usats });
    usats.push(pregunta.id);
  }
  assert.equal(new Set(usats).size, 5);
});

test('una partida acaba als 90 segons', async () => {
  const entorn = entornJoc();
  const joc = await carrega('joc');
  const partida = joc.iniciaJoc(entorn.opcions);
  partida.mostra();
  assert.equal(parseInt(entorn.node('joc-temps').textContent, 10), 90);
  entorn.rellotge.avanca(90000);
  assert.equal(entorn.estat.navegat, '#gameover');
});

test('una partida acaba en 3 errors després de mostrar la correcta 1,5 s', async () => {
  const entorn = entornJoc();
  const joc = await carrega('joc');
  const partida = joc.iniciaJoc(entorn.opcions);
  partida.mostra();
  for (let i = 0; i < 2; i++) respon(entorn, false);
  clicaResposta(entorn, false);
  assert.equal(entorn.estat.navegat, null);
  assert.equal(entorn.rellotge.tempsPendent(), 1500);
  assert.ok(teLaCorrecta(entorn), 'No es mostra la correcta en perdre l’última vida');
  entorn.rellotge.disparaTimeout();
  assert.equal(entorn.estat.navegat, '#gameover');
  assert.match(entorn.node('gameover-errors').textContent, /3/);
});

test('en fallar es mostra la correcta i el rellotge s’atura 1,5 s', async () => {
  const entorn = entornJoc();
  const joc = await carrega('joc');
  const partida = joc.iniciaJoc(entorn.opcions);
  partida.mostra();
  clicaResposta(entorn, false);
  assert.ok(teLaCorrecta(entorn), 'La resposta correcta no s’ha marcat');
  assert.equal(entorn.rellotge.tempsPendent(), 1500);
  const abans = parseInt(entorn.node('joc-temps').textContent, 10);
  entorn.rellotge.avanca(10000);
  assert.equal(parseInt(entorn.node('joc-temps').textContent, 10), abans);
  entorn.rellotge.disparaTimeout();
  entorn.rellotge.avanca(1000);
  assert.ok(parseInt(entorn.node('joc-temps').textContent, 10) < abans);
});

test('en encertar el botó es veu verd 400 ms amb el rellotge aturat', async () => {
  const entorn = entornJoc();
  const joc = await carrega('joc');
  const partida = joc.iniciaJoc(entorn.opcions);
  partida.mostra();
  const idAbans = entorn.node('joc-pregunta').dataset.id;
  const boto = clicaResposta(entorn, true);
  assert.ok(boto.classes.has('encert'), 'El botó encertat no s’ha posat verd');
  assert.equal(entorn.node('joc-pregunta').dataset.id, idAbans, 'La pregunta ha canviat massa aviat');
  assert.equal(entorn.rellotge.tempsPendent(), 400);
  const abans = entorn.node('joc-temps').textContent;
  entorn.rellotge.avanca(10000);
  assert.equal(entorn.node('joc-temps').textContent, abans);
  entorn.rellotge.disparaTimeout();
  assert.notEqual(entorn.node('joc-pregunta').dataset.id, idAbans, 'No ha passat a la pregunta següent');
  entorn.rellotge.avanca(1000);
  assert.ok(parseInt(entorn.node('joc-temps').textContent, 10) < parseInt(abans, 10));
});

test('el multiplicador puja al 3r, 6è i 10è encert i torna a x1 en fallar', async () => {
  const entorn = entornJoc();
  const joc = await carrega('joc');
  const partida = joc.iniciaJoc(entorn.opcions);
  partida.mostra();
  const esperats = [1, 1, 2, 2, 2, 3, 3, 3, 3, 4];
  esperats.forEach((multiplicador, index) => {
    respon(entorn, true);
    assert.equal(entorn.node('joc-ratxa').textContent, `🔥 x${multiplicador}`, `Encert ${index + 1}`);
  });
  clicaResposta(entorn, false);
  assert.equal(entorn.node('joc-ratxa').textContent, '🔥 x1');
});

test('contestar en menys de 3 s suma 15 punts i trigar més en suma 10', async () => {
  const entorn = entornJoc();
  const joc = await carrega('joc');
  const partida = joc.iniciaJoc(entorn.opcions);
  partida.mostra();
  respon(entorn, true);
  assert.equal(parseInt(entorn.node('joc-punts').textContent, 10), 15);
  entorn.rellotge.avanca(4000);
  respon(entorn, true);
  assert.equal(parseInt(entorn.node('joc-punts').textContent, 10), 25);
});

test('el rellotge conserva els mil·lisegons en aturar i reprendre', async () => {
  const entorn = entornJoc();
  const joc = await carrega('joc');
  const partida = joc.iniciaJoc(entorn.opcions);
  partida.mostra();
  entorn.rellotge.avanca(1500);
  assert.equal(entorn.node('joc-temps').textContent, '89');
  clicaResposta(entorn, false);
  entorn.rellotge.avanca(600);
  assert.equal(entorn.node('joc-temps').textContent, '89');
  entorn.rellotge.disparaTimeout();
  entorn.rellotge.avanca(600);
  assert.equal(entorn.node('joc-temps').textContent, '88');
});

test('20 encerts ràpids descompten el temps contestat sense comptar les pauses', async () => {
  const entorn = entornJoc();
  const joc = await carrega('joc');
  const partida = joc.iniciaJoc(entorn.opcions);
  partida.mostra();

  for (let i = 0; i < 20; i++) {
    entorn.rellotge.avanca(900);
    clicaResposta(entorn, true);
    assert.equal(entorn.rellotge.tempsPendent(), 400);
    entorn.rellotge.avanca(400);
    entorn.rellotge.disparaTimeout();
    passaBonus(entorn);
  }

  const segons = parseInt(entorn.node('joc-temps').textContent, 10);
  assert.ok(segons >= 71 && segons <= 73, `El rellotge només ha baixat ${90 - segons} s`);
  assert.equal(entorn.estat.navegat, null);
});

test('sortir a l’Inici atura el rellotge i en tornar comença una partida nova', async () => {
  const entorn = entornJoc();
  const joc = await carrega('joc');
  const partida = joc.iniciaJoc(entorn.opcions);
  partida.mostra();
  entorn.rellotge.avanca(5000);
  const abans = parseInt(entorn.node('joc-temps').textContent, 10);
  partida.atura();
  entorn.rellotge.avanca(10000);
  assert.equal(parseInt(entorn.node('joc-temps').textContent, 10), abans);
  assert.equal(entorn.estat.navegat, null);
  partida.mostra();
  assert.equal(parseInt(entorn.node('joc-temps').textContent, 10), 90);
});
