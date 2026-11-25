import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = new URL('../js/', import.meta.url).href;
const carrega = (nom) => import(`${base}${nom}.js?v=17`);
const dadesReals = JSON.parse(readFileSync(new URL('../contingut/phrasals.json', import.meta.url), 'utf8'));
const perId = new Map(dadesReals.phrasals.map((entry) => [entry.id, entry]));
const valorsAleatoris = [0, 0.25, 0.5, 0.75, 0.99];
const paraules = (text) => text.trim().split(/\s+/).length;

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
    clica() { for (const funcio of this.listeners.click ?? []) funcio(); },
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

function entornJoc(opcions = {}) {
  const dom = domFake();
  const estat = { navegat: null };
  return {
    dom,
    estat,
    node: (id) => dom.getElementById(id),
    opcions: {
      phrasals: dadesReals.phrasals,
      dom,
      rellotge: {
        ara: () => 0,
        cada: () => 1,
        atura() {},
        despres() { return 2; },
        cancela() {}
      },
      navega: (hash) => { estat.navegat = hash; },
      ...opcions
    }
  };
}

test('generaPreguntaB mai ofereix partícules que formen un put diferent', async () => {
  const p = await carrega('preguntes');
  const prohibides = new Set(['up with', 'on', 'out', 'away', 'forward', 'up', 'down']);
  for (const valor of valorsAleatoris) {
    const pregunta = p.generaPreguntaB(dadesReals.phrasals, { aleatori: () => valor, id: 'put-off' });
    assert.equal(pregunta.tipus, 'B');
    assert.equal(pregunta.correcta, 'off');
    assert.ok(pregunta.opcions.every((opcio) => !prohibides.has(opcio)),
      `put-off ofereix una partícula prohibida: ${pregunta.opcions}`);
    assert.ok(pregunta.opcions.every((opcio) => paraules(opcio) === 1),
      `put-off ofereix partícules d'un altre nombre de paraules: ${pregunta.opcions}`);
  }
});

test('generaPreguntaB mai ofereix into, away ni over per a run-out-of', async () => {
  const p = await carrega('preguntes');
  const prohibides = new Set(['into', 'away', 'over']);
  for (const valor of valorsAleatoris) {
    const pregunta = p.generaPreguntaB(dadesReals.phrasals, { aleatori: () => valor, id: 'run-out-of' });
    assert.equal(pregunta.correcta, 'out of');
    assert.ok(pregunta.opcions.every((opcio) => !prohibides.has(opcio)),
      `run-out-of ofereix una partícula prohibida: ${pregunta.opcions}`);
    assert.ok(pregunta.opcions.every((opcio) => paraules(opcio) === 2),
      `run-out-of ofereix partícules d'un altre nombre de paraules: ${pregunta.opcions}`);
  }
});

test('generaPreguntaB dóna 4 opcions diferents amb una sola de correcta per als 161 phrasals', async () => {
  const p = await carrega('preguntes');
  for (const entry of dadesReals.phrasals) {
    for (const valor of [0.1, 0.5, 0.9]) {
      const pregunta = p.generaPreguntaB(dadesReals.phrasals, { aleatori: () => valor, id: entry.id });
      assert.equal(pregunta.tipus, 'B');
      assert.equal(pregunta.id, entry.id);
      assert.equal(pregunta.forat, entry.forat);
      assert.equal(pregunta.traduccio, entry.traduccio);
      assert.equal(pregunta.correcta, entry.particula);
      assert.equal(pregunta.opcions.length, 4);
      assert.equal(new Set(pregunta.opcions).size, 4, `Opcions repetides a ${entry.id}`);
      assert.equal(pregunta.opcions.filter((opcio) => opcio === pregunta.correcta).length, 1);
    }
  }
});

test('generaPreguntaB exclou les partícules dels similars per als 161 phrasals', async () => {
  const p = await carrega('preguntes');
  for (const entry of dadesReals.phrasals) {
    const prohibides = new Set(
      (entry.similars ?? []).map((id) => perId.get(id)?.particula).filter(Boolean)
    );
    for (const valor of valorsAleatoris) {
      const pregunta = p.generaPreguntaB(dadesReals.phrasals, { aleatori: () => valor, id: entry.id });
      const incorrectes = pregunta.opcions.filter((opcio) => opcio !== pregunta.correcta);
      assert.ok(incorrectes.every((opcio) => !prohibides.has(opcio)),
        `${entry.id} ofereix un similar: ${incorrectes.filter((opcio) => prohibides.has(opcio))}`);
    }
  }
});

