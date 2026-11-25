import { TEMES, filtraConjunt, ordenaPerLeitner } from './dades.js?v=16';
import {
  actualitzaLeitner, alternaPreferit, desaRepasEnCurs,
  llegeixRepasEnCurs, registraActivitat
} from './progres.js?v=16';
import { fraseEncert, fraseError } from './frases.js?v=16';
import { pintaExempleMarcat, renderFiltres } from './filtres.js?v=16';

const LIMIT = 20;

function node(id) {
  return document.getElementById(id);
}

function avui() {
  const data = new Date();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

export function iniciaRepas({ estat, phrasals, desa, avisa, aleatori = Math.random }) {
  const elements = {
    filtres: node('filtres'),
    comptador: node('repas-comptador'),
    comenca: node('repas-comenca'),
    preparacio: node('repas-preparacio'),
    continua: node('repas-continua'),
    continuaText: node('repas-continua-text'),
    botoContinuar: node('repas-continuar'),
    botoNova: node('repas-nova'),
    sessio: node('repas-sessio'),
    progres: node('repas-progres'),
    barra: node('repas-barra'),
    barraProgres: document.querySelector('.barra-progres'),
    estrella: node('repas-estrella'),
    targeta: node('targeta'),
    phrasal: node('targeta-phrasal'),
    forat: node('targeta-forat'),
    tema: node('targeta-tema'),
    significat: node('targeta-significat'),
    sinonim: node('targeta-sinonim'),
    exemple: node('targeta-exemple'),
    traduccio: node('targeta-traduccio'),
    accions: node('targeta-accions'),
    resultat: node('resultat-repas'),
    resum: node('repas-resum'),
    resumText: node('repas-resum-text'),
    repassaFallats: node('repas-repassa-fallats')
  };

  const perId = new Map(phrasals.map((entry) => [entry.id, entry]));
  let filtre = 'tots';
  let sessio = null;
  let vista = 'prep';
  let girada = false;
  let actual = null;
  let ultimaFraseOk = null;
  let ultimaFraseKo = null;

  function desaActivitat() {
    registraActivitat(estat, avui());
    desa();
  }

  function actualitzaFiltres() {
    renderFiltres({
      contenidor: elements.filtres,
      phrasals,
      estat,
      filtre,
      enCanvi: (valor) => {
        filtre = valor;
        actualitzaComptador();
      }
    });
    actualitzaComptador();
  }

  function actualitzaComptador() {
    const total = Math.min(LIMIT, filtraConjunt(phrasals, filtre, estat).length);
    elements.comptador.textContent = String(total);
    elements.comenca.textContent = `▶️ Comença (${total} targetes)`;
  }

  function mostraPrep() {
    elements.preparacio.hidden = false;
    elements.sessio.hidden = true;
    elements.resum.hidden = true;
    elements.continua.hidden = true;
    actualitzaFiltres();
  }

  function mostraBanner(sessioDesada) {
    elements.preparacio.hidden = true;
    elements.sessio.hidden = true;
    elements.resum.hidden = true;
    elements.continua.hidden = false;
    elements.continuaText.textContent = `Tens una sessió a mitges (${sessioDesada.index + 1}/${sessioDesada.ids.length}).`;
  }

  function mostraTargeta() {
    if (!sessio || sessio.index >= sessio.ids.length) {
      acaba();
      return;
    }
    actual = perId.get(sessio.ids[sessio.index]);
    if (!actual) {
      sessio.index += 1;
      mostraTargeta();
      return;
    }

    girada = false;
    elements.targeta.classList.remove('girada');
    elements.accions.hidden = true;
    elements.resultat.textContent = '';
    elements.phrasal.textContent = actual.phrasal;
    elements.forat.textContent = actual.forat;
    elements.significat.textContent = actual.significat;
    elements.sinonim.textContent = actual.sinonim;
    elements.tema.textContent = TEMES[actual.tema] ?? actual.tema;
    elements.traduccio.textContent = actual.traduccio;

    pintaExempleMarcat(elements.exemple, actual.exempleMarcat);

    const preferit = estat.preferits.includes(actual.id);
    elements.estrella.textContent = preferit ? '🌟' : '⭐';
    elements.estrella.setAttribute('aria-pressed', String(preferit));
    elements.estrella.setAttribute('aria-label', preferit ? 'Treure dels preferits' : 'Afegir a preferits');

    const posicio = `${sessio.index + 1}/${sessio.ids.length}`;
    elements.progres.textContent = posicio;
    elements.barra.style.width = `${(sessio.index / sessio.ids.length) * 100}%`;
    elements.barraProgres.setAttribute('aria-valuenow', String(sessio.index));
    elements.barraProgres.setAttribute('aria-valuemax', String(sessio.ids.length));
  }

  function mostraSessio() {
    elements.preparacio.hidden = true;
    elements.continua.hidden = true;
    elements.resum.hidden = true;
    elements.sessio.hidden = false;
    mostraTargeta();
  }

  function comenca(ids, filtreSessio = filtre) {
    const seleccionats = ids ?? ordenaPerLeitner(
      filtraConjunt(phrasals, filtre, estat), estat.leitner, LIMIT
    ).map((entry) => entry.id);
    if (seleccionats.length === 0) {
      avisa('😵 No hi ha targetes amb aquest filtre. Prova un altre!');
      return;
    }
    sessio = { ids: [...seleccionats], index: 0, ok: 0, ko: 0, fallats: [], filtre: filtreSessio };
    vista = 'sessio';
    desaRepasEnCurs(estat, sessio);
    desaActivitat();
    mostraSessio();
  }

  function acaba() {
    vista = 'resum';
    desaRepasEnCurs(estat, null);
    desa();
    elements.sessio.hidden = true;
    elements.resum.hidden = false;
    elements.resumText.textContent = `✅ ${sessio.ok} · ❌ ${sessio.ko}`;
    elements.repassaFallats.hidden = sessio.fallats.length === 0;
  }

  function gira() {
    if (!actual) return;
    girada = !girada;
    elements.targeta.classList.toggle('girada', girada);
    elements.accions.hidden = !girada;
  }

  function respon(encert) {
    if (!actual || !girada) {
      avisa('👆 Gira primer la targeta!');
      return;
    }
    actualitzaLeitner(estat, actual.id, encert, avui());
    if (encert) sessio.ok += 1;
    else {
      sessio.ko += 1;
      sessio.fallats.push(actual.id);
    }
    sessio.index += 1;
    desaRepasEnCurs(estat, sessio.index < sessio.ids.length ? sessio : null);
    desa();
    if (sessio.index >= sessio.ids.length) acaba();
    else mostraTargeta();
    const frase = encert
      ? fraseEncert({ aleatori, anterior: ultimaFraseOk })
      : fraseError({ aleatori, anterior: ultimaFraseKo });
    if (encert) ultimaFraseOk = frase;
    else ultimaFraseKo = frase;
    avisa(frase);
  }

  elements.comenca.addEventListener('click', () => comenca());
  elements.botoContinuar.addEventListener('click', () => {
    sessio = llegeixRepasEnCurs(estat);
    if (!sessio) {
      mostraPrep();
      return;
    }
    vista = 'sessio';
    mostraSessio();
  });
  elements.botoNova.addEventListener('click', () => {
    desaRepasEnCurs(estat, null);
    desa();
    sessio = null;
    vista = 'prep';
    mostraPrep();
  });
  elements.targeta.addEventListener('click', gira);
  elements.targeta.addEventListener('keydown', (esdeveniment) => {
    if (esdeveniment.key === 'Enter') {
      esdeveniment.preventDefault();
      gira();
    }
  });
  node('boto-encara-no').addEventListener('click', () => respon(false));
  node('boto-mel-se').addEventListener('click', () => respon(true));
  elements.estrella.addEventListener('click', () => {
    if (!actual) return;
    alternaPreferit(estat, actual.id);
    desa();
    const preferit = estat.preferits.includes(actual.id);
    elements.estrella.textContent = preferit ? '🌟' : '⭐';
    elements.estrella.setAttribute('aria-pressed', String(preferit));
    elements.estrella.setAttribute('aria-label', preferit ? 'Treure dels preferits' : 'Afegir a preferits');
  });
  elements.repassaFallats.addEventListener('click', () => comenca(sessio?.fallats ?? [], 'fallats'));

  document.addEventListener('keydown', (esdeveniment) => {
    if (location.hash !== '#repas' || vista !== 'sessio') return;
    if (!node('modal').hidden) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    if (esdeveniment.code === 'Space') {
      esdeveniment.preventDefault();
      gira();
    } else if (esdeveniment.key === 'ArrowLeft') {
      esdeveniment.preventDefault();
      respon(false);
    } else if (esdeveniment.key === 'ArrowRight') {
      esdeveniment.preventDefault();
      respon(true);
    }
  });

  return {
    comenca,
    mostra() {
      const sessioDesada = llegeixRepasEnCurs(estat);
      const mateixaSessio = sessioDesada && sessio
        && sessioDesada.index === sessio.index
        && sessioDesada.ids.length === sessio.ids.length
        && sessioDesada.ids.every((id, index) => id === sessio.ids[index]);
      if (sessioDesada && !mateixaSessio) mostraBanner(sessioDesada);
      else if (vista === 'sessio' && sessio) mostraSessio();
      else if (vista === 'resum' && sessio) {
        elements.preparacio.hidden = true;
        elements.resum.hidden = false;
        elements.sessio.hidden = true;
        elements.continua.hidden = true;
      } else {
        vista = 'prep';
        mostraPrep();
      }
    },
    refresca() {
      sessio = null;
      vista = 'prep';
      actual = null;
      mostraPrep();
    }
  };
}
