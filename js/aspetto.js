// Tema chiaro e scuro. La scelta è copiata anche in localStorage per evitare un lampo all'apertura.
const COLORE = { chiaro: '#E7DEFA', scuro: '#12111B' };
const COLORE_VELATO = { chiaro: '#A7A0BB', scuro: '#08080C' };
const scuroSistema = matchMedia('(prefers-color-scheme: dark)');
let scelta = 'auto';
let veli = 0;

function disegna() {
  const tema = scelta === 'auto' ? (scuroSistema.matches ? 'scuro' : 'chiaro') : scelta;
  const r = document.getElementById('scr');
  r.classList.toggle('t-chiaro', tema === 'chiaro');
  r.classList.toggle('t-scuro', tema === 'scuro');
  const fondo = veli > 0 ? COLORE_VELATO[tema] : COLORE[tema];
  document.getElementById('colore-tema').setAttribute('content', fondo);
  document.documentElement.style.background = fondo;
  document.documentElement.style.colorScheme = tema === 'scuro' ? 'dark' : 'light';
}

export function applicaAspetto(valore) {
  scelta = valore || 'auto';
  try { localStorage.setItem('diario-aspetto', scelta); } catch { /* facoltativo */ }
  disegna();
}

// Con una conferma aperta anche la fascia dell'orario si scurisce, se iOS lo permette.
export function velaFascia(attivo) {
  veli = Math.max(0, veli + (attivo ? 1 : -1));
  disegna();
}

export function aspettoIniziale() {
  try { scelta = localStorage.getItem('diario-aspetto') || 'auto'; } catch { scelta = 'auto'; }
  disegna();
  scuroSistema.addEventListener('change', disegna);
}
