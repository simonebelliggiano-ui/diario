import { S, salvaMeta } from './dati.js';
import { dataCampo, daInputData, etichettaOra, inizioGiorno, perInputData, periodoSeduta, statistiche, testoEsportazione } from './logica.js';
import { campoData, condividiTesto, h, messaggio, pannello, svuota } from './ui.js';
import { pannelloDate, rigaVoce } from './archivio.js';
import { aggiornaViste } from './nav.js';

let scelta = null; // periodo scelto a mano: non si conserva
const ultimaSeduta = () => (S.sedute.length ? S.sedute[S.sedute.length - 1] : null);

function cartaClassifica(titolo, righe) {
  if (!righe.length) return null;
  return h('div', { class: 'sd-c' }, h('h2', null, titolo),
    righe.map(([n, c]) => h('div', { class: 'sd-r' }, h('span', null, n), h('b', null, c))));
}

function pannelloPeriodo() {
  pannello({
    titolo: 'Cambia periodo',
    costruisci: (fine) => [
      h('button', { class: 'btn sec', type: 'button', onclick: () => { fine(); scelta = null; disegnaSeduta(); } }, 'Dall’ultima seduta'),
      h('button', {
        class: 'btn sec',
        type: 'button',
        onclick: () => {
          fine();
          const oggi = new Date();
          const u = ultimaSeduta();
          pannelloDate('Scegli date', scelta?.dal || (u ? new Date(u) : new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() - 7)), scelta?.al || oggi, (dal, al) => { scelta = { dal, al }; disegnaSeduta(); });
        },
      }, 'Scegli date'),
      h('button', { class: 'btn sec', type: 'button', onclick: () => fine() }, 'Annulla'),
    ],
  });
}

function pannelloSedutaFatta() {
  const oggi = new Date();
  const oggiTxt = perInputData(oggi);
  let data = oggiTxt;
  pannello({
    titolo: 'Segnare questa data come ultima seduta?',
    costruisci: (fine) => [
      campoData({ etichetta: 'Data', testo: dataCampo(oggi), valore: oggiTxt, max: oggiTxt, alCambio: (x, b) => { data = x; b.textContent = dataCampo(daInputData(x)); } }),
      h('div', { class: 'two' },
        h('button', { class: 'btn sec', type: 'button', onclick: () => fine() }, 'Annulla'),
        h('button', {
          class: 'btn pri',
          type: 'button',
          onclick: async () => {
            fine();
            // Oggi: contano le voci scritte da adesso. Data cambiata a mano: dall'inizio di quel giorno.
            const soglia = data === oggiTxt ? new Date() : inizioGiorno(daInputData(data));
            try {
              await salvaMeta('sedute', [...S.sedute, soglia.toISOString()]);
              scelta = null;
              aggiornaViste();
            } catch {
              messaggio('Salvataggio non riuscito.');
            }
          },
        }, 'Conferma')),
    ],
  });
}

function pannelloEsporta(periodo) {
  pannello({
    titolo: 'Esporta',
    costruisci: (fine) => [
      h('button', { class: 'btn pri', type: 'button', onclick: async () => { const t = testoEsportazione(periodo); await condividiTesto(t, 'Diario'); fine(); } }, 'Condividi come testo'),
      h('button', { class: 'btn sec', type: 'button', onclick: () => fine() }, 'Annulla'),
    ],
  });
}

export function disegnaSeduta() {
  const el = document.getElementById('v2');
  const sc = el.querySelector('.sed-scorre')?.scrollTop || 0;
  const periodo = periodoSeduta(S.voci, ultimaSeduta(), scelta);
  const s = statistiche(periodo.voci);
  const pieno = periodo.voci.length > 0;

  const mini = h('div', { class: 'mini' }, 'Seduta');
  const intestazione = [
    h('header', { class: 'head' }, h('h1', { class: 'serif' }, 'Seduta')),
    h('div', { class: 'period' }, h('span', null, periodo.etichetta), h('button', { class: 'link', type: 'button', onclick: pannelloPeriodo }, 'Cambia periodo')),
  ];

  const scorre = h('main', { class: 'sed-scorre', 'data-scorre': '' }, intestazione,
    pieno && h('div', { class: 'sd' },
      h('div', { class: 'tiles' },
        h('div', { class: 'tile' }, h('small', null, 'Voci'), h('strong', { class: 'serif' }, s.totale), h('em', null, `di cui ${s.daCompletare} da completare`)),
        h('div', { class: 'tile' }, h('small', null, 'Intensità media'), h('strong', { class: 'serif' }, s.media ?? '–'), h('em', null, '​'))),
      cartaClassifica('Categorie più frequenti', s.categorie),
      cartaClassifica('Emozioni più frequenti', s.emozioni),
      cartaClassifica('Cosa ho fatto più spesso per difendermi', s.comportamenti)),
    pieno && h('h2', { class: 'serif titolo-voci' }, 'Voci del periodo'),
    pieno && h('div', { class: 'card sed-voci' }, periodo.voci.map((v) => rigaVoce(v, { etichetta: etichettaOra(v.quando), intero: true }))));

  scorre.addEventListener('scroll', () => mini.classList.toggle('on', scorre.scrollTop > 60), { passive: true });

  svuota(el,
    h('div', { class: 'orb sm' }), h('div', { class: 'orb2 sm' }),
    scorre,
    !pieno && h('div', { class: 'msg' }, h('h2', { class: 'serif' }, 'Nessuna voce in questo periodo.')),
    mini,
    h('div', { class: 'dock hi' }),
    h('div', { class: 's-acts' },
      h('button', { class: 'btn pri', type: 'button', onclick: pannelloSedutaFatta }, 'Seduta fatta'),
      h('button', { class: `btn ${pieno ? 'sec' : 'off'}`, type: 'button', disabled: !pieno, onclick: () => pannelloEsporta(periodo) }, 'Esporta')));
  scorre.scrollTop = pieno ? sc : 0;
  mini.classList.toggle('on', scorre.scrollTop > 60);
}
