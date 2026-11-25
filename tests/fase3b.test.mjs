import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = new URL('../js/', import.meta.url).href;
const carrega = (nom) => import(`${base}${nom}.js?v=17`);
const { creaClientRanking, iniciaInicials, iniciaRanking } = await carrega('ranking');

function respostaJson(dades) {
  return { ok: true, status: 200, json: async () => dades };
}

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
    value: '',
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
    clica(esdeveniment = {}) {
      for (const funcio of this.listeners.click ?? []) funcio({ preventDefault() {}, ...esdeveniment });
    },
    escriu() { for (const funcio of this.listeners.input ?? []) funcio({ target: this }); },
    prem(tecla) { for (const funcio of this.listeners.keydown ?? []) funcio({ key: tecla, target: this }); },
    append(...nodes) { this.children.push(...nodes); },
    replaceChildren(...nodes) { this.children = nodes; },
    setAttribute(clau, valor) { this.attributes[clau] = valor; },
    getAttribute(clau) { return this.attributes[clau]; },
    focus() { this.ambFocus = true; },
    querySelector: () => elementFake(),
    querySelectorAll: () => []
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

function fills(node) {
  return [...(node?.children ?? [])].flatMap((fill) => [
    ...(fill.nodeType === 1 ? [fill] : []),
    ...fills(fill)
  ]);
}

function textDe(node) {
  return [node?.textContent ?? '', ...fills(node).map((fill) => fill.textContent ?? '')]
    .filter((tros) => tros !== '')
    .join(' ');
}

function casual() {
  return new Promise(() => {});
}

function espera() {
  return new Promise((resol) => setImmediate(resol));
}

test('sense xarxa, ranking.js retorna {ok:false, error:sense_connexio}', async () => {
  const client = creaClientRanking({ fetchFn: async () => { throw new Error('xarxa'); } });
  assert.deepEqual(await client.demanaToken(), { ok: false, error: 'sense_connexio' });
});

test('una resposta que no és JSON retorna sense_connexio', async () => {
  const client = creaClientRanking({
    fetchFn: async () => ({ ok: true, json: async () => { throw new SyntaxError('no JSON'); } })
  });
  assert.deepEqual(await client.guarda({ token: 't', inicials: 'AB', punts: 10, encerts: 1 }), {
    ok: false, error: 'sense_connexio'
  });
});

test('una crida que supera el temps retorna sense_connexio i aborta la petició', async () => {
  let senyal = null;
  const client = creaClientRanking({
    timeoutMs: 10,
    fetchFn: (url, opcions) => {
      senyal = opcions.signal;
      return new Promise((resol, rebutja) => {
        senyal.addEventListener('abort', () => rebutja(new Error('abortada')));
      });
    }
  });
  assert.deepEqual(await client.top('setmana'), { ok: false, error: 'sense_connexio' });
  assert.equal(senyal.aborted, true);
});

test('top afegeix &t=Date.now() per evitar la memòria cau d’Aruba', async () => {
  const urls = [];
  const client = creaClientRanking({
    ara: () => 123456789,
    fetchFn: async (url) => {
      urls.push(url);
      return respostaJson({ ok: true, llista: [] });
    }
  });
  await client.top('setmana');
  await client.top('sempre');
  assert.equal(urls[0], 'api/ranking.php?accio=top&periode=setmana&t=123456789');
  assert.equal(urls[1], 'api/ranking.php?accio=top&periode=sempre&t=123456789');
});

test('guarda envia token, inicials, punts i encerts per POST', async () => {
  let peticio = null;
  const client = creaClientRanking({
    fetchFn: async (url, opcions) => {
      peticio = { url, opcions };
      return respostaJson({ ok: true, posicioSetmana: 1, posicioSempre: 2 });
    }
  });
  const resposta = await client.guarda({ token: 'abc', inicials: 'AB', punts: 120, encerts: 4 });
  assert.equal(peticio.url, 'api/ranking.php?accio=guardar');
  assert.equal(peticio.opcions.method, 'POST');
  assert.deepEqual(JSON.parse(peticio.opcions.body), {
    token: 'abc', inicials: 'AB', punts: 120, encerts: 4
  });
  assert.deepEqual(resposta, { ok: true, posicioSetmana: 1, posicioSempre: 2 });
});

