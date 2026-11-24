# 🦸 Phrasal Hero: pla de desenvolupament

> Document per a **opencode**. Llegeix-lo sencer abans de començar i segueix les fases en ordre.
> Cada fase s'ha d'acabar i comprovar (criteris d'acceptació) abans de passar a la següent.

---

## 0. Què fem i per a qui

**Phrasal Hero** és una web-app per memoritzar *phrasal verbs* anglesos de cara a l'examen d'anglès
de les **PAU** (2n de Batxillerat, Catalunya).

- **Públic:** adolescents de 17–18 anys. S'hi connecten sobretot des del **mòbil**.
- **Idioma de la interfície:** **català**. El contingut a aprendre és en anglès.
- **To:** desenfadat, de videojoc arcade. **Emojis a tope** 🔥🚀💥🏆.
- **Sense registre ni comptes.** El rànquing és com el de les màquines recreatives: quan acabes
  la partida, poses les inicials (màx. 5 lletres) i surts a la taula.
- **URL final:** `https://www.iespai.com/phrasalverbs/`

Té tres zones:

1. 📚 **Repassar:** targetes que es giren (flashcards) amb repetició espaiada (Leitner).
2. 🎮 **Jugar:** partida contrarellotge amb vides, ratxes i minijocs.
3. 🏆 **Rànquing:** taula compartida per a tothom (servidor), estil arcade.

El progrés de l'alumne es guarda al `localStorage` del navegador perquè pugui continuar
on ho havia deixat.

**Fora d'abast ara:** la secció de **connectors** (*however*, *moreover*...). Arribarà en una fase
posterior (vegeu §12), però el codi s'ha d'escriure pensant que hi haurà un segon conjunt de dades.

---

## 1. Restriccions tècniques (OBLIGATÒRIES)

- **HTML + CSS + JavaScript vanilla.** Res de React, Vue, Tailwind, jQuery, npm, bundlers ni
  passos de compilació. Els fitxers es pugen tal qual per FTP.
- JavaScript modern (ES2020) amb **mòduls ES** (`<script type="module">`).
- **Backend:** un sol fitxer PHP (`api/ranking.php`) amb **PDO SQLite**. PHP ≥ 8.0.
- **Hosting:** Aruba, allotjament compartit:
  - **No hi ha `mod_rewrite`.** No facis URL "boniques": crida `api/ranking.php?accio=...`.
  - El TLS acaba al proxy. **Fes servir sempre rutes relatives** (`./`, `api/...`), mai
    `http://` absoluts.
  - La memòria cau del proxy pot servir fitxers antics. Per això **posa versió als fitxers estàtics**
    (`js/app.js?v=1`, `css/estils.css?v=1`) i incrementa-la a cada canvi. L'API ha de respondre
    amb `Cache-Control: no-store`.
  - `.htaccess` sí que funciona per a `Require all denied`.
- **Tipografies:** Google Fonts està permès: `Press Start 2P` per a títols, marcadors i rànquing
  (estètica arcade) i `Nunito` per al text. Posa-hi sempre una alternativa (`system-ui`), perquè ha
  de funcionar sense connexió.
- **Res d'analítica ni de galetes** (Google Analytics, píxels...). Està pendent de decidir; de
  moment, res.
- **Sense dependències externes de JS.**
- Ha de funcionar bé en un mòbil de **360 px** d'amplada i també a l'ordinador.

---

## 2. Estructura de fitxers

```
www/phrasalverbs/
├── index.html              ← una sola pàgina (SPA) amb totes les pantalles
├── manifest.webmanifest    ← PWA (fase 5)
├── sw.js                   ← service worker (fase 5)
├── icon-192.png, icon-512.png, apple-touch-icon.png   (fase 5)
├── css/
│   └── estils.css
├── js/
│   ├── app.js              ← arrencada, navegació entre pantalles, so
│   ├── dades.js            ← carrega contingut/phrasals.json i ofereix utilitats
│   ├── progres.js          ← tot el que toca localStorage (únic lloc que hi accedeix)
│   ├── repas.js            ← pantalla Repassar (flashcards + Leitner)
│   ├── preguntes.js        ← funcions pures: preguntes, distractors, punts (testables)
│   ├── joc.js              ← pantalla de joc: DOM, rellotge, animacions, so
│   ├── ranking.js          ← inicials, crides a l'API, taula
│   └── paraulotes.js       ← filtre d'inicials (mateixa llista que el PHP)
├── contingut/
│   └── phrasals.json       ← ⚠️ JA EXISTEIX. NO EL MODIFIQUIS.
├── api/
│   ├── ranking.php
│   └── dades/
│       ├── .htaccess       ← Require all denied
│       └── (ranking.db es crea sol la primera vegada)
├── AGENTS.md               ← instruccions curtes per a opencode (no es puja)
└── docs/PLA.md             ← aquest document (no es puja)
```

---

## 3. Dades: `contingut/phrasals.json`

**Ja està fet i revisat (161 phrasal verbs de nivell PAU). No el toquis, no l'ampliïs i no el
"corregeixis".** Si creus que hi ha un error, anota'l a `docs/DUBTES.md`.

```json
{
  "versio": 1,
  "phrasals": [
    {
      "id": "put-off",
      "phrasal": "put off",
      "verb": "put",
      "particula": "off",
      "sinonim": "postpone",
      "significat": "ajornar, deixar per a més tard",
      "exemple": "Stop putting off your homework!",
      "exempleMarcat": "Stop **putting off** your homework!",
      "forat": "Stop putting ___ your homework!",
      "traduccio": "Deixa d'ajornar els deures!",
      "tema": "estudis",
      "nivell": 1
    }
  ]
}
```

| Camp | Significat |
|---|---|
| `id` | identificador únic (clau al localStorage) |
| `phrasal` | el phrasal verb complet |
| `verb` | verb base (`get`, `take`, `put`...) |
| `particula` | una o més paraules (`up`, `out of`, `up with`) |
| `sinonim` | equivalent en anglès d'una paraula o expressió curta (per al minijoc "Substitueix") |
| `significat` | significat en català |
| `exemple` | frase d'exemple en anglès |
| `exempleMarcat` | el mateix exemple amb el phrasal marcat amb `**`. Si el verb i la partícula van separats, hi ha dos blocs: `My dad **drops** me **off** at school`. **Fes-lo servir per posar el phrasal en negreta:** parteix per `**` i els trossos senars van en negreta. No calculis el ressaltat amb regex. |
| `similars` | ids dels phrasals amb un significat gairebé igual (`carry on` ↔ `go on`, `keep on`). **Mai no poden sortir com a distractors d'aquest phrasal**, en cap minijoc. |
| `particulesProhibides` | partícules que **mai** no poden sortir com a distractor d'aquest phrasal al minijoc B: les que formen un altre phrasal amb el mateix verb (de les dades o de l'anglès real, com *get off*) i les dels `similars`. |
| `forat` | la mateixa frase amb la partícula substituïda per `___` (un `___` per paraula) |
| `traduccio` | traducció al català de l'exemple |
| `tema` | `quotidia`, `relacions`, `estudis`, `feina`, `problemes`, `comunicacio`, `moviment`, `diners`, `salut`, `sentiments`, `tecnologia` |
| `nivell` | 1 (fàcil), 2 (mitjà) o 3 (difícil) |

