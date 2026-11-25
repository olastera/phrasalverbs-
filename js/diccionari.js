import { NIVELLS, TEMES, filtraConjunt, ordenaPerLeitner } from './dades.js?v=16';
import { alternaPreferit } from './progres.js?v=16';
import { pintaExempleMarcat, renderFiltres } from './filtres.js?v=16';

const ICONES_CAIXA = ['🆕', '😵', '🤔', '🧠'];
const TEXTOS_CAIXA = [
  "🆕 Encara no l'has repassat",
  '😵 El falles',
  '🤔 Gairebé',
  '🧠 Dominat'
];

function node(id) {
  return document.getElementById(id);
}

export function normalitza(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/l·l/g, 'll')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function perPhrasal(a, b) {
  return String(a.phrasal ?? '').localeCompare(String(b.phrasal ?? ''), 'ca');
}

function camps(entry) {
  return {
    phrasal: normalitza(entry.phrasal),
    sinonim: normalitza(entry.sinonim),
    significat: normalitza(entry.significat),
    exemple: normalitza(entry.exemple),
    traduccio: normalitza(entry.traduccio)
  };
}

export function cercaPhrasals(phrasals, consulta) {
  const q = normalitza(consulta);
  if (!q) return phrasals.slice().sort(perPhrasal);
  const grups = [[], [], [], [], [], []];
  for (const entry of phrasals) {
    const text = camps(entry);
    if (text.phrasal.startsWith(q)) grups[0].push(entry);
    else if (text.phrasal.includes(q)) grups[1].push(entry);
    else if (text.sinonim.includes(q)) grups[2].push(entry);
    else if (text.significat.includes(q)) grups[3].push(entry);
    else if (text.exemple.includes(q)) grups[4].push(entry);
    else if (text.traduccio.includes(q)) grups[5].push(entry);
  }
  return grups.flatMap((grup) => grup.sort(perPhrasal));
}

export function semblants(phrasals, id) {
  if (!phrasals.some((entry) => entry.id === id)) return [];
  const ids = new Set(phrasals.map((entry) => entry.id));
  const trobats = new Set();
  const entrada = phrasals.find((entry) => entry.id === id);
  for (const relacionat of entrada.similars ?? []) {
    if (relacionat !== id && ids.has(relacionat)) trobats.add(relacionat);
  }
  for (const entry of phrasals) {
    if (entry.id !== id && (entry.similars ?? []).includes(id)) trobats.add(entry.id);
  }
  return [...trobats]
    .map((relacionat) => phrasals.find((entry) => entry.id === relacionat))
    .sort(perPhrasal);
}

function parlaTexte(text) {
  try {
    const synth = globalThis.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new globalThis.SpeechSynthesisUtterance(text);
    const veus = synth.getVoices?.() ?? [];
    const veu = veus.find((v) => /^en[-_]GB$/i.test(v.lang ?? ''))
      ?? veus.find((v) => /^en([-_]|$)/i.test(v.lang ?? ''));
    if (veu) utterance.voice = veu;
    utterance.lang = veu?.lang ?? 'en-GB';
    utterance.rate = 0.9;
    synth.speak(utterance);
  } catch {
    return;
  }
}

function veuAnglesaDisponible() {
  try {
    const veus = globalThis.speechSynthesis?.getVoices?.() ?? [];
    return veus.some((veu) => /^en([-_]|$)/i.test(veu.lang ?? ''));
  } catch {
    return false;
  }
}

function creaBoto(text, classe) {
  const boto = document.createElement('button');
  boto.type = 'button';
  boto.className = `boto ${classe}`;
  boto.textContent = text;
  return boto;
}

function creaEtiqueta(text, classe) {
  const etiqueta = document.createElement('span');
  etiqueta.className = `etiqueta ${classe}`;
  etiqueta.textContent = text;
  return etiqueta;
}

