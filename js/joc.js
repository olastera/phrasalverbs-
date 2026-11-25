import {
  DURADA_SEGONS,
  VIDES,
  generaPreguntaA,
  generaPreguntaB,
  generaPreguntaC,
  multiplicador,
  puntsEncert
} from './preguntes.js?v=11';
import { estatPerDefecte, registraPartida } from './progres.js?v=11';
import { creaSo } from './so.js?v=11';

const DURADA_MS = DURADA_SEGONS * 1000;
const PAUSA_ENCERT_MS = 400;
const PAUSA_ERROR_MS = 1500;
const ETIQUETES_TIPUS = {
  A: '🤔 Què vol dir?',
  B: '🧩 Completa la frase',
  C: '🔁 Substitueix'
};

function nivellsPermesos(numero) {
  if (numero <= 5) return [1];
  if (numero <= 15) return [1, 2];
  return [1, 2, 3];
}

function triaGenerador(aleatori) {
  const valor = aleatori();
  if (valor < 1 / 3) return generaPreguntaA;
  if (valor < 2 / 3) return generaPreguntaB;
  return generaPreguntaC;
}

const rellotgeNatiu = {
  ara: () => Date.now(),
  cada: (ms, funcio) => setInterval(funcio, ms),
  atura: (id) => clearInterval(id),
  despres: (ms, funcio) => setTimeout(funcio, ms),
  cancela: (id) => clearTimeout(id)
};

