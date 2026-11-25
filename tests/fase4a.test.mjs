import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = new URL('../js/', import.meta.url).href;
const carrega = (nom) => import(`${base}${nom}.js?v=13`);
const dadesReals = JSON.parse(readFileSync(new URL('../contingut/phrasals.json', import.meta.url), 'utf8'));
const { generaParelles } = await carrega('preguntes');
const { iniciaJoc } = await carrega('joc');

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
    disabled: false,
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
      for (const funcio of this.listeners.click ?? []) funcio({ preventDefault() {}, target: this });
    },
    append(...nodes) { this.children.push(...nodes); },
    replaceChildren(...nodes) { this.children = nodes; },
    setAttribute(clau, valor) { this.attributes[clau] = valor; },
    getAttribute(clau) { return this.attributes[clau]; },
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
    pendents: () => timeouts.length,
    intervalsActius: () => intervals.size
  };
}

function entornJoc(opcions = {}) {
  const dom = domFake();
  const rellotge = rellotgeFake();
  const navegat = [];
  const so = { encert: [], error: [], pujada: [], gameOver: [] };
  return {
    dom,
    rellotge,
    navegat,
    so,
    node: (id) => dom.getElementById(id),
    opcions: {
      phrasals: dadesReals.phrasals,
      dom,
      rellotge,
      estat: null,
      navega: (hash) => navegat.push(hash),
      aleatori: () => 0,
      redueixMoviment: () => true,
      so: {
        encert: () => so.encert.push(true),
        error: () => so.error.push(true),
        pujada: () => so.pujada.push(true),
        gameOver: () => so.gameOver.push(true)
      },
      ...opcions
    }
  };
}

function respostaCorrecta(entorn) {
  const preguntaNode = entorn.node('joc-pregunta');
  const entrada = entorn.opcions.phrasals.find((entry) => entry.id === preguntaNode.dataset.id);
  if (!entrada) return null;
  if (preguntaNode.dataset.tipus === 'B') return entrada.particula;
  if (preguntaNode.dataset.tipus === 'C') return entrada.phrasal;
  return entrada.significat;
}

function responPregunta(entorn, correcte = true, disparaTimeout = true) {
  const valor = respostaCorrecta(entorn);
  const opcionsNodes = entorn.node('joc-opcions').children;
  const index = opcionsNodes.findIndex((boto) => boto.textContent === valor);
  assert.notEqual(index, -1, `No s'ha trobat la resposta correcta: ${valor}`);
  opcionsNodes[correcte ? index : (index === 0 ? 1 : 0)].clica();
  if (disparaTimeout) entorn.rellotge.disparaTimeout();
}

function parella(entorn, correcte = true) {
  const esquerra = entorn.node('bonus-esquerra').children.find((boto) => !boto.disabled && boto.dataset.id);
  assert.ok(esquerra, 'No queda cap phrasal disponible a la ronda bonus');
  const dretaCorrecta = entorn.node('bonus-dreta').children
    .find((boto) => !boto.disabled && boto.textContent === esquerra.dataset.significat);
  const dreta = correcte
    ? dretaCorrecta
    : entorn.node('bonus-dreta').children.find((boto) => !boto.disabled && boto !== dretaCorrecta);
  assert.ok(dreta, 'No queda cap significat disponible a la ronda bonus');
  esquerra.clica();
  dreta.clica();
  return { id: esquerra.dataset.id, esquerra, dreta };
}

function acabaRonda(entorn) {
  entorn.rellotge.avanca(15000);
  entorn.rellotge.disparaTimeout();
}

test('generaParelles dona 5 phrasals, 5 significats diferents i cap similar', () => {
  const ronda = generaParelles(dadesReals.phrasals, { aleatori: () => 0.2, nivells: [1, 2] });
  assert.equal(ronda.esquerra.length, 5);
  assert.equal(new Set(ronda.esquerra.map((entry) => entry.phrasal)).size, 5);
  assert.equal(new Set(ronda.esquerra.map((entry) => entry.significat)).size, 5);
  assert.equal(new Set(ronda.dreta).size, 5);
  assert.deepEqual(new Set(ronda.dreta), new Set(ronda.esquerra.map((entry) => entry.significat)));
  assert.ok(ronda.esquerra.every((entry) => [1, 2].includes(entry.nivell)));
  for (const a of ronda.esquerra) {
    for (const b of ronda.esquerra) {
      if (a.id !== b.id) {
        assert.equal((a.similars ?? []).includes(b.id), false);
        assert.equal((b.similars ?? []).includes(a.id), false);
      }
    }
  }
  for (const entry of ronda.esquerra) {
    assert.equal(ronda.solucio[entry.id], entry.significat);
  }
});

