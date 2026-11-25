import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = new URL('../js/', import.meta.url).href;
const carrega = (nom) => import(`${base}${nom}.js?v=11`);
const dadesReals = JSON.parse(readFileSync(new URL('../contingut/phrasals.json', import.meta.url), 'utf8'));
const perId = new Map(dadesReals.phrasals.map((entry) => [entry.id, entry]));
const perPhrasal = new Map(dadesReals.phrasals.map((entry) => [entry.phrasal, entry]));
const valorsAleatoris = [0, 0.25, 0.5, 0.75, 0.99];
const sinteticsC = [
  { id: 'put-off', phrasal: 'put off', verb: 'put', sinonim: 'postpone', similars: [] },
  { id: 'put-up', phrasal: 'put up', verb: 'put', sinonim: 'build', similars: [] },
  { id: 'put-on', phrasal: 'put on', verb: 'put', sinonim: 'wear', similars: [] },
  { id: 'put-away', phrasal: 'put away', verb: 'put', sinonim: 'store', similars: [] },
  { id: 'get-up', phrasal: 'get up', verb: 'get', sinonim: 'rise', similars: [] },
  { id: 'look-up', phrasal: 'look up', verb: 'look', sinonim: 'search', similars: [] }
];

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
    disparaTimeout() { timeouts.shift()?.funcio(); }
  };
}

function aleatoriCiclic(valors) {
  let index = 0;
  return () => valors[index++ % valors.length];
}

function entornJoc(opcions = {}) {
  const dom = domFake();
  const rellotge = rellotgeFake();
  const estat = { navegat: null };
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
      aleatori: () => 0.5,
      ...opcions
    }
  };
}

function clicaCorrecta(entorn) {
  const preguntaNode = entorn.node('joc-pregunta');
  const entrada = entorn.opcions.phrasals.find((item) => item.id === preguntaNode.dataset.id);
  assert.ok(entrada, `Id de pregunta desconegut: ${preguntaNode.dataset.id}`);
  const valor = preguntaNode.dataset.tipus === 'A'
    ? entrada.significat
    : preguntaNode.dataset.tipus === 'B'
      ? entrada.particula
      : entrada.phrasal;
  const index = entorn.node('joc-opcions').children.findIndex((boto) => boto.textContent === valor);
  assert.notEqual(index, -1, `No s'ha trobat la resposta correcta: ${valor}`);
  entorn.node('joc-opcions').children[index].clica();
  entorn.rellotge.disparaTimeout();
  return entrada;
}

test('generaPreguntaC no ofereix get back ni come back per a give-back', async () => {
  const p = await carrega('preguntes');
  for (const valor of valorsAleatoris) {
    const pregunta = p.generaPreguntaC(dadesReals.phrasals, { aleatori: () => valor, id: 'give-back' });
    assert.equal(pregunta.tipus, 'C');
    assert.equal(pregunta.id, 'give-back');
    assert.equal(pregunta.sinonim, 'return');
    assert.equal(pregunta.correcta, 'give back');
    assert.equal(pregunta.opcions.length, 4);
    assert.equal(new Set(pregunta.opcions).size, 4);
    assert.ok(!pregunta.opcions.includes('get back'));
    assert.ok(!pregunta.opcions.includes('come back'));
  }
});

test('generaPreguntaC prefereix distractors del mateix verb', async () => {
  const p = await carrega('preguntes');
  const pregunta = p.generaPreguntaC(sinteticsC, { aleatori: () => 0.5, id: 'put-off' });
  const incorrectes = pregunta.opcions.filter((opcio) => opcio !== pregunta.correcta);
  assert.equal(incorrectes.length, 3);
  assert.ok(incorrectes.every((opcio) => sinteticsC.find((entry) => entry.phrasal === opcio).verb === 'put'),
    `Distractors d'un altre verb: ${incorrectes}`);
});

test('generaPreguntaC canvia la posició de la correcta segons aleatori', async () => {
  const p = await carrega('preguntes');
  const posicions = valorsAleatoris.map((valor) => {
    const pregunta = p.generaPreguntaC(dadesReals.phrasals, { aleatori: () => valor, id: 'put-off' });
    return pregunta.opcions.indexOf(pregunta.correcta);
  });
  assert.ok(new Set(posicions).size >= 2, `Posició sempre la mateixa: ${posicions}`);
});

test('generaPreguntaC dóna 4 opcions diferents amb una sola de correcta per als 161 phrasals', async () => {
  const p = await carrega('preguntes');
  for (const entrada of dadesReals.phrasals) {
    const similars = new Set(
      (entrada.similars ?? []).map((id) => perId.get(id)?.phrasal).filter(Boolean)
    );
    for (const valor of [0.1, 0.5, 0.9]) {
      const pregunta = p.generaPreguntaC(dadesReals.phrasals, { aleatori: () => valor, id: entrada.id });
      assert.equal(pregunta.tipus, 'C');
      assert.equal(pregunta.id, entrada.id);
      assert.equal(pregunta.sinonim, entrada.sinonim);
      assert.equal(pregunta.correcta, entrada.phrasal);
      assert.equal(pregunta.opcions.length, 4);
      assert.equal(new Set(pregunta.opcions).size, 4, `Opcions repetides a ${entrada.id}`);
      assert.equal(pregunta.opcions.filter((opcio) => opcio === pregunta.correcta).length, 1);
      const incorrectes = pregunta.opcions.filter((opcio) => opcio !== pregunta.correcta);
      assert.ok(incorrectes.every((opcio) => perPhrasal.get(opcio)?.sinonim !== entrada.sinonim),
        `${entrada.id} ofereix el mateix sinònim: ${incorrectes}`);
      assert.ok(incorrectes.every((opcio) => !similars.has(opcio)),
        `${entrada.id} ofereix un similar: ${incorrectes}`);
    }
  }
});

