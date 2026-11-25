import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { setTimeout as retard } from 'node:timers/promises';

const arrelRepo = fileURLToPath(new URL('../../..', import.meta.url));
const arrelWeb = fileURLToPath(new URL('..', import.meta.url));
const tmpDir = fileURLToPath(new URL('./tmp/', import.meta.url));
const dbPath = fileURLToPath(new URL(`./tmp/ranking-${process.pid}.db`, import.meta.url));
const baseUrl = 'http://127.0.0.1:8082';
let servidor = null;
let sortidaServidor = '';

function execPhp(codi, variables = {}) {
  return execFileSync('php', ['-r', codi], {
    cwd: arrelRepo,
    env: { ...process.env, PHRASAL_TEST_DB: dbPath, ...variables },
    encoding: 'utf8'
  });
}

function consulta(sql) {
  const codi = `$pdo = new PDO('sqlite:' . getenv('PHRASAL_TEST_DB')); $sql = getenv('PHRASAL_TEST_SQL'); $stmt = $pdo->query($sql); echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));`;
  const sortida = execPhp(codi, { PHRASAL_TEST_SQL: sql }).trim();
  return sortida === '' ? [] : JSON.parse(sortida);
}

function netejaTaules() {
  try {
    execPhp(`$pdo = new PDO('sqlite:' . getenv('PHRASAL_TEST_DB')); $pdo->exec('DELETE FROM puntuacions'); $pdo->exec('DELETE FROM partides');`);
  } catch {
    return;
  }
}

function insereixPuntuacio(inicials, punts, creat) {
  const codi = `$pdo = new PDO('sqlite:' . getenv('PHRASAL_TEST_DB')); $row = json_decode(getenv('PHRASAL_TEST_ROW'), true); $stmt = $pdo->prepare('INSERT INTO puntuacions (inicials, punts, encerts, creat) VALUES (?, ?, ?, ?)'); $stmt->execute([$row['inicials'], $row['punts'], $row['encerts'], $row['creat']]);`;
  execPhp(codi, { PHRASAL_TEST_ROW: JSON.stringify({ inicials, punts, encerts: Math.max(1, Math.floor(punts / 50)), creat }) });
}

function insereixPartida(token, dies) {
  const codi = `$pdo = new PDO('sqlite:' . getenv('PHRASAL_TEST_DB')); $token = getenv('PHRASAL_TEST_TOKEN'); $inici = time() - ((int) getenv('PHRASAL_TEST_DIES')) * 86400; $stmt = $pdo->prepare('INSERT INTO partides (token, inici, usat) VALUES (?, ?, 0)'); $stmt->execute([$token, $inici]);`;
  execPhp(codi, { PHRASAL_TEST_TOKEN: token, PHRASAL_TEST_DIES: String(dies) });
}

function ajustaInici(token, segons) {
  const codi = `$pdo = new PDO('sqlite:' . getenv('PHRASAL_TEST_DB')); $stmt = $pdo->prepare('UPDATE partides SET inici = ? WHERE token = ?'); $stmt->execute([time() - (int) getenv('PHRASAL_TEST_SEGONS'), getenv('PHRASAL_TEST_TOKEN')]);`;
  execPhp(codi, { PHRASAL_TEST_TOKEN: token, PHRASAL_TEST_SEGONS: String(segons) });
}

function dataMadrid(modificador) {
  const codi = `date_default_timezone_set('Europe/Madrid'); echo date('Y-m-d H:i:s', strtotime(getenv('PHRASAL_TEST_MODIFIER')));`;
  return execPhp(codi, { PHRASAL_TEST_MODIFIER: modificador }).trim();
}

async function peticio(accio, { metode = 'GET', json, cos, periode } = {}) {
  const parametres = new URLSearchParams({ accio });
  if (periode) parametres.set('periode', periode);
  const cosFinal = cos ?? (json === undefined ? undefined : JSON.stringify(json));
  const capcaleres = cosFinal === undefined ? undefined : { 'Content-Type': 'application/json' };
  const resposta = await fetch(`${baseUrl}/api/ranking.php?${parametres}`, {
    method: metode,
    headers: capcaleres,
    body: cosFinal
  });
  const text = await resposta.text();
  let dades = null;
  try { dades = JSON.parse(text); } catch { dades = null; }
  return { status: resposta.status, headers: resposta.headers, text, dades };
}

