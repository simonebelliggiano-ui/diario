// Primo avvio: installazione sulla Home ed elenchi.
import { ripristina, salvaElenchi, salvaMeta } from './dati.js';
import { backupValido, fileElenchiValido } from './logica.js';
import { h, icona, leggiJson, radice, scegliFile, svuota } from './ui.js';

export function schermataInstalla() {
  radice().append(h('div', { class: 'avvio' },
    h('div', { class: 'orb' }), h('div', { class: 'orb2' }),
    h('div', { class: 'hero' }, h('h1', { class: 'serif' }, 'Aggiungi Diario alla schermata Home'), h('p', null, 'Così funziona anche senza internet.')),
    h('div', { class: 'steps' },
      h('div', { class: 'step' }, h('b', null, '1'), h('span', null, 'Tocca Condividi'), icona('share')),
      h('div', { class: 'step' }, h('b', null, '2'), h('span', null, 'Scegli Aggiungi alla schermata Home')),
      h('div', { class: 'step' }, h('b', null, '3'), h('span', null, 'Apri Diario dalla Home')))));
}

export function schermataBenvenuto(alTermine) {
  const box = h('div', { class: 'avvio' });
  radice().append(box);

  const entra = async (msg) => {
    await salvaMeta('avviato', true).catch(() => {});
    box.classList.add('via');
    setTimeout(() => box.remove(), 300);
    alTermine(msg);
  };

  async function importa() {
    const file = await scegliFile();
    if (!file) return;
    const dati = await leggiJson(file);
    try {
      if (fileElenchiValido(dati)) {
        const { categorie, emozioni, sensazioni, comportamenti } = dati;
        await salvaElenchi({ categorie, emozioni, sensazioni, comportamenti }, typeof dati.aiuto === 'string' ? dati.aiuto : undefined);
        entra('Elenchi importati.');
        return;
      }
      if (backupValido(dati)) {
        await ripristina(dati);
        entra('Backup ripristinato.');
        return;
      }
    } catch { /* mostra l'errore qui sotto */ }
    disegna(true);
  }

  function disegna(errore) {
    svuota(box,
      h('div', { class: 'orb' }), h('div', { class: 'orb2' }),
      h('div', { class: 'hero', style: 'top:calc(var(--t) + 111px)' },
        h('h1', { class: 'serif', style: 'font-size:60px;line-height:64px' }, 'Benvenuto'),
        h('p', null, 'I tuoi dati restano solo su questo iPhone.'),
        errore && h('p', { class: 'avviso' }, 'Non riesco a leggere questo file.')),
      h('div', { class: 'acts' },
        h('button', { class: 'btn pri', type: 'button', onclick: importa }, errore ? 'Riprova' : 'Importa i miei elenchi'),
        h('button', { class: 'btn sec', type: 'button', onclick: () => entra() }, 'Inizia con gli elenchi base'),
        h('p', { class: 'nota' }, 'Puoi modificarli quando vuoi nelle Impostazioni.')));
  }
  disegna(false);
}
