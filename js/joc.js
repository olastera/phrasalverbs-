import {
  DURADA_SEGONS,
  VIDES,
  generaParelles,
  generaPreguntaA,
  generaPreguntaB,
  generaPreguntaC,
  multiplicador,
  puntsEncert
} from './preguntes.js?v=17';
import { estatPerDefecte, registraPartida } from './progres.js?v=17';
import { creaSo } from './so.js?v=17';
import { fraseEncert, fraseError, fraseGameOver } from './frases.js?v=17';
import { registra } from './analitica.js?v=17';

const DURADA_MS = DURADA_SEGONS * 1000;
const PAUSA_ENCERT_MS = 400;
const PAUSA_ERROR_MS = 1500;
const BONUS_DURADA_MS = 15000;
const BONUS_PAUSA_MS = 1000;
const BONUS_ERROR_MS = 400;
const PARELLES = 5;
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
  const ratxaNode = node('joc-ratxa');
  ratxaNode?.addEventListener?.('animationend', () => ratxaNode.classList.remove('pop'));
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
  let bonusActiu = false;
  let bonusIntervalId = null;
  let bonusTimeoutId = null;
  let bonusErrorTimeoutId = null;
  let iniciBonus = 0;
  let rondaBonus = null;
  let ultimaFraseEncert = null;
  let ultimaFraseError = null;
  let ultimaFraseGameOver = null;
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
    const multiplicadorActual = multiplicador(ratxa);
    const nodeRatxa = node('joc-ratxa');
    node('joc-vides').textContent = '❤️'.repeat(vides) + '💔'.repeat(VIDES - vides);
    node('joc-punts').textContent = String(punts);
    nodeRatxa.textContent = `🔥 x${multiplicadorActual}`;
    for (const classe of ['mult-1', 'mult-2', 'mult-3', 'mult-4']) nodeRatxa.classList.remove(classe);
    nodeRatxa.classList.add(`mult-${multiplicadorActual}`);
  }

  function mostraPuntsVolants(puntsGuanyats, boto) {
    if (redueixMoviment()) return;
    const contenidor = node('joc-efectes');
    if (!contenidor) return;
    const efecte = dom.createElement('span');
    efecte.className = 'punts-volants';
    efecte.textContent = `+${puntsGuanyats}`;
    efecte.setAttribute('aria-hidden', 'true');
    if (typeof boto?.offsetLeft === 'number' && typeof boto?.offsetWidth === 'number') {
      efecte.style.left = `${boto.offsetLeft + boto.offsetWidth / 2}px`;
      efecte.style.top = `${boto.offsetTop}px`;
    }
    efecte.addEventListener('animationend', () => efecte.remove());
    contenidor.append(efecte);
  }

  function mostraConfetiJoc() {
    if (redueixMoviment()) return;
    const contenidor = node('joc-confeti');
    if (!contenidor) return;
    contenidor.replaceChildren();
    const peces = Array.from({ length: 10 }, (_, index) => {
      const peca = dom.createElement('span');
      peca.className = 'confeti';
      peca.textContent = index % 2 === 0 ? '🎉' : '✨';
      peca.style.left = `${(index * 41) % 100}%`;
      peca.style.animationDelay = `${(index % 5) * 0.07}s`;
      peca.addEventListener('animationend', () => peca.remove());
      return peca;
    });
    contenidor.append(...peces);
  }

  function mostraPujadaMultiplicador() {
    const nodeRatxa = node('joc-ratxa');
    if (!redueixMoviment() && nodeRatxa) {
      nodeRatxa.classList.remove('pop');
      void nodeRatxa.offsetWidth;
      nodeRatxa.classList.add('pop');
    }
    mostraConfetiJoc();
  }

  function mostraFraseEncert() {
    ultimaFraseEncert = fraseEncert({ aleatori, anterior: ultimaFraseEncert });
    node('joc-resultat').textContent = ultimaFraseEncert;
  }

  function mostraFraseError(correcta) {
    ultimaFraseError = fraseError({ aleatori, anterior: ultimaFraseError });
    node('joc-resultat').textContent = `${ultimaFraseError} La resposta era: ${correcta}`;
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

  function cancelaBonusInterval() {
    if (bonusIntervalId !== null) {
      rellotge.atura(bonusIntervalId);
      bonusIntervalId = null;
    }
  }

  function cancelaBonusTimeout() {
    if (bonusTimeoutId !== null) {
      rellotge.cancela(bonusTimeoutId);
      bonusTimeoutId = null;
    }
  }

  function cancelaBonusErrorTimeout() {
    if (bonusErrorTimeoutId !== null) {
      rellotge.cancela(bonusErrorTimeoutId);
      bonusErrorTimeoutId = null;
    }
  }

  function mostraTempsBonus() {
    if (!rondaBonus) return;
    const segons = Math.ceil(rondaBonus.msRestants / 1000);
    const tempsNode = node('bonus-temps');
    tempsNode.textContent = String(segons);
    tempsNode.classList.toggle('perill', rondaBonus.msRestants <= 5000);
    const barra = node('bonus-barra');
    barra.style.width = `${(rondaBonus.msRestants / BONUS_DURADA_MS) * 100}%`;
    barra.parentElement?.setAttribute?.('aria-valuenow', String(segons));
  }

  function amagaBonus() {
    const bonusNode = node('bonus');
    if (bonusNode) bonusNode.hidden = true;
    const preguntesNode = node('joc-preguntes');
    if (preguntesNode) preguntesNode.hidden = false;
    const opcionsNode = node('joc-opcions');
    if (opcionsNode) opcionsNode.hidden = false;
  }

  function aturaBonus() {
    cancelaBonusInterval();
    cancelaBonusTimeout();
    cancelaBonusErrorTimeout();
    bonusActiu = false;
    if (rondaBonus) rondaBonus.finalitzant = true;
    amagaBonus();
  }

  function acabaBonus() {
    if (!bonusActiu || !rondaBonus || rondaBonus.finalitzant) return;
    rondaBonus.finalitzant = true;
    cancelaBonusInterval();
    cancelaBonusErrorTimeout();
    bonusActiu = false;
    amagaBonus();
    const encertsBonus = rondaBonus.encerts;
    const errorsBonus = rondaBonus.errors;
    if (encertsBonus === PARELLES && errorsBonus === 0) {
      node('joc-resultat').textContent = '⚡ Perfecte! 5/5 🤩';
    } else if (encertsBonus === PARELLES) {
      node('joc-resultat').textContent = `⚡ 5/5 parelles · ${errorsBonus} ${errorsBonus === 1 ? 'error' : 'errors'}`;
    } else {
      node('joc-resultat').textContent = `⚡ ${encertsBonus}/5 parelles`;
    }
    bonusTimeoutId = rellotge.despres(BONUS_PAUSA_MS, () => {
      bonusTimeoutId = null;
      if (!actiu || acabat) return;
      node('joc-resultat').textContent = '';
      seguentPregunta();
      if (!bonusActiu && !acabat) iniciaRellotge();
    });
  }

  function continuaDespresPregunta() {
    if (!actiu || acabat) return;
    if (preguntesFetes > 0 && preguntesFetes % 8 === 0 && comencaBonus()) return;
    seguentPregunta();
    if (!bonusActiu && !acabat) iniciaRellotge();
  }

  function mostraBonus() {
    node('bonus').hidden = false;
    node('joc-preguntes').hidden = true;
    node('joc-opcions').hidden = true;
    node('joc-resultat').textContent = '';
    node('bonus-titol').textContent = '⚡ RONDA BONUS: Parelles';
    node('bonus-estat').textContent = '⚡ Uneix cada phrasal amb el seu significat';
    node('bonus-esquerra').replaceChildren(...rondaBonus.esquerra.map((entry) => {
      const boto = dom.createElement('button');
      boto.type = 'button';
      boto.className = 'boto boto-resposta bonus-boto';
      boto.textContent = entry.phrasal;
      boto.setAttribute('lang', 'en');
      boto.dataset.id = entry.id;
      boto.dataset.significat = entry.significat;
      boto.addEventListener('click', () => seleccionaPhrasal(entry, boto));
      return boto;
    }));
    node('bonus-dreta').replaceChildren(...rondaBonus.dreta.map((significat) => {
      const boto = dom.createElement('button');
      boto.type = 'button';
      boto.className = 'boto boto-resposta bonus-boto';
      boto.textContent = significat;
      boto.addEventListener('click', () => responDreta(significat, boto));
      return boto;
    }));
    mostraTempsBonus();
  }

  function comencaBonus() {
    const ronda = generaParelles(phrasals, {
      aleatori,
      nivells: nivellsPermesos(preguntesFetes),
      exclosos: [...usats]
    });
    if (!ronda) return false;
    aturaRellotge();
    bloquejat = true;
    rondaBonus = {
      esquerra: ronda.esquerra,
      dreta: ronda.dreta,
      solucio: ronda.solucio,
      fetes: 0,
      encerts: 0,
      errors: 0,
      msRestants: BONUS_DURADA_MS,
      seleccionat: null,
      finalitzant: false
    };
    bonusActiu = true;
    iniciBonus = rellotge.ara();
    mostraBonus();
    cancelaBonusInterval();
    bonusIntervalId = rellotge.cada(250, () => {
      if (!bonusActiu || !rondaBonus || rondaBonus.finalitzant || acabat) return;
      rondaBonus.msRestants = Math.max(0, BONUS_DURADA_MS - (rellotge.ara() - iniciBonus));
      mostraTempsBonus();
      if (rondaBonus.msRestants === 0) acabaBonus();
    });
    return true;
  }

  function seleccionaPhrasal(entry, boto) {
    if (!bonusActiu || !rondaBonus || rondaBonus.finalitzant || boto.disabled) return;
    for (const fill of node('bonus-esquerra').children) fill.classList.remove('seleccionada');
    rondaBonus.seleccionat = { entry, boto };
    boto.classList.add('seleccionada');
    node('bonus-estat').textContent = `🎯 ${entry.phrasal}: tria el significat`;
  }

  function responDreta(significat, boto) {
    if (!bonusActiu || !rondaBonus || rondaBonus.finalitzant || boto.disabled || !rondaBonus.seleccionat) return;
    const { entry, boto: esquerra } = rondaBonus.seleccionat;
    rondaBonus.seleccionat = null;
    esquerra.classList.remove('seleccionada');
    if (esquerra.disabled || boto.disabled) return;

    if (rondaBonus.solucio[entry.id] !== significat) {
      soJoc.error?.();
      fallats.add(entry.id);
      errors += 1;
      rondaBonus.errors += 1;
      vides = Math.max(0, vides - 1);
      ratxa = 0;
      esquerra.classList.add('erronia');
      boto.classList.add('erronia');
      node('bonus-estat').textContent = `😵 ${entry.phrasal} = ${rondaBonus.solucio[entry.id]}`;
      mostraCap();

      if (vides === 0) {
        cancelaBonusInterval();
        cancelaBonusTimeout();
        rondaBonus.finalitzant = true;
        bonusTimeoutId = rellotge.despres(BONUS_PAUSA_MS, () => {
          bonusTimeoutId = null;
          if (!actiu || acabat) return;
          acaba('vides');
        });
        return;
      }

      cancelaBonusErrorTimeout();
      bonusErrorTimeoutId = rellotge.despres(BONUS_ERROR_MS, () => {
        bonusErrorTimeoutId = null;
        esquerra.classList.remove('erronia');
        boto.classList.remove('erronia');
        node('bonus-estat').textContent = '⚡ Uneix cada phrasal amb el seu significat';
      });
      return;
    }

    esquerra.disabled = true;
    boto.disabled = true;
    rondaBonus.fetes += 1;
    const multiplicadorAnterior = multiplicador(ratxa);
    ratxa += 1;
    millorRatxa = Math.max(millorRatxa, ratxa);
    encerts += 1;
    const guanyats = 10 * multiplicador(ratxa);
    punts += guanyats;
    soJoc.encert?.();
    if (multiplicador(ratxa) > multiplicadorAnterior) {
      soJoc.pujada?.();
      mostraPujadaMultiplicador();
    }
    esquerra.classList.add('encert');
    boto.classList.add('encert');
    rondaBonus.encerts += 1;
    node('bonus-estat').textContent = `⚡ ${entry.phrasal} = ${significat}`;
    mostraPuntsVolants(guanyats, boto);
    mostraCap();

    if (rondaBonus.fetes === PARELLES) acabaBonus();
  }

  function acaba(motiu) {
    if (acabat) return; // mai registrar la mateixa partida dos cops
    aturaBonus();
    aturaRellotge();
    actiu = false;
    acabat = true;
    bloquejat = true;
    const resultat = registraPartida(estatActual(), {
      punts, encerts, errors, fallats: [...fallats]
    });
    desa();
    registra('partida_acabada', { punts, encerts, errors, motiu, millor_ratxa: millorRatxa });
    soJoc.gameOver?.();
    node('gameover-titol').textContent = motiu === 'temps' ? '⏰ TEMPS!' : '💀 GAME OVER';
    ultimaFraseGameOver = fraseGameOver({ aleatori, anterior: ultimaFraseGameOver });
    node('gameover-frase').textContent = ultimaFraseGameOver;
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
    preguntaNode.setAttribute('lang', pregunta.tipus === 'C' ? 'ca' : 'en');

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
      sinonim.setAttribute('lang', 'en');
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
      if (pregunta.tipus !== 'A') boto.setAttribute('lang', 'en');
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
      const guanyats = puntsEncert(ratxa, segons);
      punts += guanyats;
      soJoc.encert?.();
      if (multiplicador(ratxa) > multiplicadorAnterior) {
        soJoc.pujada?.();
        mostraPujadaMultiplicador();
      }
      boto.classList.add('encert');
      mostraFraseEncert();
      mostraPuntsVolants(guanyats, boto);
      mostraCap();
      aturaRellotge();
      timeoutId = rellotge.despres(PAUSA_ENCERT_MS, () => {
        timeoutId = null;
        if (!actiu || acabat) return;
        continuaDespresPregunta();
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
    mostraFraseError(pregunta.correcta);
    const ultimaVida = vides === 0;
    aturaRellotge();
    timeoutId = rellotge.despres(PAUSA_ERROR_MS, () => {
      timeoutId = null;
      if (!actiu || acabat) return;
      if (ultimaVida) {
        acaba('vides');
        return;
      }
      continuaDespresPregunta();
    });
  }

  function reinicia() {
    aturaBonus();
    aturaRellotge();
    cancelaComptador();
    rondaBonus = null;
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
    ultimaFraseEncert = null;
    ultimaFraseError = null;
    ultimaFraseGameOver = null;
    node('joc-efectes')?.replaceChildren?.();
    node('joc-confeti')?.replaceChildren?.();
    node('joc-ratxa')?.classList?.remove?.('pop');
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
    aturaBonus();
    aturaRellotge();
    cancelaComptador();
    actiu = false;
    bloquejat = true;
  }

  node('gameover-rejuga')?.addEventListener('click', () => {
    atura();
    navega('#joc');
  });

  return {
    mostra,
    atura,
    fallats: () => [...fallats],
    usats: () => [...usats],
    resultat,
    marcaGuardat
  };
}
