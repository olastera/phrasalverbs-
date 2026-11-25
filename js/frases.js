export const ENCERT = [
  'Brutal! 🔥',
  'Ets una màquina! 🤖',
  'Boom! 💥',
  'Imparable! 🚀',
  'Crack! 😎'
];

export const ERROR = [
  'Uf, per poc! 🙈',
  'La pròxima és teva 💪',
  'Apunta-te-la! 📝',
  '💔',
  '😵'
];

export const GAME_OVER = [
  'Bona partida! 👏',
  'La PAU tremola 😤',
  'Torna-hi, que tu pots! 💪'
];

export function triaFrase(lista, { aleatori = Math.random, anterior = null } = {}) {
  if (!lista || lista.length === 0) return '';
  if (lista.length === 1) return lista[0];
  const index = Math.min(lista.length - 1, Math.max(0, Math.floor(aleatori() * lista.length)));
  if (lista[index] === anterior) return lista[(index + 1) % lista.length];
  return lista[index];
}

export function fraseEncert({ aleatori = Math.random, anterior = null } = {}) {
  return triaFrase(ENCERT, { aleatori, anterior });
}

export function fraseError({ aleatori = Math.random, anterior = null } = {}) {
  return triaFrase(ERROR, { aleatori, anterior });
}

export function fraseGameOver({ aleatori = Math.random, anterior = null } = {}) {
  return triaFrase(GAME_OVER, { aleatori, anterior });
}