Etiquetes per mostrar els temes (amb emoji):

```js
const TEMES = {
  quotidia: '🏠 Dia a dia', relacions: '💞 Relacions', estudis: '📖 Estudis',
  feina: '💼 Feina', problemes: '🚨 Problemes', comunicacio: '💬 Comunicació',
  moviment: '✈️ Moviment', diners: '💸 Diners', salut: '🩺 Salut',
  sentiments: '🥹 Sentiments', tecnologia: '📱 Tecnologia'
};
```

`dades.js` ha d'estar escrit de manera genèrica (`carregaConjunt('phrasals')`), perquè més endavant
hi haurà un `connectors.json`.

---

## 4. Pantalles

Una sola pàgina amb `<section>` per pantalla. Només n'hi ha una de visible alhora. La navegació es
fa amb `location.hash` (`#inici`, `#repas`, `#joc`, `#gameover`, `#inicials`, `#ranking`,
`#progres`), perquè el botó "enrere" del mòbil funcioni.

### 4.1 🏠 Inici (`#inici`)
- Logotip de text: **🦸 PHRASAL HERO** en `Press Start 2P`, amb un efecte neó que parpelleja.
- Subtítol: "Domina els phrasal verbs per a la PAU 💪".
- Tres botons grans:
  - 📚 **Repassar**
  - 🎮 **Jugar** (el més destacat, i que bategui suaument)
  - 🏆 **Rànquing**
- A sota, un resum del progrés: "🧠 Dominats: 23/161 · 🔥 Rècord: 1.250 · 📅 Ratxa: 4 dies".
  En tocar-lo s'obre `#progres`.
- Botó 🔊/🔇 per activar o silenciar el so (a la capçalera, a totes les pantalles).

### 4.2 📚 Repassar (`#repas`)
**Pas 1, triar què repasses:**
- Xips de filtre: **Tots** · **⭐ Els meus** · **😵 Els que fallo** · per **verb base** (`get`,
  `take`, `put`, `look`, `turn`, `come`... ordenats per quantitat) · per **tema** · per **nivell**.
- Botó "▶️ Comença (20 targetes)".

**Pas 2, targetes:**
- Una targeta gran al centre. **Cara davantera:** el phrasal verb en gran (`put off`) i a sota
  `forat` com a pista. **Cara posterior** (gir 3D en tocar): significat, sinònim, exemple amb el
  phrasal en **negreta** de color, traducció i etiqueta del tema.
- Sota la targeta (només quan està girada), dos botons:
  - ❌ **Encara no** (vermell)
  - ✅ **Me'l sé** (verd)
- Botó ⭐ a la cantonada per marcar o desmarcar el phrasal com a preferit.
- Barra de progrés: "7/20".
- Amb el teclat: `Espai` gira, `←` encara no, `→` me'l sé.
- En acabar: pantalla de resum: "🎉 Sessió acabada! ✅ 14 · ❌ 6" i botons "🔁 Repassa els ❌"
  i "🎮 Ara, a jugar!".
- Si l'alumne surt a mitja sessió, es guarda (vegeu §6) i en tornar surt: "Tens una sessió a mitges
  (7/20). ▶️ Continuar / 🆕 Nova".

