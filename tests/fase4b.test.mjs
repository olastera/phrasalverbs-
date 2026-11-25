import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = new URL('../js/', import.meta.url).href;
const carrega = (nom) => import(`${base}${nom}.js?v=17`);
const carregaFrases = () => carrega('frases');
const dadesReals = JSON.parse(readFileSync(new URL('../contingut/phrasals.json', import.meta.url), 'utf8'));

function elementFake(tag = 'div') {
  const classes = new Set();
  const element = {
    tagName: tag.toUpperCase(),
    nodeType: 1,
    textContent: '',
    children: [],
    attributes: {},
    dataset: {},
    style: {},
    hidden: false,
    parentNode: null,
    listeners: {},
    classList: {
      add: (classe) => classes.add(classe),
      remove: (classe) => classes.delete(classe),
      contains: (classe) => classes.has(classe),
      toggle: (classe, forca) => {
        if (forca ?? !classes.has(classe)) classes.add(classe);
        else classes.delete(classe);
      }
    },
    classes,
    addEventListener(tipus, funcio) { (this.listeners[tipus] ??= []).push(funcio); },
    clica() {
      for (const funcio of this.listeners.click ?? []) funcio({ preventDefault() {} });
    },
    append(...nodes) {
      for (const node of nodes) {
        node.parentNode = this;
        this.children.push(node);
      }
    },
    replaceChildren(...nodes) {
      this.children = [];
      this.append(...nodes);
    },
    remove() {
      const pare = this.parentNode;
      if (!pare) return;
      const index = pare.children.indexOf(this);
      if (index >= 0) pare.children.splice(index, 1);
      this.parentNode = null;
    },
    setAttribute(clau, valor) { this.attributes[clau] = String(valor); },
    getAttribute(clau) { return this.attributes[clau] ?? null; },
    removeAttribute(clau) { delete this.attributes[clau]; },
    focus() {}
  };
  Object.defineProperty(element, 'className', {
    get() { return [...classes].join(' '); },
    set(valor) {
      classes.clear();
      for (const classe of String(valor).split(/\s+/).filter(Boolean)) classes.add(classe);
    }
  });
  return element;
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
  let properId = 1;
  const intervals = new Map();
  const timeouts = [];
  return {
    ara: () => ara,
    cada: (ms, funcio) => {
      const id = properId++;
      intervals.set(id, { ms, funcio, proper: ara + ms });
      return id;
    },
    atura: (id) => intervals.delete(id),
    despres: (ms, funcio) => {
      const id = properId++;
      timeouts.push({ id, funcio });
      return id;
    },
    cancela: (id) => {
      const index = timeouts.findIndex((pendent) => pendent.id === id);
      if (index >= 0) timeouts.splice(index, 1);
    },
    avanca(ms) {
      const fi = ara + ms;
      for (;;) {
        let proper = null;
        for (const [id, interval] of intervals) {
          if (interval.proper <= fi && (!proper || interval.proper < proper.interval.proper)) {
            proper = { id, interval };
          }
        }
        if (!proper) break;
        ara = proper.interval.proper;
        proper.interval.proper += proper.interval.ms;
        proper.interval.funcio();
      }
      ara = fi;
    },
    disparaTimeout(index = 0) { timeouts.splice(index, 1)[0]?.funcio(); },
    pendents: () => timeouts.length
  };
}

function entornJoc(opcions = {}) {
  const dom = domFake();
  const rellotge = rellotgeFake();
  const so = { encert: 0, error: 0, pujada: 0, gameOver: 0 };
  return {
    dom,
    rellotge,
    so,
    node: (id) => dom.getElementById(id),
    opcions: {
      phrasals: dadesReals.phrasals,
      dom,
      rellotge,
      aleatori: () => 0,
      redueixMoviment: () => false,
      navega: () => {},
      so: {
        encert: () => { so.encert += 1; },
        error: () => { so.error += 1; },
        pujada: () => { so.pujada += 1; },
        gameOver: () => { so.gameOver += 1; }
      },
      ...opcions
    }
  };
}

function respostaCorrecta(entorn) {
  const preguntaNode = entorn.node('joc-pregunta');
  const entrada = dadesReals.phrasals.find((entry) => entry.id === preguntaNode.dataset.id);
  if (!entrada) return null;
  if (preguntaNode.dataset.tipus === 'B') return entrada.particula;
  if (preguntaNode.dataset.tipus === 'C') return entrada.phrasal;
  return entrada.significat;
}

