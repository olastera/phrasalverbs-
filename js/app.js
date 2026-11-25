import { carregaConjunt, comptaPerVerb } from './dades.js?v=14';
import { carregaEstat, desaEstat, desaSo, esborraProgres, estatPerDefecte } from './progres.js?v=14';
import { iniciaRepas } from './repas.js?v=14';
import { iniciaJoc } from './joc.js?v=14';
import { creaSo } from './so.js?v=14';
import { creaClientRanking, iniciaInicials, iniciaRanking } from './ranking.js?v=14';

const PANTALLES = ['inici', 'repas', 'joc', 'gameover', 'inicials', 'ranking', 'progres'];
const NOMBRE = new Intl.NumberFormat('ca-ES');
const estat = carregaEstat();
const so = creaSo({ activat: () => estat.so });
let conjunt = null;
let repas = null;
let joc = null;
let modalAccio = null;
const clientRanking = creaClientRanking();
const ranking = iniciaRanking({ estat, client: clientRanking });
const inicials = iniciaInicials({
  estat,
  client: clientRanking,
  desa,
  partida: () => joc?.resultat() ?? null,
  navega: (hash) => { location.hash = hash; },
  enDesat: ({ posicioSetmana, posicioSempre }) => ranking.prepara({
    periode: 'setmana',
    posicioSetmana,
    posicioSempre
  }),
  marcaGuardat: () => joc?.marcaGuardat(),
  avisa
});
let ultimFocus = null;
let tempsAvis;

function node(id) {
  return document.getElementById(id);
}

function desa() {
  desaEstat(estat);
}

function avisa(text) {
  const element = node('aviso');
  element.textContent = text;
  element.classList.add('visible');
  clearTimeout(tempsAvis);
  tempsAvis = setTimeout(() => element.classList.remove('visible'), 2400);
}

function obreModal({ titol, text, confirmar, accio, nomesConfirmar = false }) {
  ultimFocus = document.activeElement;
  node('modal-titol').textContent = titol;
  node('modal-text').textContent = text;
  node('modal-confirma').textContent = confirmar ?? '✅ Entesos';
  node('modal-cancella').hidden = nomesConfirmar;
  modalAccio = accio ?? null;
  node('modal').hidden = false;
  node('modal-confirma').focus();
}

function tancaModal() {
  node('modal').hidden = true;
  modalAccio = null;
  ultimFocus?.focus();
}

function avisProperament(fase) {
  obreModal({
    titol: '🚧 Properament!',
    text: `La pantalla de ${fase} arriba a la següent fase. Mentrestant, entrena't amb les targetes 📚.`,
    confirmar: '👍 Entesos',
    nomesConfirmar: true
  });
}

function renderSo() {
  const boto = node('boto-so');
  boto.textContent = estat.so ? '🔊' : '🔇';
  boto.setAttribute('aria-pressed', String(estat.so));
  boto.setAttribute('aria-label', estat.so ? 'Silenciar el so' : 'Activar el so');
}

function renderResum() {
  if (!conjunt) return;
  const dominats = conjunt.phrasals.filter((entry) => estat.leitner[entry.id]?.caixa === 3).length;
  const record = estat.records[0]?.punts ?? 0;
  const dies = estat.ratxaDies.dies ?? 0;
  node('resum-dominats').textContent = `${dominats}/${conjunt.phrasals.length}`;
  node('resum-record').textContent = NOMBRE.format(record);
  node('resum-ratxa').textContent = `${dies} ${dies === 1 ? 'dia' : 'dies'}`;
}

function creaBarra(valor, total, color, clase) {
  const barra = document.createElement('div');
  barra.className = clase;
  const farcit = document.createElement('div');
  farcit.style.width = `${total ? (valor / total) * 100 : 0}%`;
  farcit.style.background = `var(${color})`;
  barra.append(farcit);
  return barra;
}

function renderProgres() {
  if (!conjunt) return;
  const comptes = { nous: 0, caixa1: 0, caixa2: 0, caixa3: 0 };
  const dominatsPerVerb = new Map();
  for (const entry of conjunt.phrasals) {
    const caixa = estat.leitner[entry.id]?.caixa ?? 0;
    const clau = caixa === 0 ? 'nous' : `caixa${caixa}`;
    comptes[clau] += 1;
    if (caixa === 3) dominatsPerVerb.set(entry.verb, (dominatsPerVerb.get(entry.verb) ?? 0) + 1);
  }

  const caixes = [
    ['🆕 Nous', comptes.nous, '--cian'],
    ['😵 Caixa 1', comptes.caixa1, '--vermell'],
    ['🤔 Caixa 2', comptes.caixa2, '--groc'],
    ['🧠 Caixa 3 (dominats)', comptes.caixa3, '--verd']
  ];
  node('caixes').replaceChildren(...caixes.map(([etiqueta, quantitat, color]) => {
    const fila = document.createElement('div');
    fila.className = 'caixa';
    const nom = document.createElement('span');
    nom.textContent = etiqueta;
    const numero = document.createElement('span');
    numero.className = 'caixa-num';
    numero.textContent = String(quantitat);
    fila.append(nom, numero, creaBarra(quantitat, conjunt.phrasals.length, color, 'caixa-barra'));
    return fila;
  }));

  node('progres-verbs').replaceChildren(...comptaPerVerb(conjunt.phrasals).map(({ valor, quantitat }) => {
    const dominats = dominatsPerVerb.get(valor) ?? 0;
    const fila = document.createElement('div');
    fila.className = 'verb';
    const nom = document.createElement('strong');
    nom.textContent = valor;
    const comptatge = document.createElement('span');
    comptatge.textContent = `${dominats}/${quantitat}`;
    fila.append(nom, comptatge, creaBarra(dominats, quantitat, '--verd', 'verb-barra'));
    return fila;
  }));
}

