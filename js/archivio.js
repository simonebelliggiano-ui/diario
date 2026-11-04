import { S } from './dati.js';
import { completa, dataCampo, daInputData, emozionePrincipale, etichettaGiorno, filtra, intervalloBreve, ordina, perInputData, pulito, soloOra } from './logica.js';
import { campoData, etichettaDaCompletare, gruppoScelte, h, icona, metaCerchio, pannello, svuota } from './ui.js';
import { apriVoce } from './voce.js';

const VUOTO = { periodo: 'tutto', dal: null, al: null, categorie: [], soloDaCompletare: false };
let f = { ...VUOTO };

export function mostraArchivio(filtri) {
  f = { ...VUOTO, ...filtri };
  disegnaArchivio({ sfuma: false });
}

export function rigaVoce(v, { etichetta, intero = false } = {}) {
  const testo = pulito(v.pensiero) || pulito(v.situazione);
  const top = emozionePrincipale(v);
  const inc = !completa(v);
  return h('button', { class: 'arow', type: 'button', onclick: () => apriVoce(v.id) },
    h('span', { class: 'a-top' },
      h('span', null, `${etichetta} ·`),
      h('span', null, v.categorie[0] || 'Senza categoria'),
      v.categorie.length > 1 && h('span', null, `+${v.categorie.length - 1}`)),
    testo && h('span', { class: `a-txt ${intero ? 'intero' : ''}` }, testo),
    (top || inc) && h('span', { class: 'a-meta' },
      h('span', null, top ? `${top.nome} · ${top.intensita}` : ''),
      inc && etichettaDaCompletare()));
}

function metaCerchioPiccolo() {
  const c = metaCerchio();
  c.setAttribute('class', 'tiny');
  return c;
}

function chip(testo, on, alTocco, ...extra) {
  return h('button', { class: `chip ${on ? 'on' : ''}`, type: 'button', 'aria-pressed': String(!!on), onclick: alTocco }, extra, testo);
}

function imposta(cambi) {
  f = { ...f, ...cambi };
  disegnaArchivio({ sfuma: true });
}

function pannelloCategorie() {
  let scelte = [...f.categorie];
  pannello({
    titolo: 'Categoria',
    costruisci: (fine) => [
      gruppoScelte({ elenco: S.elenchi.categorie, scelte, alCambio: (l) => { scelte = l; } }),
      h('div', { class: 'two', style: 'margin-top:6px' },
        h('button', { class: 'btn sec', type: 'button', onclick: () => { fine(); imposta({ categorie: [] }); } }, 'Togli filtro'),
        h('button', { class: 'btn pri', type: 'button', onclick: () => { fine(); imposta({ categorie: scelte }); } }, 'Applica')),
    ],
  });
}

export function pannelloDate(titolo, dal0, al0, alApplica) {
  let dal = dal0;
  let al = al0;
  const oggi = perInputData(new Date());
  pannello({
    titolo,
    costruisci: (fine) => [
      campoData({ etichetta: 'Dal', testo: dataCampo(dal), valore: perInputData(dal), max: oggi, alCambio: (x, b) => { dal = daInputData(x); b.textContent = dataCampo(dal); } }),
      campoData({ etichetta: 'Al', testo: dataCampo(al), valore: perInputData(al), max: oggi, alCambio: (x, b) => { al = daInputData(x); b.textContent = dataCampo(al); } }),
      h('div', { class: 'two' },
        h('button', { class: 'btn sec', type: 'button', onclick: () => fine() }, 'Annulla'),
        h('button', { class: 'btn pri', type: 'button', onclick: () => { fine(); if (dal > al) [dal, al] = [al, dal]; alApplica(dal, al); } }, 'Applica')),
    ],
  });
}

function etichettaCategoria() {
  if (!f.categorie.length) return 'Categoria';
  const piu = f.categorie.length > 1 ? ` +${f.categorie.length - 1}` : '';
  return `Categoria · ${f.categorie[0]}${piu}`;
}

export function disegnaArchivio({ sfuma = false } = {}) {
  const el = document.getElementById('v1');
  const sc = el.querySelector('.a-list')?.scrollTop || 0;
  const voci = ordina(filtra(S.voci, f));

  const attivi = f.periodo !== 'tutto' || f.categorie.length > 0 || f.soloDaCompletare;
  const filtri = h('div', { class: 'filters chips' },
    chip('Tutto', f.periodo === 'tutto', () => imposta({ periodo: 'tutto', dal: null, al: null })),
    chip('Questa settimana', f.periodo === 'settimana', () => imposta({ periodo: 'settimana', dal: null, al: null })),
    chip('Questo mese', f.periodo === 'mese', () => imposta({ periodo: 'mese', dal: null, al: null })),
    chip(f.periodo === 'date' ? intervalloBreve(f.dal, f.al) : 'Scegli date', f.periodo === 'date', () => {
      const oggi = new Date();
      const sett = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() - 7);
      pannelloDate('Scegli date', f.dal || sett, f.al || oggi, (dal, al) => imposta({ periodo: 'date', dal, al }));
    }),
    h('button', { class: `chip ${f.categorie.length ? 'on' : ''}`, type: 'button', onclick: pannelloCategorie }, etichettaCategoria(), icona('chevron-down', 'down')),
    h('button', { class: `chip ${f.soloDaCompletare ? 'on' : ''}`, type: 'button', 'aria-pressed': String(f.soloDaCompletare), onclick: () => imposta({ soloDaCompletare: !f.soloDaCompletare }) },
      metaCerchioPiccolo(), 'Da completare'));

  let contenuto;
  if (voci.length) {
    const gruppi = new Map();
    for (const v of voci) {
      const k = etichettaGiorno(v.quando);
      if (!gruppi.has(k)) gruppi.set(k, []);
      gruppi.get(k).push(v);
    }
    contenuto = h('main', { class: `a-list ${sfuma ? 'lista-sfuma' : ''}`, 'data-scorre': '' },
      [...gruppi.entries()].map(([g, lista]) => [
        h('div', { class: 'a-day' }, g),
        h('div', { class: 'card' }, lista.map((v) => rigaVoce(v, { etichetta: soloOra(v.quando) }))),
      ]));
  } else if (attivi && S.voci.length) {
    contenuto = h('div', { class: `msg ${sfuma ? 'lista-sfuma' : ''}` },
      h('h2', { class: 'serif' }, 'Nessuna voce con questi filtri.'),
      h('button', { class: 'btn sec', type: 'button', onclick: () => imposta({ ...VUOTO }) }, 'Togli i filtri'));
  } else {
    contenuto = h('div', { class: 'msg' }, h('h2', { class: 'serif' }, 'Ancora nessuna voce.'));
  }

  svuota(el,
    h('div', { class: 'orb sm' }), h('div', { class: 'orb2 sm' }),
    h('header', { class: 'head' }, h('h1', { class: 'serif' }, 'Archivio')),
    filtri, contenuto, h('div', { class: 'dock' }));
  const l = el.querySelector('.a-list');
  if (l && !sfuma) l.scrollTop = sc;
}
