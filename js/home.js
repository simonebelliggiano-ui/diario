import { S } from './dati.js';
import { completa, dataLunga, etichettaOra, ordina } from './logica.js';
import { h, icona, svuota } from './ui.js';
import { vaiA } from './nav.js';
import { apriNuovaVoce } from './nuova.js';
import { apriVoce } from './voce.js';
import { apriImpostazioni } from './impostazioni.js';
import { mostraArchivio } from './archivio.js';

function riga(v, evidenzia) {
  const cat = v.categorie[0] || 'Senza categoria';
  return h('button', { class: `row ${v.id === evidenzia ? 'riga-nuova' : ''}`, type: 'button', onclick: () => apriVoce(v.id) },
    h('span', { class: 'r-t' }, `${etichettaOra(v.quando)} ·`),
    h('span', { class: 'r-c' }, cat),
    v.categorie.length > 1 && h('span', { class: 'r-p' }, `+${v.categorie.length - 1}`));
}

function sezione(titolo, azione, alTocco, voci, evidenzia) {
  return h('section', null,
    h('div', { class: 'sec-h' }, h('h2', { class: 'serif' }, titolo), h('button', { class: 'more', type: 'button', onclick: alTocco }, azione)),
    h('div', { class: 'card' }, voci.map((v) => riga(v, evidenzia))));
}

export function disegnaHome({ evidenzia } = {}) {
  const el = document.getElementById('v0');
  const voci = ordina(S.voci);
  const daCompletare = voci.filter((v) => !completa(v)).slice(0, 3);
  const ultime = voci.filter(completa).slice(0, 3);
  const sc = el.querySelector('.lists')?.scrollTop || 0;

  svuota(el,
    h('div', { class: 'orb' }), h('div', { class: 'orb2' }),
    h('header', { class: 'head' },
      h('div', null, h('h1', { class: 'serif' }, 'Diario'), h('p', null, dataLunga(new Date()))),
      h('button', { class: 'gear', type: 'button', 'aria-label': 'Impostazioni', onclick: apriImpostazioni }, icona('settings'))),
    voci.length
      ? h('main', { class: 'lists', 'data-scorre': '' },
        daCompletare.length > 0 && sezione('Da completare', 'Vedi tutte', () => { mostraArchivio({ soloDaCompletare: true }); vaiA(1); }, daCompletare, evidenzia),
        ultime.length > 0 && sezione('Ultime voci', 'Tutte le voci', () => { mostraArchivio({}); vaiA(1); }, ultime, evidenzia))
      : h('div', { class: 'empty' }, h('h2', { class: 'serif' }, 'Ancora nessuna voce.'), h('p', null, 'Quando succede qualcosa, tocca Nuova voce.')),
    h('button', { class: 'cta', type: 'button', onclick: apriNuovaVoce }, icona('plus'), 'Nuova voce'));
  const l = el.querySelector('.lists');
  if (l) l.scrollTop = sc;
}
