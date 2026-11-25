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
| 3A | API del rànquing (`api/ranking.php` + SQLite) i filtre de paraulotes | ✅ Feta i revisada (provada a Apache del Pi) |
| 3B | Pantalles Inicials i Rànquing, token a cada partida, mode sense connexió | ⬜ |
| 4 | Ronda bonus Parelles + poliment visual | ⬜ |
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

## 🧪 Com provar

- Tests: des de `www/phrasalverbs/`, `node --experimental-default-type=module --test tests/*.test.mjs`
- Servidor local: `php -S 0.0.0.0:8081 -t /mnt/disco/Iespai/www/phrasalverbs`
  (el port 8080 està ocupat per un altre servei del Pi).
- Al mòbil (a casa): `http://192.168.0.134:8081/`
- Des de fora: **https://pi.iespai.com/phrasalverbs/** (àlies d'Apache al Pi, serveix directament
  `www/phrasalverbs`; afegit el 2026-11-25). Ara també es veuen `docs/`, `tests/` i `AGENTS.md`:
  no s'han de pujar a producció.
- Opencode no pot fer proves de navegador al Pi. **Les proves visuals les fa l'Oscar.**

## ⏭️ Pas següent: encàrrec per a opencode (subfase 3A: API del rànquing)

La Fase 3 del pla es divideix en **3A** (servidor, tot provable amb tests) i **3B** (pantalles
Inicials i Rànquing, client). Ara només la 3A.

```
Projecte: www/phrasalverbs/. Llegeix www/phrasalverbs/AGENTS.md, www/phrasalverbs/docs/PLA.md
(§7, §8 i la Fase 3 de §10) i www/phrasalverbs/docs/ESTAT.md.

La Fase 3 es fa en dues parts. Ara fes NOMÉS la 3A: el servidor i el filtre. No toquis cap
pantalla ni index.html (això és la 3B).

1. api/ranking.php: un sol fitxer, exactament com §7 (taules, endpoints inici/guardar/top,
   validacions en aquest ordre, codis d'error, 405/400, cos ≤ 1 KB, PDO amb consultes
   preparades, Europe/Madrid, cap IP ni user-agent desats).
   - La ruta de la base de dades és api/dades/ranking.db, però si existeix la variable
     d'entorn PHRASAL_DB, fes servir aquesta (només per als tests).
   - Crea api/dades/ si no existeix, i les taules si no existeixen.
   - top: setmana = des del dilluns a les 00:00 hora de Madrid; empat → primer el més antic.
   - guardar: posicioSetmana i posicioSempre amb el mateix criteri d'empat que el top.
   - Ha de funcionar a Aruba (hosting compartit, sense mod_rewrite): res de rutes amigables,
     només ?accio=.
2. api/dades/.htaccess exactament com §7.3. Afegeix api/dades/*.db al .gitignore.
3. js/paraulotes.js: export function teParaulota(inicials) amb la llista de §8, la mateixa que
   ranking.php. Normalitza (majúscules i sense accents) abans de comprovar.
   Exporta també export function normalitzaInicials(text): majúscules, sense accents
   (À→A, Ç→C, Ñ→N...), només A-Z, màxim 5 lletres. La farà servir la 3B.

Tests obligatoris (tests/fase3a.test.mjs, amb node:test, sense dependències):
- el test arrenca php -S 127.0.0.1:8082 -t www/phrasalverbs amb PHRASAL_DB apuntant a un fitxer
  dins tests/tmp/ (afegeix tests/tmp/ al .gitignore), l'atura en acabar i esborra la base;
- per simular el pas del temps, modifica partides.inici directament a la base amb
  php -r (PDO) en lloc d'esperar 20 s;
- inici retorna un token de 32 hex;
- PUTO i XFUCK → inicials_invalides (servidor) i teParaulota(...) === true (client);
- òscar → normalitzaInicials('òscar') === 'OSCAR'; 'a1b-c' → 'ABC'; 'abcdefg' → 'ABCDE';
- un token només es pot fer servir una vegada (el 2n cop → token_invalid);
- punts 99999 → punts_invalids; punts > encerts × 60 → punts_invalids;
  encerts > temps × 2 → punts_invalids;
- guardar abans de 20 s → temps_invalid; després de 15 min → temps_invalid;
- GET a guardar → 405; accio=xyz → 400; cos de més d'1 KB → error;
- top setmana i sempre: màxim 10, ordenat, empats amb el més antic primer, i una puntuació de
  la setmana passada surt a sempre però no a setmana;
- la llista de paraulotes de js/paraulotes.js i la de api/ranking.php són idèntiques
  (llegeix els dos fitxers i compara-les).

No posis ?v= nou a index.html (no el toques). No facis commits ni desplegaments.
Executa tots els tests (els 69 d'abans també han de passar), actualitza docs/ESTAT.md i atura't.
```

Després de la 3A: Claude revisa i prova l'API a https://pi.iespai.com/phrasalverbs/api/ranking.php
(inclòs que `api/dades/ranking.db` no es pugui descarregar; **només des del Pi o localhost**, per
no activar el fail2ban). Després, l'encàrrec de la 3B.

## 📌 Pendents fora del codi

- Decidir si s'hi afegeix analítica (GA4 o cap).
- Enllaçar Phrasal Hero des d'algun lloc d'iespai.com quan estigui publicat.
- El projecte és al repo d'Iespai (des del commit `0fd6955`). Decidir si més endavant va a un
  repo propi (com Sender).
