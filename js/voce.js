// Voce: completamento e modifica. Le modifiche si salvano da sole.
import { S, eliminaVoce, salvaVoce } from './dati.js';
import { etichettaOra, mancano, perInputOra } from './logica.js';
import { campoTesto, conferma, cursore, gruppoScelte, h, icona, messaggio, metaCerchio, scorrereChiudeTastiera, svuota } from './ui.js';
import { aggiungiAElenco } from './comuni.js';
import { aggiornaViste, apriPagina, chiudiPagina } from './nav.js';

let salvaInSospeso = null;

// Salva subito ciò che è in attesa, per esempio quando l'app va in secondo piano.
export function salvaOra() { salvaInSospeso?.(); }

export function apriVoce(id) {
  const orig = S.voci.find((x) => x.id === id);
  if (!orig) return;
  const v = JSON.parse(JSON.stringify(orig));
  v.altro = v.altro || {};

  // --- Salvataggio automatico
  let timer = null;
  let timerSalvato = null;
  const salvato = h('span', { class: 'saved' }, icona('check'), 'Salvato');
  async function scrivi() {
    clearTimeout(timer);
    timer = null;
    salvaInSospeso = null;
    v.modificata = new Date().toISOString();
    try {
      await salvaVoce(v);
      salvato.classList.add('on');
      clearTimeout(timerSalvato);
      timerSalvato = setTimeout(() => salvato.classList.remove('on'), 2000);
      aggiornaViste();
    } catch {
      messaggio('Salvataggio non riuscito. Il testo è ancora qui.');
    }
  }
  function cambiato() {
    aggiornaMancano();
    clearTimeout(timer);
    timer = setTimeout(scrivi, 400);
    salvaInSospeso = scrivi;
  }

  // --- Testata
  const testoData = h('span', null, etichettaOra(v.quando));
  const data = h('div', { class: 'v-date' }, testoData, icona('chevron-down', 'down'),
    h('input', {
      class: 'sovra',
      type: 'datetime-local',
      'aria-label': 'Cambia data e ora',
      value: perInputOra(new Date(v.quando)),
      onchange: (e) => {
        if (!e.target.value) return;
        v.quando = new Date(e.target.value).toISOString();
        testoData.textContent = etichettaOra(v.quando);
        cambiato();
      },
    }));
  const testata = h('header', { class: 'v-head' },
    h('button', { class: 'back', type: 'button', onclick: chiudiPagina }, icona('chevron-left'), 'Indietro'),
    data, salvato);

  // --- Cosa manca
  const miss = h('div', { class: 'miss' });
  function aggiornaMancano() {
    const m = mancano(v);
    miss.hidden = !m.length;
    if (m.length) svuota(miss, metaCerchio(), h('span', null, h('b', null, 'Da completare'), ` · Mancano: ${m.join(', ')}`));
  }
  aggiornaMancano();

  // --- Campo "Altro"
  function campoAltro(chiave, lista) {
    const c = campoTesto({ classe: 'one', suggerimento: 'Scrivi qui', valore: v.altro[chiave] || '', etichetta: 'Altro', alCambio: (t) => { v.altro[chiave] = t; cambiato(); } });
    const box = h('div', { class: `apribile ${lista().includes('Altro') ? 'open' : ''}` }, h('div', null, c));
    return { box, aggiorna: () => box.classList.toggle('open', lista().includes('Altro')) };
  }

  // --- Categorie: chiuse mostrano solo le scelte
  const altroCat = campoAltro('categoria', () => v.categorie);
  const riassunto = h('div', { class: 'chips after' });
  const blocRiassunto = h('div', { class: 'chiudibile' }, h('div', null, riassunto));
  const elencoCat = gruppoScelte({
    elenco: S.elenchi.categorie,
    scelte: v.categorie,
    alCambio: (l) => { v.categorie = l; altroCat.aggiorna(); disegnaRiassunto(); cambiato(); },
    alAggiungi: () => aggiungiAElenco('categorie', 'Aggiungi categoria'),
  });
  elencoCat.classList.add('after');
  elencoCat.append(h('button', { class: 'chip', type: 'button', onclick: () => apriCat(false) }, 'Chiudi'));
  const blocElenco = h('div', { class: 'apribile' }, h('div', null, elencoCat));
  function apriCat(si) {
    blocRiassunto.classList.toggle('gone', si);
    blocElenco.classList.toggle('open', si);
  }
  function disegnaRiassunto() {
    svuota(riassunto,
      v.categorie.map((c) => h('span', { class: 'chip on fissa' }, c)),
      h('button', { class: 'chip', type: 'button', onclick: () => apriCat(true) }, v.categorie.length ? 'Cambia' : 'Scegli', icona('chevron-down', 'down')));
  }
  disegnaRiassunto();

  // --- Emozioni
  const cursori = h('div', { class: 'sliders' });
  const nodi = new Map();
  function aggiungiCursore(em) {
    const n = cursore({ nome: em.nome, valore: em.intensita, alCambio: (x) => { em.intensita = x; cambiato(); } });
    nodi.set(em.nome, n);
    cursori.append(n);
    return n;
  }
  v.emozioni.forEach(aggiungiCursore);
  cursori.hidden = !v.emozioni.length;
  const emozioni = gruppoScelte({
    elenco: S.elenchi.emozioni,
    scelte: v.emozioni.map((e) => e.nome),
    alCambio: (_, nome, on) => {
      if (on) {
        const em = { nome, intensita: null };
        v.emozioni.push(em);
        cursori.hidden = false;
        const n = aggiungiCursore(em);
        setTimeout(() => n.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 40);
      } else {
        v.emozioni = v.emozioni.filter((e) => e.nome !== nome);
        nodi.get(nome)?.remove();
        nodi.delete(nome);
        cursori.hidden = !v.emozioni.length;
      }
      cambiato();
    },
    alAggiungi: () => aggiungiAElenco('emozioni', 'Aggiungi emozione'),
  });

  const sensazioni = gruppoScelte({
    elenco: S.elenchi.sensazioni,
    scelte: v.sensazioni,
    alCambio: (l) => { v.sensazioni = l; cambiato(); },
    alAggiungi: () => aggiungiAElenco('sensazioni', 'Aggiungi sensazione'),
  });

  const altroCom = campoAltro('comportamento', () => v.comportamenti);
  const comportamenti = gruppoScelte({
    elenco: S.elenchi.comportamenti,
    scelte: v.comportamenti,
    alCambio: (l) => { v.comportamenti = l; altroCom.aggiorna(); cambiato(); },
    alAggiungi: () => aggiungiAElenco('comportamenti', 'Aggiungi comportamento'),
  });

  // --- Corpo
  const corpo = h('div', { class: 'v-body', 'data-scorre': '' },
    miss,
    h('h2', { class: 'sub2 serif' }, 'Cosa è successo?'),
    campoTesto({ classe: 'm-b', suggerimento: 'Dove eri, cosa facevi, con chi. Scrivi tutto quello che ti serve.', valore: v.situazione, etichetta: 'Cosa è successo?', alCambio: (t) => { v.situazione = t; cambiato(); } }),
    blocRiassunto, blocElenco, altroCat.box,
    h('h2', { class: 'sub2 serif' }, 'Cosa ho pensato?'),
    campoTesto({ classe: 'm-p', suggerimento: 'Scrivi la frase come ti è venuta in mente', valore: v.pensiero, etichetta: 'Cosa ho pensato?', alCambio: (t) => { v.pensiero = t; cambiato(); } }),
    h('h2', { class: 'sub2 serif' }, 'Cosa ho provato?'), emozioni, cursori,
    h('h2', { class: 'sub2 serif' }, 'Sensazioni nel corpo'), sensazioni,
    h('h2', { class: 'sub2 serif' }, 'Cosa ho fatto per difendermi?'),
    h('p', { class: 'help', style: 'margin-bottom:8px' }, 'Per esempio: ho cercato rassicurazione su internet. Se non hai fatto nulla, scegli «Sono rimasto e ho aspettato».'),
    comportamenti, altroCom.box,
    h('h2', { class: 'sub2 serif' }, "Com'è finita?"),
    campoTesto({ classe: 'm-f', suggerimento: 'Quanto è durato, cosa è successo dopo.', valore: v.fine, etichetta: "Com'è finita?", alCambio: (t) => { v.fine = t; cambiato(); } }),
    h('button', { class: 'quiet del', type: 'button', onclick: elimina }, 'Elimina voce'));
  scorrereChiudeTastiera(corpo);
  corpo.addEventListener('scroll', () => corpo.classList.toggle('line', corpo.scrollTop > 4), { passive: true });

  const pagina = h('section', { class: 'pagina', 'aria-label': 'Voce' },
    h('div', { class: 'orb sm' }), h('div', { class: 'orb2 sm' }),
    testata, corpo,
    h('footer', { class: 'foot' }, h('button', { class: 'btn pri save', type: 'button', onclick: chiudiPagina }, 'Fine')));

  async function elimina() {
    const s = await conferma({
      titolo: 'Eliminare questa voce?',
      affiancati: false,
      pulsanti: [{ testo: 'Elimina', valore: 'si' }, { testo: 'Annulla', tipo: 'pri', valore: null }],
    });
    if (s !== 'si') return;
    clearTimeout(timer);
    salvaInSospeso = null;
    timer = null;
    try {
      await eliminaVoce(v.id);
    } catch {
      messaggio('Eliminazione non riuscita.');
      return;
    }
    chiudiPagina();
    aggiornaViste();
  }

  apriPagina(pagina, {
    allaChiusura: () => {
      document.activeElement?.blur?.();
      if (timer) scrivi();
      else aggiornaViste();
    },
  });

}