test('un error del servidor es retorna tal qual (no es converteix en sense_connexio)', async () => {
  const client = creaClientRanking({
    fetchFn: async () => respostaJson({ ok: false, error: 'temps_invalid' })
  });
  assert.deepEqual(await client.demanaToken(), { ok: false, error: 'temps_invalid' });
});

function rellotgeFake() {
  let ara = 0;
  let interval = null;
  const timeouts = [];
  return {
    ara: () => ara,
    cada: (ms, funcio) => { interval = { ms, funcio }; return 1; },
    atura: () => { interval = null; },
    despres: (ms, funcio) => { timeouts.push(funcio); return timeouts.length; },
    cancela: () => {},
    avanca(ms) {
      const fi = ara + ms;
      while (interval && ara + interval.ms <= fi) {
        ara += interval.ms;
        interval.funcio();
      }
      ara = fi;
    },
    disparaTimeout() { timeouts.shift()?.(); }
  };
}

function entornJoc(opcions = {}) {
  const dom = domFake();
  const rellotge = rellotgeFake();
  const navegat = [];
  const phrasals = [
    { id: 'a', phrasal: 'get up', verb: 'get', particula: 'up', significat: 'aixecar-se', sinonim: 'rise', similars: [], exemple: 'Get up!', exempleMarcat: '**Get up**!', forat: '___!', traduccio: 'Aixeca-t!', tema: 'quotidia', nivell: 1 },
    { id: 'b', phrasal: 'get on', verb: 'get', particula: 'on', significat: 'pujar', sinonim: 'board', similars: [], exemple: 'Get on!', exempleMarcat: '**Get on**!', forat: '___!', traduccio: 'Puja!', tema: 'quotidia', nivell: 1 }
  ];
  return {
    dom,
    rellotge,
    navegat,
    node: (id) => dom.document.getElementById(id),
    opcions: {
      phrasals,
      dom: dom.document,
      rellotge,
      estat: null,
      so: null,
      redueixMoviment: () => true,
      navega: (hash) => navegat.push(hash),
      aleatori: () => 0,
      ...opcions
    }
  };
}

test('una partida nova demana token i el joc comença encara que el token no arribi mai', async () => {
  const { iniciaJoc } = await carrega('joc');
  const demanats = [];
  const entorn = entornJoc({ demanaToken: () => { demanats.push(true); return casual(); } });
  const partida = iniciaJoc(entorn.opcions);
  partida.mostra();
  assert.equal(demanats.length, 1);
  assert.ok(entorn.node('joc-pregunta').textContent.length > 0);
  assert.equal(entorn.node('joc-temps').textContent, '90');
  assert.equal(partida.resultat().token, null);
  assert.equal(partida.resultat().punts, 0);
});

test('el token que arriba durant la partida queda guardat amb el resultat', async () => {
  const { iniciaJoc } = await carrega('joc');
  let resol = null;
  const entorn = entornJoc({
    demanaToken: () => new Promise((f) => { resol = f; })
  });
  const partida = iniciaJoc(entorn.opcions);
  partida.mostra();
  assert.equal(partida.resultat().token, null);
  resol({ ok: true, token: 'token123' });
  await espera();
  assert.equal(partida.resultat().token, 'token123');
  assert.deepEqual(partida.resultat(), { punts: 0, encerts: 0, token: 'token123', guardat: false });
});

test('un token que arriba després de acabar la partida no s’hi afegeix', async () => {
  const { iniciaJoc } = await carrega('joc');
  let resol = null;
  const entorn = entornJoc({ demanaToken: () => new Promise((f) => { resol = f; }) });
  const partida = iniciaJoc(entorn.opcions);
  partida.mostra();
  entorn.rellotge.avanca(90000);
  resol({ ok: true, token: 'tard' });
  await espera();
  assert.equal(partida.resultat().token, null);
});

