import { normalitzaInicials, teParaulota } from './paraulotes.js?v=12';

const URL_API = 'api/ranking.php';
const MIDA_CASELLES = 5;
const BUID = '_';
const MISSATGES_ERROR = {
  inicials_invalides: '😇 Ups! Prova unes altres inicials',
  temps_invalid: '⏱️ Aquesta partida ja no es pot guardar',
  token_invalid: '✅ Aquesta partida ja estava guardada',
  sense_connexio: '📡 Sense connexió: la puntuació només s’ha guardat al teu dispositiu'
};

export function creaClientRanking({
  fetchFn = null,
  url = URL_API,
  timeoutMs = 5000,
  ara = () => Date.now()
} = {}) {
  async function crida(parametres, opcions = {}) {
    const control = new AbortController();
    const temporitzador = setTimeout(() => control.abort(), timeoutMs);
    try {
      const resposta = await (fetchFn ?? globalThis.fetch)(`${url}?${parametres}`, {
        ...opcions,
        signal: control.signal
      });
      if (!resposta?.ok) return { ok: false, error: 'sense_connexio' };
      const dades = await resposta.json();
      if (!dades || typeof dades !== 'object') return { ok: false, error: 'sense_connexio' };
      return dades;
    } catch {
      return { ok: false, error: 'sense_connexio' };
    } finally {
      clearTimeout(temporitzador);
    }
  }

  return {
    demanaToken: () => crida('accio=inici', { method: 'POST' }),
    guarda: ({ token, inicials, punts, encerts }) => crida(
      'accio=guardar',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, inicials, punts, encerts })
      }
    ),
    top: (periode) => crida(
      `accio=top&periode=${encodeURIComponent(periode)}&t=${ara()}`
    )
  };
}

function seguentLletra(actual, direccio) {
  if (actual === BUID) return direccio > 0 ? 'A' : 'Z';
  if (direccio > 0) return actual === 'Z' ? BUID : String.fromCharCode(actual.charCodeAt(0) + 1);
  return actual === 'A' ? BUID : String.fromCharCode(actual.charCodeAt(0) - 1);
}

export function iniciaInicials({
  dom = document,
  estat,
  client,
  desa = () => {},
  partida = () => null,
  navega = () => {},
  enDesat = () => {},
  marcaGuardat = () => {},
  avisa = () => {}
} = {}) {
  const node = (id) => dom.getElementById(id);
  let caselles = Array(MIDA_CASELLES).fill(BUID);
  let actiu = 0;
  let pendent = null;
  let enviant = false;

  function inicialsValides() {
    let ultim = -1;
    for (let index = 0; index < MIDA_CASELLES; index += 1) {
      if (caselles[index] !== BUID) ultim = index;
    }
    if (ultim < 0) return '';
    if (caselles.slice(0, ultim + 1).includes(BUID)) return null;
    return caselles.slice(0, ultim + 1).join('');
  }

  function dibuixa(actualitzaInput = true) {
    const contenidor = node('inicials-caselles');
    contenidor.replaceChildren(...caselles.map((lletra, index) => {
      const casella = dom.createElement('div');
      casella.className = 'casella-inicials';
      if (index === actiu) casella.classList.add('activa');
      casella.dataset.casella = String(index);
      const puja = dom.createElement('button');
      puja.type = 'button';
      puja.className = 'casella-fletxa';
      puja.textContent = '▲';
      puja.setAttribute('aria-label', `Puja la lletra ${index + 1}`);
      puja.addEventListener('click', () => canvia(index, 1));
      const valor = dom.createElement('span');
      valor.className = 'casella-lletra';
      valor.textContent = lletra;
      const baixa = dom.createElement('button');
      baixa.type = 'button';
      baixa.className = 'casella-fletxa';
      baixa.textContent = '▼';
      baixa.setAttribute('aria-label', `Baixa la lletra ${index + 1}`);
      baixa.addEventListener('click', () => canvia(index, -1));
      casella.append(puja, valor, baixa);
      return casella;
    }));
    const input = node('inicials-input');
    if (input && actualitzaInput) input.value = inicialsValides() ?? '';
  }

  function canvia(index, direccio) {
    actiu = index;
    caselles[index] = seguentLletra(caselles[index], direccio);
    dibuixa();
  }

  function mostra() {
    pendent = partida();
    if (!pendent?.token) {
      navega('#inici');
      return;
    }
    enviant = false;
    actiu = 0;
    caselles = normalitzaInicials(estat?.ultimesInicials ?? '')
      .padEnd(MIDA_CASELLES, BUID)
      .slice(0, MIDA_CASELLES)
      .split('');
    node('inicials-resultat').textContent = '';
    node('inicials-ok').disabled = false;
    dibuixa();
    node('inicials-input').focus();
  }

  async function envia() {
    if (enviant || !pendent) return;
    const inicials = inicialsValides();
    const resultat = node('inicials-resultat');
    if (!inicials || teParaulota(inicials)) {
      resultat.textContent = MISSATGES_ERROR.inicials_invalides;
      return;
    }
    enviant = true;
    node('inicials-ok').disabled = true;
    resultat.textContent = '';
    let resposta;
    try {
      resposta = await client.guarda({
        token: pendent.token,
        inicials,
        punts: pendent.punts,
        encerts: pendent.encerts
      });
    } catch {
      resposta = { ok: false, error: 'sense_connexio' };
    }
    enviant = false;
    if (resposta?.ok === true) {
      estat.ultimesInicials = inicials;
      desa();
      node('ranking-missatge').textContent = `🏆 Ets el número ${resposta.posicioSetmana} de la setmana!`;
      enDesat({ inicials, posicioSetmana: resposta.posicioSetmana, posicioSempre: resposta.posicioSempre });
      marcaGuardat();
      pendent = null;
      navega('#ranking');
      return;
    }
    node('inicials-ok').disabled = false;
    const codi = resposta?.error;
    resultat.textContent = MISSATGES_ERROR[codi] ?? '📡 No s’ha pogut guardar. Torna-ho a provar.';
    avisa(resultat.textContent);
    if (codi === 'token_invalid') marcaGuardat();
  }

  node('inicials-ok').addEventListener('click', envia);
  node('inicials-input').addEventListener('input', (esdeveniment) => {
    const text = [...String(esdeveniment.target?.value ?? '')]
      .slice(0, MIDA_CASELLES)
      .map((caracter) => (caracter === BUID ? BUID : normalitzaInicials(caracter)))
      .join('');
    caselles = text.padEnd(MIDA_CASELLES, BUID).slice(0, MIDA_CASELLES).split('');
    actiu = Math.min(text.length, MIDA_CASELLES - 1);
    dibuixa(false);
  });
  node('inicials-input').addEventListener('keydown', (esdeveniment) => {
    if (esdeveniment.key === 'Enter') envia();
  });

  return { mostra };
}

