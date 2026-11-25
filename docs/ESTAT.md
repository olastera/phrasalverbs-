# Estat: Fase 1 + 2A-2D + 3A-3B + 4A-4B + 5 (PWA)

Estat: fases 1-4B acabades; Fase 5 (PWA) implementada i provada. No s'han fet commits ni
desplegaments. `contingut/phrasals.json` i `contingut/connectors.json` no s'han tocat. Tampoc no
s'han tocat `api/ranking.php`, `js/paraulotes.js`, `js/ranking.js` ni cap regla de joc.

## Versions

- Versió estàtica actual: **`?v=15`** a `index.html`, `css/estils.css` (fonts incloses), tots els
  imports JS i les URLs dels tests. `js/app.js` importa `js/ranking.js?v=15`; `js/ranking.js` no
  s'ha tocat per restricció explícita i conserva `js/paraulotes.js?v=12`.
- Service worker: memòria cau **`phrasalhero-v15`**, fitxer `sw.js?v=15`, registrat després de
  `load` només si `navigator.serviceWorker` existeix, dins `try/catch`.
- **`VERSIO_DADES` és 3** (`contingut/phrasals.json?v=3`). Si canvien `contingut/*.json`, cal
  pujar `VERSIO_DADES` i la referència corresponent a `sw.js`.
- Comanda de tests: `node --experimental-default-type=module --test tests/*.test.mjs`.

## Fase 1 (recordatori)

- Negreta de `exempleMarcat` amb trossos senars dins `<strong>`; `segmentsExemple` eliminat.
- `repasEnCurs` desa i recupera `fallats`; "🔁 Repassa els ❌" inclou errors d'abans i després
  de la pausa.
- Modal "Properament": "entrena't amb les targetes".
- Fonts allotjades a `fonts/` amb `@font-face` i `font-display: swap`; cap referència a Google
  Fonts.
- 19/19 tests de Fase 1 passen.

## Fase 2A: correcció del rellotge

- Arrel: `aturaRellotge()` només cancel·lava el `setInterval` sense descomptear el temps
  transcorregut des de l'últim tick; contestant abans del primer tick (p. ex. 0,9 s) el temps no
  baixava mai.
- Correcció: `aturaRellotge()` descompta `ara - iniciTick` de `msRestants` només si el rellotge
  estava en marxa, abans de parar l'interval.
- El tick del rellotge és cada **250 ms** perquè la barra es mogui suau; cada tick descompta
  el temps real i actualitza `iniciTick`.
- Test afegit amb rellotge fals: 20 encerts seguits contestant a 0,9 s i amb pauses de 400 ms
  descompten unes 18 s (71–73 s restants), sense comptar les pauses.
- 16/16 tests de 2A passen.

## Fase 2B: minijoc B (Completa la frase) 🧩

- `js/preguntes.js`: funció pura `generaPreguntaB`.
  - Mostra `forat` i `traduccio`; la resposta correcta és `particula`.
  - Distractors preferentment d'altres partícules amb el **mateix nombre de paraules**.
  - Si no n'hi ha prou, completa amb partícules d'un altre nombre de paraules.
  - Regla 1: mai una partícula que, amb el mateix verb, formi un altre phrasal del JSON
    (`put off` no ofereix `up with`, `on`, `out`, `away`, `forward`, `up` ni `down`;
    `run out of` no ofereix `into`, `away` ni `over`).
  - Regla 2 (general de similars): mai la partícula d'un id de `similars` de la resposta.
  - **Ajust nou:** qualsevol partícula de `particulesProhibides` queda exclosa com a distractor.
    `get up` no ofereix `off`, `in`, `out`, `on` ni `down`; `put off` no ofereix `over`;
    comprovat per als 161 phrasals.
  - 4 opcions diferents, una sola correcta i posició aleatòria per als 161 phrasals.
- `js/joc.js`: `iniciaJoc` rep `aleatori` (per defecte `Math.random`) i ara barreja A/B/C a l'atzar.
  La pregunta B mostra el `___` destacat amb CSS i la traducció en petit sota el forat; l'etiqueta
  canvia entre "🤔 Què vol dir?", "🧩 Completa la frase" i "🔁 Substitueix".
- `index.html`: afegits `joc-tipus` i `joc-traduccio`.
- `css/estils.css`: estils per a `.forat` i `.joc-traduccio`.
- 10/10 tests de 2B passen.

## Fase 2C: minijoc C (Substitueix) 🔁

