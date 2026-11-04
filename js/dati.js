// Salvataggio sul telefono (IndexedDB). In memoria c'è sempre una copia aggiornata.

const NOME = 'diario';

const ELENCHI_BASE = {
  categorie: ['Corpo', 'Salute', 'Sonno', 'Lavoro o studio', 'Relazioni', 'Famiglia', 'Altro'],
  emozioni: ['Paura', 'Ansia', 'Tristezza', 'Rabbia', 'Senso di colpa', 'Vergogna', 'Frustrazione', 'Sollievo'],
  sensazioni: ['Battito accelerato', 'Capogiro', 'Tensione muscolare', 'Tremore', 'Sudore', 'Nausea'],
  comportamenti: ['Ho cercato rassicurazione su internet', 'Ho chiesto rassicurazione a qualcuno', 'Ho evitato o rinunciato', 'Sono uscito dalla situazione', 'Mi sono distratto', 'Sono rimasto e ho aspettato', 'Ne ho parlato con qualcuno', 'Altro'],
};

const AIUTO_BASE = 'Meglio preciso: «Ho pensato che avrei perso il treno», non «Che sarebbe andato tutto male».';

export const S = {
  voci: [],
  elenchi: copia(ELENCHI_BASE),
  aiuto: AIUTO_BASE,
  sedute: [],
  aspetto: 'auto',
  ultimoBackup: null,
  avviato: false,
  bozza: null,
};

function copia(x) { return JSON.parse(JSON.stringify(x)); }

let db;

function apri() {
  return new Promise((ok, ko) => {
    const r = indexedDB.open(NOME, 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore('voci', { keyPath: 'id' });
      r.result.createObjectStore('meta', { keyPath: 'k' });
    };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
  });
}

function fatto(tx) {
  return new Promise((ok, ko) => {
    tx.oncomplete = () => ok();
    tx.onerror = () => ko(tx.error);
    tx.onabort = () => ko(tx.error);
  });
}

const leggi = (r) => new Promise((ok, ko) => { r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });

export async function carica() {
  db = await apri();
  const tx = db.transaction(['voci', 'meta']);
  const [voci, meta] = await Promise.all([leggi(tx.objectStore('voci').getAll()), leggi(tx.objectStore('meta').getAll())]);
  S.voci = voci;
  for (const { k, v } of meta) if (k in S) S[k] = v;
  try { navigator.storage?.persist?.(); } catch { /* facoltativo */ }
}

export async function salvaMeta(k, v) {
  const tx = db.transaction('meta', 'readwrite');
  tx.objectStore('meta').put({ k, v });
  await fatto(tx);
  S[k] = v;
}

export async function salvaVoce(voce) {
  const tx = db.transaction('voci', 'readwrite');
  tx.objectStore('voci').put(copia(voce));
  await fatto(tx);
  const i = S.voci.findIndex((x) => x.id === voce.id);
  if (i >= 0) S.voci[i] = copia(voce); else S.voci.push(copia(voce));
}

export async function eliminaVoce(id) {
  const tx = db.transaction('voci', 'readwrite');
  tx.objectStore('voci').delete(id);
  await fatto(tx);
  S.voci = S.voci.filter((x) => x.id !== id);
}

export async function salvaElenchi(elenchi, aiuto) {
  const tx = db.transaction('meta', 'readwrite');
  const m = tx.objectStore('meta');
  m.put({ k: 'elenchi', v: elenchi });
  if (aiuto !== undefined) m.put({ k: 'aiuto', v: aiuto });
  await fatto(tx);
  S.elenchi = elenchi;
  if (aiuto !== undefined) S.aiuto = aiuto;
}

export function creaBackup() {
  return {
    tipo: 'diario-backup',
    versione: 1,
    creato: new Date().toISOString(),
    voci: copia(S.voci),
    elenchi: copia(S.elenchi),
    aiuto: S.aiuto,
    sedute: copia(S.sedute),
    aspetto: S.aspetto,
    ultimoBackup: S.ultimoBackup,
  };
}

// Sostituisce tutto in un'unica operazione: se qualcosa va storto, i dati restano com'erano.
export async function ripristina(b) {
  const tx = db.transaction(['voci', 'meta'], 'readwrite');
  const v = tx.objectStore('voci');
  const m = tx.objectStore('meta');
  v.clear();
  m.clear();
  for (const x of b.voci) v.put(x);
  const nuovi = {
    elenchi: b.elenchi,
    aiuto: typeof b.aiuto === 'string' ? b.aiuto : AIUTO_BASE,
    sedute: Array.isArray(b.sedute) ? b.sedute : [],
    aspetto: ['auto', 'chiaro', 'scuro'].includes(b.aspetto) ? b.aspetto : 'auto',
    ultimoBackup: b.ultimoBackup || null,
    avviato: true,
    bozza: null,
  };
  for (const [k, val] of Object.entries(nuovi)) m.put({ k, v: val });
  await fatto(tx);
  S.voci = copia(b.voci);
  Object.assign(S, copia(nuovi));
}

export function nuovoId() {
  return crypto.randomUUID ? crypto.randomUUID() : `v${Date.now()}${Math.random().toString(36).slice(2)}`;
}
