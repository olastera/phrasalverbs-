# Estat: Fase 1 + Fase 2A (corregida) + Fase 2B (ajustada) + Fase 2C

Estat: Fase 1 acabada; Fase 2A corregida; Fase 2B ajustada amb `particulesProhibides`;
Fase 2, subfase 2C (minijoc C, "Substitueix", dificultat, no repetició i caixa 1) implementada i
provada. No s'han fet commits ni desplegaments. `contingut/phrasals.json` no s'ha tocat; el camp
`particulesProhibides` ja era a les dades revisades.

## Correcció de versions (importants)

- Tots els imports interns de JS portaven versió. S'han posat a `?v=7`, inclòs `index.html` i
  `css/estils.css` (fonts incloses), i s'ha mantingut la norma a `AGENTS.md`: pujar `?v=N` a
  `index.html` i a tots els imports quan canviï qualsevol fitxer JS o CSS.
- Versions successives: `?v=3` (imports interns), `?v=4` (2A), `?v=5` (correccions 2A),
  `?v=6` (2B) i **`?v=7` ara** (ajust 2B i 2C). `js/dades.js`, `js/progres.js` i
  `js/preguntes.js` s'importen amb `?v=7`.
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

## Proves executades

- Primer, TDD en vermell: 12 fallades esperades (versió de dades, `particulesProhibides`,
  minijoc C, barreja de tipus, dificultat i caixa 1), cadascuna pel motiu correcte.
- `node --check` sobre tots els fitxers `js/*.js`: sintaxi correcta.
- `node --experimental-default-type=module --test tests/*.test.mjs`: **52 tests, 52 passats,
  0 fallats** (19 de Fase 1, 16 de 2A, 10 de 2B i 7 de 2C).
- Servidor `php -S 127.0.0.1:8081 -t /mnt/disco/Iespai/www/phrasalverbs`: `/`, `index.html`,
  `css/estils.css?v=7`, `js/app.js?v=7`, `js/joc.js?v=7`, `js/preguntes.js?v=7` i
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

## Revisió de Claude de la 2C (2026-11-25)

- `js/app.js` passa `leitner: () => estat.leitner` i `js/joc.js` accepta un objecte o una funció.
  Abans, en esborrar el progrés, el joc continuava fent servir l'objecte `leitner` vell fins que es
  recarregava la pàgina. Test nou a `fase2c.test.mjs`.
- Corregit el castellanisme "partículas" → "partícules" als missatges de `fase2b.test.mjs`.
- Tests: **53 tests, 53 passats**.

## Pendent (no fet ara)

- Fase 2D: Game Over complet, efectes al progrés i so.
- Fase 3: rànquing i API PHP.