test('tornar a jugar demana un token nou i reactiva el botó de guardar', async () => {
  const { iniciaJoc } = await carrega('joc');
  let numero = 0;
  const entorn = entornJoc({
    demanaToken: async () => ({ ok: true, token: `token${++numero}` })
  });
  const partida = iniciaJoc(entorn.opcions);
  partida.mostra();
  await espera();
  assert.equal(partida.resultat().token, 'token1');
  partida.marcaGuardat();
  assert.equal(entorn.node('gameover-ranking').disabled, true);
  entorn.rellotge.avanca(90000);
  entorn.node('gameover-rejuga').clica();
  partida.mostra();
  await espera();
  assert.equal(numero, 2);
  assert.equal(partida.resultat().token, 'token2');
  assert.equal(partida.resultat().guardat, false);
  assert.equal(entorn.node('gameover-ranking').disabled, false);
});

test('una partida nova amaga i buida l’avís 📡 del botó del rànquing', async () => {
  const { iniciaJoc } = await carrega('joc');
  const entorn = entornJoc();
  const avis = entorn.node('gameover-ranking-avis');
  avis.textContent = '📡 Sense connexió: la puntuació només s’ha guardat al teu dispositiu';
  avis.hidden = false;
  const partida = iniciaJoc(entorn.opcions);
  partida.mostra();
  assert.equal(avis.hidden, true);
  assert.equal(avis.textContent, '');
});

function entornInicials({
  partida = { token: 't', punts: 120, encerts: 3 },
  ultimesInicials = '',
  resposta = { ok: true, posicioSetmana: 7, posicioSempre: 42 }
} = {}) {
  const dom = domFake();
  const crides = [];
  const desats = [];
  const navegat = [];
  const missatges = [];
  const avisos = [];
  const marcat = [];
  const estat = { ultimesInicials };
  const client = {
    guarda: async (dades) => {
      crides.push(dades);
      return typeof resposta === 'function' ? resposta(dades) : resposta;
    }
  };
  const pantalla = iniciaInicials({
    dom: dom.document,
    estat,
    client,
    desa: () => desats.push(true),
    partida: () => partida,
    navega: (hash) => navegat.push(hash),
    enDesat: (dades) => missatges.push(dades),
    avisa: (text) => avisos.push(text),
    marcaGuardat: () => marcat.push(true)
  });
  return {
    dom,
    estat,
    crides,
    desats,
    navegat,
    missatges,
    avisos,
    marcat,
    pantalla,
    node: (id) => dom.document.getElementById(id),
    caselles: () => fills(dom.document.getElementById('inicials-caselles')).filter((n) => n.dataset.casella !== undefined),
    lletres: () => fills(dom.document.getElementById('inicials-caselles'))
      .filter((n) => n.classList.contains('casella-lletra'))
      .map((n) => n.textContent),
    fletxa: (index, direccio) => fills(dom.document.getElementById('inicials-caselles'))
      .filter((n) => n.textContent === direccio)[index].clica()
  };
}

test('▲ des de A posa B, ▼ des de A posa _ i ▼ des de _ posa Z', () => {
  const desDeA = entornInicials({ ultimesInicials: 'A' });
  desDeA.pantalla.mostra();
  desDeA.fletxa(0, '▲');
  assert.equal(desDeA.lletres()[0], 'B');

  const desDeABuit = entornInicials({ ultimesInicials: 'A' });
  desDeABuit.pantalla.mostra();
  desDeABuit.fletxa(0, '▼');
  assert.equal(desDeABuit.lletres()[0], '_');

  const buit = entornInicials();
  buit.pantalla.mostra();
  buit.fletxa(0, '▼');
  assert.equal(buit.lletres()[0], 'Z');
});

test('es poden escriure inicials amb el teclat i s’hi apliquen les normes', async () => {
  const entorn = entornInicials();
  entorn.pantalla.mostra();
  const input = entorn.node('inicials-input');
  input.value = 'òscar';
  input.escriu();
  assert.deepEqual(entorn.lletres(), ['O', 'S', 'C', 'A', 'R']);
  input.value = 'A_B';
  input.escriu();
  entorn.node('inicials-ok').clica();
  await espera();
  assert.equal(entorn.crides.length, 0);
  assert.match(textDe(entorn.node('inicials-resultat')), /😇 Ups! Prova unes altres inicials/);
});

