// Tema chiaro e scuro. La scelta è copiata anche in localStorage per evitare un lampo all'apertura.
const COLORE = { chiaro: '#E7DEFA', scuro: '#12111B' };
const scuroSistema = matchMedia('(prefers-color-scheme: dark)');
let scelta = 'auto';

function disegna() {
  const tema = scelta === 'auto' ? (scuroSistema.matches ? 'scuro' : 'chiaro') : scelta;
  const r = document.getElementById('scr');
  r.classList.toggle('t-chiaro', tema === 'chiaro');
  r.classList.toggle('t-scuro', tema === 'scuro');
  document.getElementById('colore-tema').setAttribute('content', COLORE[tema]);
  const fondo = tema === 'scuro' ? '#12111B' : '#F3F0FB';
  document.documentElement.style.background = fondo;
  document.body.style.background = fondo;
}

export function applicaAspetto(valore) {
  scelta = valore || 'auto';
  try { localStorage.setItem('diario-aspetto', scelta); } catch { /* facoltativo */ }
  disegna();
}

export function aspettoIniziale() {
  try { scelta = localStorage.getItem('diario-aspetto') || 'auto'; } catch { scelta = 'auto'; }
  disegna();
  scuroSistema.addEventListener('change', disegna);
}