- `js/preguntes.js`: nova funció pura `generaPreguntaC`.
  - Mostra el `sinonim` en negreta dins la pregunta: "Quin phrasal vol dir **postpone**?".
  - 4 opcions de `phrasal`; la correcta és `phrasal`.
  - Distractors preferentment del **mateix verb base** i completats amb altres verbs si cal.
  - Mai un phrasal amb el mateix `sinonim` que la resposta (`return`, `continue`, `relax`,
    `separate`, `reduce`, `register` i `depart` es repeteixen) ni un id de `similars`.
  - 4 opcions diferents i una sola correcta per als 161 phrasals.
- `js/joc.js`:
  - Tria el generador A, B o C amb terços iguals de l'atzar.
  - Dificultat progressiva: preguntes 1–5 només nivell 1; 6–15 nivells 1–2; 16+ nivells 1–3.
  - Cap id repetit mentre queden candidats; només es repeteixen si s'esgoten els 161.
  - Un 30 % de les preguntes (posicions 1–3, 11–13, 21–23 i 31–33) surten de la caixa 1 si n'hi
    ha i compleixen la dificultat; si no, es fa servir el pool normal.
  - `mostraPregunta()` mostra el sinònim destacat i amaga `joc-traduccio` al minijoc C.
- `js/app.js`: passa `estat.leitner` a `iniciaJoc` per alimentar la regla de la caixa 1.
- 7/7 tests de 2C passen; inclouen preferència de mateix verb, posició aleatòria de la correcta i
  cap phrasal ja preguntat com a opció d'una pregunta C.

## Fase 2D: Game Over complet, progrés i so 🔊

- `js/progres.js`: nova `registraPartida(estat, { punts, encerts, errors, fallats, data, dia })`.
  - Llegeix el millor rècord abans de desar; `nouRecord = punts > 0 && punts > recordAnterior`.
  - Cada id fallat únic va a la caixa 1 amb `actualitzaLeitner(estat, id, false, dia)`;
    els encerts del joc no canvien la caixa.
  - Desa el top 5 de records amb data ISO, suma `partides`, `encerts` i `errors`, actualitza
    `ratxa` i `millorRatxa` i registra l'activitat del dia.
  - Retorna `{ nouRecord, recordAnterior }`; `js/joc.js` rep l'estat viu via funció.
- `js/so.js`: nou mòdul amb `creaSo({ activat, navegador, factoria })` i API
  `{ desperta, encert, error, pujada, gameOver }`.
  - `AudioContext` diferit fins al primer gest d'usuari (`desperta()`); `pointerdown` global i
    el botó `#boto-so` el desperten.
  - Web Audio amb oscil·ladors `triangle` i rampes de guany; sense Web Audio, sense vibració o
    amb so desactivat no peta ni sona.
  - `navigator.vibrate(80)` només a l'error; `pujada` puja de to i `gameOver` baixa de to.
  - El so s'injecta a `iniciaJoc({ so })` com `rellotge` i `aleatori`, així els tests comproven
    les crides sense àudio real.
- `js/joc.js`:
  - Comptador animat de 0 al total en 20 passos de 50 ms; amb `prefers-reduced-motion` el número
    apareix directament i no es crea confeti.
  - Mostra encerts, errors, millor ratxa i avís `🆕 NOU RÈCORD PERSONAL!` només si escau.
  - Llista els phrasals fallats sense repetits amb significat; si no n'hi ha cap, mostra
    `🎉 No has fallat cap phrasal. Perfecte!` i amaga `📚 Repassar els fallats`.
  - En acabar crida `registraPartida`, desa, sona `gameOver` i navega a `#gameover`.
  - `fallats()` exposa els ids per al repàs; `reinicia()` i `atura()` cancel·len el comptador.
- `js/repas.js`: `mostra()` ja no sobreescriu una sessió acabada de crear amb
  `comenca(ids, 'fallats')`; `comenca` s'exposa al return.
- `js/app.js`: `const so = creaSo({ activat: () => estat.so })`; passa `estat`, `desa` i `so` al
  joc; `#gameover-repassa` obre el repàs amb els ids fallats; `#gameover-ranking` mostra
  l'avís "Properament"; en tornar a `#inici` es redibuixa el resum sense recarregar.
- `index.html` i `css/estils.css`: nous elements del Game Over, estils de rècord/fallats/confeti i
  animació `confeti-cau`; amb moviment reduït s'amaga el confeti i s'atura `batega` al rècord.
- 16/16 tests de 2D passen, incloent-hi deduplicació de fallats, caixa 1, rècord, so/vibració,
  moviment reduït i el fil `repas-a-jugar → #joc`.

