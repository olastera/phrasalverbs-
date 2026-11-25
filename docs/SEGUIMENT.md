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
| **2D** | Game Over complet, progrés, so i vibració | ⏳ **Encàrrec preparat** (vegeu a sota) |
| 3 | Rànquing arcade (API PHP + SQLite, inicials, filtre) | ⬜ |
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

## 🧪 Com provar

- Tests: des de `www/phrasalverbs/`, `node --experimental-default-type=module --test tests/*.test.mjs`
- Servidor local: `php -S 0.0.0.0:8081 -t /mnt/disco/Iespai/www/phrasalverbs`
  (el port 8080 està ocupat per un altre servei del Pi).
- Al mòbil (a casa): `http://192.168.0.134:8081/`
- Des de fora: **https://pi.iespai.com/phrasalverbs/** (àlies d'Apache al Pi, serveix directament
  `www/phrasalverbs`; afegit el 2026-11-25). Ara també es veuen `docs/`, `tests/` i `AGENTS.md`:
  no s'han de pujar a producció.
- Opencode no pot fer proves de navegador al Pi. **Les proves visuals les fa l'Oscar.**

## ⏭️ Pas següent: encàrrec per a opencode (subfase 2D)

```
Projecte: www/phrasalverbs/. Llegeix www/phrasalverbs/AGENTS.md, www/phrasalverbs/docs/PLA.md
(§4.4, §5.4, §5.5, §6 i la subfase 2D de §10) i www/phrasalverbs/docs/ESTAT.md.

Fes la subfase 2D del pla: Game Over complet, efectes al progrés, so i vibració.

1. Game Over (§4.4):
   - Comptador animat dels punts finals (de 0 al total en ~1 s; si prefers-reduced-motion,
     el número directament). Encerts, errors i millor ratxa 🔥.
   - "🆕 NOU RÈCORD PERSONAL!" amb confeti si els punts superen el millor de estat.records
     (i són > 0). Compara amb el rècord d'ABANS de desar la partida.
   - Llista dels phrasals fallats en aquesta partida (sense repetits), amb el significat.
     Si no n'hi ha cap, un missatge positiu.
   - "📚 Repassar els fallats": comença un repàs només amb aquests ids (iniciaRepas ja té
     comenca(ids); exposa el que calgui). Amagat si no hi ha fallats.
   - "🏆 Guardar al rànquing": de moment només l'avís "Properament" (és la Fase 3).
2. Progrés (§5.4 i §6), tot a través de js/progres.js:
   - Cada error al joc: el phrasal va a la caixa 1 (actualitzaLeitner amb encert = false).
   - Els encerts al joc NO canvien la caixa.
   - En acabar: afegeixRecord (top 5, format de §6), estadistiques (partides, encerts, errors),
     registraActivitat (ratxa de dies) i desar.
   - El resum de l'Inici (🔥 Rècord, ratxa) s'actualitza en tornar-hi, sense recarregar.
   - Llegeix sempre estat en el moment (mai una còpia guardada en iniciar el joc: mira com es
     passa ara el leitner a iniciaJoc).
3. So i vibració (§5.5): nou fitxer js/so.js amb Web Audio (OscillatorNode, sense fitxers):
   encert, error, pujada de multiplicador (arpegi) i game over (descendent).
   - Crea/reprèn l'AudioContext dins d'un gest de l'usuari (cal per a iPhone).
   - Si estat.so és false, cap so. Si Web Audio no existeix, no peta.
   - navigator.vibrate(80) en fallar, només si existeix i el so està activat.
   - El joc rep el so per paràmetre (com rellotge i aleatori) perquè els tests puguin
     comprovar les crides sense Web Audio.
4. El botó "🎮 Ara, a jugar!" del resum del repàs porta a #joc.

Tests obligatoris (tests/fase2d.test.mjs), a més dels criteris d'acceptació 2D del pla:
- en fallar, el phrasal queda a caixa 1; en encertar, la caixa no canvia;
- en acabar, records (màx. 5, ordenats), estadistiques i ratxaDies s'actualitzen;
- nou rècord només si supera l'anterior; no amb el mateix valor ni amb 0 punts;
- llista de fallats sense repetits i "Repassar els fallats" amb exactament aquests ids;
- amb so = false no es crida cap so ni vibració; sense AudioContext ni vibrate no peta.

Afegeix js/so.js als imports amb ?v=8 i puja la versió a ?v=8 a tot arreu. No facis commits.
Executa tots els tests (els 53 d'abans també han de passar), actualitza docs/ESTAT.md i atura't.
```

Després de la 2D: provar al mòbil a https://pi.iespai.com/phrasalverbs/ (so, vibració, rècord
i fallats), enganxar a Claude que ha acabat per a la revisió i, si tot va bé, passar a la Fase 3.

## 📌 Pendents fora del codi

- Decidir si s'hi afegeix analítica (GA4 o cap).
- Enllaçar Phrasal Hero des d'algun lloc d'iespai.com quan estigui publicat.
- El projecte és al repo d'Iespai (des del commit `0fd6955`). Decidir si més endavant va a un
  repo propi (com Sender).
