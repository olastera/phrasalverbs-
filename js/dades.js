export const VERSIO_DADES = 3;

export const TEMES = {
  quotidia: '🏠 Dia a dia',
  relacions: '💞 Relacions',
  estudis: '📖 Estudis',
  feina: '💼 Feina',
  problemes: '🚨 Problemes',
  comunicacio: '💬 Comunicació',
  moviment: '✈️ Moviment',
  diners: '💸 Diners',
  salut: '🩺 Salut',
  sentiments: '🥹 Sentiments',
  tecnologia: '📱 Tecnologia'
};

export const NIVELLS = { 1: '🟢 Fàcil', 2: '🟡 Mitjà', 3: '🔴 Difícil' };

export async function carregaConjunt(nom, versio = VERSIO_DADES) {
  const url = `contingut/${nom}.json?v=${versio}`;
  const resposta = await fetch(url);
  if (!resposta.ok) {
    throw new Error(`No s'ha pogut carregar ${url} (${resposta.status})`);
  }
  return resposta.json();
}

export function comptaPerVerb(phrasals) {
  const comptes = new Map();
  for (const entry of phrasals) {
    comptes.set(entry.verb, (comptes.get(entry.verb) ?? 0) + 1);
  }
  return [...comptes].map(([valor, quantitat]) => ({ valor, quantitat }))
    .sort((a, b) => b.quantitat - a.quantitat || a.valor.localeCompare(b.valor, 'ca'));
}

export function comptaPerTema(phrasals) {
  const comptes = new Map();
  for (const entry of phrasals) {
    comptes.set(entry.tema, (comptes.get(entry.tema) ?? 0) + 1);
  }
  return [...comptes].map(([valor, quantitat]) => ({ valor, etiqueta: TEMES[valor] ?? valor, quantitat }))
    .sort((a, b) => b.quantitat - a.quantitat || a.valor.localeCompare(b.valor, 'ca'));
}

export function filtraConjunt(phrasals, filtre, estat = {}) {
  if (!filtre || filtre === 'tots') return phrasals;
  const [camp, valor] = filtre.split(':');
  if (camp === 'favorits') {
    const favorits = new Set(estat.preferits ?? []);
    return phrasals.filter((entry) => favorits.has(entry.id));
  }
  if (camp === 'fallats') {
    const leitner = estat.leitner ?? {};
    return phrasals.filter((entry) => leitner[entry.id]?.caixa === 1);
  }
  if (camp === 'verb') return phrasals.filter((entry) => entry.verb === valor);
  if (camp === 'tema') return phrasals.filter((entry) => entry.tema === valor);
  if (camp === 'nivell') return phrasals.filter((entry) => entry.nivell === Number(valor));
  return phrasals;
}

function barreja(array, aleatori) {
  const resultat = array.slice();
  for (let i = resultat.length - 1; i > 0; i--) {
    const j = Math.floor(aleatori() * (i + 1));
    [resultat[i], resultat[j]] = [resultat[j], resultat[i]];
  }
  return resultat;
}

export function ordenaPerLeitner(phrasals, leitner = {}, limit = 20, aleatori = Math.random) {
  const grups = [[], [], [], []];
  for (const entry of phrasals) {
    const caixa = leitner[entry.id]?.caixa ?? 0;
    const grup = caixa === 1 ? 0 : caixa === 2 ? 2 : caixa === 3 ? 3 : 1;
    grups[grup].push(entry);
  }
  return grups.flatMap((grup) => barreja(grup, aleatori)).slice(0, limit);
}
