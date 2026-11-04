import { S, carica } from './dati.js';
import { aspettoIniziale, applicaAspetto } from './aspetto.js';
import { messaggio, seguiTastiera } from './ui.js';
import { aggiornaViste, ciSonoPagine, creaTabs, registraVista } from './nav.js';
import { disegnaHome } from './home.js';
import { disegnaArchivio } from './archivio.js';
import { disegnaSeduta } from './seduta.js';
import { apriNuovaVoce } from './nuova.js';
import { salvaOra } from './voce.js';
import { schermataBenvenuto, schermataInstalla } from './avvio.js';

const installata = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
const suIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent);

// Il testo non ancora salvato si riapre da solo se l'app è stata chiusa da poco.
const BOZZA_RECENTE = 15 * 60 * 1000;

function entraNellApp(msg) {
  aggiornaViste();
  if (msg) messaggio(msg, { basso: false });
  if (S.bozza && Date.now() - new Date(S.bozza.quando).getTime() < BOZZA_RECENTE) apriNuovaVoce();
}

function registraServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const aveva = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  let daRicaricare = false;
  const libera = () => !ciSonoPagine() && !document.querySelector('.sheet, .strato');
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!aveva) return;
    if (libera()) location.reload();
    else daRicaricare = true;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && daRicaricare && libera()) location.reload();
  });
}

async function avvia() {
  aspettoIniziale();
  document.addEventListener('touchstart', () => {}, { passive: true }); // attiva :active su iOS
  seguiTastiera();
  creaTabs();
  registraVista(0, disegnaHome);
  registraVista(1, disegnaArchivio);
  registraVista(2, disegnaSeduta);
  registraServiceWorker();

  if (suIos() && !installata()) {
    schermataInstalla();
    return;
  }

  await carica();
  applicaAspetto(S.aspetto);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') salvaOra();
    else if (S.avviato) aggiornaViste(); // "Oggi" e "Ieri" restano giusti dopo la mezzanotte
  });
  window.addEventListener('pagehide', salvaOra);

  if (!S.avviato) {
    aggiornaViste();
    schermataBenvenuto(entraNellApp);
    return;
  }
  entraNellApp();
}

avvia();