function clicaResposta(entorn, correcte) {
  const valor = respostaCorrecta(entorn);
  const opcionsNodes = entorn.node('joc-opcions').children;
  const index = opcionsNodes.findIndex((boto) => boto.textContent === valor);
  assert.notEqual(index, -1, `No s'ha trobat la resposta correcta: ${valor}`);
  opcionsNodes[correcte ? index : (index === 0 ? 1 : 0)].clica();
}

function responPregunta(entorn, correcte = true) {
  clicaResposta(entorn, correcte);
  entorn.rellotge.disparaTimeout();
}

function parellaCorrecta(entorn) {
  const esquerra = entorn.node('bonus-esquerra').children.find((boto) => !boto.disabled && boto.dataset.id);
  assert.ok(esquerra, 'No queda cap phrasal disponible a la ronda bonus');
  const dreta = entorn.node('bonus-dreta').children.find(
    (boto) => !boto.disabled && boto.textContent === esquerra.dataset.significat
  );
  assert.ok(dreta, 'No queda cap significat disponible a la ronda bonus');
  esquerra.clica();
  dreta.clica();
}

test('frases.js tria de cada llista i no repeteix la frase anterior', async () => {
  const { ENCERT, ERROR, GAME_OVER, triaFrase } = await carregaFrases();
  assert.equal(ENCERT.length, 5);
  assert.equal(ERROR.length, 5);
  assert.equal(GAME_OVER.length, 3);
  for (const llista of [ENCERT, ERROR, GAME_OVER]) {
    const primer = triaFrase(llista, { aleatori: () => 0, anterior: null });
    assert.equal(primer, llista[0]);
    const segon = triaFrase(llista, { aleatori: () => 0, anterior: primer });
    assert.equal(segon, llista[1]);
    assert.notEqual(segon, primer);
    const ultim = triaFrase(llista, { aleatori: () => 0.999999, anterior: null });
    assert.equal(ultim, llista[llista.length - 1]);
  }
});

test('encert mostra una frase d’ENCERT i error afegeix la resposta correcta', async () => {
  const { ENCERT, ERROR } = await carregaFrases();
  const { iniciaJoc } = await carrega('joc');
  const entorn = entornJoc();
  iniciaJoc(entorn.opcions).mostra();
  clicaResposta(entorn, true);
  assert.ok(ENCERT.includes(entorn.node('joc-resultat').textContent));
  entorn.rellotge.disparaTimeout();
  const correcta = respostaCorrecta(entorn);
  clicaResposta(entorn, false);
  const text = entorn.node('joc-resultat').textContent;
  const [frase, ...resta] = text.split(' La resposta era: ');
  assert.ok(ERROR.includes(frase));
  assert.equal(resta.join(' La resposta era: '), correcta);
});

test('un encert crea un +N volant amb els punts exactes i el treu en acabar', async () => {
  const { iniciaJoc } = await carrega('joc');
  const entorn = entornJoc();
  const partida = iniciaJoc(entorn.opcions);
  partida.mostra();
  const abans = partida.resultat().punts;
  clicaResposta(entorn, true);
  const guanyats = partida.resultat().punts - abans;
  const efectes = entorn.node('joc-efectes');
  assert.equal(efectes.children.length, 1);
  assert.equal(efectes.children[0].textContent, `+${guanyats}`);
  assert.equal(efectes.children[0].getAttribute('aria-hidden'), 'true');
  efectes.children[0].listeners.animationend[0]();
  assert.equal(efectes.children.length, 0);
});

test('amb reduced-motion no es crea el +N', async () => {
  const { iniciaJoc } = await carrega('joc');
  const entorn = entornJoc({ redueixMoviment: () => true });
  iniciaJoc(entorn.opcions).mostra();
  clicaResposta(entorn, true);
  assert.equal(entorn.node('joc-efectes').children.length, 0);
});