## Fase 3A: servidor del rànquing i filtre

- `api/ranking.php`: un sol fitxer, sense rutes amigables, només `api/ranking.php?accio=...`.
  - `inici` i `guardar` són POST; `top` és GET. Mètode incorrecte → 405 `metode_invalid`;
    acció desconeguda → 400 `accio_invalida`; cos > 1 KB → `cos_massat_gran`.
  - SQLite a `api/dades/ranking.db`, o a la ruta de `PHRASAL_DB` si existeix (només per als tests).
    Crea `api/dades/` si cal i les taules `puntuacions` i `partides` amb `idx_punts` i `idx_creat`.
  - Respostes JSON amb `Content-Type: application/json; charset=utf-8` i `Cache-Control: no-store`.
    `date_default_timezone_set('Europe/Madrid')`, PDO amb consultes preparades i cap IP ni
    user-agent desat.
  - `inici` crea `bin2hex(random_bytes(16))` i esborra partides de fa més d'un dia.
  - `guardar` valida en ordre: `token_invalid`, `temps_invalid` (20 s–15 min),
    `inicials_invalides` (regex i paraulotes), `punts_invalids` (enters ≥ 0, `punts ≤ encerts × 60`,
    `punts ≤ 20000`, `encerts ≤ temps × 2`), i respon amb `posicioSetmana` i `posicioSempre`.
  - `top` retorna 10 files amb `pos`, `inicials`, `punts` i `data` (`YYYY-MM-DD`). `setmana` comença
    el dilluns a les 00:00 de Madrid; `sempre` inclou tot. Empat de punts: primer el més antic
    (`creat ASC, id ASC`), criteri també usat per a les posicions de `guardar`.
- `api/dades/.htaccess`: bloqueig exacte de §7.3 per a Apache/Aruba.
- `js/paraulotes.js`: `normalitzaInicials(text)` (majúscules, sense accents, només A-Z i màxim 5)
  i `teParaulota(inicials)`. La llista és idèntica a la del PHP i un test ho comprova llegint
  els dos fitxers.
- `.gitignore`: afegits `api/dades/*.db` i `tests/tmp/`.
- A la 3A no es van tocar `index.html`, les pantalles ni la versió `?v=8` (aquest canvi és de la 3B).
- 23/23 tests de 3A passen.

## Subfase 3B (client del rànquing)

- `js/ranking.js` (nou): `creaClientRanking({ fetchFn, url, timeoutMs, ara })` amb `demanaToken()`,
  `guarda({ token, inicials, punts, encerts })`, `top(periode)`, `iniciaInicials()` i
  `iniciaRanking()`. URL relativa `api/ranking.php`; `fetch` injectable i, per defecte,
  `globalThis.fetch` resolt en el moment de la crida; `AbortController` de 5 s; errors de xarxa,
  timeout i respostes no JSON → `{ ok: false, error: 'sense_connexio' }` sense llançar.
- `top()` afegeix `&t=${Date.now()}` a les dues pestanyes (`setmana` i `sempre`) per evitar la cau
  d'Aruba. `guarda()` envia `POST` amb `Content-Type: application/json` i cos
  `{ token, inicials, punts, encerts }` a `api/ranking.php?accio=guardar`; `demanaToken()` també
  és `POST`. Això coincideix amb la 3A i amb el test `guarda envia token, inicials, punts i encerts
  per POST`.
- Token sol·licitat en començar cada partida des de `js/joc.js`, sense esperar la resposta. Si no
  arriba a temps, la partida continua i es desa a `progres.js` com sempre; en acabar, el botó del
  Game Over mostra l'avís de sense connexió en lloc d'anar a `#inicials`.
- `js/joc.js`: nou paràmetre `demanaToken`, estat de la partida amb `token`, `guardat` i
  `generacio`, mètodes `resultat()` i `marcaGuardat()`, i reinici del token a `reinicia()`.
- `js/app.js`: `PANTALLES` inclou `inicials` i `ranking`; connecta `iniciaInicials()` i
  `iniciaRanking()`, precarrega l'estat amb el token i els rècords locals, rep `enDesat`,
  mostra `📡` i marca la partida com a desada. El botó d'Inici "🥇 Rànquing" obre `#ranking`.
- `index.html`: botó `#gameover-ranking` canviat a `data-ruta="#inicials"`, afegit
  `#gameover-ranking-avis` i seccions `#inicials` (5 caselles amb fletxes, input amagat, botó OK)
  i `#ranking` (pestanyes setmana/sempre, llista i rècords).