test('AB___ es desa com a AB i es recorda com a últimes inicials', async () => {
  const entorn = entornInicials();
  entorn.pantalla.mostra();
  entorn.node('inicials-input').value = 'AB___';
  entorn.node('inicials-input').escriu();
  entorn.node('inicials-ok').clica();
  await espera();
  assert.deepEqual(entorn.crides[0], { token: 't', inicials: 'AB', punts: 120, encerts: 3 });
  assert.equal(entorn.estat.ultimesInicials, 'AB');
  assert.equal(entorn.desats.length, 1);
  assert.match(textDe(entorn.node('ranking-missatge')), /🏆 Ets el número 7 de la setmana!/);
  assert.deepEqual(entorn.navegat, ['#ranking']);
  assert.deepEqual(entorn.missatges[0], { inicials: 'AB', posicioSetmana: 7, posicioSempre: 42 });
  assert.deepEqual(entorn.marcat, [true]);
});

test('es precarreguen les últimes inicials desades', () => {
  const entorn = entornInicials({ ultimesInicials: 'OSCAR' });
  entorn.pantalla.mostra();
  assert.deepEqual(entorn.lletres(), ['O', 'S', 'C', 'A', 'R']);
  assert.equal(entorn.node('inicials-input').value, 'OSCAR');
});

test('PUTO al client mostra 😇 Ups! i no crida guarda', async () => {
  const entorn = entornInicials();
  entorn.pantalla.mostra();
  entorn.node('inicials-input').value = 'puto';
  entorn.node('inicials-input').escriu();
  entorn.node('inicials-ok').clica();
  await espera();
  assert.equal(entorn.crides.length, 0);
  assert.match(textDe(entorn.node('inicials-resultat')), /😇 Ups! Prova unes altres inicials/);
});

test('un doble clic a OK només fa una crida a guarda', async () => {
  let resol = null;
  const entorn = entornInicials({
    resposta: () => new Promise((f) => { resol = f; })
  });
  entorn.pantalla.mostra();
  entorn.node('inicials-input').value = 'AB';
  entorn.node('inicials-input').escriu();
  const ok = entorn.node('inicials-ok');
  ok.clica();
  ok.clica();
  assert.equal(entorn.crides.length, 1);
  assert.equal(ok.disabled, true);
  resol({ ok: true, posicioSetmana: 3, posicioSempre: 9 });
  await espera();
  assert.equal(entorn.crides.length, 1);
});

test('cada codi d’error del servidor mostra el seu missatge en català', async () => {
  const casos = [
    ['inicials_invalides', /😇 Ups! Prova unes altres inicials/],
    ['temps_invalid', /⏱️ Aquesta partida ja no es pot guardar/],
    ['token_invalid', /✅ Aquesta partida ja estava guardada/],
    ['sense_connexio', /📡 Sense connexió: la puntuació només s’ha guardat al teu dispositiu/]
  ];
  for (const [error, missatge] of casos) {
    const entorn = entornInicials({ resposta: { ok: false, error } });
    entorn.pantalla.mostra();
    entorn.node('inicials-input').value = 'AB';
    entorn.node('inicials-input').escriu();
    entorn.node('inicials-ok').clica();
    await espera();
    assert.match(textDe(entorn.node('inicials-resultat')), missatge, error);
    assert.equal(entorn.node('inicials-ok').disabled, false);
    assert.deepEqual(entorn.navegat, [], error);
  }
});

test('entrar a #inicials sense partida pendent torna a #inici', () => {
  const entorn = entornInicials({ partida: null });
  entorn.pantalla.mostra();
  assert.deepEqual(entorn.navegat, ['#inici']);
});

function entornRanking({
  llista = [],
  servidor = { ok: true, llista },
  records = [{ punts: 500, encerts: 9, data: '2026-11-24T18:03:00' }]
} = {}) {
  const dom = domFake();
  const crides = [];
  const client = {
    top: async (periode) => {
      crides.push(periode);
      return servidor;
    }
  };
  const estat = { records };
  const pantalla = iniciaRanking({ dom: dom.document, estat, client });
  return {
    dom,
    crides,
    pantalla,
    node: (id) => dom.document.getElementById(id),
    files: () => fills(dom.document.getElementById('ranking-llista')).filter((n) => n.dataset.fila !== undefined),
    locals: () => fills(dom.document.getElementById('ranking-records')).filter((n) => n.dataset.fila !== undefined)
  };
}

