// Nuova voce: la cattura veloce.
import { S, nuovoId, salvaMeta, salvaVoce } from './dati.js';
import { etichettaOra, pulito } from './logica.js';
import { campoTesto, chiudiMessaggio, conferma, cursore, gestoGiu, gruppoScelte, h, messaggio, mostraCampo, radice, riduciMovimento, scorrereChiudeTastiera, svuota } from './ui.js';
import { aggiungiAElenco } from './comuni.js';
import { aggiornaViste } from './nav.js';
import { apriVoce } from './voce.js';

let aperta = false;
let timerBozza;

export function apriNuovaVoce() {
  if (aperta) return;
  aperta = true;
  chiudiMessaggio();
  const sotto = document.getElementById('sotto');
  const b = S.bozza ? { ...S.bozza } : { quando: new Date().toISOString(), pensiero: '', situazione: '', sitAperta: false, categorie: [], emozioni: [] };

  const toccata = () => !!(pulito(b.pensiero) || pulito(b.situazione) || b.emozioni.length || b.categorie.length);
  const salvabile = () => !!(pulito(b.pensiero) || pulito(b.situazione));

  const salvaBozza = () => {
    clearTimeout(timerBozza);
    timerBozza = setTimeout(() => { salvaMeta('bozza', toccata() ? b : null).catch(() => {}); }, 300);
  };
  const cambiato = () => { aggiornaSalva(); salvaBozza(); };

  // --- Testata e pannello
  const testata = h('header', { class: 's-head' },
    h('button', { class: 'cancel', type: 'button', onclick: () => tentaChiusura() }, 'Annulla'),
    h('div', { class: 's-title' }, h('h1', null, 'Nuova voce'), h('p', null, etichettaOra(b.quando))));

  // --- Pensiero
  const pensiero = campoTesto({
    classe: 'm-p', id: 'nv-pensiero', suggerimento: 'Scrivi la frase come ti è venuta in mente', valore: b.pensiero,
    alCambio: (t) => { b.pensiero = t; cambiato(); },
  });

  // --- Cosa è successo
  const situazione = campoTesto({
    classe: 'm-s', id: 'nv-situazione', suggerimento: 'Dove eri, cosa facevi, con chi. Scrivi tutto quello che ti serve.', valore: b.situazione,
    alCambio: (t) => { b.situazione = t; cambiato(); },
  });
  const blocSit = h('div', { class: `apribile ${b.sitAperta ? 'open' : ''}` },
    h('div', null, h('label', { class: 'sub serif', for: 'nv-situazione', style: 'display:block' }, 'Cosa è successo?'), situazione));
  const rigaSit = h('div', { class: `chiudibile ${b.sitAperta ? 'gone' : ''}` },
    h('div', null, h('button', {
      class: 'frow',
      type: 'button',
      onclick: () => {
        b.sitAperta = true;
        rigaSit.classList.add('gone');
        blocSit.classList.add('open');
        situazione.focus({ preventScroll: true });
        mostraCampo(situazione);
        salvaBozza();
      },
    }, '+ Aggiungi cosa è successo')));

  // --- Emozioni e cursori
  const cursori = h('div', { class: 'sliders' });
  const nodiCursore = new Map();
  function aggiungiCursore(em) {
    const n = cursore({ nome: em.nome, valore: em.intensita, alCambio: (x) => { em.intensita = x; cambiato(); } });
    nodiCursore.set(em.nome, n);
    cursori.append(n);
    return n;
  }
  b.emozioni.forEach(aggiungiCursore);
  cursori.hidden = !b.emozioni.length;

  const emozioni = gruppoScelte({
    elenco: S.elenchi.emozioni,
    scelte: b.emozioni.map((e) => e.nome),
    alCambio: (_, nome, on) => {
      if (on) {
        const em = { nome, intensita: null };
        b.emozioni.push(em);
        cursori.hidden = false;
        const n = aggiungiCursore(em);
        setTimeout(() => n.scrollIntoView({ block: 'nearest', behavior: riduciMovimento() ? 'auto' : 'smooth' }), 40);
      } else {
        b.emozioni = b.emozioni.filter((e) => e.nome !== nome);
        nodiCursore.get(nome)?.remove();
        nodiCursore.delete(nome);
        cursori.hidden = !b.emozioni.length;
      }
      cambiato();
    },
    alAggiungi: () => aggiungiAElenco('emozioni', 'Aggiungi emozione'),
  });

  const categorie = gruppoScelte({
    elenco: S.elenchi.categorie,
    scelte: b.categorie,
    alCambio: (l) => { b.categorie = l; cambiato(); },
    alAggiungi: () => aggiungiAElenco('categorie', 'Aggiungi categoria'),
  });

  // --- Corpo
  const corpo = h('div', { class: 'body', 'data-scorre': '' },
    h('label', { class: 'q serif', for: 'nv-pensiero' }, 'Cosa ho pensato?'),
    pensiero,
    h('p', { class: 'help su-pensiero' }, S.aiuto),
    rigaSit, blocSit,
    h('h2', { class: 'sub serif' }, 'Cosa ho provato?'), emozioni, cursori,
    h('h2', { class: 'sub serif' }, 'Di cosa si tratta?'), categorie);

  corpo.addEventListener('scroll', () => testata.classList.toggle('line', corpo.scrollTop > 4), { passive: true });
  scorrereChiudeTastiera(corpo);

  // --- Salva
  const btnSalva = h('button', { class: 'btn save', type: 'button', onclick: () => salva() }, 'Salva');
  const piede = h('footer', { class: 'foot' }, btnSalva);
  function aggiornaSalva() {
    const si = salvabile();
    btnSalva.disabled = !si;
    btnSalva.className = `btn save ${si ? 'pri' : 'off'}`;
  }
  aggiornaSalva();

  const sheet = h('section', { class: 'sheet', 'aria-label': 'Nuova voce', role: 'dialog' },
    h('div', { class: 'orb sh' }), h('div', { class: 'grab' }), testata, corpo, piede);
  const velo = h('div', { class: 'velo', onclick: () => tentaChiusura() });
  radice().append(velo, sheet);
  sotto.inert = true;

  void sheet.offsetWidth;
  requestAnimationFrame(() => {
    velo.classList.add('on');
    sheet.classList.add('on');
    sotto.classList.add('ridotto');
  });

  // --- Trascinamento verso il basso
  gestoGiu({
    testata,
    contenuto: corpo,
    alMuovere: (dy) => {
      if (riduciMovimento()) return;
      const p = Math.min(1, dy / sheet.offsetHeight);
      sheet.classList.add('segue');
      velo.style.transition = 'none';
      sotto.style.transition = 'none';
      sheet.style.transform = `translateY(${dy}px)`;
      velo.style.opacity = String(1 - p);
      sotto.style.transform = `scale(${0.955 + 0.045 * p})`;
    },
    alRilascio: (dy, velocita) => {
      sheet.classList.remove('segue');
      velo.style.transition = '';
      sotto.style.transition = '';
      void sheet.offsetWidth;
      sheet.style.transform = '';
      velo.style.opacity = '';
      sotto.style.transform = '';
      if (dy > 90 || (dy > 24 && velocita > 0.6)) tentaChiusura();
    },
  });

  // --- Uscita
  function chiudi() {
    document.activeElement?.blur?.();
    clearTimeout(timerBozza);
    aperta = false;
    velo.classList.remove('on');
    sheet.classList.remove('on');
    sotto.classList.remove('ridotto');
    sotto.inert = false;
    sheet.inert = true;
    setTimeout(() => { sheet.remove(); velo.remove(); }, riduciMovimento() ? 150 : 420);
  }

  async function tentaChiusura() {
    if (!toccata()) {
      S.bozza = null;
      salvaMeta('bozza', null).catch(() => {});
      chiudi();
      return;
    }
    const scelta = await conferma({
      titolo: 'Eliminare questa voce?',
      pulsanti: [
        { testo: 'Elimina', valore: 'elimina' },
        { testo: 'Continua a scrivere', tipo: 'pri', valore: null },
      ],
    });
    if (scelta !== 'elimina') return;
    clearTimeout(timerBozza);
    S.bozza = null;
    salvaMeta('bozza', null).catch(() => {});
    chiudi();
  }

  async function salva() {
    if (!salvabile()) return;
    const ora = new Date().toISOString();
    const v = {
      id: nuovoId(),
      quando: b.quando,
      creata: ora,
      modificata: ora,
      pensiero: pulito(b.pensiero),
      situazione: pulito(b.situazione),
      fine: '',
      categorie: b.categorie,
      emozioni: b.emozioni,
      sensazioni: [],
      comportamenti: [],
      altro: {},
    };
    clearTimeout(timerBozza);
    try {
      await salvaVoce(v);
    } catch {
      mostraErrore();
      return;
    }
    S.bozza = null;
    salvaMeta('bozza', null).catch(() => {});
    chiudi();
    aggiornaViste({ evidenzia: v.id });
    messaggio('Voce salvata', { azione: 'Completa ora', alAzione: () => apriVoce(v.id), durata: 5000, basso: false });
  }

  function mostraErrore() {
    piede.classList.add('tall');
    corpo.classList.add('errore');
    svuota(piede, h('div', { class: 'note-line' }, 'Salvataggio non riuscito. Il testo è ancora qui.'), btnSalva);
    btnSalva.textContent = 'Riprova';
  }
}
