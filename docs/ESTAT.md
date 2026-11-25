# Estat: Fase 1 + Fase 2A (corregida) + Fase 2B (ajustada) + Fase 2C + Fase 2D + Fase 3A

Estat: Fase 1 acabada; Fase 2A corregida; Fase 2B ajustada amb `particulesProhibides`;
subfase 2C (minijoc C, "Substitueix", dificultat, no repetició i caixa 1) implementada i provada;
subfase 2D (Game Over complet, efectes al progrés i so) implementada i provada; Fase 3A (servidor
del rànquing i filtre de paraulotes) implementada i provada. No s'han fet commits ni desplegaments.
`contingut/phrasals.json` no s'ha tocat; el camp `particulesProhibides` ja era a les dades revisades.

## Correcció de versions (importants)

- Tots els imports interns de JS porten versió. S'han posat a `?v=8`, inclòs `index.html` i
  `css/estils.css` (fonts incloses), i s'ha mantingut la norma a `AGENTS.md`: pujar `?v=N` a
  `index.html` i a tots els imports quan canviï qualsevol fitxer JS o CSS.
- Versions successives: `?v=3` (imports interns), `?v=4` (2A), `?v=5` (correccions 2A),
  `?v=6` (2B), `?v=7` (ajust 2B i 2C) i **`?v=8` ara** (2D). `js/dades.js`, `js/preguntes.js`,
  `js/progres.js`, `js/joc.js`, `js/repas.js`, `js/app.js` i el nou `js/so.js` s'importen amb
  `?v=8`.
- La 3A manté `?v=8`: no s'ha tocat `index.html` ni cap JS/CSS existent. El nou
  `js/paraulotes.js` encara no s'importa; s'importarà a la 3B amb la pujada de versió que toqui.
- **`VERSIO_DADES` és 3** perquè les dades han canviat (`contingut/phrasals.json?v=3`).
- A `AGENTS.md` hi ha la norma: si `contingut/*.json` canvia, puja `VERSIO_DADES`.
- A `AGENTS.md` hi ha la comanda de tests:
  `node --experimental-default-type=module --test tests/*.test.mjs`.

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
- No s'han tocat `index.html`, les pantalles ni la versió `?v=8`.
- 23/23 tests de 3A passen.

## Proves executades

- TDD en vermell: històricament 12 fallades esperades a 2C; a 2D el test nou fallava amb
  `progres.registraPartida is not a function` i amb `js/so.js` absent; a 3A fallava per
  `api/ranking.php` absent, taules inexistents i `js/paraulotes.js` inexistent.
- `php -l api/ranking.php`: sintaxi correcta. `node --check` sobre tots els fitxers `js/*.js`:
  sintaxi correcta.
- `node --experimental-default-type=module --test tests/*.test.mjs`: **92 tests, 92 passats,
  0 fallats** (69 d'abans + 23 de 3A).
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

## Revisió de Claude de la 2C (2026-11-25)

- `js/app.js` passa `leitner: () => estat.leitner` i `js/joc.js` accepta un objecte o una funció.
  Abans, en esborrar el progrés, el joc continuava fent servir l'objecte `leitner` vell fins que es
  recarregava la pàgina. Test nou a `fase2c.test.mjs`.
- Corregit el castellanisme "partículas" → "partícules" als missatges de `fase2b.test.mjs`.
- Tests: **53 tests, 53 passats**.

## Pendent (no fet ara)

- Fase 3B: pantalles `#inicials` i `#ranking`, `js/ranking.js`, connexió del botó
  "🏆 Guardar al rànquing" i pujada de versió a `index.html`. De moment aquell botó només mostra
  l'avís "Properament", tal com demana la 2D.
- Fase 4: ronda bonus i poliment.
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