function dataCurta(data) {
  const text = String(data ?? '');
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? `${text.slice(8, 10)}/${text.slice(5, 7)}` : text;
}

export function iniciaRanking({ dom = document, client, estat } = {}) {
  const node = (id) => dom.getElementById(id);
  let periode = 'setmana';
  let posicioSetmana = null;
  let posicioSempre = null;
  let desatPendent = false;
  let seq = 0;

  function prepara(opcions = {}) {
    if (opcions.periode) periode = opcions.periode;
    if (Number.isInteger(opcions.posicioSetmana)) posicioSetmana = opcions.posicioSetmana;
    if (Number.isInteger(opcions.posicioSempre)) posicioSempre = opcions.posicioSempre;
    if (opcions.posicioSetmana !== undefined || opcions.posicioSempre !== undefined) desatPendent = true;
    if (opcions.netejaRessaltat) {
      posicioSetmana = null;
      posicioSempre = null;
      desatPendent = false;
      node('ranking-missatge').textContent = '';
    }
  }

  function dibuixaPestanyes() {
    for (const [id, valor] of [
      ['ranking-tab-setmana', 'setmana'],
      ['ranking-tab-sempre', 'sempre']
    ]) {
      const pestanya = node(id);
      pestanya.setAttribute('aria-selected', String(valor === periode));
      pestanya.classList.toggle('activa', valor === periode);
    }
  }

  function creaFila(posicio, entrada, { buida = false, propi = true } = {}) {
    const fila = dom.createElement('li');
    fila.className = buida ? 'ranking-fila ranking-buit' : 'ranking-fila';
    if (!buida) fila.dataset.fila = String(entrada.inicials ?? '');
    const posicioRessaltada = periode === 'setmana' ? posicioSetmana : posicioSempre;
    if (!buida && propi && Number.isInteger(posicio) && posicio >= 1 && posicio <= 10 && posicio === posicioRessaltada) {
      fila.classList.add('ressaltada');
    }
    const col = dom.createElement('span');
    col.className = 'ranking-posicio';
    col.textContent = buida ? '🏆' : posicio === 1 ? '🥇' : posicio === 2 ? '🥈' : posicio === 3 ? '🥉' : String(posicio);
    const nom = dom.createElement('span');
    nom.className = 'ranking-inicials';
    nom.textContent = buida ? 'Encara no hi ha puntuacions. Sigues el primer!' : String(entrada.inicials ?? '');
    const punts = dom.createElement('span');
    punts.className = 'ranking-punts';
    punts.textContent = buida ? '' : String(entrada.punts ?? 0);
    const data = dom.createElement('span');
    data.className = 'ranking-data';
    data.textContent = buida ? '' : dataCurta(entrada.data);
    fila.append(col, nom, punts, data);
    return fila;
  }

  function dibuixaRecords() {
    const millors = [...(estat?.records ?? [])]
      .sort((a, b) => (b?.punts ?? 0) - (a?.punts ?? 0))
      .slice(0, 5);
    node('ranking-records').replaceChildren(...millors.map((registre, index) => creaFila(index + 1, registre, { propi: false })));
  }

  async function mostra(opcions = {}) {
    const entradaNova = Object.keys(opcions).length === 0 && !desatPendent;
    prepara({ ...opcions, netejaRessaltat: entradaNova });
    desatPendent = false;
    const actual = ++seq;
    dibuixaPestanyes();
    dibuixaRecords();
    node('ranking-sense-connexio').hidden = true;
    node('ranking-llista').replaceChildren(creaFila(0, null, { buida: true }));
    let resposta;
    try {
      resposta = await client.top(periode);
    } catch {
      resposta = { ok: false, error: 'sense_connexio' };
    }
    if (actual !== seq) return;
    if (!resposta?.ok || !Array.isArray(resposta.llista)) {
      node('ranking-sense-connexio').textContent = '📡 Sense connexió. Mostrem només els teus rècords';
      node('ranking-sense-connexio').hidden = false;
      return;
    }
    if (resposta.llista.length === 0) return;
    node('ranking-llista').replaceChildren(...resposta.llista.slice(0, 10).map((entrada, index) => (
      creaFila(index + 1, entrada)
    )));
  }

  for (const [id, valor] of [
    ['ranking-tab-setmana', 'setmana'],
    ['ranking-tab-sempre', 'sempre']
  ]) {
    node(id).addEventListener('click', () => { mostra({ periode: valor }); });
  }

  return { mostra, prepara };
}
