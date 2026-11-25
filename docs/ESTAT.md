# Estat: Fase 1 + Fase 2A (corregida) + Fase 2B (ajustada) + Fase 2C + Fase 2D

Estat: Fase 1 acabada; Fase 2A corregida; Fase 2B ajustada amb `particulesProhibides`;
subfase 2C (minijoc C, "Substitueix", dificultat, no repetició i caixa 1) implementada i provada;
subfase 2D (Game Over complet, efectes al progrés i so) implementada i provada. No s'han fet
commits ni desplegaments. `contingut/phrasals.json` no s'ha tocat; el camp `particulesProhibides`
ja era a les dades revisades.

## Correcció de versions (importants)

- Tots els imports interns de JS porten versió. S'han posat a `?v=8`, inclòs `index.html` i
  `css/estils.css` (fonts incloses), i s'ha mantingut la norma a `AGENTS.md`: pujar `?v=N` a
  `index.html` i a tots els imports quan canviï qualsevol fitxer JS o CSS.
- Versions successives: `?v=3` (imports interns), `?v=4` (2A), `?v=5` (correccions 2A),
  `?v=6` (2B), `?v=7` (ajust 2B i 2C) i **`?v=8` ara** (2D). `js/dades.js`, `js/preguntes.js`,
  `js/progres.js`, `js/joc.js`, `js/repas.js`, `js/app.js` i el nou `js/so.js` s'importen amb
  `?v=8`.
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

## Proves executades

- TDD en vermell: històricament 12 fallades esperades a 2C; a 2D el test nou fallava amb
  `progres.registraPartida is not a function` i amb `js/so.js` absent, fins que s'han implementat.
- `node --check` sobre tots els fitxers `js/*.js`: sintaxi correcta.
- `node --experimental-default-type=module --test tests/*.test.mjs`: **69 tests, 69 passats,
  0 fallats** (53 d'abans + 16 de 2D).
- Servidor `php -S 127.0.0.1:8081 -t /mnt/disco/Iespai/www/phrasalverbs`: `/`, `/index.html`,
  `css/estils.css?v=8`, `js/app.js?v=8`, `js/so.js?v=8`, `js/joc.js?v=8`, `js/progres.js?v=8`,
  `js/repas.js?v=8`, `js/preguntes.js?v=8`, `js/dades.js?v=8` i
  `contingut/phrasals.json?v=3` responen 200. Servidor aturat després de la prova.
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

## Revisió de Claude de la 2C (2026-11-25)

- `js/app.js` passa `leitner: () => estat.leitner` i `js/joc.js` accepta un objecte o una funció.
  Abans, en esborrar el progrés, el joc continuava fent servir l'objecte `leitner` vell fins que es
  recarregava la pàgina. Test nou a `fase2c.test.mjs`.
- Corregit el castellanisme "partículas" → "partícules" als missatges de `fase2b.test.mjs`.
- Tests: **53 tests, 53 passats**.

## Pendent (no fet ara)

- Fase 3: rànquing real amb API PHP. De moment `#gameover-ranking` només mostra l'avís
  "Properament", tal com demana la 2D.
- No s'han fet commits ni desplegaments.

## Revisió de Claude de la 2D (2026-11-25)

- `js/app.js`: el so es desperta amb `pointerup`, `touchend`, `click` i `keydown` (abans només
  `pointerdown`, que al mòbil, sobretot a l'iPhone, no compta com a gest d'usuari i el so no sonava).
- `js/joc.js`: `acaba()` surt si la partida ja està acabada, perquè no es registri dos cops a
  rècords i estadístiques.
- Tests: **69 tests, 69 passats**.