test('generaParelles retorna null si no hi ha 5 phrasals vàlids', () => {
  const quatre = dadesReals.phrasals.slice(0, 4);
  assert.equal(generaParelles(quatre, { aleatori: () => 0, nivells: [1, 2, 3] }), null);
});

test('generaParelles respecta els nivells que rep', () => {
  const ronda = generaParelles(dadesReals.phrasals, { aleatori: () => 0.7, nivells: [3] });
  assert.ok(ronda);
  assert.ok(ronda.esquerra.every((entry) => entry.nivell === 3));
});

test('la ronda no surt fins a la pregunta 8 i torna a sortir a la 16', () => {
  const entorn = entornJoc();
  const partida = iniciaJoc(entorn.opcions);
  partida.mostra();
  assert.equal(entorn.node('bonus').hidden, true);
  for (let i = 0; i < 6; i += 1) {
    responPregunta(entorn);
    assert.equal(entorn.node('bonus').hidden, true, `No toca a la pregunta ${i + 1}`);
  }
  responPregunta(entorn);
  assert.equal(entorn.node('bonus').hidden, true, 'No toca en passar a la pregunta 8');
  responPregunta(entorn);
  assert.equal(entorn.node('bonus').hidden, false);
  acabaRonda(entorn);
  for (let i = 9; i < 16; i += 1) {
    responPregunta(entorn);
    assert.equal(entorn.node('bonus').hidden, true, `No toca a la pregunta ${i}`);
  }
  responPregunta(entorn);
  assert.equal(entorn.node('bonus').hidden, false);
});

test('durant la ronda i el missatge el rellotge principal no baixa', () => {
  const entorn = entornJoc();
  const partida = iniciaJoc(entorn.opcions);
  partida.mostra();
  for (let i = 0; i < 8; i += 1) responPregunta(entorn);
  const abans = entorn.node('joc-temps').textContent;
  entorn.rellotge.avanca(15000);
  assert.equal(entorn.node('joc-temps').textContent, abans);
  entorn.rellotge.disparaTimeout();
  assert.equal(entorn.node('joc-temps').textContent, abans);
  entorn.rellotge.avanca(1250);
  assert.ok(Number(entorn.node('joc-temps').textContent) < Number(abans));
});

test('als 15 s la ronda s’acaba sola i torna la pregunta normal', () => {
  const entorn = entornJoc();
  const partida = iniciaJoc(entorn.opcions);
  partida.mostra();
  for (let i = 0; i < 8; i += 1) responPregunta(entorn);
  entorn.rellotge.avanca(15000);
  assert.equal(entorn.node('bonus').hidden, true);
  assert.equal(entorn.node('joc-preguntes').hidden, false);
  assert.match(entorn.node('joc-resultat').textContent, /⚡ 0\/5 parelles/);
  entorn.rellotge.disparaTimeout();
  assert.ok(entorn.node('joc-opcions').children.length === 4);
});

test('una parella correcta suma 10 × multiplicador sense bonus de velocitat', () => {
  const entorn = entornJoc();
  const partida = iniciaJoc(entorn.opcions);
  partida.mostra();
  responPregunta(entorn);
  responPregunta(entorn);
  assert.equal(entorn.node('joc-ratxa').textContent, '🔥 x1');
  for (let i = 2; i < 8; i += 1) responPregunta(entorn);
  const puntsAbans = partida.resultat().punts;
  const encertsAbans = partida.resultat().encerts;
  parella(entorn);
  assert.equal(partida.resultat().punts - puntsAbans, 30);
  assert.equal(partida.resultat().encerts, encertsAbans + 1);
  assert.equal(entorn.node('joc-ratxa').textContent, '🔥 x3');
  assert.equal(entorn.so.encert.length, 9);
  assert.equal(entorn.so.pujada.length, 2);
});

