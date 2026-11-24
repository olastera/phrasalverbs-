# Dubtes i incidències de la Fase 1

Tots els dubtes estan **resolts** (2026-11-24).

## ✅ Port 8080 ocupat — resolt

La comanda del pla no es va poder fer servir perquè el port 8080 ja el feia servir Apache/WordPress:

`php -S 0.0.0.0:8080 -t /mnt/disco/Iespai/www/phrasalverbs` → `Address already in use`.

**Resolució:** es fa servir el port alternatiu indicat per l'usuari:

`php -S 0.0.0.0:8081 -t /mnt/disco/Iespai/www/phrasalverbs`

Totes les rutes de la Fase 1 responen 200 en aquest port, incloses les fonts locals. No cal alliberar
el 8080.

## ✅ Verificació interactiva al navegador — resolt

L'entorn headless no permetia controlar Chrome ni Firefox de manera fiable (pàgines `about:blank`,
timeouts de navegació, connexió CDP/BiDi tancada, mòduls ES que s'executen després de la càrrega).

**Resolució:** la interacció s'ha cobert amb un DOM simulat a les proves unitàries (18/18 passats):
clic a la targeta per girar-la, botons ✅/❌, pausa i continuació de la sessió, i "🔁 Repassa els ❌".
A més, s'han verificat les respostes HTTP al port 8081 i s'ha revisat el CSS per a 360 px. No cal
cap acció addicional per tancar el dubte; abans del desplegament es recomana una revisió visual al
navegador habitual.

## ✅ Google Fonts — resolt

`index.html` carregava `https://fonts.googleapis.com` i `https://fonts.gstatic.com`, amb un retard
d'uns 15 segons a l'entorn headless.

**Resolució:** s'han eliminat els tres `<link>` externs i s'allotgen els fitxers al projecte:

- `fonts/press-start-2p-400-latin.woff2` (400)
- `fonts/nunito-latin.woff2` (subconjunt latin, pesos 700/800/900)

Declarats amb `@font-face` i `font-display: swap` a `css/estils.css`. Les versions estàtiques de
CSS i JS s'han pujat a `?v=2` a `index.html`. La web ja no depèn de cap domini extern per a les
fonts i manté `system-ui` com a alternativa.