### 4.3 🎮 Jugar (`#joc`)
Vegeu les regles a §5. A la pantalla s'hi veu:
- A dalt: ❤️❤️❤️ (vides), ⏱️ temps (barra que s'escurça; es posa vermella i bateguen els últims
  10 s), 💰 punts.
- Indicador de ratxa: "🔥 x2", que creix i canvia de color en pujar de multiplicador.
- La pregunta al centre i 4 botons de resposta grans (2×2 al mòbil).
- Animació en encertar (el botó es posa verd, "+20" que surt volant, confeti 🎉 quan puja el
  multiplicador) i en fallar (sacseig, vermell, 💔, i **es mostra la resposta correcta durant
  1,5 s**: és important per aprendre).

### 4.4 💀 Game Over (`#gameover`)
- "💀 GAME OVER" (o "⏰ TEMPS!") en arcade.
- Punts finals amb un comptador animat, encerts, errors, millor ratxa 🔥.
- "🆕 NOU RÈCORD PERSONAL!" si toca (amb confeti).
- **Llista dels phrasals que has fallat**, amb el significat (repàs ràpid).
- Botons: 🏆 **Guardar al rànquing** (porta a `#inicials`) · 🔁 **Tornar a jugar** · 📚
  **Repassar els fallats** (obre Repassar amb aquest filtre).

### 4.5 🕹️ Entrar inicials (`#inicials`)
La pantalla clàssica de recreativa:
- "ENTER YOUR NAME" i a sota "Posa les teves inicials".
- **5 caselles** grans en `Press Start 2P`. Cada casella té ▲ a sobre i ▼ a sota per canviar la
  lletra (A→Z, i `_` = buit). La casella activa parpelleja.
- També s'hi pot escriure directament amb el teclat (input amagat). Només s'accepta A‑Z; les
  minúscules passen a majúscules i els accents es treuen (`À`→`A`, `Ç`→`C`, `Ñ`→`N`).
- Regles: d'1 a 5 lletres i sense buits al mig. Els `_` del final s'ignoren.
- Es precarreguen les últimes inicials que s'han fet servir (localStorage).
- Si el filtre de paraulotes les rebutja: "😇 Ups! Prova unes altres inicials" (sense dir quina
  paraula).
- Botó ✅ **OK**. En guardar: "🏆 Ets el número 7 de la setmana!" i es va a `#ranking` amb la teva
  fila ressaltada i parpellejant.

### 4.6 🏆 Rànquing (`#ranking`)
- Dues pestanyes: **📅 Aquesta setmana** (de dilluns a diumenge, hora de Madrid) i **👑 De sempre**.
- Top 10: posició (🥇🥈🥉 per als tres primers, i 4–10 en número), inicials, punts, data (`dd/mm`).
  Estètica de pantalla arcade: fons negre, text de colors, línies de vídeo antic (scanlines) amb CSS.
- A sota, "👤 Els teus rècords" (local): els 5 millors resultats d'aquest dispositiu.
- Si no hi ha connexió: "📡 Sense connexió. Mostrem només els teus rècords".

### 4.7 📊 Progrés (`#progres`)
- Gràfic de barres simple (CSS, sense llibreries) amb les caixes Leitner: 🆕 Nous · 😵 Caixa 1 ·
  🤔 Caixa 2 · 🧠 Caixa 3 (dominats).
- Progrés per verb base (`get` 5/12...).
- Botó "🗑️ Esborrar el meu progrés", amb confirmació dins la pàgina (un modal propi; **res
  d'`alert()` ni `confirm()`**).

---

## 5. Regles del joc

### 5.1 Partida
- Duració: **90 segons**. Vides: **3** ❤️. La partida s'acaba quan s'acaba el temps o les vides.
- Les preguntes van sortint una darrere l'altra, sense pausa (excepte els 1,5 s de correcció quan
  falles; durant aquest temps **el rellotge s'atura**).
- No es repeteix cap phrasal dins de la mateixa partida (excepte si s'han esgotat).
- **Dificultat progressiva:** preguntes 1–5: només nivell 1; 6–15: nivells 1–2; a partir de la 16:
  nivells 1–3.
- Els phrasals que l'alumne té a la **caixa 1** (els que falla) hi surten amb més freqüència
  (un 30 % de les preguntes, si n'hi ha).

### 5.2 Minijocs (tipus de pregunta, barrejats a l'atzar)

**A) 🤔 Què vol dir?**
- Es mostra el `phrasal` (`run out of`) i 4 opcions de `significat` en català.
- Distractors: significats d'altres phrasals. A partir del nivell 2, prioritza **el mateix verb base**
  (és més difícil: `run into`, `run away`, `run over`).

**B) 🧩 Completa la frase** (el que més s'assembla a l'examen)
- Es mostra `forat` ("We've run ___ ___ milk.") i la traducció en petit a sota.
- 4 opcions de partícula (`out of`, `away with`, `down on`, `up for`).
- Distractors: altres valors de `particula` **amb el mateix nombre de paraules**.
- ⚠️ **Prohibit** fer servir com a distractor qualsevol partícula de `particulesProhibides`. Inclou,
  entre altres, qualsevol partícula que, amb el mateix verb, formi un altre
  phrasal del JSON (si la resposta és `put off`, no pots oferir `away`, perquè `put away` existeix i
  podria semblar correcte).

**C) 🔁 Substitueix** (*rewrite* de la PAU)
- Es mostra: "Quin phrasal vol dir **postpone**?" (`sinonim`).
- 4 opcions de `phrasal`. Distractors preferentment del **mateix verb base**
  (`put up`, `put on`, `put away`).