- `css/estils.css`: estils arcade de neó, caselles amb fletxes, casella activa parpellejant,
  pestanyes, llista top 10 amb posats 🥇🥈🥉, efecte scanlines amb `repeating-linear-gradient` i
  respecte de `prefers-reduced-motion`.
- Inicials: 1–5 lletres, sense buits al mig, `A→Z` i `_`, normals amb `normalitzaInicials()` de
  `js/paraulotes.js`; precàrrega de `estat.ultimesInicials`. `A_B` no és vàlid; `AB___` desa `AB`.
- Errors del servidor confirmats en pantalla: `😇 Ups! Prova unes altres inicials`, `⏱️ Aquesta partida
  ja no es pot guardar`, `✅ Aquesta partida ja estava guardada` i l'avís `📡` de connexió. Les dades
  del servidor i les inicials s'escapen amb `textContent`.
- No s'han modificat `api/ranking.php` ni `js/paraulotes.js`.

## Subfase 4A: ronda bonus "⚡ Parelles"

- `js/preguntes.js`: nova funció pura `generaParelles(phrasals, { aleatori, nivells, exclosos })`.
  - Filtra per `nivells` i `exclosos`, barreja amb `aleatori` i torna 5 entrades amb ids i significats únics.
  - Descarta qualsevol parella amb relació `similars` en qualsevol direcció; si no n'hi ha 5, torna `null`.
  - Retorna `{ esquerra, dreta, solucio }`; la dreta és la llista de significats barrejada.
- `js/joc.js`:
  - La ronda surt just després de respondre la pregunta normal 8, 16, 24... des de
    `continuaDespresPregunta()`; si no es poden generar parelles, se salta.
  - Fa servir `nivellsPermesos(preguntesFetes)` i exclou els phrasals ja usats a la partida;
    les parelles no s'afegeixen a `usats`.
  - El rellotge principal s'atura durant la ronda i el missatge d'1 s; la ronda dura 15 s amb
    barra de temps i estat `perill` als últims 5 s.
  - L'esquerra selecciona o canvia el phrasal; la dreta sense selecció no respon; després de
    respondre, els dos botons es desactiven per evitar dobles tocs.
  - Cada encert suma `10 × multiplicador(ratxa)` amb la ratxa ja incrementada, sense bonus de
    velocitat; compta com a encert i actualitza `millorRatxa`.
  - Cada error resta una vida, reinicia la ratxa, afegeix el phrasal a `fallats` i sona l'error;
    amb 0 vides s'acaba la partida després del missatge.
  - Missatge final `⚡ Perfecte! 5/5 🤩` o `⚡ N/5 parelles`; `atura()`, `reinicia()` i `acaba()`
    cancel·len tots els temporitzadors de la ronda.
  - El return exposa `usats()` juntament amb `fallats()`, `resultat()` i `marcaGuardat()`.
- `index.html`: bloc `#bonus` dins `#joc` amb `#bonus-titol`, `#bonus-temps`, `#bonus-barra`,
  `#bonus-estat` (`aria-live="polite"`), `#bonus-esquerra` i `#bonus-dreta`; `#joc-preguntes`
  s'amaga mentre dura la ronda.
- `css/estils.css`: estils `.bonus-parelles`, `.bonus-cap`, `.bonus-columnes`,
  `.bonus-boto.seleccionada` i els estats `[disabled]`, amb botons de 48 px i
  `prefers-reduced-motion` respectat.
- No s'han modificat `api/ranking.php`, la lògica de `js/paraulotes.js` ni `js/ranking.js`, ni
  `contingut/*.json`.
- 14 tests nous a `tests/fase4a.test.mjs`; els tests llargs de 2A i 2C s'han ajustat per travessar
  la ronda sense consumir la seqüència d'atzar de les preguntes normals.

## Proves executades

- TDD en vermell: històricament 12 fallades esperades a 2C; a 2D el test nou fallava amb
  `progres.registraPartida is not a function` i amb `js/so.js` absent; a 3A fallava per
  `api/ranking.php` absent, taules inexistents i `js/paraulotes.js` inexistent; la 3B inicial
  fallava amb `Cannot find module .../js/ranking.js`; les correccions han fallat primer amb 7 tests
  nous (avís 📡, ressaltat per posició, missatge persistent, cursa de pestanyes i versió). A 4A el
  test nou fallava amb `generaParelles is not a function`; després, els tests llargs de 2A i 2C
  fallaven perquè la ronda interrompia la seqüència de preguntes (multiplicador, rellotge i nivells).