function mostraPantalla() {
  const hash = location.hash.replace('#', '');
  const activa = PANTALLES.includes(hash) ? hash : 'inici';
  for (const id of PANTALLES) node(id).hidden = id !== activa;
  if (activa !== 'joc') joc?.atura();
  if (activa === 'joc') joc?.mostra();
  if (activa === 'progres') renderProgres();
  if (activa === 'repas') repas?.mostra();
  if (activa === 'inicials') inicials.mostra();
  if (activa === 'ranking') ranking.mostra();
  if (activa === 'inici') renderResum();
}

async function carregaDades() {
  try {
    conjunt = await carregaConjunt('phrasals');
    if (!Array.isArray(conjunt.phrasals) || conjunt.phrasals.length === 0) {
      throw new Error('Fitxer de dades buit');
    }
    node('error-dades').hidden = true;
    node('boto-retry').hidden = true;
    repas = iniciaRepas({ estat, phrasals: conjunt.phrasals, desa, avisa });
    joc = iniciaJoc({
      phrasals: conjunt.phrasals,
      leitner: () => estat.leitner,
      estat: () => estat,
      desa,
      so,
      demanaToken: () => clientRanking.demanaToken(),
      navega: (hash) => { location.hash = hash; }
    });
    renderResum();
    mostraPantalla();
  } catch (error) {
    console.error(error);
    node('error-dades').hidden = false;
    node('boto-retry').hidden = false;
    avisa('📡 No s’han pogut carregar les targetes.');
  }
}

// L'AudioContext només es pot activar dins d'un gest que compti com a activació de l'usuari.
// Al mòbil, pointerdown NO compta (iPhone): cal pointerup/touchend/click.
for (const tipus of ['pointerup', 'touchend', 'click', 'keydown']) {
  document.addEventListener(tipus, () => so.desperta(), { passive: true });
}

node('boto-so').addEventListener('click', () => {
  desaSo(estat, !estat.so);
  desa();
  so.desperta();
  renderSo();
});

node('resum-inici').addEventListener('click', () => {
  location.hash = '#progres';
});

document.querySelectorAll('[data-ruta]').forEach((boto) => {
  boto.addEventListener('click', () => {
    location.hash = boto.dataset.ruta;
  });
});

document.querySelectorAll('[data-fase]').forEach((boto) => {
  boto.addEventListener('click', () => avisProperament('rànquing'));
});

node('repas-a-jugar').addEventListener('click', () => {
  location.hash = '#joc';
});

node('gameover-repassa').addEventListener('click', () => {
  const ids = joc?.fallats() ?? [];
  if (ids.length === 0) return;
  location.hash = '#repas';
  repas?.comenca(ids, 'fallats');
  repas?.mostra();
});

node('gameover-ranking').addEventListener('click', () => {
  const partida = joc?.resultat();
  if (!partida) {
    avisProperament('rànquing');
    return;
  }
  if (partida.guardat) return;
  const avis = node('gameover-ranking-avis');
  if (!partida.token) {
    const text = '📡 Sense connexió: la puntuació només s’ha guardat al teu dispositiu';
    avis.textContent = text;
    avis.hidden = false;
    avisa(text);
    return;
  }
  avis.textContent = '';
  avis.hidden = true;
  location.hash = '#inicials';
});

node('boto-esborra').addEventListener('click', () => {
  obreModal({
    titol: '🗑️ Esborrar el progrés?',
    text: 'Perdràs els phrasals dominats, els preferits, els rècords i la ratxa. No es pot desfer.',
    confirmar: '🗑️ Sí, esborra-ho',
    accio: () => {
      esborraProgres();
      Object.assign(estat, estatPerDefecte());
      desa();
      repas?.refresca();
      renderResum();
      renderProgres();
      renderSo();
      avisa('🧹 Progrés esborrat!');
    }
  });
});

node('modal-confirma').addEventListener('click', () => {
  const accio = modalAccio;
  tancaModal();
  accio?.();
});
node('modal-cancella').addEventListener('click', tancaModal);
node('modal').addEventListener('click', (esdeveniment) => {
  if (esdeveniment.target === node('modal')) tancaModal();
});
document.addEventListener('keydown', (esdeveniment) => {
  if (esdeveniment.key === 'Escape' && !node('modal').hidden) tancaModal();
});

node('boto-retry').addEventListener('click', carregaDades);
window.addEventListener('hashchange', mostraPantalla);

renderSo();
mostraPantalla();
carregaDades();