- ⚠️ Alguns `sinonim` es repeteixen (`return`, `continue`, `relax`...). **Cap distractor no pot
  tenir el mateix `sinonim` que la resposta correcta.**

**D) ⚡ Ronda bonus: Parelles** (cada 8 preguntes)
- 5 phrasals a l'esquerra i 5 significats a la dreta, barrejats. Toques un de cada costat per
  aparellar-los. Tens 15 s.
- Cada parella correcta suma punts; un error resta una vida.
- Durant la ronda bonus, el rellotge principal s'atura.

**Regla general de distractors:** cap distractor no pot ser un phrasal de la llista `similars` de la
resposta correcta (en el minijoc A, tampoc el seu significat). Les 4 opcions han de ser **diferents** entre elles (no hi pot
haver dos textos iguals) i la posició de la correcta ha de ser aleatòria.

### 5.3 Puntuació
- Encert: **10 punts × multiplicador**.
- **Bonus de velocitat:** +5 (abans de multiplicar) si contestes en menys de 3 s. No s'aplica a
  Parelles.
- Multiplicador segons la ratxa d'encerts seguits:

  | Ratxa | Multiplicador |
  |---|---|
  | 0–2 | ×1 |
  | 3–5 | ×2 🔥 |
  | 6–9 | ×3 🔥🔥 |
  | 10+ | ×4 🔥🔥🔥 |

- Error: −1 ❤️, la ratxa torna a 0 i no resta punts.
- **Màxim per encert: (10+5)×4 = 60 punts.** El servidor ho fa servir per validar.
- `encerts` = nombre de respostes correctes (en Parelles, cada parella compta com un encert).

### 5.4 Efecte del joc al progrés
- Cada error al joc posa aquell phrasal a la **caixa 1** de Leitner.
- Els encerts al joc **no** pugen de caixa (només el repàs ho fa).
- Es desa el rècord personal i els 5 millors resultats locals.

### 5.5 So i vibració
- Sons curts generats amb **Web Audio API** (`OscillatorNode`, sense fitxers d'àudio): encert (to
  agut curt), error (to greu), pujada de multiplicador (arpegi), game over (descendent).
- `navigator.vibrate(80)` en fallar, si està disponible.
- El botó 🔊/🔇 es desa al localStorage. Per defecte, **activat**.

---

## 6. `localStorage` (només a `js/progres.js`)

Tot sota **una sola clau**, amb versió:

```js
// clau: "phrasalhero:v1"
{
  "versio": 1,
  "leitner": { "put-off": { "caixa": 2, "vist": "2026-11-24" } },  // caixa 1..3; si no hi és = nou
  "preferits": ["put-off", "give-up"],
  "repasEnCurs": { "ids": ["put-off", "..."], "index": 7, "ok": 5, "ko": 2, "filtre": "verb:put" },  // o null
  "records": [ { "punts": 1250, "encerts": 31, "data": "2026-11-24T18:03:00" } ],  // top 5 local
  "ultimesInicials": "OSCAR",
  "so": true,
  "ratxaDies": { "ultimDia": "2026-11-24", "dies": 4 },
  "estadistiques": { "partides": 12, "encerts": 300, "errors": 80 }
}
```