test('una parella errònia resta una vida, reinicia la ratxa i afegeix el phrasal a fallats', () => {
  const entorn = entornJoc();
  const partida = iniciaJoc(entorn.opcions);
  partida.mostra();
  for (let i = 0; i < 8; i += 1) responPregunta(entorn);
  const { id, esquerra, dreta } = parella(entorn, false);
  assert.equal(partida.fallats().includes(id), true);
  assert.equal(entorn.node('joc-vides').textContent, '❤️❤️💔');
  assert.equal(entorn.node('joc-ratxa').textContent, '🔥 x1');
  assert.equal(esquerra.classes.has('erronia'), true);
  assert.equal(dreta.classes.has('erronia'), true);
  assert.equal(entorn.so.error.length, 1);
});

test('una parella errònia amb l’última vida acaba la partida després del missatge', () => {
  const entorn = entornJoc();
  const partida = iniciaJoc(entorn.opcions);
  partida.mostra();
  responPregunta(entorn, false);
  responPregunta(entorn, false);
  for (let i = 2; i < 8; i += 1) responPregunta(entorn);
  parella(entorn, false);
  entorn.rellotge.avanca(15000);
  entorn.rellotge.disparaTimeout();
  assert.deepEqual(entorn.navegat, ['#gameover']);
  assert.match(entorn.node('gameover-titol').textContent, /GAME OVER/);
  assert.equal(entorn.so.gameOver.length, 1);
});

test('un doble toc a la mateixa parella només puntua un cop', () => {
  const entorn = entornJoc();
  const partida = iniciaJoc(entorn.opcions);
  partida.mostra();
  for (let i = 0; i < 8; i += 1) responPregunta(entorn);
  const abans = partida.resultat().punts;
  const casual = parella(entorn);
  casual.dreta.clica();
  casual.esquerra.clica();
  casual.dreta.clica();
  assert.equal(partida.resultat().punts - abans, 30);
  assert.equal(partida.resultat().encerts, 9);
});

test('tocar la dreta sense selecció no fa res', () => {
  const entorn = entornJoc();
  const partida = iniciaJoc(entorn.opcions);
  partida.mostra();
  for (let i = 0; i < 8; i += 1) responPregunta(entorn);
  const punts = partida.resultat().punts;
  const vides = entorn.node('joc-vides').textContent;
  entorn.node('bonus-dreta').children[0].clica();
  assert.equal(partida.resultat().punts, punts);
  assert.equal(entorn.node('joc-vides').textContent, vides);
  assert.equal(entorn.node('bonus-esquerra').children.some((boto) => boto.classes.has('seleccionada')), false);
});

test('atura() durant la ronda cancel·la tots els temporitzadors', () => {
  const entorn = entornJoc();
  const partida = iniciaJoc(entorn.opcions);
  partida.mostra();
  for (let i = 0; i < 8; i += 1) responPregunta(entorn);
  partida.atura();
  assert.equal(entorn.rellotge.pendents(), 0);
  assert.equal(entorn.rellotge.intervalsActius(), 0);
  assert.equal(entorn.node('bonus').hidden, true);
});

test('els phrasals de la ronda no s’afegeixen als de la partida', () => {
  const entorn = entornJoc();
  const partida = iniciaJoc(entorn.opcions);
  partida.mostra();
  for (let i = 0; i < 8; i += 1) responPregunta(entorn);
  const idsBonus = entorn.node('bonus-esquerra').children.map((boto) => boto.dataset.id);
  assert.equal(new Set(idsBonus).size, 5);
  for (const id of idsBonus) {
    assert.equal(partida.usats().includes(id), false);
  }
});

