export const DURADA_SEGONS = 90;
export const VIDES = 3;
export const NOMBRE_OPCIONS = 4;

export function barreja(array, aleatori = Math.random) {
  const resultat = array.slice();
  for (let i = resultat.length - 1; i > 0; i--) {
    const j = Math.floor(aleatori() * (i + 1));
    [resultat[i], resultat[j]] = [resultat[j], resultat[i]];
  }
  return resultat;
}

export function multiplicador(ratxa) {
  if (ratxa >= 10) return 4;
  if (ratxa >= 6) return 3;
  if (ratxa >= 3) return 2;
  return 1;
}

export function puntsEncert(ratxa, segons) {
  return (10 + (segons < 3 ? 5 : 0)) * multiplicador(ratxa);
}

export function generaPreguntaA(phrasals, { aleatori = Math.random, exclosos = [], id } = {}) {
  const disponibles = phrasals.filter((entry) => !exclosos.includes(entry.id));
  const pool = disponibles.length > 0 ? disponibles : phrasals;
  const encert = id
    ? phrasals.find((entry) => entry.id === id)
    : pool[Math.floor(aleatori() * pool.length)];
  if (!encert) return null;

  const idsSimilars = new Set(Array.isArray(encert.similars) ? encert.similars : []);
  const perId = new Map(phrasals.map((entry) => [entry.id, entry]));
  const significatsSimilars = new Set(
    [...idsSimilars].map((id) => perId.get(id)).filter(Boolean).map((entry) => entry.significat)
  );

  const creaAltres = (idsProhibits) => {
    const perSignificat = new Map();
    for (const entry of phrasals) {
      if (entry.id === encert.id || idsProhibits.has(entry.id)) continue;
      if (significatsSimilars.has(entry.significat)) continue;
      if (!perSignificat.has(entry.significat)) perSignificat.set(entry.significat, entry);
    }
    return [...perSignificat.values()].filter((entry) => entry.significat !== encert.significat);
  };
  const altres = creaAltres(new Set([...idsSimilars, ...exclosos]));
  const base = altres.length >= NOMBRE_OPCIONS - 1 ? altres : creaAltres(idsSimilars);
  const preferits = encert.nivell >= 2 ? base.filter((entry) => entry.verb === encert.verb) : [];
  const distractors = barreja(preferits, aleatori).slice(0, NOMBRE_OPCIONS - 1);
  const jaTriats = new Set(distractors.map((entry) => entry.id));
  const reserva = barreja(base.filter((entry) => !jaTriats.has(entry.id)), aleatori);
  for (const entry of reserva) {
    if (distractors.length === NOMBRE_OPCIONS - 1) break;
    distractors.push(entry);
  }

  const opcions = barreja([encert.significat, ...distractors.map((entry) => entry.significat)], aleatori);
  return {
    tipus: 'A',
    id: encert.id,
    phrasal: encert.phrasal,
    opcions,
    correcta: encert.significat
  };
}

export function generaPreguntaB(phrasals, { aleatori = Math.random, exclosos = [], id } = {}) {
  const disponibles = phrasals.filter((entry) => !exclosos.includes(entry.id));
  const pool = disponibles.length > 0 ? disponibles : phrasals;
  const encert = id
    ? phrasals.find((entry) => entry.id === id)
    : pool[Math.floor(aleatori() * pool.length)];
  if (!encert) return null;

  const perId = new Map(phrasals.map((entry) => [entry.id, entry]));
  const idsSimilars = new Set(Array.isArray(encert.similars) ? encert.similars : []);
  const formenPhrasal = new Set(
    phrasals
      .filter((entry) => entry.verb === encert.verb && entry.id !== encert.id)
      .map((entry) => entry.particula)
  );
  const particulesSimilars = new Set(
    [...idsSimilars].map((idSimilar) => perId.get(idSimilar)?.particula).filter(Boolean)
  );
  const prohibides = new Set([
    ...(Array.isArray(encert.particulesProhibides) ? encert.particulesProhibides : []),
    ...formenPhrasal,
    ...particulesSimilars
  ]);
  const numParaules = encert.particula.trim().split(/\s+/).length;
  const creaCandidats = (idsProhibits) => [...new Set(
    phrasals.filter((entry) => !idsProhibits.has(entry.id)).map((entry) => entry.particula)
  )].filter((particula) => particula !== encert.particula && !prohibides.has(particula));
  const candidats = creaCandidats(new Set(exclosos));
  const baseParticules = candidats.length >= NOMBRE_OPCIONS - 1 ? candidats : creaCandidats(new Set());
  const mateixNom = baseParticules.filter(
    (particula) => particula.trim().split(/\s+/).length === numParaules
  );
  const reserva = baseParticules.filter(
    (particula) => particula.trim().split(/\s+/).length !== numParaules
  );
  const distractors = barreja(mateixNom, aleatori).slice(0, NOMBRE_OPCIONS - 1);
  for (const particula of barreja(reserva, aleatori)) {
    if (distractors.length === NOMBRE_OPCIONS - 1) break;
    distractors.push(particula);
  }

  const opcions = barreja([encert.particula, ...distractors], aleatori);
  return {
    tipus: 'B',
    id: encert.id,
    forat: encert.forat,
    traduccio: encert.traduccio,
    opcions,
    correcta: encert.particula
  };
}

export function generaPreguntaC(phrasals, { aleatori = Math.random, exclosos = [], id } = {}) {
  const disponibles = phrasals.filter((entry) => !exclosos.includes(entry.id));
  const pool = disponibles.length > 0 ? disponibles : phrasals;
  const encert = id
    ? phrasals.find((entry) => entry.id === id)
    : pool[Math.floor(aleatori() * pool.length)];
  if (!encert) return null;

  const idsSimilars = new Set(Array.isArray(encert.similars) ? encert.similars : []);
  const creaCandidats = (idsProhibits) => {
    const perPhrasal = new Map();
    for (const entry of phrasals) {
      if (entry.id === encert.id || idsSimilars.has(entry.id) || idsProhibits.has(entry.id)) continue;
      if (encert.sinonim && entry.sinonim === encert.sinonim) continue;
      if (entry.phrasal === encert.phrasal || perPhrasal.has(entry.phrasal)) continue;
      perPhrasal.set(entry.phrasal, entry);
    }
    return [...perPhrasal.values()];
  };
  const candidats = creaCandidats(new Set(exclosos));
  const base = candidats.length >= NOMBRE_OPCIONS - 1 ? candidats : creaCandidats(new Set());
  const preferits = base.filter((entry) => entry.verb === encert.verb);
  const altres = base.filter((entry) => entry.verb !== encert.verb);
  const distractors = barreja(preferits, aleatori).slice(0, NOMBRE_OPCIONS - 1);
  for (const entry of barreja(altres, aleatori)) {
    if (distractors.length === NOMBRE_OPCIONS - 1) break;
    distractors.push(entry);
  }

  const opcions = barreja([encert.phrasal, ...distractors.map((entry) => entry.phrasal)], aleatori);
  return {
    tipus: 'C',
    id: encert.id,
    phrasal: encert.phrasal,
    sinonim: encert.sinonim,
    opcions,
    correcta: encert.phrasal
  };
}