async function inici() {
  const resposta = await peticio('inici', { metode: 'POST' });
  return resposta.dades?.token;
}

async function guardar(token, canvis = {}) {
  return peticio('guardar', {
    metode: 'POST',
    json: { token, inicials: 'OSCAR', punts: 120, encerts: 3, ...canvis }
  });
}

async function esperaServidor() {
  for (let intent = 0; intent < 80; intent += 1) {
    try {
      await fetch(`${baseUrl}/api/ranking.php?accio=top&periode=setmana`);
      return;
    } catch {
      await retard(100);
    }
  }
  throw new Error(`El servidor no ha arrencat: ${sortidaServidor}`);
}

before(async () => {
  mkdirSync(tmpDir, { recursive: true });
  servidor = spawn('php', ['-S', '127.0.0.1:8082', '-t', 'www/phrasalverbs'], {
    cwd: arrelRepo,
    env: { ...process.env, PHRASAL_DB: dbPath },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  servidor.stdout.on('data', (tros) => { sortidaServidor += tros.toString(); });
  servidor.stderr.on('data', (tros) => { sortidaServidor += tros.toString(); });
  await esperaServidor();
});

after(async () => {
  if (servidor && servidor.exitCode === null) {
    servidor.kill('SIGTERM');
    await once(servidor, 'exit');
  }
  for (const sufix of ['', '-journal', '-wal', '-shm']) {
    rmSync(`${dbPath}${sufix}`, { force: true });
  }
});

test('inici retorna un token de 32 caràcters hexadecimals', async () => {
  netejaTaules();
  const token = await inici();
  assert.match(token, /^[0-9a-f]{32}$/);
});

test('les respostes són JSON amb Cache-Control: no-store', async () => {
  const resposta = await peticio('inici', { metode: 'POST' });
  assert.equal(resposta.status, 200);
  assert.match(resposta.headers.get('content-type'), /^application\/json; charset=utf-8$/);
  assert.equal(resposta.headers.get('cache-control'), 'no-store');
  assert.equal(resposta.dades?.ok, true);
});

test('inici esborra les partides de fa més d’un dia', async () => {
  netejaTaules();
  const vell = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  insereixPartida(vell, 2);
  const token = await inici();
  assert.equal(consulta(`SELECT token FROM partides WHERE token = '${vell}'`).length, 0);
  assert.equal(consulta(`SELECT token FROM partides WHERE token = '${token}'`).length, 1);
});

test('les taules tenen les columnes i els índexs del pla i no desen IP ni user-agent', () => {
  const columnes = (taula) => consulta(`PRAGMA table_info(${taula})`).map((fila) => fila.name);
  assert.deepEqual(columnes('puntuacions'), ['id', 'inicials', 'punts', 'encerts', 'creat']);
  assert.deepEqual(columnes('partides'), ['token', 'inici', 'usat']);
  const indexos = consulta(`SELECT name FROM sqlite_master WHERE type = 'index' AND name IN ('idx_punts', 'idx_creat')`).map((fila) => fila.name);
  assert.deepEqual(indexos.sort(), ['idx_creat', 'idx_punts']);
});

test('un token només es pot fer servir una vegada', async () => {
  netejaTaules();
  const token = await inici();
  ajustaInici(token, 30);
  const primera = await guardar(token);
  const segona = await guardar(token);
  assert.equal(primera.dades?.ok, true);
  assert.equal(segona.dades?.error, 'token_invalid');
});

test('PUTO és rebutjat amb inicials_invalides al servidor', async () => {
  netejaTaules();
  const token = await inici();
  ajustaInici(token, 30);
  const resposta = await guardar(token, { inicials: 'PUTO' });
  assert.equal(resposta.dades?.error, 'inicials_invalides');
});

test('XFUCK és rebutjat amb inicials_invalides al servidor', async () => {
  netejaTaules();
  const token = await inici();
  ajustaInici(token, 30);
  const resposta = await guardar(token, { inicials: 'XFUCK' });
  assert.equal(resposta.dades?.error, 'inicials_invalides');
});

test('teParaulota detecta PUTO i XFUCK', async () => {
  const { teParaulota } = await import('../js/paraulotes.js?v=11');
  assert.equal(teParaulota('PUTO'), true);
  assert.equal(teParaulota('XFUCK'), true);
  assert.equal(teParaulota('OSCAR'), false);
});

test('normalitzaInicials treu els accents', async () => {
  const { normalitzaInicials } = await import('../js/paraulotes.js?v=11');
  assert.equal(normalitzaInicials('òscar'), 'OSCAR');
});

test('normalitzaInicials deixa només lletres i màxim cinc', async () => {
  const { normalitzaInicials } = await import('../js/paraulotes.js?v=11');
  assert.equal(normalitzaInicials('a1b-c'), 'ABC');
  assert.equal(normalitzaInicials('abcdefg'), 'ABCDE');
});

test('punts 99999 és rebutjat amb punts_invalids', async () => {
  netejaTaules();
  const token = await inici();
  ajustaInici(token, 890);
  const resposta = await guardar(token, { punts: 99999, encerts: 1700 });
  assert.equal(resposta.dades?.error, 'punts_invalids');
});

test('punts superiors a encerts × 60 són rebutjats', async () => {
  netejaTaules();
  const token = await inici();
  ajustaInici(token, 30);
  const resposta = await guardar(token, { punts: 121, encerts: 2 });
  assert.equal(resposta.dades?.error, 'punts_invalids');
});

test('encerts superiors a temps × 2 són rebutjats', async () => {
  netejaTaules();
  const token = await inici();
  ajustaInici(token, 30);
  const resposta = await guardar(token, { punts: 100, encerts: 61 });
  assert.equal(resposta.dades?.error, 'punts_invalids');
});

test('guardar abans de 20 segons retorna temps_invalid', async () => {
  netejaTaules();
  const token = await inici();
  ajustaInici(token, 5);
  const resposta = await guardar(token);
  assert.equal(resposta.dades?.error, 'temps_invalid');
});

test('guardar després de 15 minuts retorna temps_invalid', async () => {
  netejaTaules();
  const token = await inici();
  ajustaInici(token, 901);
  const resposta = await guardar(token);
  assert.equal(resposta.dades?.error, 'temps_invalid');
});

test('un GET a guardar retorna 405', async () => {
  const resposta = await peticio('guardar', { metode: 'GET' });
  assert.equal(resposta.status, 405);
  assert.equal(resposta.dades?.ok, false);
  assert.equal(typeof resposta.dades?.error, 'string');
});

test('una acció desconeguda retorna 400', async () => {
  const resposta = await peticio('xyz');
  assert.equal(resposta.status, 400);
  assert.equal(resposta.dades?.ok, false);
  assert.equal(typeof resposta.dades?.error, 'string');
});

test('un cos de més d’1 KB retorna un error JSON', async () => {
  netejaTaules();
  const token = await inici();
  ajustaInici(token, 30);
  const cos = JSON.stringify({ token, inicials: 'A'.repeat(2000), punts: 120, encerts: 3 });
  const resposta = await peticio('guardar', { metode: 'POST', cos });
  assert.equal(resposta.dades?.ok, false);
  assert.equal(typeof resposta.dades?.error, 'string');
});

test('les validacions es fan en l’ordre del pla', async () => {
  netejaTaules();
  const token = await inici();
  ajustaInici(token, 5);
  const cos = { inicials: 'PUTO', punts: 99999, encerts: 999 };

  const senseToken = await guardar('x', { ...cos, token: 'x' });
  assert.equal(senseToken.dades?.error, 'token_invalid');

  const foraTemps = await guardar(token, cos);
  assert.equal(foraTemps.dades?.error, 'temps_invalid');
  ajustaInici(token, 30);

  const format = await guardar(token, { ...cos, inicials: 'AB1' });
  assert.equal(format.dades?.error, 'inicials_invalides');

  const paraulota = await guardar(token, cos);
  assert.equal(paraulota.dades?.error, 'inicials_invalides');

  const puntuacio = await guardar(token, { ...cos, inicials: 'OLGA' });
  assert.equal(puntuacio.dades?.error, 'punts_invalids');
});

test('top setmana retorna màxim 10 ordenats i empats amb el més antic primer', async () => {
  netejaTaules();
  const dilluns = dataMadrid('monday this week');
  const fila = (inicials, punts, segons) => insereixPuntuacio(inicials, punts, `${dilluns.slice(0, 10)} 00:00:${String(segons).padStart(2, '0')}`);
  fila('PRIMER', 1000, 10);
  fila('SEGON', 900, 10);
  fila('TERCER', 800, 10);
  fila('VELLA', 700, 1);
  fila('NOVA', 700, 2);
  fila('SISENA', 600, 10);
  fila('SETENA', 500, 10);
  fila('VUITENA', 400, 10);
  fila('NOVENA', 300, 10);
  fila('DESENA', 200, 10);
  fila('ONZENA', 100, 10);
  const resposta = await peticio('top', { periode: 'setmana' });
  const llista = resposta.dades?.llista ?? [];
  assert.equal(llista.length, 10);
  assert.deepEqual(llista.map((f) => f.punts), [1000, 900, 800, 700, 700, 600, 500, 400, 300, 200]);
  assert.deepEqual(llista.slice(0, 3).map((f) => f.inicials), ['PRIMER', 'SEGON', 'TERCER']);
  assert.deepEqual(llista.slice(3, 5).map((f) => f.inicials), ['VELLA', 'NOVA']);
  assert.deepEqual(llista.map((f) => f.pos), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.ok(llista.every((f) => /^\d{4}-\d{2}-\d{2}$/.test(f.data)));
});

test('top sempre inclou la setmana passada i top setmana no', async () => {
  netejaTaules();
  insereixPuntuacio('AVUI', 50, dataMadrid('now'));
  insereixPuntuacio('VELLASET', 999, dataMadrid('monday last week'));
  const setmana = await peticio('top', { periode: 'setmana' });
  const sempre = await peticio('top', { periode: 'sempre' });
  assert.deepEqual((setmana.dades?.llista ?? []).map((f) => f.inicials), ['AVUI']);
  assert.deepEqual((sempre.dades?.llista ?? []).map((f) => f.inicials), ['VELLASET', 'AVUI']);
});

test('guardar calcula les posicions amb el mateix criteri d’empat', async () => {
  netejaTaules();
  insereixPuntuacio('ABANS', 300, dataMadrid('monday this week'));
  insereixPuntuacio('PASSAT', 400, dataMadrid('monday last week'));
  const token = await inici();
  ajustaInici(token, 30);
  const resposta = await guardar(token, { punts: 300, encerts: 5 });
  assert.equal(resposta.dades?.ok, true);
  assert.equal(resposta.dades?.posicioSetmana, 2);
  assert.equal(resposta.dades?.posicioSempre, 3);
});

test('la llista de paraulotes del client i del servidor és idèntica', () => {
  const llistaDe = (fitxer) => {
    const text = readFileSync(new URL(fitxer, import.meta.url), 'utf8');
    const bloc = text.match(/PARAULOTES\s*=\s*\[([\s\S]*?)\];/);
    assert.ok(bloc, `No s'ha trobat PARAULOTES a ${fitxer}`);
    return [...bloc[1].matchAll(/'([A-Z]+)'/g)].map((coincidencia) => coincidencia[1]);
  };
  const client = llistaDe('../js/paraulotes.js');
  const servidor = llistaDe('../api/ranking.php');
  assert.ok(client.length > 0);
  assert.deepEqual(client, servidor);
});

test('un periode que no és text retorna 400 JSON (no 500)', async () => {
  const resposta = await fetch(`${baseUrl}/api/ranking.php?accio=top&periode[]=x`);
  assert.equal(resposta.status, 400);
  assert.deepEqual(await resposta.json(), { ok: false, error: 'periode_invalid' });
});
