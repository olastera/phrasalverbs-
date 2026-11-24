# Estat: Fase 1 + Fase 2A (corregida) + Fase 2B

Estat: Fase 1 acabada; Fase 2A corregida; Fase 2, subfase 2B (minijoc B, "Completa la frase")
implementada i provada. No s'han fet commits ni desplegaments. `contingut/phrasals.json` no s'ha
tocat.

## Correcció de versions (importants)

- Tots els imports interns de JS abans no portaven versió. S'han posat a `?v=3`, inclòs
  `index.html`, i s'ha afegit la norma a `AGENTS.md`: pujar `?v=N` a `index.html` i a tots els
  imports quan canviï qualsevol fitxer JS o CSS.
- Versions successives: `?v=4` amb la 2A, `?v=5` amb les correccions de la 2A i **`?v=6` ara**
  (`index.html`, `css/estils.css` incloses les fonts, `js/app.js`, `js/repas.js`, `js/joc.js` i
  els tests). `js/dades.js`, `js/progres.js` i `js/preguntes.js` s'importen amb `?v=6`.
- **`VERSIO_DADES` és 2** perquè les dades han canviat (`contingut/phrasals.json?v=2`).
- A `AGENTS.md` s'ha afegit la norma: si `contingut/*.json` canvia, puja `VERSIO_DADES`.
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
- El tick del rellotge és ara cada **250 ms** perquè la barra es mogui suau; cada tick descompta
  el temps real i actualitza `iniciTick`.
- Test afegit amb rellotge fals: 20 encerts seguits contestant a 0,9 s i amb pauses de 400 ms
  descompten unes 18 s (71–73 s restants), sense comptar les pauses.

## Fase 2B: minijoc B (Completa la frase) 🧩

- `js/preguntes.js`: nova funció pura `generaPreguntaB`.
  - Mostra `forat` i `traduccio`; la resposta correcta és `particula`.
  - Distractors preferentment d'altres partícules amb el **mateix nombre de paraules**.
  - Si no n'hi ha prou, completa amb partícules d'un altre nombre de paraules.
  - Regla 1: mai una partícula que, amb el mateix verb, formi un altre phrasal del JSON
    (`put off` no ofereix `up with`, `on`, `out`, `away`, `forward`, `up` ni `down`;
    `run out of` no ofereix `into`, `away` ni `over`).
  - Regla 2 (general de similars): mai la partícula d'un id de `similars` de la resposta.
  - 4 opcions diferents, una sola correcta i posició aleatòria per als 161 phrasals.
- `js/joc.js`: `iniciaJoc` rep `aleatori` (per defecte `Math.random`) i alterna A/B a l'atzar.
  La pregunta B mostra el `___` destacat amb CSS i la traducció en petit sota el forat; l'etiqueta
  canvia entre "🤔 Què vol dir?" i "🧩 Completa la frase".
- `index.html`: afegits `joc-tipus` i `joc-traduccio`.
- `css/estils.css`: estils per a `.forat` i `.joc-traduccio`.

## Proves executades

- Primer, TDD en vermell: 11 fallades esperades (versió de dades, rellotge i minijoc B), cadascuna
  pel motiu correcte.
- `node --check` sobre tots els fitxers `js/*.js`: sintaxi correcta.
- `node --experimental-default-type=module --test tests/*.test.mjs`: **42 tests, 42 passats,
  0 fallats** (19 de Fase 1, 16 de 2A, 7 de 2B).
- Servidor `php -S 0.0.0.0:8081 -t /mnt/disco/Iespai/www/phrasalverbs`: `/`, `index.html`,
  `css/estils.css?v=6`, `js/app.js?v=6`, `js/joc.js?v=6`, `js/preguntes.js` i
  `contingut/phrasals.json?v=2` responen 200. Servidor aturat després de la prova.
- No s'ha fet servir un navegador real; la comprovació és de tests, sintaxi i HTTP.

## Criteris d'acceptació 2B (§10)

- [x] Test: `put-off` no inclou `up with`, `on`, `out`, `away`, `forward`, `up` ni `down`.
- [x] Test: `run-out-of` no inclou `into`, `away` ni `over`.
- [x] Test: per als 161 phrasals, 4 opcions diferents i exactament una de correcta.
- [x] Test: cap partícula d'un `similar` com a distractor (161 phrasals).
- [x] Test: completar amb un altre nombre de paraules quan no n'hi ha prou.
- [x] El forat `___` es veu destacat i la traducció apareix en petit.
- [x] La partida barreja els minijocs A i B a l'atzar.

## Pendent (no fet ara)

- Fase 2C: minijoc C (Substitueix) + dificultat progressiva i no repetició.
- Fase 2D: Game Over complet, efectes al progrés i so.
- Fase 3: rànquing i API PHP.
