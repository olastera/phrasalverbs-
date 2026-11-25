# 🧭 Phrasal Hero: seguiment del projecte

> Quadern de bitàcola de l'Oscar i de Claude: on som, què s'ha decidit i què ve ara.
> Opencode escriu el seu propi informe tècnic a `docs/ESTAT.md`. Aquest document és la visió general.
> **Última actualització: 24/11/2026**

---

## 👥 Com treballem

- **Oscar:** decideix i passa els encàrrecs a opencode.
- **Claude Code:** fa el pla (`docs/PLA.md`), les dades (`contingut/*.json`, generades amb
  `tools/*.py`) i revisa cada fase d'opencode.
- **Opencode** (model gratuït): programa una fase o subfase cada vegada, seguint
  `AGENTS.md` i `docs/PLA.md`.
- **Cicle:** Claude prepara el text → l'Oscar l'enganxa a opencode (en una **conversa nova**
  a cada fase) → opencode programa i actualitza `docs/ESTAT.md` → l'Oscar enganxa el resum
  d'opencode a Claude → Claude revisa el codi i prepara el text següent.
- Opencode s'executa a `/mnt/disco/Iespai`, com Claude.

## ✅ Decisions preses

| Tema | Decisió |
|---|---|
| Nom | **Phrasal Hero** 🦸 |
| URL | `iespai.com/phrasalverbs/` (carpeta `www/phrasalverbs/`) |
| Públic | 2n de Batxillerat, preparació de la PAU d'anglès. Primer el mòbil |
| Idioma | Interfície en **català** |
| Estil | Arcade neó dels 80, **emojis a tope** |
| Rànquing | **Compartit** (PHP + SQLite), anònim, estil recreativa: inicials A-Z, màx. 5 lletres. Sense registre ni IP |
| Progrés | `localStorage` (clau `phrasalhero:v1`) |
| Tecnologia | HTML/CSS/JS vanilla (mòduls ES), sense frameworks ni build |
| Fonts | Allotjades a `fonts/` (no Google Fonts, per privacitat dels menors i per l'ús offline) |
| Analítica | **Cap** de moment (pendent de decidir) |
| Partida a mitges | No es desa (arcade). La sessió de repàs a mitges sí |
| Connectors | Fase futura. Les dades ja estan fetes |

## 📦 Dades (fetes per Claude, NO les toca opencode)

- `contingut/phrasals.json`: **161 phrasal verbs**. Camps afegits durant les revisions:
  - `exempleMarcat`: el phrasal marcat amb `**` (també quan està separat: *drop me off*).
  - `similars`: phrasals amb un significat gairebé igual, que no poden sortir com a distractors.
  - `particulesProhibides`: partícules prohibides com a distractor del minijoc B, incloent-hi
    phrasals reals de l'anglès que no són a les dades (*get off*, *come away*...).
- `contingut/connectors.json`: **74 connectors** amb funció, estructura, registre, nota,
  equivalents i distractors revisats a mà.
- Es regeneren amb `python3 -I tools/gen_phrasals.py contingut/phrasals.json` (i igual amb
  `gen_connectors.py`). **Mai no s'editen els JSON a mà.**
- ⚠️ Cada vegada que es regenera un JSON, cal pujar `VERSIO_DADES` a `js/dades.js` (per la
  memòria cau d'Aruba).

## 🗺️ Fases

| Fase | Contingut | Estat |
|---|---|---|
| 1 | Esquelet + Repassar (targetes, Leitner, filtres, progrés) | ✅ Feta i revisada |
| 2A | Motor de la partida + minijoc A (Què vol dir?) | ✅ Feta, corregida i revisada |
| 2B | Minijoc B (Completa la frase) | ✅ Feta i revisada (amb `particulesProhibides`) |
| 2C | Minijoc C (Substitueix) + barreja + dificultat + 30 % caixa 1 | ✅ Feta, revisada i provada al mòbil (commit `9cc360e`) |
| 2D | Game Over complet, progrés, so i vibració | ✅ Feta, revisada i provada al mòbil (commit `020c826`) |
| 3A | API del rànquing (`api/ranking.php` + SQLite) i filtre de paraulotes | ✅ Feta i revisada, provada a Apache del Pi (commit `c4aa469`) |
| 3B | Pantalles Inicials i Rànquing, token a cada partida, mode sense connexió | ✅ Feta, corregida i revisada (commit `5adca30`); falta provar-la al mòbil |
| **4A** | Ronda bonus ⚡ Parelles (minijoc D) | ⏳ **Encàrrec preparat** (vegeu a sota) |
| 4B | Poliment: frases i emojis aleatoris al joc, "+N" volant, confeti en pujar multiplicador | ⬜ |
| 5 | PWA (manifest, service worker, icones) | ⬜ |
| 6 | Script `deploy-phrasalverbs.sh` (el desplegament el fa l'Oscar) | ⬜ |
| Futur | Connectors, codi de classe al rànquing, mode examen | ⬜ |

## 🔍 Errors trobats a les revisions (perquè no tornin)

- Ressaltat de l'exemple fet amb regex → marcava paraules equivocades. **Solució:** `exempleMarcat`.
- Imports JS sense `?v=` → la memòria cau d'Aruba podia barrejar versions. **Norma a AGENTS.md.**
- Distractors amb significat gairebé igual (*carry on* / *keep on*). **Solució:** `similars`.
- El rellotge perdia temps en cada pausa i, amb respostes ràpides, **no baixava mai**. Corregit:
  tick de 250 ms i descompte en pausar.
- Partícules que formen altres phrasals reals (*I get off at seven*). **Solució:**
  `particulesProhibides`.
- Opencode va intentar fer *brainstorming* (skill superpowers). **Norma a AGENTS.md:** el pla ja
  és el disseny aprovat.
- Tests a `/tmp` (es perden en reiniciar) → ara són a `tests/`.
- El joc rebia `estat.leitner` un sol cop; en esborrar el progrés feia servir l'objecte vell.
  **Solució:** `leitner: () => estat.leitner`. Qualsevol dada d'`estat` que el joc necessiti,
  llegir-la en el moment (mai guardar-ne una còpia en iniciar).
- El so es despertava amb `pointerdown`, que al mòbil no compta com a gest d'usuari (iPhone mut).
  **Solució:** `pointerup`/`touchend`/`click`/`keydown`.
- `acaba()` sense protecció contra una doble crida (doble registre de la partida). Ara és idempotent.
- API: un `SELECT` de PDO obert (sense `closeCursor()`) bloquejava SQLite i el doble enviament
  donava `database is locked`. **Norma:** tancar les lectures abans d'escriure, `BEGIN IMMEDIATE` i
  comprovar `rowCount()`.
- Rànquing (3B): la fila pròpia es ressaltava comparant inicials → si unes inicials surten
  diverses vegades, parpellegen totes. **Solució:** ressaltar per posició (`posicioSetmana` /
  `posicioSempre` que torna el servidor), mai pel text.
- Missatges que es queden enganxats d'una visita a l'altra ("🏆 Ets el número N", avís 📡 del
  Game Over). **Norma:** cada missatge puntual s'esborra quan es torna a mostrar la pantalla o
  comença una partida nova.
- Respostes de xarxa que arriben desordenades (pestanya setmana/sempre clicada ràpid).
  **Norma:** comptador de crida i descartar respostes velles, com ja fa el token del joc.

## 🧪 Com provar

- Tests: des de `www/phrasalverbs/`, `node --experimental-default-type=module --test tests/*.test.mjs`
- Servidor local: `php -S 0.0.0.0:8081 -t /mnt/disco/Iespai/www/phrasalverbs`
  (el port 8080 està ocupat per un altre servei del Pi).
- Al mòbil (a casa): `http://192.168.0.134:8081/`
- Des de fora: **https://pi.iespai.com/phrasalverbs/** (àlies d'Apache al Pi, serveix directament
  `www/phrasalverbs`; afegit el 2026-11-25). Ara també es veuen `docs/`, `tests/` i `AGENTS.md`:
  no s'han de pujar a producció.
- Opencode no pot fer proves de navegador al Pi. **Les proves visuals les fa l'Oscar.**

## ⏭️ Pas següent: encàrrec per a opencode (subfase 4A: ronda bonus Parelles)

Abans o en paral·lel: **provar la 3B al mòbil** a https://pi.iespai.com/phrasalverbs/ (guardar una
puntuació de debò, pestanyes setmana i de sempre, mode avió). La revisió de Claude ja hi va afegir
una correcció: els rècords locals no es ressalten mai (test inclòs, `?v=11`).

Decisions de Claude per a Parelles (el pla §5.2 D no les concretava):
- Cada parella correcta = `10 × multiplicador(ratxa)`, sense bonus de velocitat, i compta com a
  encert i com a ratxa. Així es compleix el màxim de 60 punts per encert que valida el servidor.
- El rellotge principal s'atura durant la ronda: la partida pot durar més de 90 s, però el
  servidor accepta fins a 900 s.

```
Projecte: www/phrasalverbs/. Llegeix AGENTS.md, docs/PLA.md (§4.3, §5.1, §5.2 D, §5.3, §5.4, §9)
i docs/ESTAT.md. NO toquis api/ranking.php, js/paraulotes.js, js/ranking.js ni contingut/*.json.
No facis commits ni desplegaments.

Fes la subfase 4A: el minijoc D, la ronda bonus "⚡ Parelles".

1. Quan surt: just després de respondre la pregunta normal número 8, 16, 24... (comptador
   preguntesFetes de js/joc.js), si la partida no s'ha acabat. Si no hi ha prou phrasals vàlids
   (vegeu el punt 2), se la salta i el joc continua normal.
2. Generació (funció pura nova a js/preguntes.js, p. ex. generaParelles(phrasals, {aleatori,
   nivells})): 5 phrasals dels nivells permesos en aquell moment, amb 5 significats diferents, i
   cap dels 5 a la llista `similars` d'un altre dels 5. Retorna { esquerra: [phrasals barrejats],
   dreta: [significats barrejats], solucio } o null si no n'hi ha 5. Les Parelles no consumeixen
   els phrasals de la partida (no els afegeixis a `usats`).
3. Pantalla dins de #joc (no una secció nova): títol "⚡ RONDA BONUS: Parelles", compte enrere
   propi de 15 s (barra), 5 botons a l'esquerra (phrasal dins <span lang="en">) i 5 a la dreta
   (significat). Botons de debò, mínim 48 px, dues columnes també al mòbil. Les preguntes normals
   s'amaguen mentre dura.
4. Interacció: toques un botó de l'esquerra (queda seleccionat; si en toques un altre de l'esquerra,
   canvia la selecció) i després un de la dreta.
   - Correcta: tots dos en verd i desactivats, punts += 10 × multiplicador(ratxa) (ratxa +1 abans
     de calcular, com a les preguntes normals; sense bonus de velocitat), encerts += 1, so d'encert
     i pujada si toca.
   - Errònia: −1 vida, ratxa = 0, el phrasal seleccionat va a fallats (i a la caixa 1 com tots
     els errors del joc), sacseig vermell curt, so d'error i vibració, i es deselecciona. Si era
     l'última vida, Game Over (motiu 'vides') després de la pausa curta.
   - Protecció contra dobles tocs mentre es resol una parella.
   - Toques la dreta sense res seleccionat a l'esquerra: no passa res.
5. Final de la ronda: les 5 fetes o els 15 s exhaurits. Missatge curt ("⚡ Perfecte! 5/5 🤩" o
   "⚡ 3/5 parelles") ~1 s, i torna la pregunta normal amb el rellotge principal en marxa.
   El rellotge principal NO baixa durant la ronda bonus ni durant aquest missatge.
6. atura() (sortir de #joc) i reinicia() han de cancel·lar també el compte enrere de la ronda bonus.
7. aria-live per a l'estat de la ronda, prefers-reduced-motion sense sacseig, colors del §9.

Tests obligatoris (tests/fase4a.test.mjs, amb rellotge i aleatori simulats):
- generaParelles: 5 phrasals, 5 significats diferents, cap parell dins de `similars`, null si
  no n'hi ha prou; respecta els nivells.
- la ronda surt després de la pregunta 8 i de la 16, i no abans;
- durant la ronda (i el missatge final) el temps principal no baixa; després continua;
- als 15 s la ronda s'acaba sola i torna el joc;
- parella correcta: punts = 10 × multiplicador, sense bonus encara que sigui ràpida; encerts +1;
- parella errònia: −1 vida, ratxa 0, phrasal a fallats; última vida → Game Over;
- doble toc a la mateixa parella només puntua un cop; tocar la dreta sense selecció no fa res;
- atura() durant la ronda no deixa temporitzadors vius;
- cap phrasal de la ronda queda a `usats`.

Puja a ?v=12 a tot arreu (imports i tests inclosos). Executa tots els tests (els 124 d'abans també
han de passar), actualitza docs/ESTAT.md i atura't.
```

Després de la 4A: provar al mòbil (arribar a la pregunta 8 i jugar la ronda; comprovar que el temps
s'atura) i avisar Claude per a la revisió.

## 📌 Pendents fora del codi

- Decidir si s'hi afegeix analítica (GA4 o cap).
- Enllaçar Phrasal Hero des d'algun lloc d'iespai.com quan estigui publicat.
- El projecte és al repo d'Iespai (des del commit `0fd6955`). Decidir si més endavant va a un
  repo propi (com Sender).