- `php -l api/ranking.php`: sintaxi correcta. `node --check` sobre tots els fitxers `js/*.js` i
  `tests/*.mjs`: sintaxi correcta.
- `node --experimental-default-type=module --test tests/*.test.mjs`: **141 tests, 141 passats,
  0 fallats** (124 d'abans + 17 de 4A).
- El test de 3A arrenca `php -S 127.0.0.1:8082 -t www/phrasalverbs` amb `PHRASAL_DB` dins
  `tests/tmp/`, simula el temps modificant `partides.inici` amb `php -r` i PDO, atura el servidor
  i esborra la base en acabar.
- Servidor `php -S 127.0.0.1:8081 -t /mnt/disco/Iespai/www/phrasalverbs` amb una base temporal:
  `POST inici` → 200 amb token, `GET top` → 200 JSON, `GET guardar` → 405 i `GET accio=xyz` → 400.
  Servidor aturat i base temporal esborrada.
- No s'ha fet servir un navegador real; la comprovació és de tests, sintaxi i HTTP.

## Criteris d'acceptació 2B (§10)

- [x] Test: `put-off` no inclou `up with`, `on`, `out`, `away`, `forward`, `up` ni `down`.
- [x] Test: `run-out-of` no inclou `into`, `away` ni `over`.
- [x] Test: `get-up` no inclou `off`, `in`, `out`, `on` ni `down`.
- [x] Test: `put-off` no inclou `over`.
- [x] Test: per als 161 phrasals, 4 opcions diferents i exactament una de correcta.
- [x] Test: cap partícula d'un `similar` ni de `particulesProhibides` com a distractor (161 phrasals).
- [x] Test: completar amb un altre nombre de paraules quan no n'hi ha prou.
- [x] El forat `___` es veu destacat i la traducció apareix en petit.

## Criteris d'acceptació 2C (§10)

- [x] Test: `give-back` (sinònim `return`) no inclou `get back` ni `come back`.
- [x] Test: per als 161 phrasals, el minijoc C genera 4 opcions diferents amb una sola correcta.
- [x] Test: amb 40 preguntes, les 5 primeres són de nivell 1 i no hi ha cap id repetit.
- [x] Test: jugant, surten els 3 tipus de pregunta barrejats.
- [x] Test: un 30 % de les preguntes surten de la caixa 1 si n'hi ha.

## Criteris d'acceptació 2D (§10)

- [x] Test: cada fallat únic va a la caixa 1; els encerts del joc no canvien la caixa.
- [x] Test: rècord només si `punts > 0` i superen el millor anterior, comparat abans de desar.
- [x] Test: top 5 de records amb data, estadístiques, ratxa i activitat del dia actualitzats.
- [x] Test: llista de fallats sense repetits amb significat; si no n'hi ha cap, missatge positiu
      i botó de repàs amagat.
- [x] Test: comptador animat en 20 passos de 50 ms i número directe amb moviment reduït.
- [x] Test: confeti només amb nou rècord i sense moviment reduït.
- [x] Test: `encert`, `pujada`, `error` i `gameOver` cridats; amb so apagat no sona ni vibra.
- [x] Test: `repas-a-jugar → #joc`, `comenca(ids, 'fallats')` i resum de l'Inici redibuixat.

## Criteris d'acceptació 3A (petició actual)

- [x] Test: servidor PHP a 8082 amb `PHRASAL_DB` a `tests/tmp/`, aturat i base esborrada.
- [x] Test: pas del temps simulat modificant `partides.inici` amb `php -r` i PDO.
- [x] Test: `inici` retorna un token de 32 hex i neteja partides de fa més d'un dia.
- [x] Test: taules i índexs del pla, sense columnes d'IP ni user-agent.
- [x] Test: `PUTO` i `XFUCK` → `inicials_invalides` al servidor i `teParaulota` al client.
- [x] Test: `òscar` → `OSCAR`, `a1b-c` → `ABC` i `abcdefg` → `ABCDE`.
- [x] Test: un token només es fa servir una vegada (`token_invalid` al segon ús).
- [x] Test: `punts 99999`, `punts > encerts × 60` i `encerts > temps × 2` → `punts_invalids`.
- [x] Test: guardar abans de 20 s i després de 15 min → `temps_invalid`.
- [x] Test: GET a `guardar` → 405, `accio=xyz` → 400 i cos > 1 KB → error JSON.
- [x] Test: validacions en l'ordre del pla.
- [x] Test: top setmana i sempre, màxim 10, ordenat, empats més antics primer i filtre setmanal.
- [x] Test: `posicioSetmana` i `posicioSempre` amb el mateix criteri d'empat.
- [x] Test: llista de paraulotes idèntica a `js/paraulotes.js` i `api/ranking.php`.

## Criteris d'acceptació 3B (petició actual)

- [x] Test: URL relativa `api/ranking.php`, sense `/phrasalverbs` ni domini.
- [x] Test: `fetch` injectable, amb `globalThis.fetch` per defecte.
- [x] Test: timeout de 5 s amb `AbortController`; errors de xarxa i respostes no JSON →
      `{ ok: false, error: 'sense_connexio' }` sense llançar.
- [x] Test: `top('setmana')` afegeix `&t=${Date.now()}` i `top('sempre')` no afegeix cap `t`.
- [x] Test: token demanat en començar partida; sense token, Game Over mostra l'avís `📡`.
- [x] Test: `joc.resultat()` i `joc.marcaGuardat()`; doble clic a OK no envia dues vegades.
- [x] Test: inicials precarregades, `A_B` invàlid, `AB___` desa `AB` i `PUTO` mostra
      `😇 Ups! Prova unes altres inicials`.
- [x] Test: errors `inicials_invalides`, `temps_invalid`, `token_invalid` i `sense_connexio` amb
      els missatges exactes.
- [x] Test: llista top 10 amb posats, punts i data; fila pròpia ressaltada; pestanya setmana/sempre.
- [x] Test: sense connexió mostra `📡 Sense connexió. Mostrem només els teus rècords`.
- [x] Test: rècords locals top 5 i `#ranking` buit mostra el missatge d'estat buit.
- [x] Test: `<img src=x onerror=alert(1)>` no injecta HTML ni esdeveniments.
- [x] Test: HTML amb `#inicials`, `#ranking`, IDs i `data-ruta="#ranking"`, app amb
      `PANTALLES` i rànquing, CSS amb `scanlines` i `repeating-linear-gradient`.
- [x] Test: cap `?v=8` ni `?v=9` a `index.html`, CSS ni app; imports a `?v=10`.
- [x] Test: `top()` porta `&t=` tant a `setmana` com a `sempre`.
- [x] Test: `guarda()` fa `POST` amb JSON (no `GET`/query).

## Correccions de la 4A (2026-11-25)

- `responDreta()` ja no desactiva els botons ni compta `fetes` quan la parella és errònia: resta
  una vida, reinicia la ratxa, afegeix el phrasal a `fallats`, mostra `erronia` amb `sacseig` als
  dos botons durant 400 ms i després els deixa actius per poder repetir qualsevol dels dos.
  Només una parella correcta desactiva els dos botons i incrementa `fetes`.
- El camí d'error de `respon()` crida `continuaDespresPregunta()` (excepte amb l'última vida),
  així que fallar la pregunta 8, 16 o 24 també obre la ronda bonus després de la pausa d'error.