test('una parella errònia deixa els botons actius i permet repetir les dues parelles', () => {
  const entorn = entornJoc();
  const partida = iniciaJoc(entorn.opcions);
  partida.mostra();
  for (let i = 0; i < 8; i += 1) responPregunta(entorn);
  const encertsAbans = partida.resultat().encerts;
  const { esquerra, dreta } = parella(entorn, false);
  assert.equal(esquerra.disabled, false);
  assert.equal(dreta.disabled, false);
  assert.equal(esquerra.classes.has('seleccionada'), false);
  assert.equal(esquerra.classes.has('erronia'), true);
  assert.equal(dreta.classes.has('erronia'), true);
  assert.equal(entorn.rellotge.pendents(), 1);
  entorn.rellotge.disparaTimeout();
  assert.equal(esquerra.classes.has('erronia'), false);
  assert.equal(dreta.classes.has('erronia'), false);

  const altreEsquerra = entorn.node('bonus-esquerra').children.find(
    (boto) => boto !== esquerra && !boto.disabled && boto.dataset.significat === dreta.textContent
  );
  assert.ok(altreEsquerra, 'No s’ha trobat el phrasal del significat triat');
  altreEsquerra.clica();
  dreta.clica();
  assert.equal(partida.resultat().encerts, encertsAbans + 1);
  assert.equal(altreEsquerra.disabled, true);
  assert.equal(dreta.disabled, true);

  const dretaCorrecta = entorn.node('bonus-dreta').children.find(
    (boto) => !boto.disabled && boto.textContent === esquerra.dataset.significat
  );
  assert.ok(dretaCorrecta, 'El significat correcte del phrasal fallat no continua actiu');
  esquerra.clica();
  dretaCorrecta.clica();
  assert.equal(partida.resultat().encerts, encertsAbans + 2);
  assert.equal(esquerra.disabled, true);
  assert.equal(dretaCorrecta.disabled, true);

  parella(entorn);
  parella(entorn);
  assert.equal(entorn.node('bonus').hidden, false);
  assert.equal(entorn.node('joc-resultat').textContent, '');
  assert.equal(partida.resultat().encerts, encertsAbans + 4);
});

test('el missatge final és Perfecte només si la ronda no ha tingut errors', () => {
  const senseErrors = entornJoc();
  iniciaJoc(senseErrors.opcions).mostra();
  for (let i = 0; i < 8; i += 1) responPregunta(senseErrors);
  for (let i = 0; i < 5; i += 1) parella(senseErrors);
  assert.equal(senseErrors.node('joc-resultat').textContent, '⚡ Perfecte! 5/5 🤩');

  const ambError = entornJoc();
  iniciaJoc(ambError.opcions).mostra();
  for (let i = 0; i < 8; i += 1) responPregunta(ambError);
  parella(ambError, false);
  ambError.rellotge.disparaTimeout();
  for (let i = 0; i < 5; i += 1) parella(ambError);
  assert.equal(ambError.node('joc-resultat').textContent, '⚡ 5/5 parelles · 1 error');
  assert.doesNotMatch(ambError.node('joc-resultat').textContent, /Perfecte/);
});

test('fallar la pregunta 8 també obre la ronda bonus després de la pausa d’error', () => {
  const entorn = entornJoc();
  const partida = iniciaJoc(entorn.opcions);
  partida.mostra();
  for (let i = 0; i < 7; i += 1) responPregunta(entorn);
  responPregunta(entorn, false, false);
  assert.equal(entorn.node('bonus').hidden, true);
  assert.equal(entorn.node('joc-vides').textContent, '❤️❤️💔');
  entorn.rellotge.disparaTimeout();
  assert.equal(entorn.node('bonus').hidden, false);
});

test('l’HTML i el CSS tenen la ronda bonus amb aria-live i botons de 48 px', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../css/estils.css', import.meta.url), 'utf8');
  assert.match(html, /⚡ RONDA BONUS: Parelles/);
  assert.match(html, /id="bonus-esquerra"/);
  assert.match(html, /id="bonus-dreta"/);
  assert.match(html, /id="bonus-barra"/);
  assert.match(html, /id="bonus-estat"[^>]*aria-live="polite"|aria-live="polite"[^>]*id="bonus-estat"/);
  assert.match(css, /min-height:\s*48px/);
  assert.match(css, /\.bonus-parelles[\s\S]*grid-template-columns:\s*repeat\(2/);
  assert.doesNotMatch(html, /\?v=11/);
  assert.doesNotMatch(css, /\?v=11/);
});
