# 🦸 Phrasal Hero

**Aprèn els *phrasal verbs* de la PAU jugant.** Una web-app en català, d'estil màquina recreativa,
pensada per als alumnes de 2n de Batxillerat que preparen l'examen d'anglès de les PAU a Catalunya.

▶️ **Juga-hi:** <https://www.iespai.com/phrasalverbs/>

- 📱 Feta per al mòbil, però també funciona a l'ordinador.
- 🙅 Sense registre, sense comptes, sense galetes i sense analítica.
- 📲 S'instal·la com una app (PWA) i funciona sense connexió.
- 🪶 HTML, CSS i JavaScript sense frameworks, i un sol fitxer PHP per al rànquing.

---

## 🎮 Què hi ha dins

### 📚 Repassar
Targetes que es giren (*flashcards*) amb **repetició espaiada** (sistema Leitner de 3 caixes).
Pots triar què repasses: tots, els teus ⭐ preferits, 😵 els que falles, o filtrar per verb base
(*get*, *take*, *put*...), per tema o per nivell. A la cara del darrere hi ha el significat en
català, un sinònim en anglès, una frase d'exemple i la seva traducció.

Amb el teclat: `Espai` gira la targeta, `←` *encara no*, `→` *me'l sé*.

### 🕹️ Jugar
Una partida contrarellotge de **90 segons amb 3 vides**. Les preguntes es barregen a l'atzar entre
quatre minijocs:

| Minijoc | Què has de fer |
|---|---|
| 🤔 **Què vol dir?** | Tries el significat correcte d'un phrasal. |
| 🧩 **Completa la frase** | Tries la partícula que falta (`We've run ___ ___ milk.`). És el que més s'assembla a l'examen. |
| 🔁 **Substitueix** | Quin phrasal vol dir *postpone*? (com els *rewrite* de la PAU) |
| ⚡ **Parelles** | Ronda bonus cada 8 preguntes: aparella 5 phrasals amb el seu significat en 15 s. |

La dificultat puja a mesura que avances, i els phrasals que falles tornen a sortir més sovint.
Quan t'equivoques, el joc t'ensenya la resposta correcta, perquè la idea és aprendre.

**Puntuació:** cada encert val 10 punts, amb +5 si contestes en menys de 3 s. Els encerts seguits
fan pujar el multiplicador 🔥:

| Encerts seguits | 0–2 | 3–5 | 6–9 | 10+ |
|---|---|---|---|---|
| Multiplicador | ×1 | ×2 🔥 | ×3 🔥🔥 | ×4 🔥🔥🔥 |

### 🏆 Rànquing
Com a les recreatives de sempre: en acabar, poses les teves **inicials (fins a 5 lletres)** i surts
a la taula. Hi ha un rànquing de la setmana i un de sempre, i a més el teu dispositiu guarda els
teus 5 millors resultats.

### 📊 Progrés
Quants phrasals tens a cada caixa (🆕 nous, 😵 caixa 1, 🤔 caixa 2, 🧠 dominats) i com vas amb cada
verb base. El progrés es guarda al navegador (`localStorage`), no en cap servidor.

---

## 📖 El contingut

- **161 phrasal verbs** de 67 verbs base, en 11 temes i 3 nivells de dificultat
  (`contingut/phrasals.json`).
- Cada entrada inclou el significat en català, un sinònim en anglès, un exemple, la frase amb el
  forat i la traducció. També porta llistes de phrasals semblants i de partícules prohibides, perquè
  les respostes falses no puguin ser correctes per casualitat.
- També hi ha **74 connectors** (*however*, *moreover*...) a `contingut/connectors.json`, preparats
  per a una secció futura.

Les dades es generen amb els scripts de `tools/` (`gen_phrasals.py`, `gen_connectors.py`). No
s'editen a mà.

---

## 🧱 Com està fet

