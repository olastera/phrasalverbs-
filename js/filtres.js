import { NIVELLS, TEMES, comptaPerTema, comptaPerVerb, filtraConjunt } from './dades.js?v=16';

export function pintaExempleMarcat(desti, exempleMarcat) {
  const trossos = String(exempleMarcat ?? '').split('**');
  desti.replaceChildren(...trossos.map((tros, index) => {
    if (index % 2 === 0) return document.createTextNode(tros);
    const fort = document.createElement('strong');
    fort.textContent = tros;
    return fort;
  }));
}

export function renderFiltres({ contenidor, phrasals, estat, filtre, enCanvi }) {
  function creaXip(valor, etiqueta, comptatge) {
    const boto = document.createElement('button');
    boto.type = 'button';
    boto.className = 'xip';
    boto.dataset.filtre = valor;
    boto.setAttribute('aria-pressed', String(valor === filtre));
    boto.textContent = comptatge === undefined ? etiqueta : `${etiqueta} ${comptatge}`;
    boto.addEventListener('click', () => {
      contenidor.querySelectorAll('.xip').forEach((xip) => {
        xip.setAttribute('aria-pressed', String(xip.dataset.filtre === valor));
      });
      enCanvi(valor);
    });
    return boto;
  }

  function creaGrup(titol, opcions) {
    const grup = document.createElement('div');
    grup.className = 'grup-filtres';
    const etiqueta = document.createElement('p');
    etiqueta.className = 'grup-titol';
    etiqueta.textContent = titol;
    grup.append(etiqueta, ...opcions.map((opcio) => creaXip(...opcio)));
    return grup;
  }

  const fallatsCount = filtraConjunt(phrasals, 'fallats', estat).length;
  const preferitsCount = filtraConjunt(phrasals, 'favorits', estat).length;
  contenidor.replaceChildren(
    creaGrup('🎯 Resultats', [
      ['tots', '🌐 Tots', phrasals.length],
      ['favorits', '⭐ Els meus', preferitsCount],
      ['fallats', '😵 Els que fallo', fallatsCount]
    ]),
    creaGrup('🔤 Per verb base', comptaPerVerb(phrasals).map((v) => [
      `verb:${v.valor}`, v.valor, v.quantitat
    ])),
    creaGrup('🏷️ Per tema', comptaPerTema(phrasals).map((t) => [
      `tema:${t.valor}`, t.etiqueta, t.quantitat
    ])),
    creaGrup('📈 Per nivell', [1, 2, 3].map((n) => [
      `nivell:${n}`, NIVELLS[n], filtraConjunt(phrasals, `nivell:${n}`, estat).length
    ]))
  );
}
