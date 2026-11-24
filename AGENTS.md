# Phrasal Hero: instruccions per a l'agent

Abans de fer res, llegeix **`docs/PLA.md`** sencer. Allà hi ha tot el disseny, les regles del joc,
l'API i les fases.

Resum de les normes:

- HTML, CSS i JS **vanilla** (mòduls ES) + un sol PHP amb PDO SQLite. Sense frameworks, npm ni build.
- Interfície en **català**, estil arcade de neó, **emojis a tope**, pensada primer per al mòbil.
- **No modifiquis `contingut/phrasals.json` ni `contingut/connectors.json`** (dades revisades a mà; es generen amb `tools/`).
- Rutes sempre relatives. Fitxers estàtics amb `?v=N`. Res d'`alert()`/`confirm()`.
- Quan canviïs qualsevol fitxer JS o CSS, puja la versió `?v=N` a tot arreu (index.html i tots els imports).
- Si `contingut/*.json` canvia, puja `VERSIO_DADES`.
- El `localStorage` només es fa servir des de `js/progres.js`, amb la clau `phrasalhero:v1` i sempre
  dins `try/catch`.
- Treballa **fase per fase** (§10 del pla). En acabar cada fase, actualitza `docs/ESTAT.md`.
- Prova en local: `php -S 0.0.0.0:8081 -t /mnt/disco/Iespai/www/phrasalverbs`
- No facis commits ni desplegaments.

## Flux de treball
- **`docs/PLA.md` és el disseny aprovat.** No facis brainstorming, no escriguis specs ni plans nous
  (res de `docs/superpowers/` ni similars) i no facis preguntes de disseny que el pla ja respon.
  Implementa directament la fase que se t'indiqui.
- Si alguna cosa del pla és ambigua, tria l'opció més simple i anota-la a `docs/DUBTES.md`.
- Tests: des de `www/phrasalverbs/`, executa
  `node --experimental-default-type=module --test tests/*.test.mjs`.