- `rondaBonus.errors` controla el missatge final: `⚡ Perfecte! 5/5 🤩` només amb 5/5 sense errors;
  amb errors i 5/5 mostra `⚡ 5/5 parelles · N errors` (singular `1 error`); amb el temps esgotat,
  `⚡ X/5 parelles`.
- Tres tests nous cobreixen aquests casos. Total: 141/141 tests passen i `node --check` de tots
  els fitxers JS acaba amb codi `0`.

## Criteris d'acceptació 4A (subfase 4A corregida)

- [x] Test: `generaParelles` dona 5 phrasals, 5 significats diferents, cap parella amb `similars` i `null` si no n'hi ha prou.
- [x] Test: respecta els nivells rebuts i exclou els ids ja usats.
- [x] Test: la ronda no surt fins a la pregunta 8 i torna a sortir a la 16.
- [x] Test: durant la ronda i el missatge el rellotge principal no baixa; després continua.
- [x] Test: als 15 s la ronda s'acaba sola i torna la pregunta normal.
- [x] Test: parella correcta = `10 × multiplicador(ratxa)`, sense bonus de velocitat, amb `encerts +1`.
- [x] Test: parella errònia = `−1` vida, ratxa `0`, phrasal a `fallats` i, amb l'última vida, Game Over.
- [x] Test: error de parella deixa els dos botons actius, treu `erronia` al cap de 400 ms i permet
      repetir tant el phrasal fallat com el significat triat.