test('el rànquing mostra 🥇🥈🥉, inicials, punts i data dd/mm', async () => {
  const entorn = entornRanking({
    llista: [
      { pos: 1, inicials: 'PRIMER', punts: 900, data: '2026-11-24' },
      { pos: 2, inicials: 'SEGON', punts: 800, data: '2026-11-23' },
      { pos: 3, inicials: 'TERCER', punts: 700, data: '2026-11-22' }
    ]
  });
  await entorn.pantalla.mostra();
  const textos = entorn.files().map(textDe);
  assert.deepEqual(textos.slice(0, 3).map((t) => t.slice(0, 2)), ['🥇', '🥈', '🥉']);
  assert.ok(textos[0].includes('PRIMER') && textos[0].includes('900') && textos[0].includes('24/11'));
  assert.ok(textos[1].includes('23/11'));
  assert.ok(textos[2].includes('22/11'));
});

test('la fila pròpia es ressalta per posició, no per inicials', async () => {
  const entorn = entornRanking({
    llista: [
      { pos: 1, inicials: 'AB', punts: 900, data: '2026-11-24' },
      { pos: 2, inicials: 'AB', punts: 800, data: '2026-11-23' }
    ]
  });
  entorn.pantalla.prepara({ posicioSetmana: 2, posicioSempre: 9 });
  await entorn.pantalla.mostra();
  const ressaltades = entorn.files().filter((fila) => fila.classList.contains('ressaltada'));
  assert.equal(ressaltades.length, 1);
  assert.match(textDe(ressaltades[0]), /800/);
  assert.equal(entorn.node('ranking-tab-setmana').getAttribute('aria-selected'), 'true');
  assert.equal(entorn.node('ranking-tab-sempre').getAttribute('aria-selected'), 'false');
});

test('els rècords locals no es ressalten mai (revisió de Claude)', async () => {
  const entorn = entornRanking({
    llista: [
      { pos: 1, inicials: 'AB', punts: 900, data: '2026-11-24' },
      { pos: 2, inicials: 'CD', punts: 800, data: '2026-11-23' }
    ],
    records: [
      { punts: 700, encerts: 12, data: '2026-11-24T18:03:00' },
      { punts: 500, encerts: 9, data: '2026-11-23T18:03:00' }
    ]
  });
  entorn.pantalla.prepara({ posicioSetmana: 2, posicioSempre: 2 });
  await entorn.pantalla.mostra();
  assert.equal(entorn.locals().length, 2);
  assert.equal(entorn.locals().filter((fila) => fila.classList.contains('ressaltada')).length, 0);
  assert.equal(entorn.files().filter((fila) => fila.classList.contains('ressaltada')).length, 1);
});

test('en canviar a sempre es ressalta la posició de sempre', async () => {
  const entorn = entornRanking({
    llista: [
      { pos: 1, inicials: 'AB', punts: 900, data: '2026-11-24' },
      { pos: 2, inicials: 'AB', punts: 800, data: '2026-11-23' }
    ]
  });
  entorn.pantalla.prepara({ posicioSetmana: 2, posicioSempre: 1 });
  await entorn.pantalla.mostra();
  entorn.node('ranking-tab-sempre').clica();
  await espera();
  const ressaltades = entorn.files().filter((fila) => fila.classList.contains('ressaltada'));
  assert.deepEqual(entorn.crides, ['setmana', 'sempre']);
  assert.equal(ressaltades.length, 1);
  assert.match(textDe(ressaltades[0]), /900/);
});

test('obrir #ranking des de l’Inici buida el missatge de la posició', async () => {
  const entorn = entornRanking({ llista: [] });
  entorn.node('ranking-missatge').textContent = '🏆 Ets el número 7 de la setmana!';
  await entorn.pantalla.mostra();
  assert.equal(entorn.node('ranking-missatge').textContent, '');
});

