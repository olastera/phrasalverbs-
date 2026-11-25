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
| **3B** | Pantalles Inicials i Rànquing, token a cada partida, mode sense connexió | ⏳ **Encàrrec preparat** (vegeu a sota) |
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

## ⏭️ Pas següent: encàrrec per a opencode (subfase 3B: pantalles del rànquing)

```
Projecte: www/phrasalverbs/. Llegeix www/phrasalverbs/AGENTS.md, www/phrasalverbs/docs/PLA.md
(§4.4, §4.5, §4.6, §7.2, §8 i la Fase 3 de §10) i www/phrasalverbs/docs/ESTAT.md.
L'API (api/ranking.php) i js/paraulotes.js ja estan fets i revisats (3A): NO els modifiquis.

Fes la subfase 3B: la part del client del rànquing.

1. js/ranking.js: tota la comunicació amb l'API.
   - URL relativa 'api/ranking.php' (ha de funcionar a /phrasalverbs/ al Pi i a Aruba).
   - demanaToken(), guarda({token, inicials, punts, encerts}) i top(periode).
   - Cada crida amb un temps màxim de 5 s (AbortController). Si falla la xarxa o la resposta no
     és JSON, retorna {ok:false, error:'sense_connexio'}; no llancis mai excepcions.
   - top() afegeix &t=Date.now() a la URL: la memòria cau d'Aruba pot servir respostes velles.
   - fetch es rep per paràmetre (per als tests), per defecte globalThis.fetch.
2. Token a cada partida: en començar una partida nova (reinicia del joc), demana un token sense
   esperar-lo (el joc comença igualment). Guarda'l amb la partida. Si no arriba, la partida
   continua i ja no hi haurà token per a aquesta partida.
3. Game Over: "🏆 Guardar al rànquing" porta a #inicials amb el resultat d'aquesta partida
   (punts, encerts, token). Si la partida no té token, en lloc d'anar a #inicials mostra
   "📡 Sense connexió: la puntuació només s'ha guardat al teu dispositiu". Un cop guardada,
   el botó queda desactivat per a aquesta partida (i no es pot tornar a enviar).
4. Pantalla #inicials (§4.5), exactament com el pla: 5 caselles amb ▲▼, A→Z i _, casella activa
   que parpelleja (sense parpelleig si prefers-reduced-motion), input amagat per al teclat
   (usa normalitzaInicials de js/paraulotes.js), regles d'1 a 5 lletres sense buits al mig,
   precàrrega de estat.ultimesInicials.
   - En prémer ✅ OK: comprova teParaulota al client ("😇 Ups! Prova unes altres inicials",
     sense dir quina paraula) i, si passa, crida guarda(). Botó desactivat mentre s'envia
     (res de dobles enviaments).
   - Si ok: desa ultimesInicials (desaInicials + desa), "🏆 Ets el número N de la setmana!" i ves
     a #ranking, pestanya setmana, amb la teva fila ressaltada i parpellejant si és al top 10.
   - Errors del servidor amb missatge en català: inicials_invalides → el mateix "😇 Ups!...";
     temps_invalid → "⏱️ Aquesta partida ja no es pot guardar"; token_invalid → "✅ Aquesta
     partida ja estava guardada"; sense_connexio → el missatge 📡 del punt 3.
   - Si s'entra a #inicials sense una partida pendent de guardar, ves a #inici.
5. Pantalla #ranking (§4.6): pestanyes 📅 Aquesta setmana / 👑 De sempre, top 10 amb 🥇🥈🥉,
   inicials, punts i data dd/mm, estètica arcade amb scanlines CSS. A sota, "👤 Els teus rècords"
   (estat.records, top 5 local). Sense connexió: "📡 Sense connexió. Mostrem només els teus
   rècords". Llista buida: un missatge que convidi a ser el primer.
   - Afegeix 'inicials' i 'ranking' a PANTALLES. El botó 🏆 Rànquing de l'Inici (ara data-fase)
     porta a #ranking.
   - Les inicials i tot el que ve del servidor es pinten amb textContent (mai innerHTML).

Tests obligatoris (tests/fase3b.test.mjs, amb fetch simulat; no cal servidor real), a més dels
criteris d'acceptació de la Fase 3 del pla que siguin del client:
- ranking.js: sense xarxa, amb resposta no JSON o amb timeout → {ok:false,error:'sense_connexio'};
  top() porta &t= a la URL;
- una partida nova demana un token i el joc comença encara que el token no arribi mai;
- inicials: ▲ des de A → B, ▼ des de A → _, ▼ des de _ → Z; teclat 'òscar' → OSCAR;
  'A_B' no és vàlid; 'AB___' es guarda com 'AB'; es precarreguen ultimesInicials;
- PUTO al client mostra "😇 Ups!" i NO crida guarda();
- doble clic a OK → una sola crida a guarda();
- després de guardar bé, el botó Guardar del Game Over queda desactivat;
- cada codi d'error del servidor mostra el seu missatge;
- rànquing: 🥇🥈🥉 als tres primers, data dd/mm, fila pròpia ressaltada, i sense connexió es
  mostren només els rècords locals;
- unes inicials '<b>' que vinguin del servidor es mostren com a text.

Puja la versió a ?v=9 a tot arreu (imports inclosos). No facis commits ni desplegaments.
Executa tots els tests (els 93 d'abans també han de passar), actualitza docs/ESTAT.md i atura't.
```

Després de la 3B: provar al mòbil a https://pi.iespai.com/phrasalverbs/ (guardar una puntuació
de debò, el rànquing setmanal i el de sempre, i el mode avió per a l'avís sense connexió) i
avisar Claude per a la revisió. Les puntuacions de prova al Pi no van a producció (la base és
local, `api/dades/ranking.db`, i el deploy no la puja mai).

## 📌 Pendents fora del codi

- Decidir si s'hi afegeix analítica (GA4 o cap).
- Enllaçar Phrasal Hero des d'algun lloc d'iespai.com quan estigui publicat.
- El projecte és al repo d'Iespai (des del commit `0fd6955`). Decidir si més endavant va a un
  repo propi (com Sender).
