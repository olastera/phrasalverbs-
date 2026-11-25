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
| **4B** | Poliment: frases i emojis aleatoris al joc, "+N" volant, confeti en pujar multiplicador | ✅ Feta, revisada i provada al mòbil (commit `103eed4`) |
| **5** | PWA (manifest, service worker, icones) | ✅ Feta, revisada i provada al mòbil (commit `e12e6ff`) |
| **6** | Script `deploy-phrasalverbs.sh` (el desplegament el fa l'Oscar) | ✅ Feta i **desplegada** el 2026-11-25 (26 fitxers, 6/6 comprovacions HTTP OK); provada al mòbil a producció |
| **7** | Diccionari 📖: cerca ca/en, filtres, fitxa, ⭐, 🔊 pronunciació, 🔗 semblants, "Repassa aquests" | ⏭️ **Encàrrec preparat** (vegeu a sota) |
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

- Icones (5): Pillow no llegeix `.woff2` i va caure a la font per defecte → "P" blanca i deformada.
  **Solució (Claude):** la "P" es dibuixa en pixel-art amb rectangles a `tools/gen_icones.py`.

## 🧪 Com provar

- Tests: des de `www/phrasalverbs/`, `node --experimental-default-type=module --test tests/*.test.mjs`
- Servidor local: `php -S 0.0.0.0:8081 -t /mnt/disco/Iespai/www/phrasalverbs`
  (el port 8080 està ocupat per un altre servei del Pi).
- Al mòbil (a casa): `http://192.168.0.134:8081/`
- Des de fora: **https://pi.iespai.com/phrasalverbs/** (àlies d'Apache al Pi, serveix directament
  `www/phrasalverbs`; afegit el 2026-11-25). Ara també es veuen `docs/`, `tests/` i `AGENTS.md`:
  no s'han de pujar a producció.
- Opencode no pot fer proves de navegador al Pi. **Les proves visuals les fa l'Oscar.**

## ⏭️ Pas següent: encàrrec per a opencode (fase 7: Diccionari)

Decidit a 2026-11-25 (6 desplegada i provada al mòbil): diccionari **només de phrasals**, amb tots
els extres (⭐ i caixa, "Repassa aquests", 🔗 semblants i 🔊 pronunciació). Disseny complet a
`docs/PLA.md` §10 Fase 7.

```
Projecte: www/phrasalverbs/. Llegeix AGENTS.md, docs/PLA.md (§1, §2, §4.2, §6, §9 i §10 Fase 7)
i docs/ESTAT.md.
NO toquis api/, js/paraulotes.js, js/ranking.js ni contingut/*.json.
No canviïs cap regla de joc ni com funciona Repassar. No facis commits ni desplegaments.

Fes la fase 7: Diccionari, exactament com diu docs/PLA.md §10 Fase 7:
- pantalla #diccionari i botó "📖 Diccionari" a l'Inici;
- js/diccionari.js amb normalitza(), cercaPhrasals() i semblants() exportades (pures) i la part
  de DOM;
- xips de filtre reaprofitats de Repassar i plegats sota "🎛️ Filtres";
- llista amb la caixa Leitner, fitxa desplegable amb ⭐, 🔊 (speechSynthesis), 🔗 semblants;
- botó "📚 Repassa aquests" (màxim 20, ordenaPerLeitner) que obre Repassar amb aquests ids;
- tot a ?v=16, memòria cau phrasalhero-v16 i js/diccionari.js a la llista de sw.js.
Res de innerHTML amb text de l'usuari. Ha de quedar bé a 360 px.

Tests obligatoris: tests/fase7.test.mjs amb tots els criteris d'acceptació de la Fase 7.
Executa tots els tests (els 158 d'abans també han de passar, posant-los a ?v=16), actualitza
docs/ESTAT.md i atura't.
```

Després de la 7: revisió de Claude → prova de l'Oscar a https://pi.iespai.com/phrasalverbs/
(cerca, filtres, fitxa, ⭐, 🔊, 🔗, "Repassa aquests", 360 px, mode avió) → commit →
`./deploy-phrasalverbs.sh` → `git push`.

## 📌 Pendents fora del codi

- Decidir si s'hi afegeix analítica (GA4 o cap).
- Enllaçar Phrasal Hero des d'algun lloc d'iespai.com quan estigui publicat.
- El projecte és al repo d'Iespai (des del commit `0fd6955`). Decidir si més endavant va a un
  repo propi (com Sender).
