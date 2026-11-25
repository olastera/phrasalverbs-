// Analítica (GA4) sense galetes: client_storage 'none', sense senyals de Google ni anuncis.
// Només s'activa a producció; en local, al Pi i als tests, registra() no fa res.

export const GA_ID = 'G-KJNSZ0HZ9C';
export const HOST_PRODUCCIO = 'www.iespai.com';

let actiu = false;

export function iniciaAnalitica({ finestra = globalThis, id = GA_ID } = {}) {
  try {
    if (actiu || finestra.location?.hostname !== HOST_PRODUCCIO) return false;
    finestra.dataLayer = finestra.dataLayer || [];
    finestra.gtag = function gtag() { finestra.dataLayer.push(arguments); };
    finestra.gtag('js', new Date());
    finestra.gtag('config', id, {
      client_storage: 'none',
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      send_page_view: false
    });
    const script = finestra.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    finestra.document.head.append(script);
    actiu = true;
    return true;
  } catch {
    return false;
  }
}

// Envia un esdeveniment. Mai no ha de trencar l'app (sense xarxa, bloquejadors, tests...).
export function registra(nom, parametres = {}, finestra = globalThis) {
  try {
    if (typeof finestra.gtag === 'function') finestra.gtag('event', nom, parametres);
  } catch {
    // res
  }
}

export function registraPantalla(pantalla, finestra = globalThis) {
  registra('page_view', {
    page_title: `Phrasal Hero: ${pantalla}`,
    page_location: `https://${HOST_PRODUCCIO}/phrasalverbs/#${pantalla}`
  }, finestra);
}