```
phrasalverbs/
├── index.html              una sola pàgina amb totes les pantalles
├── manifest.webmanifest    PWA
├── sw.js                   service worker (primer la xarxa i, sense connexió, la memòria cau)
├── css/estils.css
├── fonts/                  Press Start 2P i Nunito, allotjades al mateix servidor
├── js/
│   ├── app.js              arrencada, navegació entre pantalles, registre del service worker
│   ├── dades.js            càrrega de contingut/*.json
│   ├── progres.js          l'únic mòdul que toca el localStorage
│   ├── repas.js            targetes i Leitner
│   ├── preguntes.js        funcions pures: preguntes, distractors i punts
│   ├── joc.js              pantalla de joc, rellotge i animacions
│   ├── frases.js           frases i emojis del joc
│   ├── so.js               sons generats amb Web Audio (sense fitxers d'àudio)
│   ├── ranking.js          inicials i rànquing
│   └── paraulotes.js       filtre d'inicials
├── api/
│   ├── ranking.php         API del rànquing (PHP + SQLite)
│   └── dades/              base de dades SQLite, tancada amb .htaccess
├── contingut/              phrasals.json i connectors.json
├── tests/                  tests automàtics (node:test)
└── tools/                  generadors de dades i d'icones (Python)
```

- **Sense dependències:** ni npm, ni bundlers, ni passos de compilació. Els fitxers es pugen tal
  qual al servidor.
- **Mòduls ES** de JavaScript, amb versió a les URL (`?v=15`) perquè les memòries cau no serveixin
  fitxers vells.
- **Rutes relatives** a tot arreu: l'app funciona dins de qualsevol carpeta.

### 🔒 El rànquing i les trampes
L'API (`api/ranking.php`) és un sol fitxer PHP amb PDO i SQLite:

| Petició | Què fa |
|---|---|
| `POST ?accio=inici` | Abans de cada partida dona un *token* d'un sol ús. |
| `POST ?accio=guardar` | Desa `{token, inicials, punts, encerts}` si tot quadra. |
| `GET ?accio=top&periode=setmana\|sempre` | Retorna el top 10. |

Una puntuació es desa només si el token és vàlid i no s'ha fet servir, la partida ha durat un temps
raonable i els punts són possibles amb aquells encerts (màxim 60 per encert). Les inicials passen un
filtre de paraulotes, i totes les consultes són preparades. És un joc d'institut, no un banc, però
fer trampes costa una mica. 😉

Si no hi ha connexió, l'app deixa jugar igualment i guarda la puntuació només al dispositiu.

---

## 🚀 Provar-ho en local

Cal **PHP 8** amb l'extensió `pdo_sqlite`:

```bash
git clone https://github.com/olastera/phrasalverbs-.git
cd phrasalverbs-
php -S localhost:8081
```

I obre <http://localhost:8081/>. La base de dades del rànquing es crea sola a `api/dades/ranking.db`
la primera vegada que es crida l'API.

### 🧪 Tests
Cal **Node.js 20** o posterior:

```bash
node --experimental-default-type=module --test tests/*.test.mjs
```

### 🌐 Publicar-ho
Puja-ho a qualsevol allotjament amb PHP 8, **excepte** `docs/`, `tests/`, `tools/`, `AGENTS.md` i
la base de dades (`api/dades/*.db`). El servidor ha de permetre `.htaccess`, perquè ningú no pugui
descarregar la base de dades. No cal `mod_rewrite`.

Si canvies algun fitxer estàtic, puja la versió `?v=N` a `index.html`, a les importacions de JS i al
nom de la memòria cau de `sw.js`. Si no, els mòbils que ja tenen l'app continuaran veient la versió
vella.

---

## 🗺️ Què ve ara

- 🔗 Secció de **connectors** (les dades ja hi són).
- 🏫 Codi de classe opcional al rànquing, per fer taules per grup.
- 📝 Mode examen: 20 preguntes sense temps, amb nota sobre 10.

---

## 🙌 Crèdits

Un projecte d'[Iespai](https://www.iespai.com/).

Tipografies: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) (CodeMan38) i
[Nunito](https://fonts.google.com/specimen/Nunito) (Vernon Adams i altres), totes dues amb
llicència SIL Open Font License 1.1.