test('la partida mostra el minijoc C amb el sinònim destacat', async () => {
  const entorn = entornJoc({ aleatori: () => 0.99 });
  const joc = await carrega('joc');
  joc.iniciaJoc(entorn.opcions).mostra();

  const preguntaNode = entorn.node('joc-pregunta');
  assert.equal(preguntaNode.dataset.tipus, 'C');
  assert.match(entorn.node('joc-tipus').textContent, /Substitueix/);
  assert.ok(preguntaNode.children.some(
    (fill) => fill.tagName === 'STRONG' && fill.textContent === perId.get(preguntaNode.dataset.id).sinonim
  ), 'El sinònim no està destacat');
  assert.equal(entorn.node('joc-traduccio').hidden, true);
  assert.equal(new Set(entorn.node('joc-opcions').children.map((boto) => boto.textContent)).size, 4);
});

test('40 preguntes comencen amb nivell 1, no repeteixen id i barregen els 3 tipus', async () => {
  const entorn = entornJoc({ aleatori: aleatoriCiclic([0.1, 0.5, 0.9]) });
  const joc = await carrega('joc');
  joc.iniciaJoc(entorn.opcions).mostra();

  const ids = [];
  const tipus = new Set();
  const nivells = [];
  for (let i = 0; i < 40; i++) {
    const preguntaNode = entorn.node('joc-pregunta');
    if (preguntaNode.dataset.tipus === 'C') {
      for (const boto of entorn.node('joc-opcions').children) {
        const idOpció = perPhrasal.get(boto.textContent)?.id;
        assert.ok(!ids.includes(idOpció), `El phrasal ${idOpció} ja s'havia preguntat`);
      }
    }
    ids.push(preguntaNode.dataset.id);
    tipus.add(preguntaNode.dataset.tipus);
    nivells.push(perId.get(preguntaNode.dataset.id).nivell);
    clicaCorrecta(entorn);
  }

  assert.equal(new Set(ids).size, 40, `Ids repetits: ${ids}`);
  assert.ok(nivells.slice(0, 5).every((nivell) => nivell === 1), `Nivells inicials: ${nivells.slice(0, 5)}`);
  assert.ok(nivells.slice(5, 15).every((nivell) => nivell <= 2), `Nivells 6-15: ${nivells.slice(5, 15)}`);
  assert.ok(nivells.slice(15).every((nivell) => nivell <= 3), `Nivells 16+: ${nivells.slice(15)}`);
  assert.deepEqual([...tipus].sort(), ['A', 'B', 'C']);
});

test('un 30 % de les preguntes surten de la caixa 1 si n’hi ha', async () => {
  const caixa1Ids = dadesReals.phrasals.filter((entrada) => entrada.nivell === 1).slice(0, 30).map((entrada) => entrada.id);
  const leitner = Object.fromEntries(caixa1Ids.map((id) => [id, { caixa: 1 }]));
  const entorn = entornJoc({
    aleatori: aleatoriCiclic([0.1, 0.5, 0.9]),
    leitner
  });
  const joc = await carrega('joc');
  joc.iniciaJoc(entorn.opcions).mostra();

  let deCaixa1 = 0;
  for (let i = 0; i < 40; i++) {
    const id = entorn.node('joc-pregunta').dataset.id;
    if (caixa1Ids.includes(id)) deCaixa1 += 1;
    clicaCorrecta(entorn);
  }

  assert.ok(deCaixa1 >= 12, `Només ${deCaixa1} preguntes de la caixa 1`);
});

test('el joc llegeix el leitner actual si rep una funció (esborrar el progrés)', async () => {
  const caixa1Ids = dadesReals.phrasals.filter((entrada) => entrada.nivell === 1).slice(0, 30).map((entrada) => entrada.id);
  const estat = { leitner: {} };
  const entorn = entornJoc({
    aleatori: aleatoriCiclic([0.1, 0.5, 0.9]),
    leitner: () => estat.leitner
  });
  const joc = await carrega('joc');
  const partida = joc.iniciaJoc(entorn.opcions);
  // Com fa app.js en esborrar el progrés: l'objecte leitner se substitueix per un de nou.
  estat.leitner = Object.fromEntries(caixa1Ids.map((id) => [id, { caixa: 1 }]));
  partida.mostra();

  let deCaixa1 = 0;
  for (let i = 0; i < 40; i++) {
    const id = entorn.node('joc-pregunta').dataset.id;
    if (caixa1Ids.includes(id)) deCaixa1 += 1;
    clicaCorrecta(entorn);
  }

  assert.ok(deCaixa1 >= 12, `El joc no veu el leitner nou: només ${deCaixa1} preguntes de la caixa 1`);
});
