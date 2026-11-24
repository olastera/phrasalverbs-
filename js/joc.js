import {
  DURADA_SEGONS,
  VIDES,
  generaPreguntaA,
  generaPreguntaB,
  multiplicador,
  puntsEncert
} from './preguntes.js?v=6';

const DURADA_MS = DURADA_SEGONS * 1000;
const PAUSA_ENCERT_MS = 400;
const PAUSA_ERROR_MS = 1500;

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
  aleatori = Math.random
} = {}) {
  const node = (id) => dom.getElementById(id);
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
  let pregunta = null;
  const usats = new Set();

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
    aturaRellotge();
    actiu = false;
    acabat = true;
    bloquejat = true;
    node('gameover-titol').textContent = motiu === 'temps' ? '⏰ TEMPS!' : '💀 GAME OVER';
    node('gameover-punts').textContent = String(punts);
    node('gameover-encerts').textContent = String(encerts);
    node('gameover-errors').textContent = String(errors);
    node('gameover-ratxa').textContent = `🔥 ${millorRatxa}`;
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
    node('joc-tipus').textContent = pregunta.tipus === 'B'
      ? '🧩 Completa la frase'
      : '🤔 Què vol dir?';

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
    const genera = aleatori() < 0.5 ? generaPreguntaB : generaPreguntaA;
    pregunta = genera(phrasals, { aleatori, exclosos: [...usats] });
    if (!pregunta) {
      acaba('temps');
      return;
    }
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
      ratxa += 1;
      millorRatxa = Math.max(millorRatxa, ratxa);
      encerts += 1;
      punts += puntsEncert(ratxa, segons);
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
    msRestants = DURADA_MS;
    vides = VIDES;
    punts = 0;
    encerts = 0;
    errors = 0;
    ratxa = 0;
    millorRatxa = 0;
    usats.clear();
    pregunta = null;
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
    actiu = false;
    bloquejat = true;
  }

  node('gameover-rejuga')?.addEventListener('click', () => {
    atura();
    navega('#joc');
  });

  return { mostra, atura };
}