test('generaPreguntaB mai ofereix off, in, out, on ni down per a get-up', async () => {
  const p = await carrega('preguntes');
  const prohibides = new Set(['off', 'in', 'out', 'on', 'down']);
  for (const valor of valorsAleatoris) {
    const pregunta = p.generaPreguntaB(dadesReals.phrasals, { aleatori: () => valor, id: 'get-up' });
    assert.equal(pregunta.correcta, 'up');
    assert.ok(pregunta.opcions.every((opcio) => !prohibides.has(opcio)),
      `get-up ofereix una partícula prohibida: ${pregunta.opcions}`);
  }
});

test('generaPreguntaB mai ofereix over per a put-off', async () => {
  const p = await carrega('preguntes');
  for (const valor of valorsAleatoris) {
    const pregunta = p.generaPreguntaB(dadesReals.phrasals, { aleatori: () => valor, id: 'put-off' });
    assert.equal(pregunta.correcta, 'off');
    assert.ok(!pregunta.opcions.includes('over'),
      `put-off ofereix over: ${pregunta.opcions}`);
  }
});

test('generaPreguntaB exclou les particulesProhibides per als 161 phrasals', async () => {
  const p = await carrega('preguntes');
  for (const entry of dadesReals.phrasals) {
    const prohibides = new Set(entry.particulesProhibides ?? []);
    for (const valor of valorsAleatoris) {
      const pregunta = p.generaPreguntaB(dadesReals.phrasals, { aleatori: () => valor, id: entry.id });
      const incorrectes = pregunta.opcions.filter((opcio) => opcio !== pregunta.correcta);
      assert.ok(incorrectes.every((opcio) => !prohibides.has(opcio)),
        `${entry.id} ofereix una partícula prohibida: ${incorrectes.filter((opcio) => prohibides.has(opcio))}`);
    }
  }
});

test('generaPreguntaB completa amb un altre nombre de paraules si no n’hi ha prou', async () => {
  const p = await carrega('preguntes');
  const sintetics = [
    { id: 'x', phrasal: 'put off', verb: 'put', particula: 'off', forat: 'put ___', traduccio: 'Deixa-ho' },
    { id: 'a', phrasal: 'get in', verb: 'get', particula: 'in', forat: 'get ___', traduccio: 'Entra' },
    { id: 'b', phrasal: 'look after', verb: 'look', particula: 'after', forat: 'look ___', traduccio: 'Cuida' },
    { id: 'c', phrasal: 'put up', verb: 'put', particula: 'up', forat: 'put ___', traduccio: 'Puja' },
    { id: 'd', phrasal: 'run out of', verb: 'run', particula: 'out of', forat: 'run ___ ___', traduccio: 'Acaba' }
  ];
  const pregunta = p.generaPreguntaB(sintetics, { aleatori: () => 0.5, id: 'x' });
  assert.equal(pregunta.opcions.length, 4);
  assert.equal(new Set(pregunta.opcions).size, 4);
  assert.ok(!pregunta.opcions.includes('up'), 'up forma put up i no pot sortir');
  assert.ok(pregunta.opcions.some((opcio) => paraules(opcio) === 2),
    `Falta la partícula de reserva: ${pregunta.opcions}`);
});

test('la partida mostra el minijoc B amb el forat destacat i la traducció', async () => {
  const entorn = entornJoc({ aleatori: () => 0.5 });
  const joc = await carrega('joc');
  const partida = joc.iniciaJoc(entorn.opcions);
  partida.mostra();

  const preguntaNode = entorn.node('joc-pregunta');
  assert.equal(preguntaNode.dataset.tipus, 'B');
  assert.ok(preguntaNode.children.some((fill) => fill.classes?.has('forat') && fill.textContent === '___'),
    'El forat ___ no està destacat');
  const entrada = perId.get(preguntaNode.dataset.id);
  assert.equal(entorn.node('joc-traduccio').textContent, entrada.traduccio);
  assert.equal(entorn.node('joc-traduccio').hidden, false);
  assert.equal(new Set(entorn.node('joc-opcions').children.map((boto) => boto.textContent)).size, 4);
});

test('la partida tria el minijoc A, B o C segons l’aleatori', async () => {
  const joc = await carrega('joc');
  const entornA = entornJoc({ aleatori: () => 0.1 });
  joc.iniciaJoc(entornA.opcions).mostra();
  assert.equal(entornA.node('joc-pregunta').dataset.tipus, 'A');
  assert.equal(entornA.node('joc-traduccio').hidden, true);

  const entornB = entornJoc({ aleatori: () => 0.5 });
  joc.iniciaJoc(entornB.opcions).mostra();
  assert.equal(entornB.node('joc-pregunta').dataset.tipus, 'B');
  assert.equal(entornB.node('joc-traduccio').hidden, false);

  const entornC = entornJoc({ aleatori: () => 0.99 });
  joc.iniciaJoc(entornC.opcions).mostra();
  assert.equal(entornC.node('joc-pregunta').dataset.tipus, 'C');
  assert.equal(entornC.node('joc-traduccio').hidden, true);
});
