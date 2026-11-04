import { S, creaBackup, ripristina, salvaElenchi, salvaMeta } from './dati.js';
import { backupValido, perInputData, tempoBackup } from './logica.js';
import { chiediNome, condividiFile, conferma, h, icona, leggiJson, messaggio, scegliFile, svuota } from './ui.js';
import { aggiornaViste, apriPagina, chiudiPagina } from './nav.js';
import { applicaAspetto } from './aspetto.js';

const ELENCHI = [['categorie', 'Categorie', 'categoria'], ['emozioni', 'Emozioni', 'emozione'], ['sensazioni', 'Sensazioni del corpo', 'sensazione'], ['comportamenti', 'Comportamenti', 'comportamento']];

const testata = (titolo) => [
  h('div', { class: 'orb sm' }), h('div', { class: 'orb2 sm' }),
  h('div', { class: 'subhead' }, h('button', { class: 'back', type: 'button', onclick: chiudiPagina }, icona('chevron-left'), 'Indietro')),
  h('h1', { class: 'subtitle serif' }, titolo),
];

export function apriImpostazioni() {
  const segmenti = h('div', { class: 'seg' });
  function disegnaAspetto() {
    svuota(segmenti, [['auto', 'Automatico'], ['chiaro', 'Chiaro'], ['scuro', 'Scuro']].map(([k, t]) => h('button', {
      class: S.aspetto === k ? 'on' : '',
      type: 'button',
      'aria-pressed': String(S.aspetto === k),
      onclick: async () => {
        await salvaMeta('aspetto', k).catch(() => {});
        applicaAspetto(k);
        disegnaAspetto();
      },
    }, t)));
  }
  disegnaAspetto();

  const infoBackup = h('div', { class: 'lrow info' }, tempoBackup(S.ultimoBackup));

  async function creaFileBackup() {
    const ora = new Date();
    const dati = JSON.stringify({ ...creaBackup(), ultimoBackup: ora.toISOString() }, null, 1);
    const ok = await condividiFile(`diario-backup-${perInputData(ora)}.json`, dati);
    if (!ok) return;
    await salvaMeta('ultimoBackup', ora.toISOString()).catch(() => {});
    infoBackup.textContent = tempoBackup(S.ultimoBackup);
    messaggio('Backup creato.');
  }

  async function ripristinaDaFile() {
    const file = await scegliFile();
    if (!file) return;
    const dati = await leggiJson(file);
    if (!backupValido(dati)) {
      messaggio('Questo file non è un backup di Diario.');
      return;
    }
    const s = await conferma({
      titolo: 'Ripristinare questo backup?',
      testo: 'I dati attuali verranno sostituiti.',
      pulsanti: [{ testo: 'Ripristina', valore: 'si' }, { testo: 'Annulla', tipo: 'pri', valore: null }],
    });
    if (s !== 'si') return;
    try {
      await ripristina(dati);
    } catch {
      messaggio('Ripristino non riuscito. I dati non sono cambiati.');
      return;
    }
    applicaAspetto(S.aspetto);
    disegnaAspetto();
    infoBackup.textContent = tempoBackup(S.ultimoBackup);
    aggiornaViste();
    messaggio('Backup ripristinato.');
  }

  apriPagina(h('section', { class: 'pagina', 'aria-label': 'Impostazioni' },
    testata('Impostazioni'),
    h('main', { class: 'set', 'data-scorre': '' },
      h('h2', null, 'Aspetto'), segmenti,
      h('h2', null, 'Elenchi'),
      h('div', { class: 'card' }, ELENCHI.map(([k, t, s]) => h('button', { class: 'lrow', type: 'button', onclick: () => apriElenco(k, t, s) }, h('span', null, t), icona('chevron-right')))),
      h('h2', null, 'Backup'),
      h('div', { class: 'card' }, infoBackup,
        h('button', { class: 'lrow act', type: 'button', onclick: creaFileBackup }, h('span', null, 'Crea backup')),
        h('button', { class: 'lrow act', type: 'button', onclick: ripristinaDaFile }, h('span', null, 'Ripristina da backup'))),
      h('p', { class: 'nota' }, 'I dati restano solo su questo iPhone.'))));
}

function apriElenco(chiave, titolo, singolare) {
  const lista = h('div', { class: 'card' });

  async function salvaLista(nuova) {
    try {
      await salvaElenchi({ ...S.elenchi, [chiave]: nuova });
      disegna();
    } catch {
      messaggio('Salvataggio non riuscito.');
    }
  }
  const presente = (nome, tranne) => S.elenchi[chiave].some((x) => x !== tranne && x.toLowerCase() === nome.toLowerCase());

  function disegna() {
    svuota(lista, S.elenchi[chiave].map((nome) => h('div', { class: 'erow' },
      h('span', null, nome),
      h('button', {
        type: 'button',
        'aria-label': `Rinomina ${nome}`,
        onclick: async () => {
          const n = await chiediNome({ titolo: 'Rinomina', azione: 'Rinomina', valore: nome });
          if (!n || n === nome || presente(n, nome)) return;
          salvaLista(S.elenchi[chiave].map((x) => (x === nome ? n : x)));
        },
      }, icona('pencil')),
      h('button', {
        type: 'button',
        'aria-label': `Elimina ${nome}`,
        onclick: async () => {
          const s = await conferma({
            titolo: `Eliminare «${nome}» dall'elenco?`,
            testo: 'Le voci già scritte non cambiano.',
            pulsanti: [{ testo: 'Elimina', valore: 'si' }, { testo: 'Annulla', tipo: 'pri', valore: null }],
          });
          if (s === 'si') salvaLista(S.elenchi[chiave].filter((x) => x !== nome));
        },
      }, icona('x')))));
  }
  disegna();

  apriPagina(h('section', { class: 'pagina', 'aria-label': titolo },
    testata(titolo),
    h('main', { class: 'set con-pulsante', 'data-scorre': '' },
      h('p', { class: 'nota', style: 'margin-top:0;margin-bottom:8px' }, 'Le voci già scritte non cambiano.'),
      lista),
    h('div', { class: 'dock' }),
    h('div', { class: 'addbtn' }, h('button', {
      class: 'btn pri',
      type: 'button',
      onclick: async () => {
        const n = await chiediNome({ titolo: `Aggiungi ${singolare}`, azione: 'Aggiungi' });
        if (n && !presente(n)) salvaLista([...S.elenchi[chiave], n]);
      },
    }, '+ Aggiungi'))));
}