test('el missatge de la posició es mostra un cop i es buida en tornar a entrar', async () => {
  const entorn = entornRanking({ llista: [] });
  entorn.node('ranking-missatge').textContent = '🏆 Ets el número 7 de la setmana!';
  entorn.pantalla.prepara({ posicioSetmana: 7, posicioSempre: 42 });
  await entorn.pantalla.mostra();
  assert.match(textDe(entorn.node('ranking-missatge')), /Ets el número 7/);
  await entorn.pantalla.mostra();
  assert.equal(entorn.node('ranking-missatge').textContent, '');
});

test('canviar a la pestanya de sempre crida top amb altre periode', async () => {
  const entorn = entornRanking({ llista: [] });
  await entorn.pantalla.mostra();
  entorn.node('ranking-tab-sempre').clica();
  await espera();
  assert.deepEqual(entorn.crides, ['setmana', 'sempre']);
  assert.equal(entorn.node('ranking-tab-sempre').getAttribute('aria-selected'), 'true');
});

test('una resposta vella de setmana no sobreescriu la de sempre', async () => {
  const dom = domFake();
  const pendents = {};
  const client = {
    top: (periode) => new Promise((resol) => { pendents[periode] = resol; })
  };
  const pantalla = iniciaRanking({ dom: dom.document, estat: {}, client });
  const llista = () => fills(dom.document.getElementById('ranking-llista'))
    .filter((node) => node.dataset.fila !== undefined);
  pantalla.mostra();
  dom.document.getElementById('ranking-tab-sempre').clica();

  pendents.sempre({
    ok: true,
    llista: [{ pos: 1, inicials: 'SEMPRE', punts: 900, data: '2026-11-24' }]
  });
  await espera();
  pendents.setmana({
    ok: true,
    llista: [{ pos: 1, inicials: 'SETMANA', punts: 100, data: '2026-11-23' }]
  });
  await espera();

  assert.equal(llista().length, 1);
  assert.match(textDe(llista()[0]), /SEMPRE/);
  assert.doesNotMatch(textDe(llista()[0]), /SETMANA/);
});

test('sense connexió es mostren només els rècords locals', async () => {
  const entorn = entornRanking({
    servidor: { ok: false, error: 'sense_connexio' },
    records: [
      { punts: 500, encerts: 9, data: '2026-11-24T18:03:00' },
      { punts: 300, encerts: 7, data: '2026-11-23T18:03:00' }
    ]
  });
  await entorn.pantalla.mostra();
  assert.equal(entorn.node('ranking-sense-connexio').hidden, false);
  assert.match(textDe(entorn.node('ranking-sense-connexio')), /📡 Sense connexió. Mostrem només els teus rècords/);
  assert.equal(entorn.files().length, 0);
  assert.equal(entorn.locals().length, 2);
  assert.match(textDe(entorn.locals()[0]), /24\/11/);
});

test('una llista buida convida a ser el primer', async () => {
  const entorn = entornRanking({ llista: [] });
  await entorn.pantalla.mostra();
  assert.match(textDe(entorn.node('ranking-llista')), /primer/i);
});

test('unes inicials <b> del servidor es pinten com a text, no com a HTML', async () => {
  const entorn = entornRanking({ llista: [{ pos: 1, inicials: '<b>', punts: 10, data: '2026-11-24' }] });
  await entorn.pantalla.mostra();
  const fila = entorn.files()[0];
  assert.ok(textDe(fila).includes('<b>'));
  assert.equal(fills(fila).some((node) => node.tagName === 'B'), false);
});

test('l’HTML i l’app connecten les pantalles noves, el botó i la versió 9', () => {
  const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../css/estils.css', import.meta.url), 'utf8');
  assert.match(app, /PANTALLES = \[[^\]]*'inicials'[^\]]*'ranking'/);
  assert.match(html, /data-ruta="#ranking"/);
  assert.match(html, /id="gameover-ranking-avis"/);
  assert.match(html, /id="inicials-input"/);
  assert.match(html, /id="ranking-llista"/);
  assert.match(app, /iniciaInicials|iniciaRanking/);
  assert.match(app, /demanaToken/);
  assert.match(css, /scanlines|repeating-linear-gradient/);
  assert.doesNotMatch(html, /\?v=8|\?v=9/);
  assert.doesNotMatch(css, /\?v=8|\?v=9/);
  assert.doesNotMatch(app, /\?v=8|\?v=9/);
  assert.match(app, /ranking\.js\?v=17/);
});
