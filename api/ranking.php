<?php

declare(strict_types=1);

const PARAULOTES = [
  'PUTA', 'PUTO', 'PUTE', 'MERD', 'MIERD', 'POLLA', 'CONYO', 'CULO',
  'CAGAR', 'FOLLA', 'FOTRE', 'CABRO', 'MARIC', 'MAMON', 'PENE', 'TETA',
  'ZORRA', 'GUARR', 'NAZI', 'HITLR', 'FUCK', 'SHIT', 'DICK', 'COCK',
  'CUNT', 'PUSSY', 'BITCH', 'NIGG', 'FAG', 'SEX', 'PORN', 'ASS'
];

date_default_timezone_set('Europe/Madrid');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function resposta(array $dades, int $estat = 200): void
{
  http_response_code($estat);
  echo json_encode($dades, JSON_UNESCAPED_UNICODE);
  exit;
}

function error(string $codi, int $estat = 400): void
{
  resposta(['ok' => false, 'error' => $codi], $estat);
}

function bd(): PDO
{
  static $pdo = null;
  if ($pdo instanceof PDO) return $pdo;

  $entorn = getenv('PHRASAL_DB');
  $ruta = ($entorn !== false && $entorn !== '') ? $entorn : __DIR__ . '/dades/ranking.db';
  $directori = dirname($ruta);
  if (!is_dir($directori) && !mkdir($directori, 0775, true)) error('bd_error', 500);

  try {
    $pdo = new PDO('sqlite:' . $ruta);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Si dues peticions escriuen alhora, la segona espera (fins a 5 s) en lloc de fallar.
    $pdo->setAttribute(PDO::ATTR_TIMEOUT, 5);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('CREATE TABLE IF NOT EXISTS puntuacions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inicials TEXT NOT NULL,
      punts INTEGER NOT NULL,
      encerts INTEGER NOT NULL,
      creat TEXT NOT NULL
    )');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_punts ON puntuacions(punts DESC)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_creat ON puntuacions(creat)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS partides (
      token TEXT PRIMARY KEY,
      inici INTEGER NOT NULL,
      usat INTEGER NOT NULL DEFAULT 0
    )');
    return $pdo;
  } catch (PDOException $excepcio) {
    error('bd_error', 500);
  }
}

function teParaulota(string $inicials): bool
{
  foreach (PARAULOTES as $paraula) {
    if (strpos($inicials, $paraula) !== false) return true;
  }
  return false;
}

function iniciSetmana(): string
{
  $avui = new DateTimeImmutable('now', new DateTimeZone('Europe/Madrid'));
  $avui = $avui->setTime(0, 0, 0);
  return $avui->modify('-' . ((int) $avui->format('N') - 1) . ' days')->format('Y-m-d H:i:s');
}

function posicio(PDO $pdo, int $punts, string $creat, int $id, bool $setmana): int
{
  $sql = 'SELECT COUNT(*) FROM puntuacions WHERE (punts > ? OR (punts = ? AND (creat < ? OR (creat = ? AND id < ?))))';
  $parametres = [$punts, $punts, $creat, $creat, $id];
  if ($setmana) {
    $sql .= ' AND creat >= ?';
    $parametres[] = iniciSetmana();
  }
  $consulta = $pdo->prepare($sql);
  $consulta->execute($parametres);
  return (int) $consulta->fetchColumn() + 1;
}

function inici(PDO $pdo): void
{
  $consulta = $pdo->prepare('DELETE FROM partides WHERE inici < ?');
  $consulta->execute([time() - 86400]);
  $token = bin2hex(random_bytes(16));
  $consulta = $pdo->prepare('INSERT INTO partides (token, inici, usat) VALUES (?, ?, 0)');
  $consulta->execute([$token, time()]);
  resposta(['ok' => true, 'token' => $token]);
}