export function iniciaDiccionari({
  estat, phrasals, desa, avisa, navega, repas,
  aleatori = Math.random, parla = parlaTexte, teVeuAnglesa = veuAnglesaDisponible
}) {
  const elements = {
    cerca: node('diccionari-cerca'),
    filtresBoto: node('diccionari-filtres-boto'),
    filtres: node('diccionari-filtres'),
    compta: node('diccionari-compta'),
    repassa: node('diccionari-repassa'),
    llista: node('diccionari-llista'),
    buit: node('diccionari-buit'),
    buitQuery: node('diccionari-buit-query')
  };
  let consulta = '';
  let filtre = 'tots';
  let obert = null;
  let nodesPerId = new Map();

  function ambVeu() {
    try {
      return Boolean(teVeuAnglesa());
    } catch {
      return false;
    }
  }

  function resultats() {
    const filtrats = filtraConjunt(phrasals, filtre, estat);
    return consulta ? cercaPhrasals(filtrats, consulta) : filtrats;
  }

  function caixaDe(entry) {
    return estat.leitner[entry.id]?.caixa ?? 0;
  }

  function actualitzaXips() {
    renderFiltres({
      contenidor: elements.filtres,
      phrasals,
      estat,
      filtre,
      enCanvi: (valor) => {
        filtre = valor;
        render();
      }
    });
  }

  function obreSemblant(id) {
    if (!resultats().some((entry) => entry.id === id)) {
      consulta = '';
      filtre = 'tots';
      elements.cerca.value = '';
      actualitzaXips();
    }
    obert = id;
    render();
    const desti = nodesPerId.get(id);
    desti?.children[0].setAttribute('aria-expanded', 'true');
    if (desti?.children[1]) desti.children[1].hidden = false;
    desti?.scrollIntoView({ block: 'nearest' });
  }

  function creaBotoVeu(text) {
    const boto = creaBoto('🔊', 'boto-veu');
    boto.setAttribute('aria-label', `Pronuncia ${text}`);
    boto.addEventListener('click', () => {
      try {
        parla(text);
      } catch {
        avisa('🔇 No s’ha pogut pronunciar aquest phrasal.');
      }
    });
    return boto;
  }

  function creaFitxa(entry) {
    const fitxa = document.createElement('div');
    fitxa.className = 'diccionari-fitxa';
    fitxa.hidden = true;

    const cap = document.createElement('div');
    cap.className = 'diccionari-fitxa-cap';
    const nom = document.createElement('strong');
    nom.className = 'diccionari-phrasal';
    nom.textContent = entry.phrasal;
    nom.setAttribute('lang', 'en');
    cap.append(nom);
    if (ambVeu()) cap.append(creaBotoVeu(entry.phrasal));
    fitxa.append(cap);

    const significat = document.createElement('p');
    significat.textContent = entry.significat;
    fitxa.append(significat);

    const sinonim = document.createElement('p');
    sinonim.append(document.createTextNode('≈ '));
    const sinonimText = document.createElement('span');
    sinonimText.textContent = entry.sinonim ?? '';
    sinonimText.setAttribute('lang', 'en');
    sinonim.append(sinonimText);
    fitxa.append(sinonim);

    const exemple = document.createElement('p');
    exemple.className = 'diccionari-exemple';
    exemple.setAttribute('lang', 'en');
    pintaExempleMarcat(exemple, entry.exempleMarcat ?? `**${entry.phrasal}**`);
    if (ambVeu()) exemple.append(creaBotoVeu(entry.exemple));
    fitxa.append(exemple);

    const traduccio = document.createElement('p');
    traduccio.textContent = entry.traduccio ?? '';
    fitxa.append(traduccio);

    const etiquetes = document.createElement('div');
    etiquetes.className = 'diccionari-etiquetes';
    etiquetes.append(
      creaEtiqueta(TEMES[entry.tema] ?? entry.tema, 'etiqueta-tema'),
      creaEtiqueta(NIVELLS[entry.nivell] ?? String(entry.nivell), 'etiqueta-nivell'),
      creaEtiqueta(TEXTOS_CAIXA[caixaDe(entry)], 'etiqueta-caixa')
    );
    fitxa.append(etiquetes);

    const estrella = creaBoto(estat.preferits.includes(entry.id) ? '🌟' : '⭐', 'diccionari-estrella');
    estrella.setAttribute('aria-pressed', String(estat.preferits.includes(entry.id)));
    estrella.setAttribute('aria-label', estat.preferits.includes(entry.id)
      ? 'Treure dels preferits' : 'Afegir a preferits');
    estrella.addEventListener('click', () => {
      alternaPreferit(estat, entry.id);
      desa();
      actualitzaXips();
      render();
    });
    fitxa.append(estrella);

    const relacionats = semblants(phrasals, entry.id);
    if (relacionats.length > 0) {
      const seccio = document.createElement('div');
      seccio.className = 'diccionari-semblants';
      const titol = document.createElement('p');
      titol.textContent = '🔗 Es confon amb:';
      seccio.append(titol);
      for (const related of relacionats) {
        const enllaç = creaBoto(related.phrasal, 'boto-petit');
        enllaç.setAttribute('lang', 'en');
        enllaç.addEventListener('click', () =>obreSemblant(related.id));
        seccio.append(enllaç);
      }
      fitxa.append(seccio);
    }
    return fitxa;
  }

  function creaFila(entry) {
    const contenidor = document.createElement('article');
    contenidor.className = 'diccionari-entrada';

    const boto = document.createElement('button');
    boto.type = 'button';
    boto.className = 'diccionari-fila';
    boto.setAttribute('aria-expanded', String(obert === entry.id));
    boto.setAttribute('data-id', entry.id);

    const cap = document.createElement('span');
    cap.className = 'diccionari-fila-cap';
    const nom = document.createElement('strong');
    nom.className = 'diccionari-phrasal';
    nom.textContent = entry.phrasal;
    nom.setAttribute('lang', 'en');
    const caixa = document.createElement('span');
    caixa.className = 'diccionari-caixa';
    caixa.textContent = ICONES_CAIXA[caixaDe(entry)] ?? '🆕';
    caixa.setAttribute('aria-label', TEXTOS_CAIXA[caixaDe(entry)]);
    cap.append(nom, caixa);

    const significat = document.createElement('span');
    significat.className = 'diccionari-significat';
    significat.textContent = entry.significat;
    boto.append(cap, significat);
    boto.addEventListener('click', () => {
      obert = obert === entry.id ? null : entry.id;
      actualitzaObertura();
    });

    const fitxa = creaFitxa(entry);
    fitxa.hidden = obert !== entry.id;
    contenidor.append(boto, fitxa);
    nodesPerId.set(entry.id, contenidor);
    return contenidor;
  }

  function actualitzaObertura() {
    for (const [id, contenidor] of nodesPerId) {
      contenidor.children[0].setAttribute('aria-expanded', String(obert === id));
      contenidor.children[1].hidden = obert !== id;
    }
  }

  function render() {
    const trobats = resultats();
    const ambFiltre = Boolean(consulta) || filtre !== 'tots';
    elements.compta.textContent = `${trobats.length} ${ambFiltre ? 'resultats' : 'phrasals'}`;
    elements.repassa.textContent = trobats.length > 20 ? "📚 Repassa'n 20" : '📚 Repassa aquests';
    elements.repassa.disabled = trobats.length === 0;
    elements.buit.hidden = trobats.length !== 0;
    elements.buitQuery.textContent = consulta;
    elements.buit.replaceChildren(
      document.createTextNode('🤷 Cap phrasal amb «'),
      elements.buitQuery,
      document.createTextNode('». Prova-ho en anglès o en català.')
    );
    nodesPerId = new Map();
    elements.llista.replaceChildren(...trobats.map(creaFila));
  }

  elements.filtresBoto.addEventListener('click', () => {
    const obre = elements.filtres.hidden;
    elements.filtres.hidden = !obre;
    elements.filtresBoto.setAttribute('aria-expanded', String(obre));
  });

  elements.cerca.addEventListener('input', () => {
    consulta = elements.cerca.value;
    obert = null;
    render();
  });

  elements.repassa.addEventListener('click', () => {
    const ids = ordenaPerLeitner(resultats(), estat.leitner, 20, aleatori).map((entry) => entry.id);
    if (ids.length === 0) return;
    navega('#repas');
    repas?.comenca(ids, 'diccionari');
    repas?.mostra();
  });

  document.addEventListener('keydown', (esdeveniment) => {
    if (location.hash !== '#diccionari' || esdeveniment.key !== 'Escape') return;
    if (document.activeElement !== elements.cerca || !elements.cerca.value) return;
    elements.cerca.value = '';
    consulta = '';
    obert = null;
    render();
  });

  try {
    globalThis.speechSynthesis?.addEventListener?.('voiceschanged', () => render());
  } catch {
    // sense veus: el diccionari funciona igual, sense botons 🔊
  }

  actualitzaXips();
  render();

  return {
    mostra() {
      consulta = '';
      filtre = 'tots';
      obert = null;
      elements.cerca.value = '';
      elements.filtres.hidden = true;
      elements.filtresBoto.setAttribute('aria-expanded', 'false');
      actualitzaXips();
      render();
    }
  };
}