export function iniciaJoc({
  phrasals = [],
  dom = document,
  rellotge = rellotgeNatiu,
  navega = (hash) => { location.hash = hash; },
  aleatori = Math.random,
  leitner = {},
  estat = null,
  desa = () => {},
  so = null,
  demanaToken = null,
  redueixMoviment = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
} = {}) {
  const node = (id) => dom.getElementById(id);
  const soJoc = so ?? creaSo();
  const estatLocal = estatPerDefecte();
  let intervalId = null;
  let timeoutId = null;
  let actiu = false;
  let acabat = false;
  let bloquejat = false;
  let msRestants = DURADA_MS;
  let iniciTick = 0;
  let iniciPregunta = 0;
  let vides = VIDES;
  let punts = 0;
  let encerts = 0;
  let errors = 0;
  let ratxa = 0;
  let millorRatxa = 0;
  let preguntesFetes = 0;
  let pregunta = null;
  let token = null;
  let guardat = false;
  let generacio = 0;
  const usats = new Set();
  const fallats = new Set();
  const comptadorIds = [];

  function estatActual() {
    return typeof estat === 'function' ? estat() : estat ?? estatLocal;
  }

  function cancelaComptador() {
    while (comptadorIds.length > 0) rellotge.cancela(comptadorIds.pop());
  }

  function configuraBotoGuardar() {
    const boto = node('gameover-ranking');
    if (!boto) return;
    boto.disabled = guardat;
    boto.textContent = guardat ? '✅ Guardat al rànquing' : '🏆 Guardar al rànquing';
    const avis = node('gameover-ranking-avis');
    if (avis) {
      avis.textContent = '';
      avis.hidden = true;
    }
  }

  function resultat() {
    return { punts, encerts, token, guardat };
  }

  function marcaGuardat() {
    guardat = true;
    configuraBotoGuardar();
  }

  function comptaPunts(total) {
    cancelaComptador();
    node('gameover-punts').textContent = '0';
    if (redueixMoviment()) {
      node('gameover-punts').textContent = String(total);
      return;
    }
    const passos = 20;
    for (let pas = 1; pas <= passos; pas++) {
      comptadorIds.push(rellotge.despres(50 * pas, () => {
        node('gameover-punts').textContent = String(Math.round((total * pas) / passos));
      }));
    }
  }

  function mostraConfeti(nouRecord) {
    const contenidor = node('gameover-confeti');
    if (!contenidor) return;
    contenidor.replaceChildren();
    if (!nouRecord || redueixMoviment()) return;
    const peces = Array.from({ length: 18 }, (_, index) => {
      const peca = dom.createElement('span');
      peca.className = 'confeti';
      peca.textContent = index % 2 === 0 ? '🎉' : '✨';
      peca.style.left = `${(index * 37) % 100}%`;
      peca.style.animationDelay = `${(index % 6) * 0.09}s`;
      return peca;
    });
    contenidor.append(...peces);
  }

  function mostraFallats() {
    const perId = new Map(phrasals.map((entrada) => [entrada.id, entrada]));
    const llista = node('gameover-fallats');
    llista?.replaceChildren(...[...fallats].map((id) => {
      const entrada = perId.get(id);
      const fila = dom.createElement('li');
      const nom = dom.createElement('strong');
      nom.textContent = entrada?.phrasal ?? id;
      nom.setAttribute('lang', 'en');
      fila.append(nom, dom.createTextNode(` — ${entrada?.significat ?? ''}`));
      return fila;
    }));
    const sense = node('gameover-sense-fallats');
    if (sense) {
      sense.hidden = fallats.size > 0;
      sense.textContent = fallats.size > 0 ? '' : '🎉 No has fallat cap phrasal. Perfecte!';
    }
    const boto = node('gameover-repassa');
    if (boto) boto.hidden = fallats.size === 0;
  }

  function mostraTemps() {
    const segons = Math.ceil(msRestants / 1000);
    node('joc-temps').textContent = String(segons);
    const barra = node('joc-barra');
    barra.style.width = `${(msRestants / DURADA_MS) * 100}%`;
    barra.parentElement?.setAttribute?.('aria-valuenow', String(segons));
    node('joc-temps').classList.toggle('perill', msRestants <= 10000);
  }

  function mostraCap() {
    node('joc-vides').textContent = '❤️'.repeat(vides) + '💔'.repeat(VIDES - vides);
    node('joc-punts').textContent = String(punts);
    node('joc-ratxa').textContent = `🔥 x${multiplicador(ratxa)}`;
  }

  function aturaRellotge() {
    if (intervalId !== null) {
      const ara = rellotge.ara();
      msRestants = Math.max(0, msRestants - (ara - iniciTick));
      rellotge.atura(intervalId);
      intervalId = null;
    }
    if (timeoutId !== null) {
      rellotge.cancela(timeoutId);
      timeoutId = null;
    }
  }

  function acaba(motiu) {
    if (acabat) return; // mai registrar la mateixa partida dos cops
    aturaRellotge();
    actiu = false;
    acabat = true;
    bloquejat = true;
    const resultat = registraPartida(estatActual(), {
      punts, encerts, errors, fallats: [...fallats]
    });
    desa();
    soJoc.gameOver?.();
    node('gameover-titol').textContent = motiu === 'temps' ? '⏰ TEMPS!' : '💀 GAME OVER';
    comptaPunts(punts);
    node('gameover-encerts').textContent = String(encerts);
    node('gameover-errors').textContent = String(errors);
    node('gameover-ratxa').textContent = `🔥 ${millorRatxa}`;
    const avis = node('gameover-record');
    if (avis) {
      avis.hidden = !resultat.nouRecord;
      avis.textContent = resultat.nouRecord ? '🆕 NOU RÈCORD PERSONAL!' : '';
    }
    mostraConfeti(resultat.nouRecord);
    mostraFallats();
    navega('#gameover');
  }

  function iniciaRellotge() {
    aturaRellotge();
    iniciTick = rellotge.ara();
    intervalId = rellotge.cada(250, () => {
      if (!actiu || acabat || bloquejat) return;
      const ara = rellotge.ara();
      msRestants = Math.max(0, msRestants - (ara - iniciTick));
      iniciTick = ara;
      mostraTemps();
      if (msRestants === 0) acaba('temps');
    });
  }

  function mostraPregunta() {
    const preguntaNode = node('joc-pregunta');
    const traduccioNode = node('joc-traduccio');
    preguntaNode.dataset.tipus = pregunta.tipus;
    preguntaNode.dataset.id = pregunta.id;
    node('joc-tipus').textContent = ETIQUETES_TIPUS[pregunta.tipus] ?? ETIQUETES_TIPUS.A;

    if (pregunta.tipus === 'B') {
      const trossos = pregunta.forat.split('___');
      preguntaNode.textContent = '';
      preguntaNode.replaceChildren(
        dom.createTextNode(trossos.shift()),
        ...trossos.flatMap((tros) => {
          const forat = dom.createElement('strong');
          forat.classList.add('forat');
          forat.textContent = '___';
          return [forat, dom.createTextNode(tros)];
        })
      );
      traduccioNode.textContent = pregunta.traduccio;
      traduccioNode.hidden = false;
    } else if (pregunta.tipus === 'C') {
      const sinonim = dom.createElement('strong');
      sinonim.textContent = pregunta.sinonim;
      preguntaNode.textContent = '';
      preguntaNode.replaceChildren(
        dom.createTextNode('Quin phrasal vol dir '),
        sinonim,
        dom.createTextNode('?')
      );
      traduccioNode.textContent = '';
      traduccioNode.hidden = true;
    } else {
      preguntaNode.replaceChildren();
      preguntaNode.textContent = pregunta.phrasal;
      traduccioNode.textContent = '';
      traduccioNode.hidden = true;
    }

    node('joc-opcions').replaceChildren(...pregunta.opcions.map((text, index) => {
      const boto = dom.createElement('button');
      boto.type = 'button';
      boto.className = 'boto boto-resposta';
      boto.textContent = text;
      boto.addEventListener('click', () => respon(index, boto));
      return boto;
    }));
    node('joc-resultat').textContent = '';
  }

  function seguentPregunta() {
    const genera = triaGenerador(aleatori);
    const numero = preguntesFetes + 1;
    const nivells = nivellsPermesos(numero);
    let candidats = phrasals.filter((entry) => !usats.has(entry.id) && nivells.includes(entry.nivell));
    if (candidats.length === 0) candidats = phrasals.filter((entry) => !usats.has(entry.id));
    if (candidats.length === 0) candidats = phrasals;
    let pool = candidats;
    if ((numero - 1) % 10 < 3) {
      const caixes = typeof leitner === 'function' ? leitner() : leitner;
      const deCaixa1 = candidats.filter((entry) => caixes?.[entry.id]?.caixa === 1);
      if (deCaixa1.length > 0) pool = deCaixa1;
    }
    const encert = pool[Math.floor(aleatori() * pool.length)];
    pregunta = genera(phrasals, { aleatori, exclosos: [...usats], id: encert.id });
    if (!pregunta) {
      acaba('temps');
      return;
    }
    preguntesFetes += 1;
    usats.add(pregunta.id);
    iniciPregunta = rellotge.ara();
    bloquejat = false;
    mostraPregunta();
  }

  function respon(index, boto) {
    if (!actiu || bloquejat || acabat) return;
    bloquejat = true;
    const segons = (rellotge.ara() - iniciPregunta) / 1000;

    if (pregunta.opcions[index] === pregunta.correcta) {
      const multiplicadorAnterior = multiplicador(ratxa);
      ratxa += 1;
      millorRatxa = Math.max(millorRatxa, ratxa);
      encerts += 1;
      punts += puntsEncert(ratxa, segons);
      soJoc.encert?.();
      if (multiplicador(ratxa) > multiplicadorAnterior) soJoc.pujada?.();
      boto.classList.add('encert');
      node('joc-resultat').textContent = '🎉 Brutal!';
      mostraCap();
      aturaRellotge();
      timeoutId = rellotge.despres(PAUSA_ENCERT_MS, () => {
        timeoutId = null;
        if (!actiu || acabat) return;
        seguentPregunta();
        iniciaRellotge();
      });
      return;
    }

    boto.classList.add('erronia');
    soJoc.error?.();
    fallats.add(pregunta.id);
    const correctIndex = pregunta.opcions.indexOf(pregunta.correcta);
    node('joc-opcions').children[correctIndex]?.classList.add('correcta');
    errors += 1;
    vides = Math.max(0, vides - 1);
    ratxa = 0;
    mostraCap();
    node('joc-resultat').textContent = `😵 La resposta era: ${pregunta.correcta}`;
    const ultimaVida = vides === 0;
    aturaRellotge();
    timeoutId = rellotge.despres(PAUSA_ERROR_MS, () => {
      timeoutId = null;
      if (!actiu || acabat) return;
      if (ultimaVida) {
        acaba('vides');
        return;
      }
      seguentPregunta();
      iniciaRellotge();
    });
  }

  function reinicia() {
    aturaRellotge();
    cancelaComptador();
    fallats.clear();
    msRestants = DURADA_MS;
    vides = VIDES;
    punts = 0;
    encerts = 0;
    errors = 0;
    ratxa = 0;
    millorRatxa = 0;
    preguntesFetes = 0;
    usats.clear();
    pregunta = null;
    token = null;
    guardat = false;
    const meva = ++generacio;
    configuraBotoGuardar();
    if (typeof demanaToken === 'function') {
      try {
        Promise.resolve(demanaToken()).then((resposta) => {
          if (generacio !== meva || acabat || !resposta?.ok || typeof resposta.token !== 'string') return;
          token = resposta.token;
        }).catch(() => {});
      } catch {
        token = null;
      }
    }
    actiu = true;
    acabat = false;
    bloquejat = false;
    mostraCap();
    mostraTemps();
    seguentPregunta();
    iniciaRellotge();
  }

  function mostra() {
    if (actiu && !acabat && msRestants > 0) return;
    reinicia();
  }

  function atura() {
    aturaRellotge();
    cancelaComptador();
    actiu = false;
    bloquejat = true;
  }

  node('gameover-rejuga')?.addEventListener('click', () => {
    atura();
    navega('#joc');
  });

  return { mostra, atura, fallats: () => [...fallats], resultat, marcaGuardat };
}
