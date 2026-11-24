const CLAU = 'phrasalhero:v1';
const VERSIO = 1;

export function estatPerDefecte() {
  return {
    versio: VERSIO,
    leitner: {},
    preferits: [],
    repasEnCurs: null,
    records: [],
    ultimesInicials: '',
    so: true,
    ratxaDies: { ultimDia: '', dies: 0 },
    estadistiques: { partides: 0, encerts: 0, errors: 0 }
  };
}

function storageDisponible(storage) {
  if (storage) return storage;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function carregaEstat(storage) {
  const origen = storageDisponible(storage);
  if (!origen) return estatPerDefecte();
  try {
    const desat = origen.getItem(CLAU);
    if (!desat) return estatPerDefecte();
    const parsejat = JSON.parse(desat);
    if (!parsejat || parsejat.versio !== VERSIO) return estatPerDefecte();
    const base = estatPerDefecte();
    return {
      ...base,
      ...parsejat,
      leitner: parsejat.leitner && typeof parsejat.leitner === 'object' ? parsejat.leitner : {},
      preferits: Array.isArray(parsejat.preferits) ? parsejat.preferits : [],
      records: Array.isArray(parsejat.records) ? parsejat.records : [],
      ratxaDies: { ...base.ratxaDies, ...parsejat.ratxaDies },
      estadistiques: { ...base.estadistiques, ...parsejat.estadistiques }
    };
  } catch {
    return estatPerDefecte();
  }
}

export function desaEstat(estat, storage) {
  const desti = storageDisponible(storage);
  if (!desti) return false;
  try {
    desti.setItem(CLAU, JSON.stringify(estat));
    return true;
  } catch {
    return false;
  }
}

export function esborraProgres(storage) {
  const desti = storageDisponible(storage);
  try {
    desti?.removeItem(CLAU);
  } catch {
    return false;
  }
  return true;
}

export function actualitzaLeitner(estat, id, encert, dia) {
  const anterior = estat.leitner[id];
  estat.leitner[id] = {
    caixa: encert ? (anterior ? Math.min(anterior.caixa + 1, 3) : 2) : 1,
    vist: dia
  };
  return estat;
}

export function alternaPreferit(estat, id) {
  const index = estat.preferits.indexOf(id);
  if (index >= 0) estat.preferits.splice(index, 1);
  else estat.preferits.push(id);
  return estat;
}

export function desaRepasEnCurs(estat, sessio) {
  estat.repasEnCurs = sessio;
  return estat;
}

export function llegeixRepasEnCurs(estat) {
  const sessio = estat.repasEnCurs;
  if (!sessio || !Array.isArray(sessio.ids) || !Number.isInteger(sessio.index)) return null;
  return { ...sessio, fallats: Array.isArray(sessio.fallats) ? sessio.fallats : [] };
}

function diferenciesDies(diaAnterior, diaActual) {
  const a = Date.parse(`${diaAnterior}T00:00:00Z`);
  const b = Date.parse(`${diaActual}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) / 86400000);
}

export function registraActivitat(estat, dia) {
  const ratxa = estat.ratxaDies;
  const diferencia = ratxa.ultimDia ? diferenciesDies(ratxa.ultimDia, dia) : null;
  if (ratxa.ultimDia === dia) return estat;
  ratxa.dies = diferencia === 1 ? ratxa.dies + 1 : 1;
  ratxa.ultimDia = dia;
  return estat;
}

export function afegeixRecord(estat, resultat) {
  estat.records.push(resultat);
  estat.records.sort((a, b) => b.punts - a.punts);
  estat.records = estat.records.slice(0, 5);
  return estat;
}

export function desaSo(estat, so) {
  estat.so = Boolean(so);
  return estat;
}

export function desaInicials(estat, inicials) {
  estat.ultimesInicials = inicials;
  return estat;
}