- [x] Test: `Perfecte! 5/5` només si la ronda no ha tingut errors; si n'hi ha, `5/5 parelles · N errors`.
- [x] Test: fallar la pregunta 8 també obre la ronda bonus després de la pausa d'error.
- [x] Test: doble toc només puntua un cop i tocar la dreta sense selecció no fa res.
- [x] Test: `atura()` durant la ronda cancel·la tots els temporitzadors.
- [x] Test: cap phrasal de la ronda queda a `usats`.
- [x] Test: HTML i CSS inclouen `aria-live`, botons de 48 px i versions `?v=14`.

## Correcció de la 3B (2026-11-25)

- Ressaltat per posició: `enDesat` passa `posicioSetmana` i `posicioSempre` a `ranking.prepara()`;
  `creaFila()` només afegeix `ressaltada` a la fila `index + 1 === posició` del període mostrat i
  només si la posició és entre 1 i 10. Dues files amb les mateixes inicials ja no parpellegen totes.
- El ressaltat s'esborra en entrar a `#ranking` des de l'Inici; es manté mentre es canvia de
  pestanya dins d'aquesta visita, perquè les dues posicions són desades i s'usen segons el període.
- `🏆 Ets el número N de la setmana!` es mostra a la primera entrada després de guardar i es buida
  en qualsevol altra entrada a `#ranking`.
- `configuraBotoGuardar()` de `js/joc.js` buida i amaga `#gameover-ranking-avis`; com es crida a
  `reinicia()`, qualsevol partida nova esborra l'avís `📡`.
- `iniciaRanking.mostra()` té un comptador de seqüència: les respostes que arriben després d'una
  crida més recent es descarten, així clicar setmana i sempre ràpidament no sobreescriu la llista.
- Versions pujades a `?v=10` arreu. No s'han tocat `api/ranking.php` ni `js/paraulotes.js`.

## Revisió de Claude de la 2C (2026-11-25)

- `js/app.js` passa `leitner: () => estat.leitner` i `js/joc.js` accepta un objecte o una funció.
  Abans, en esborrar el progrés, el joc continuava fent servir l'objecte `leitner` vell fins que es
  recarregava la pàgina. Test nou a `fase2c.test.mjs`.
- Corregit el castellanisme "partículas" → "partícules" als missatges de `fase2b.test.mjs`.
- Tests: **53 tests, 53 passats**.

## Subfase 4B: poliment visual del joc (2026-11-25)

- `js/frases.js` (nou): llistes `ENCERT`, `ERROR` i `GAME_OVER`, amb `triaFrase()` pura i `aleatori`
  injectable. Evita repetir la frase anterior i `js/repas.js` ja no defineix `MISSATGES_OK/KO`.
- `js/joc.js`: en encertar, `#joc-resultat` mostra una frase d'`ENCERT`; en fallar, mostra
  `<frase d'ERROR> La resposta era: X`, amb la correcció obligatòria.
- `+N` volant en cada encert, inclosa la ronda de Parelles: punts exactes, `aria-hidden="true"`,
  pujada i esvaïment en ~700 ms, eliminació del DOM amb `animationend` i cap element amb
  `prefers-reduced-motion`.
- Pujada de multiplicador: 10 peces de confeti a `#joc-confeti`, `pop` a `#joc-ratxa` i colors
  `mult-1` a `mult-4` (text suau, groc, rosa i cian amb ombra de neó). Amb moviment reduït no hi ha
  confeti ni `pop`, però el color del multiplicador continua canviant.
- Game Over: frase aleatòria de `GAME_OVER` a `#gameover-frase`, sota `💀 GAME OVER`.
- Accessibilitat §9: `lang="en"` a la pregunta del minijoc B, al sinònim anglès del C i a les opcions
  angleses dels minijocs B i C; les opcions catalanes del minijoc A no porten `lang`.
- `index.html` i `css/estils.css`: nous `#joc-confeti`, `#joc-efectes` i `#gameover-frase`, amb
  animacions `punts-vola`, `ratxa-pop` i `confeti-joc-cau`; reduced-motion amaga el moviment.
- Versions pujades a `?v=14` a `index.html`, `css/estils.css`, imports JS i URLs dels tests.
- Retoc d'accessibilitat a la ronda Parelles: test nou a `tests/fase4b.test.mjs` que comprova que
  els cinc botons de `#bonus-esquerra` porten `lang="en"` i que cap botó de `#bonus-dreta` en porta.
  `js/joc.js` ja posava l'atribut; s'ha verificat en vermell en treure'l temporalment i en verd en
  restaurar-lo. Versió mantinguda a `?v=14`.
