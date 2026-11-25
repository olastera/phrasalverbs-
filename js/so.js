const ENCERT = 880;
const PUJADA = [523.25, 659.25, 783.99];
const GAME_OVER = [440, 330, 261.63, 196];

export function creaSo({
  activat = true,
  navegador = globalThis.navigator,
  factoria = globalThis.AudioContext ?? globalThis.webkitAudioContext
} = {}) {
  let context = null;

  function habilitat() {
    return typeof activat === 'function' ? activat() : Boolean(activat);
  }

  function desperta() {
    if (!habilitat() || !factoria) return null;
    try {
      context ??= new factoria();
      if (context.state === 'suspended') context.resume?.();
      return context;
    } catch {
      return null;
    }
  }

  function to(freq, retard = 0, durada = 0.12) {
    const ctx = desperta();
    if (!ctx) return;
    try {
      const inici = (ctx.currentTime ?? 0) + retard;
      const oscilador = ctx.createOscillator();
      if (!oscilador) return;
      oscilador.type = 'triangle';
      oscilador.frequency?.setValueAtTime?.(freq, inici);
      const guany = ctx.createGain?.();
      if (guany) {
        guany.gain?.setValueAtTime?.(0.0001, inici);
        guany.gain?.exponentialRampToValueAtTime?.(0.09, inici + 0.01);
        guany.gain?.exponentialRampToValueAtTime?.(0.0001, inici + durada);
        oscilador.connect(guany);
        guany.connect(ctx.destination);
      } else {
        oscilador.connect(ctx.destination);
      }
      oscilador.start?.(inici);
      oscilador.stop?.(inici + durada);
    } catch {
      return;
    }
  }

  function encert() {
    to(ENCERT, 0, 0.1);
  }

  function error() {
    if (!habilitat()) return;
    try {
      navegador?.vibrate?.(80);
    } catch {
      return;
    }
    to(150, 0, 0.22);
  }

  function pujada() {
    PUJADA.forEach((freq, index) => to(freq, index * 0.08, 0.12));
  }

  function gameOver() {
    GAME_OVER.forEach((freq, index) => to(freq, index * 0.14, 0.18));
  }

  return { desperta, encert, error, pujada, gameOver };
}