function guardar(PDO $pdo, string $cos): void
{
  $dades = json_decode($cos, true);
  if (!is_array($dades)) error('json_invalid');

  $token = $dades['token'] ?? null;
  if (!is_string($token) || !preg_match('/^[0-9a-f]{32}$/', $token)) error('token_invalid');
  $consulta = $pdo->prepare('SELECT inici, usat FROM partides WHERE token = ?');
  $consulta->execute([$token]);
  $partida = $consulta->fetch();
  // Tancar la lectura: si queda oberta, manté un bloqueig que fa fallar escriptures simultànies.
  $consulta->closeCursor();
  if ($partida === false || (int) $partida['usat'] !== 0) error('token_invalid');

  $temps = time() - (int) $partida['inici'];
  if ($temps < 20 || $temps > 900) error('temps_invalid');

  $inicials = $dades['inicials'] ?? null;
  if (!is_string($inicials) || !preg_match('/^[A-Z]{1,5}$/', $inicials)) error('inicials_invalides');
  if (teParaulota($inicials)) error('inicials_invalides');

  $punts = $dades['punts'] ?? null;
  $encerts = $dades['encerts'] ?? null;
  if (
    !is_int($punts) || !is_int($encerts) || $punts < 0 || $encerts < 0 ||
    $punts > $encerts * 60 || $punts > 20000 || $encerts > $temps * 2
  ) {
    error('punts_invalids');
  }

  $creat = date('Y-m-d H:i:s');
  try {
    // IMMEDIATE: reserva l'escriptura des del principi; així dues peticions alhora fan cua
    // (ATTR_TIMEOUT) en lloc de bloquejar-se i fallar amb SQLITE_BUSY.
    $pdo->exec('BEGIN IMMEDIATE');
    $consulta = $pdo->prepare('UPDATE partides SET usat = 1 WHERE token = ? AND usat = 0');
    $consulta->execute([$token]);
    // Doble enviament simultani: només la primera petició marca el token.
    if ($consulta->rowCount() !== 1) {
      $pdo->exec('ROLLBACK');
      error('token_invalid');
    }
    $consulta = $pdo->prepare('INSERT INTO puntuacions (inicials, punts, encerts, creat) VALUES (?, ?, ?, ?)');
    $consulta->execute([$inicials, $punts, $encerts, $creat]);
    $id = (int) $pdo->lastInsertId();
    $posicioSetmana = posicio($pdo, $punts, $creat, $id, true);
    $posicioSempre = posicio($pdo, $punts, $creat, $id, false);
    $pdo->exec('COMMIT');
  } catch (PDOException $excepcio) {
    try { $pdo->exec('ROLLBACK'); } catch (PDOException $ignorada) {}
    error('bd_error', 500);
  }

  resposta(['ok' => true, 'posicioSetmana' => $posicioSetmana, 'posicioSempre' => $posicioSempre]);
}

function top(PDO $pdo, string $periode): void
{
  if (!in_array($periode, ['setmana', 'sempre'], true)) error('periode_invalid');
  $sql = 'SELECT inicials, punts, creat FROM puntuacions';
  $parametres = [];
  if ($periode === 'setmana') {
    $sql .= ' WHERE creat >= ?';
    $parametres[] = iniciSetmana();
  }
  $sql .= ' ORDER BY punts DESC, creat ASC, id ASC LIMIT 10';
  $consulta = $pdo->prepare($sql);
  $consulta->execute($parametres);

  $llista = [];
  $pos = 1;
  foreach ($consulta->fetchAll() as $fila) {
    $llista[] = [
      'pos' => $pos++,
      'inicials' => $fila['inicials'],
      'punts' => (int) $fila['punts'],
      'data' => substr($fila['creat'], 0, 10)
    ];
  }
  resposta(['ok' => true, 'llista' => $llista]);
}

$accio = $_GET['accio'] ?? '';
if (!in_array($accio, ['inici', 'guardar', 'top'], true)) error('accio_invalida');

$metode = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$metodes = ['inici' => 'POST', 'guardar' => 'POST', 'top' => 'GET'];
if ($metode !== $metodes[$accio]) error('metode_invalid', 405);

$cos = file_get_contents('php://input');
if (strlen($cos) > 1024) error('cos_massat_gran');

$pdo = bd();
if ($accio === 'inici') inici($pdo);
if ($accio === 'guardar') guardar($pdo, $cos);
$periode = $_GET['periode'] ?? 'setmana';
top($pdo, is_string($periode) ? $periode : '');