- Comprovació: `node --check` a tots els JS i tests; **152 tests, 152 passats, 0 fallats**.
- No s'han tocat regles ni puntuació, ni `api/ranking.php`, `js/paraulotes.js`, `js/ranking.js` ni
  `contingut/*.json`. No s'han fet commits ni desplegaments.

## Pendent (no fet ara)

- Verificació opcional en navegador real i a Aruba (ara només s'han provat tests, sintaxi i HTTP).
- Fase 5: PWA.
- Fase 6: script de desplegament (sense executar-lo).
- No s'han fet commits ni desplegaments.

## Revisió de Claude de la 2D (2026-11-25)

- `js/app.js`: el so es desperta amb `pointerup`, `touchend`, `click` i `keydown` (abans només
  `pointerdown`, que al mòbil, sobretot a l'iPhone, no compta com a gest d'usuari i el so no sonava).
- `js/joc.js`: `acaba()` surt si la partida ja està acabada, perquè no es registri dos cops a
  rècords i estadístiques.
- Tests: **69 tests, 69 passats**.

## Revisió de Claude de la 3A (2026-11-25)

Provat de debò a través d'Apache al Pi (`pi.iespai.com/phrasalverbs/api/`, des de localhost):
`inici` i `top` funcionen; `api/dades/ranking.db` i `api/dades/` → **403** (el `.htaccess` funciona).

Corregit a `api/ranking.php`:
- **Doble enviament simultani** (doble toc a "Guardar"): 4 peticions alhora amb el mateix token
  donaven 1 `ok` i, sovint, un `bd_error` ("database is locked"). Causes i solucions:
  - el `SELECT` del token quedava obert i mantenia un bloqueig → `closeCursor()` després del `fetch()`;
  - transacció `BEGIN IMMEDIATE` i `PDO::ATTR_TIMEOUT` = 5 s, perquè les peticions facin cua;
  - es comprova `rowCount() === 1` en marcar el token com a usat; si no → `token_invalid`.
  Resultat: 12 rondes de 4 peticions simultànies → sempre 1 desada, 0 errors.
- `?periode[]=x` donava un 500 sense JSON → ara 400 `periode_invalid` (test nou).
- Tests: **93 tests, 93 passats**.

Per al desplegament (Fase 6): a Aruba, `api/dades/` ha de tenir permís d'escriptura per a PHP.

## Fase 5: PWA

- `manifest.webmanifest` (arrel): `name`/`short_name` "Phrasal Hero", `display` "standalone",
  `start_url` "./", `scope` "./", `lang` "ca", `background_color` i `theme_color` "#120a2e",
  icones `icon-192.png` i `icon-512.png` amb `purpose` "any maskable".
- Icones generades amb `tools/gen_icones.py` (Python + Pillow, sense emojis): fons lila #120a2e,
  "P" gran de neó cian amb resplendor, centrada dins el 60% central. Fitxers: `icon-192.png`,
  `icon-512.png`, `apple-touch-icon.png` (180 px).
- `sw.js` (arrel), basat en `www/volei/sw.js`: cache `phrasalhero-v15`; instal·la shell amb
  `./`, `index.html`, manifest, icones, `css/estils.css?v=15`, tots els `js/*.js?v=15`, les dues
  fonts `?v=15` i `contingut/phrasals.json?v=3`. `connectors.json` no s'inclou perquè l'app no el
  carrega. Estratègia xarxa primer, fallback a cache amb `ignoreSearch`; navegacions sense xarxa
  cauen a `index.html`. Només GET del mateix origen; qualsevol ruta amb `/api/` fa `return` abans
  de `respondWith`. En activar, esborra caches velles.
- `index.html`: afegits `<link rel="manifest">`, `<link rel="apple-touch-icon">`,
  `meta apple-mobile-web-app-capable` i `apple-mobile-web-app-title`. Pujat tot a `?v=15`.
- `js/app.js`: registra `sw.js?v=15` només si `serviceWorker` in navigator, dins `try/catch`,
  després del `load`; la promesa de registre també té `.catch`. No trenca tests sense navegador.

## Proves Fase 5

- `node --experimental-default-type=module --test tests/fase5.test.mjs`: **6/6 passats**.
- `node --experimental-default-type=module --test tests/*.test.mjs`: **158/158 passats, 0 fallats**.
- Comprovació manual de fitxers: manifest JSON vàlid, icones PNG amb mides 192/512/180, SW amb
  versió coherent, comprovació `/api/` abans de `respondWith`, sense rutes absolutes a SHELL.

## Pendent

- Fase 6: script de desplegament (sense executar-lo).
- Verificació manual opcional en navegador real/PWA i a Aruba.