- **Leitner:** "Me'l sé" → `caixa = min(caixa+1, 3)` (si era nou → 2). "Encara no" → `caixa = 1`.
- **Ordre de les targetes en una sessió de repàs:** primer caixa 1, després els nous, després la
  caixa 2 i, per acabar, la caixa 3 (que només hi surt si no n'hi ha prou dels altres). Dins de
  cada grup, a l'atzar.
- **Dominat** = caixa 3.
- **Ratxa de dies:** si avui l'alumne ha repassat o jugat i l'últim dia va ser ahir → +1; si va ser
  avui → no canvia; si no → 1.
- **Totes les lectures i escriptures dins `try/catch`.** Si el localStorage no funciona (navegació
  privada), l'app ha de funcionar igualment, sense guardar res.
- Si la `versio` desada no coincideix → migrar (o, en aquesta v1, començar de zero).
- La partida en curs **no** es desa (és arcade: si tanques, la perds). El que sí que es desa és la
  sessió de repàs a mitges.

---

## 7. API del rànquing: `api/ranking.php`

Un sol fitxer. Totes les respostes són JSON (`Content-Type: application/json; charset=utf-8`) amb
`Cache-Control: no-store`. Format: `{"ok": true, ...}` o `{"ok": false, "error": "codi"}`.

### 7.1 Base de dades (SQLite a `api/dades/ranking.db`, es crea si no existeix)

```sql
CREATE TABLE IF NOT EXISTS puntuacions (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  inicials  TEXT    NOT NULL,          -- ^[A-Z]{1,5}$
  punts     INTEGER NOT NULL,
  encerts   INTEGER NOT NULL,
  creat     TEXT    NOT NULL           -- 'YYYY-MM-DD HH:MM:SS', hora Europe/Madrid
);
CREATE INDEX IF NOT EXISTS idx_punts ON puntuacions(punts DESC);
CREATE INDEX IF NOT EXISTS idx_creat ON puntuacions(creat);

CREATE TABLE IF NOT EXISTS partides (
  token  TEXT PRIMARY KEY,             -- 32 caràcters hex aleatoris
  inici  INTEGER NOT NULL,             -- timestamp UNIX
  usat   INTEGER NOT NULL DEFAULT 0
);
```

**Privacitat:** **no es desa cap IP**, ni user-agent, ni cap altra dada. Només inicials, punts,
encerts i data.

### 7.2 Endpoints

**`POST api/ranking.php?accio=inici`** → abans de començar cada partida.
- Crea un token (`bin2hex(random_bytes(16))`), el desa a `partides` amb `inici = time()`.
- De passada, esborra les partides de fa més d'1 dia.
- Resposta: `{"ok":true,"token":"..."}`.
- Si falla (no hi ha connexió), el client deixa jugar igualment, però en acabar només pot desar el
  resultat en local ("📡 Sense connexió: la puntuació només s'ha guardat al teu dispositiu").

**`POST api/ranking.php?accio=guardar`** amb cos JSON:
`{"token":"...","inicials":"OSCAR","punts":1250,"encerts":31}`

Validacions (si alguna falla → `ok:false` amb codi d'error):
1. El token existeix i `usat = 0` → si no, `token_invalid`.
2. `temps = time() - inici`. Ha de ser entre **20 s** i **15 min** → `temps_invalid`.
3. `inicials` compleix `^[A-Z]{1,5}$` → `inicials_invalides`.
4. `inicials` no conté cap paraula de la llista de paraulotes (§8) → `inicials_invalides`.
5. `punts` i `encerts` són enters ≥ 0. `punts ≤ encerts × 60`, `punts ≤ 20000` i
   `encerts ≤ temps × 2` → `punts_invalids`.
6. Si tot és correcte: marca el token com a usat, insereix la puntuació i calcula la posició setmanal.

Resposta: `{"ok":true,"posicioSetmana":7,"posicioSempre":42}`.

**`GET api/ranking.php?accio=top&periode=setmana|sempre`**
- Retorna el top 10: `{"ok":true,"llista":[{"pos":1,"inicials":"MARTA","punts":2310,"data":"2026-11-24"}]}`.
- `setmana` = des del dilluns d'aquesta setmana a les 00:00 (hora de Madrid).
- En cas d'empat de punts, va primer el més antic (el primer que ho va aconseguir).

### 7.3 Seguretat
- **Sempre consultes preparades (PDO)**, mai concatenar.
- `date_default_timezone_set('Europe/Madrid')`.
- Mètode incorrecte → 405. `accio` desconeguda → 400.
- Mida màxima del cos: 1 KB.
- La carpeta `api/dades/` té un `.htaccess` amb:
  ```apache
  <IfModule mod_authz_core.c>
    Require all denied
  </IfModule>
  <IfModule !mod_authz_core.c>
    Order deny,allow
    Deny from all
  </IfModule>
  ```
- **El client no s'ha de fiar de res i el servidor tampoc:** la validació de §7.2 és la protecció
  principal. No cal fer-ho més complicat (és un joc d'institut, no un banc).

---

## 8. Filtre de paraulotes (`js/paraulotes.js` i dins `ranking.php`)

La mateixa llista als dos llocs. Es comprova si les inicials **contenen** alguna d'aquestes
cadenes (en majúscules, sense accents):

```
PUTA PUTO PUTE MERD MIERD POLLA CONYO CULO CAGAR FOLLA FOTRE CABRO MARIC MAMON
PENE TETA ZORRA GUARR NAZI HITLR FUCK SHIT DICK COCK CUNT PUSSY BITCH NIGG FAG
SEX PORN ASS
```

(`ASS` també bloqueja inicials innocents com `CASSA`. Ho acceptem: és el preu de la simplicitat.)

---

## 9. Disseny visual

**Estil:** neó arcade dels 80 + app mòbil actual. Fons fosc, colors elèctrics, cantonades
arrodonides, ombres de neó (`box-shadow` / `text-shadow` amb el color), molta animació curta.

```css
:root {
  --fons: #120a2e;        /* lila molt fosc */
  --fons-2: #1d1147;      /* targetes */
  --rosa: #ff2e97;        /* principal */
  --cian: #00e5ff;        /* secundari */
  --groc: #ffe14d;        /* punts, rècords */
  --verd: #39ff88;        /* encert */
  --vermell: #ff4d6d;     /* error, vides */
  --text: #f4f1ff;
  --text-suau: #a89cd6;
  --radi: 18px;
}
```

- Fons amb un degradat suau i alguns emojis/estrelles flotant lentament (CSS, `opacity` baixa).
- Botons grans (mínim **48 px** d'alt), amb efecte de "prémer" (`transform: scale(.96)`).
- Títols i marcadors en `Press Start 2P`; la resta, en `Nunito` (pes 700–900).
- **Emojis per tot arreu:** a cada botó, a cada missatge, als encerts (🎯🔥💥🚀🤩) i als errors
  (💔😵🙈). Tria'ls a l'atzar d'una llista perquè variïn.
- **Frases d'ànim aleatòries** en català informal, per exemple:
  - Encert: "Brutal! 🔥", "Ets una màquina! 🤖", "Boom! 💥", "Imparable! 🚀", "Crack! 😎"
  - Error: "Uf, per poc! 🙈", "La pròxima és teva 💪", "Apunta-te-la! 📝"
  - Game over: "Bona partida! 👏", "La PAU tremola 😤", "Torna-hi, que tu pots! 💪"
- Confeti fet amb divs i CSS (sense llibreria).
- Respecta `prefers-reduced-motion: reduce`: treu el parpelleig, el confeti i les animacions grans.
- **Accessibilitat mínima:** contrast suficient, `aria-live="polite"` per al resultat de cada
  resposta, botons de debò (`<button>`), focus visible i `lang="ca"` a l'`<html>`. Els textos en
  anglès han d'anar dins `<span lang="en">`.
- Res de `alert()`, `confirm()` ni `prompt()`: sempre modals propis.

---

## 10. Fases de desenvolupament

> Després de cada fase: prova-ho en local amb
> `php -S 0.0.0.0:8081 -t /mnt/disco/Iespai/www/phrasalverbs` i obre `http://localhost:8081/`.
> Comprova la consola del navegador: **0 errors**.

### Fase 1: Esquelet i repàs 📚
- `index.html`, `css/estils.css`, `js/app.js`, `js/dades.js`, `js/progres.js`, `js/repas.js`.
- Pantalles: Inici, Repassar (filtres + targetes + resum), Progrés.
- Leitner, preferits i sessió a mitges desats al localStorage.

**Acceptació:**
- [ ] Es carreguen els 161 phrasals i el filtre "verb: get" en mostra 12.
- [ ] La targeta es gira amb un toc i amb `Espai`.
- [ ] Marcar ✅/❌ canvia la caixa i, en recarregar la pàgina, es manté.
- [ ] Si surto a la targeta 7/20 i torno, m'ofereix continuar.
- [ ] A 360 px d'amplada no hi ha scroll horitzontal.
- [ ] En navegació privada amb el localStorage bloquejat, funciona (sense desar).

### Fase 2: El joc 🎮 (dividida en 4 subfases)

Fes **una subfase cada vegada** (2A → 2B → 2C → 2D). En acabar cadascuna, actualitza
`docs/ESTAT.md` i atura't.

**Separació obligatòria del codi:**
- `js/preguntes.js` → **només funcions pures, sense DOM**: generar preguntes i distractors, triar
  phrasals segons el nivell, calcular el multiplicador i els punts. Totes reben l'array de phrasals
  i una funció `aleatori` opcional (per defecte `Math.random`), perquè es puguin provar amb tests.
- `js/joc.js` → DOM i temps: pantalla, rellotge, botons, animacions i so.
- Afegeix `preguntes.js` a l'estructura de fitxers de §2.

#### Subfase 2A: Motor de la partida + minijoc A 🤔
- Pantalla `#joc` (§4.3): ❤️ vides, ⏱️ barra de temps, 💰 punts, 🔥 multiplicador.
- Només el minijoc **A (Què vol dir?)**, amb els distractors de §5.2 A.
- Temps de 90 s, 3 vides, puntuació i multiplicador (§5.3), bonus de velocitat.
- En fallar: es marca en vermell, es mostra la correcta 1,5 s i el rellotge s'atura.
- Final de partida → una pantalla `#gameover` **bàsica** (punts, encerts, errors i botó
  "🔁 Tornar a jugar"). El Game Over complet arriba a la 2D.
- El botó 🎮 de l'Inici ja porta a `#joc` (treu l'avís "Properament" del joc, però deixa el del
  rànquing).

**Acceptació 2A:**
- [ ] Una partida s'acaba en 90 s o en 3 errors.
- [ ] En fallar, es veu la resposta correcta 1,5 s, amb el rellotge aturat.
- [ ] El multiplicador puja a ×2 al 3r encert seguit, a ×3 al 6è i a ×4 al 10è, i torna a ×1 en fallar.
- [ ] Contestant en menys de 3 s amb ×1 se sumen 15 punts; si triges més, 10.
- [ ] Les 4 opcions sempre són diferents i la correcta canvia de posició.
- [ ] Sortir a l'Inici a mitja partida l'atura (el rellotge no continua corrent amagat).
- [ ] Tests de `preguntes.js` per al minijoc A i per a la puntuació.

#### Subfase 2B: Minijoc B (Completa la frase) 🧩
- Afegeix el minijoc **B** (§5.2 B): es mostra `forat` + `traduccio` i 4 partícules.
- Distractors: partícules amb el **mateix nombre de paraules** i **mai** una que, amb el mateix
  verb, formi un altre phrasal del JSON.
- Si no hi ha prou partícules vàlides del mateix nombre de paraules (passa amb les de 2 paraules),
  completa-les amb partícules d'un altre nombre de paraules que també compleixin la segona regla.
- De moment, la partida alterna A i B a l'atzar.

**Acceptació 2B:**
- [ ] Test: per a `put-off`, les opcions mai no inclouen `up with`, `on`, `out`, `away`,
      `forward`, `up` ni `down` (tots formen phrasals amb `put`).
- [ ] Test: per a `run-out-of`, les opcions no inclouen `into`, `away` ni `over`.
- [ ] Test: per a **tots** els 161 phrasals es generen 4 opcions diferents i n'hi ha exactament
      una de correcta.
- [ ] El forat es veu clar (`___` destacat) i la traducció en petit.

#### Subfase 2C: Minijoc C (Substitueix) + dificultat 🔁
- Afegeix el minijoc **C** (§5.2 C): "Quin phrasal vol dir **postpone**?" i 4 phrasals.
- Distractors preferentment del mateix verb, i **mai** un phrasal amb el mateix `sinonim` que la
  resposta (`return`, `continue`, `relax`, `separate`, `reduce`, `register` i `depart` es repeteixen).
- Barreja dels 3 minijocs (A, B, C) a l'atzar.
- Dificultat progressiva (§5.1): preguntes 1–5 nivell 1; 6–15 nivells 1–2; 16+ nivells 1–3.
- Cap phrasal repetit dins la mateixa partida.
- Un 30 % de les preguntes surten de la caixa 1 de Leitner, si n'hi ha.

**Acceptació 2C:**
- [ ] Test: per a `give-back` (sinonim `return`), les opcions no inclouen `get back` ni `come back`.
- [ ] Test: per a tots els phrasals, el minijoc C genera 4 opcions diferents amb una sola correcta.
- [ ] Test: amb una seqüència de 40 preguntes, les 5 primeres són de nivell 1 i no hi ha cap id
      repetit.
- [ ] Jugant, surten els 3 tipus de pregunta barrejats.

#### Subfase 2D: Game Over complet, progrés i so 💀🔊
- Game Over complet (§4.4): comptador animat, millor ratxa, "🆕 NOU RÈCORD PERSONAL!", llista
  de fallats amb el significat i botó "📚 Repassar els fallats" (obre el repàs amb aquests ids).
  El botó "🏆 Guardar al rànquing" encara mostra l'avís "Properament" (és la Fase 3).
- Efectes al progrés (§5.4): fallats → caixa 1, rècords locals (top 5), `estadistiques` i ratxa de
  dies.
- Resum de l'Inici actualitzat (🔥 Rècord).
- So amb Web Audio i vibració (§5.5), respectant el botó 🔊/🔇.
- El botó "🎮 Ara, a jugar!" del resum del repàs porta a `#joc`.

**Acceptació 2D:**
- [ ] Els phrasals fallats surten al Game Over i, al Progrés, apareixen a la caixa 1.
- [ ] "📚 Repassar els fallats" comença un repàs només amb aquests phrasals.
- [ ] Un rècord nou es mostra amb confeti i queda a l'Inici després de recarregar.
- [ ] El botó 🔇 silencia tots els sons, i en recarregar es manté.
- [ ] Consola sense errors durant una partida sencera.

### Fase 3: Rànquing arcade 🏆
- `api/ranking.php`, `api/dades/.htaccess`, `js/ranking.js`, `js/paraulotes.js`.
- Pantalles Inicials i Rànquing. Crida `accio=inici` en començar cada partida.

**Acceptació:**
- [ ] Les inicials es poden posar amb ▲▼ i amb el teclat. `òscar` → `OSCAR`.
- [ ] `PUTO` i `XFUCK` es rebutgen al client **i** al servidor (prova amb `curl`).
- [ ] Un token només es pot fer servir una vegada.
- [ ] `curl` amb `punts: 99999` → `punts_invalids`.
- [ ] Guardar abans de 20 s des de l'`inici` → `temps_invalid`.
- [ ] La taula setmanal i la de sempre mostren el top 10 correcte i ressalten la teva fila.
- [ ] Sense connexió, el joc funciona i ho avisa.
- [ ] `http://localhost:8081/api/dades/ranking.db` **no** es pot descarregar. Amb `php -S` el
      `.htaccess` no s'aplica, així que comprova-ho després del desplegament.

### Fase 4: Ronda bonus i poliment ⚡
- Minijoc D (Parelles) cada 8 preguntes.
- Confeti, frases aleatòries, emojis flotants, `prefers-reduced-motion`, ratxa de dies.

### Fase 5: PWA 📲
- `manifest.webmanifest` (`name: "Phrasal Hero"`, `display: standalone`,
  `theme_color: #120a2e`, `lang: ca`, `start_url: "./"`).
- `sw.js`: **primer la xarxa i, si no n'hi ha, la memòria cau** (com `www/volei/sw.js`). **No ha de
  guardar mai les respostes de `api/`.**
- Icones de 192 i 512 px i `apple-touch-icon` (un 🦸 o una "P" de neó sobre el fons lila).

### Fase 6: Desplegament 🚀
Crea `/mnt/disco/Iespai/deploy-phrasalverbs.sh`, copiant `deploy-volei.sh`, amb:
- `LOCAL_DIR="$ROOT/www/phrasalverbs"` i `REMOTE_DIR="/www.iespai.com/phrasalverbs"`.
- Exclusions al `mirror`: `-x '^docs/' -x '^tools/' -x '^tests/' -x '^AGENTS\.md$' -x '\.db$' -x '\.git'`.
  ⚠️ **Mai no s'ha de pujar ni sobreescriure `ranking.db`** (s'hi perdria el rànquing).
- Mantenir `set ftp:ssl-allow no;`, com a l'original.

**No despleguis tu.** Deixa l'script fet. El desplegarà l'Oscar.

---

## 11. Normes per a l'agent (opencode)

1. **No modifiquis `contingut/phrasals.json`.**
2. No afegeixis frameworks, llibreries ni `package.json`.
3. Tot el text que veu l'usuari, **en català** correcte (amb accents, `l·l`, apòstrofs).
4. Una fase cada vegada. En acabar-la, repassa els criteris d'acceptació i escriu a
   `docs/ESTAT.md` què has fet, què has provat i què queda pendent.
5. Si una regla d'aquest document no és clara, **no t'inventis res**: anota-ho a `docs/DUBTES.md`
   i tria l'opció més simple.
6. Codi llegible: funcions curtes, noms en català o anglès (però coherents) i comentaris breus en
   català.
7. No facis commits de git ni desplegaments.

---

## 12. Futur (no fer ara)

- 🔗 **Connectors**: les dades ja són a `contingut/connectors.json` (vegeu §13). El disseny de la
  fase s'afegirà quan el joc dels phrasals estigui acabat.
- Codi de classe opcional al rànquing (`2BATA`) per fer taules per grup.
- Mode "examen": 20 preguntes sense temps, amb nota sobre 10.

---

## 13. Dades dels connectors: `contingut/connectors.json` (ja fet, NO MODIFICAR)

74 connectors de nivell PAU per a la redacció. **Encara no s'han de programar.** Aquesta secció
només documenta el fitxer per a una fase futura.

```json
{
  "id": "despite",
  "connector": "despite",
  "funcio": "contrast",
  "estructura": "nom",
  "registre": "neutre",
  "nivell": 2,
  "significat": "malgrat, tot i",
  "exemple": "Despite the rain, the match went ahead.",
  "exempleMarcat": "**Despite** the rain, the match went ahead.",
  "forat": "___ the rain, the match went ahead.",
  "iniciFrase": true,
  "traduccio": "Malgrat la pluja, el partit es va jugar.",
  "equivalents": ["in spite of"],
  "distractors": ["although", "even though", "as a result", "in order to"],
  "nota": "⚠️ Va seguit d'un nom o d'un -ing, mai d'una frase. ..."
}
```

| Camp | Significat |
|---|---|
| `funcio` | `addicio`, `contrast`, `causa`, `consequencia`, `finalitat`, `condicio`, `exemple`, `ordre`, `temps`, `conclusio`, `opinio`, `emfasi`, `reformulacio`, `comparacio` |
| `estructura` | què el segueix: `enllac` (inici de frase + coma: *However,*), `oracio` (+ subjecte i verb), `nom` (+ nom o -ing), `infinitiu`, `adverbi` (dins la frase), `final` (al final) |
| `registre` | `formal`, `neutre` o `informal` (a la redacció de la PAU, millor formal/neutre) |
| `forat` | l'exemple amb **un sol** `___` en lloc del connector (encara que tingui diverses paraules) |
| `iniciFrase` | `true` si el forat és a l'inici d'una frase → les opcions s'han de mostrar amb **majúscula inicial** |
| `equivalents` | connectors que poden **substituir-lo en aquella mateixa frase** (pot ser buit). Són la resposta correcta del minijoc "Substitueix" |
| `distractors` | opcions **incorrectes revisades a mà**. Algunes són trampes gramaticals a posta (*although* en lloc de *despite*), que és el que avalua la PAU. **Fes servir només aquests distractors, no en generis d'altres** |
| `nota` | consell per a l'alumne (pot ser buit). Hi pot haver `*cursiva*` i `~~ratllat~~` (error típic) |

Etiquetes de les funcions:

```js
const FUNCIONS = {
  addicio: '➕ Addició', contrast: '⚖️ Contrast', causa: '🔍 Causa',
  consequencia: '➡️ Conseqüència', finalitat: '🎯 Finalitat', condicio: '❓ Condició',
  exemple: '💡 Exemple', ordre: '🔢 Ordre', temps: '⏰ Temps', conclusio: '🏁 Conclusió',
  opinio: '🗣️ Opinió', emfasi: '❗ Èmfasi', reformulacio: '🔄 Reformulació',
  comparacio: '🟰 Comparació'
};
```

Minijocs previstos per als connectors:
- **A) Quina funció té?** `however` → 4 etiquetes de funció (la correcta + 3 funcions diferents).
- **B) Completa:** `forat` + `traduccio` → el connector correcte + 3 dels seus `distractors`.
- **C) Substitueix:** l'`exempleMarcat` → "Quin connector el pot substituir?" → un dels
  `equivalents` + 3 `distractors`. Només per als connectors que tenen `equivalents`.

Les dades es generen amb `tools/gen_connectors.py` (i els phrasals amb `tools/gen_phrasals.py`).
Si cal corregir alguna dada, es canvia l'script i es torna a generar el JSON; mai no s'edita el
JSON a mà.