test('una parella correcta de la ronda bonus també mostra el +N', async () => {
  const { iniciaJoc } = await carrega('joc');
  const entorn = entornJoc();
  const partida = iniciaJoc(entorn.opcions);
  partida.mostra();
  for (let i = 0; i < 8; i += 1) responPregunta(entorn);
  entorn.node('joc-efectes').replaceChildren();
  const abans = partida.resultat().punts;
  parellaCorrecta(entorn);
  const guanyats = partida.resultat().punts - abans;
  const efectes = entorn.node('joc-efectes').children;
  assert.equal(efectes.length, 1);
  assert.equal(efectes[0].textContent, `+${guanyats}`);
});

test('la ronda Parelles posa lang="en" als phrasals i no als significats', async () => {
  const { iniciaJoc } = await carrega('joc');
  const entorn = entornJoc();
  iniciaJoc(entorn.opcions).mostra();
  for (let i = 0; i < 8; i += 1) responPregunta(entorn);
  const esquerra = entorn.node('bonus-esquerra').children;
  const dreta = entorn.node('bonus-dreta').children;
  assert.equal(esquerra.length, 5);
  assert.equal(dreta.length, 5);
  for (const boto of esquerra) {
    assert.equal(boto.getAttribute('lang'), 'en');
  }
  for (const boto of dreta) {
    assert.equal(boto.getAttribute('lang'), null);
  }
});

test('pujar a x2 afegeix classe de color al ratxa i confeti al joc', async () => {
  const { iniciaJoc } = await carrega('joc');
  const entorn = entornJoc();
  iniciaJoc(entorn.opcions).mostra();
  responPregunta(entorn);
  assert.ok(entorn.node('joc-ratxa').classes.has('mult-1'));
  assert.equal(entorn.node('joc-confeti').children.length, 0);
  responPregunta(entorn);
  responPregunta(entorn);
  assert.ok(entorn.node('joc-ratxa').classes.has('mult-2'));
  assert.ok(entorn.node('joc-ratxa').classes.has('pop'));
  assert.equal(entorn.node('joc-confeti').children.length, 10);
});

test('amb reduced-motion no apareix confeti ni pop, però sí el color del multiplicador', async () => {
  const { iniciaJoc } = await carrega('joc');
  const entorn = entornJoc({ redueixMoviment: () => true });
  iniciaJoc(entorn.opcions).mostra();
  for (let i = 0; i < 3; i += 1) responPregunta(entorn);
  assert.ok(entorn.node('joc-ratxa').classes.has('mult-2'));
  assert.equal(entorn.node('joc-ratxa').classes.has('pop'), false);
  assert.equal(entorn.node('joc-confeti').children.length, 0);
});

test('Game Over mostra una frase de la llista sota el títol', async () => {
  const { GAME_OVER } = await carregaFrases();
  const { iniciaJoc } = await carrega('joc');
  const entorn = entornJoc();
  iniciaJoc(entorn.opcions).mostra();
  for (let i = 0; i < 3; i += 1) responPregunta(entorn, false);
  assert.ok(GAME_OVER.includes(entorn.node('gameover-frase').textContent));
  assert.match(entorn.node('gameover-titol').textContent, /GAME OVER/);
});

test('repas.js fa servir frases.js i ja no defineix les llistes velles', () => {
  const codi = readFileSync(new URL('../js/repas.js', import.meta.url), 'utf8');
  assert.match(codi, /frases\.js\?v=17/);
  assert.doesNotMatch(codi, /MISSATGES_OK|MISSATGES_KO/);
});

test('les opcions angleses porten lang="en" i les catalanes no', async () => {
  const { iniciaJoc } = await carrega('joc');
  const tipus = [
    { aleatori: () => 0, esperat: 'A', angles: false },
    { aleatori: () => 0.5, esperat: 'B', angles: true },
    { aleatori: () => 0.99, esperat: 'C', angles: true }
  ];
  for (const cas of tipus) {
    const entorn = entornJoc({ aleatori: cas.aleatori });
    iniciaJoc(entorn.opcions).mostra();
    const preguntaNode = entorn.node('joc-pregunta');
    assert.equal(preguntaNode.dataset.tipus, cas.esperat);
    if (cas.esperat === 'B') assert.equal(preguntaNode.getAttribute('lang'), 'en');
    for (const boto of entorn.node('joc-opcions').children) {
      assert.equal(boto.getAttribute('lang'), cas.angles ? 'en' : null, `Opció del minijoc ${cas.esperat}`);
    }
  }
});
