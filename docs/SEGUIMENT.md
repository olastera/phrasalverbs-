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
| 3B | Pantalles Inicials i Rànquing, token a cada partida, mode sense connexió | ✅ Feta, corregida, revisada i provada al mòbil (commit `5adca30`) |
| 4A | Ronda bonus ⚡ Parelles (minijoc D) | ✅ Feta, corregida, revisada i provada al mòbil (commit `b285e87`) |
| **4B** | Poliment: frases i emojis aleatoris al joc, "+N" volant, confeti en pujar multiplicador | ⏳ **Encàrrec preparat** (vegeu a sota) |
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
- Parelles (4A): una parella errònia desactivava els dos botons → el significat bloquejat ja no
  es podia fer servir i l'error en provocava d'altres. **Norma:** en un error només es desfà la
  selecció; només les parelles correctes queden desactivades.
- Camins duplicats (encert / error) que fan el mateix: el de l'error no comprovava la ronda bonus.
  **Norma:** un sol punt de pas a la pregunta següent (`continuaDespresPregunta`).

## 🧪 Com provar

- Tests: des de `www/phrasalverbs/`, `node --experimental-default-type=module --test tests/*.test.mjs`
- Servidor local: `php -S 0.0.0.0:8081 -t /mnt/disco/Iespai/www/phrasalverbs`
  (el port 8080 està ocupat per un altre servei del Pi).
- Al mòbil (a casa): `http://192.168.0.134:8081/`
- Des de fora: **https://pi.iespai.com/phrasalverbs/** (àlies d'Apache al Pi, serveix directament
  `www/phrasalverbs`; afegit el 2026-11-25). Ara també es veuen `docs/`, `tests/` i `AGENTS.md`:
  no s'han de pujar a producció.
- Opencode no pot fer proves de navegador al Pi. **Les proves visuals les fa l'Oscar.**

## ⏭️ Pas següent: encàrrec per a opencode (subfase 4B: poliment)

Revisat a 2026-11-25: ja hi ha emojis flotants al fons, ratxa de dies, confeti de rècord i
`prefers-reduced-motion` global. Falta el que demanen §4.3 i §9 durant la partida:

```
Projecte: www/phrasalverbs/. Llegeix AGENTS.md, docs/PLA.md (§4.3, §4.4 i §9) i docs/ESTAT.md.
NO toquis api/ranking.php, js/paraulotes.js, js/ranking.js ni contingut/*.json.
No canviïs cap regla de joc ni de puntuació. No facis commits ni desplegaments.

Fes la subfase 4B: poliment visual del joc.

1. js/frases.js (nou, funcions pures amb `aleatori` injectable): llistes i tria a l'atzar.
   - ENCERT: "Brutal! 🔥", "Ets una màquina! 🤖", "Boom! 💥", "Imparable! 🚀", "Crack! 😎"
   - ERROR (només l'emoji/ànim, la correcció es manté): "Uf, per poc! 🙈", "La pròxima és teva 💪",
     "Apunta-te-la! 📝", "💔", "😵"
   - GAME OVER: "Bona partida! 👏", "La PAU tremola 😤", "Torna-hi, que tu pots! 💪"
   - No repeteixis la mateixa frase dues vegades seguides.
   js/repas.js passa a fer servir aquestes llistes (treu MISSATGES_OK/KO de repas.js).
2. Joc: en encertar, #joc-resultat mostra una frase d'ENCERT (ara sempre "🎉 Brutal!"). En fallar,
   "<frase d'ERROR> La resposta era: X" (la resposta correcta és obligatòria, §4.3).
3. "+N" volant: en cada encert (també a les Parelles), un element petit "+N" (els punts guanyats)
   que surt del botó encertat i puja i s'esvaeix (~700 ms, CSS). aria-hidden="true", s'elimina del
   DOM en acabar. Amb prefers-reduced-motion no es crea.
4. Pujada de multiplicador: petit esclat de confeti a la zona del joc (reutilitza l'estil .confeti,
   menys peces, ~10) i l'indicador "🔥 xN" fa un "pop" (escala) i canvia de color segons el
   multiplicador: x1 text suau, x2 groc, x3 rosa, x4 cian amb ombra de neó. Sense moviment si
   prefers-reduced-motion (el color sí que canvia).
5. Game Over: una frase de GAME OVER a l'atzar sota el títol "💀 GAME OVER".
6. Accessibilitat §9: el text en anglès dins lang="en" a les preguntes i opcions del joc
   (phrasals, partícules i frases amb forat en anglès; els significats en català no).

Tests obligatoris (tests/fase4b.test.mjs, amb aleatori simulat):
- frases.js: tria de cada llista i mai dues iguals seguides;
- encert → #joc-resultat conté una frase d'ENCERT; error → conté una frase d'ERROR i
  "La resposta era: X";
- "+N" amb els punts exactes (també a Parelles), aria-hidden, i no es crea amb reduced-motion;
- pujada de x1 a x2 → classe de multiplicador a #joc-ratxa i confeti; sense pujada, cap confeti;
  reduced-motion → cap confeti però sí la classe de color;
- Game Over mostra una frase de la llista;
- repas.js fa servir js/frases.js;
- lang="en" a les opcions dels minijocs B i C i a la pregunta de B; no a les opcions del minijoc A.

Puja a ?v=14 a tot arreu (imports i tests inclosos). Executa tots els tests (els 141 d'abans també
han de passar), actualitza docs/ESTAT.md i atura't.
```

Després de la 4B: provar al mòbil (frases variades, "+N", confeti en arribar a x2, colors de la
ratxa; i amb "reduir moviment" activat al mòbil, que no es mogui res) i avisar Claude.

## 📌 Pendents fora del codi

- Decidir si s'hi afegeix analítica (GA4 o cap).
- Enllaçar Phrasal Hero des d'algun lloc d'iespai.com quan estigui publicat.
- El projecte és al repo d'Iespai (des del commit `0fd6955`). Decidir si més endavant va a un
  repo propi (com Sender).
