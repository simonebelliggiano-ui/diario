// Regole del diario: nessun accesso allo schermo o ai dati salvati.

export const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
export const GIORNI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

export const pulito = (s) => (s || '').trim();

// ---------- Stato della voce ----------

export function mancano(v) {
  const m = [];
  if (!pulito(v.situazione)) m.push('cosa è successo');
  if (!pulito(v.pensiero)) m.push('cosa ho pensato');
  if (!(v.emozioni || []).some((e) => e.intensita != null)) m.push('emozione con intensità');
  if (!(v.comportamenti || []).length) m.push('cosa ho fatto per difendermi');
  return m;
}

export const completa = (v) => mancano(v).length === 0;

export function emozionePrincipale(v) {
  let top = null;
  for (const e of v.emozioni || []) {
    if (e.intensita == null) continue;
    if (!top || e.intensita > top.intensita) top = e;
  }
  return top;
}

export const ordina = (voci) => [...voci].sort((a, b) => new Date(b.quando) - new Date(a.quando));

// ---------- Date ----------

export const inizioGiorno = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const fineGiorno = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

// Conta i giorni di calendario, primo e ultimo compresi.
export function giorniCompresi(da, a) {
  const u = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((u(a) - u(da)) / 86400000) + 1;
}

const stessoGiorno = (a, b) => giorniCompresi(a, b) === 1;
const oraTesto = (d) => `${d.getHours() === 0 ? '00' : d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
const breve = (d) => MESI[d.getMonth()].slice(0, 3);

export const dataLunga = (d) => `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}`;
export const dataCampo = (d) => `${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`;

// Valori per i selettori nativi, in ora locale.
const p2 = (n) => String(n).padStart(2, '0');
export const perInputData = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const perInputOra = (d) => `${perInputData(d)}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
export function daInputData(s) {
  const [a, m, g] = s.split('-').map(Number);
  return new Date(a, m - 1, g);
}

// "Oggi, 18:10" · "Ieri, 23:40" · "Lunedì, 22:05" · "28 ott, 9:30"
export function etichettaOra(iso, ora = new Date()) {
  const d = new Date(iso);
  return `${etichettaGiornoBreve(d, ora)}, ${oraTesto(d)}`;
}

function etichettaGiornoBreve(d, ora) {
  const n = giorniCompresi(d, ora);
  if (n === 1) return 'Oggi';
  if (n === 2) return 'Ieri';
  if (n > 2 && n <= 7) return GIORNI[d.getDay()];
  const anno = d.getFullYear() === ora.getFullYear() ? '' : ` ${d.getFullYear()}`;
  return `${d.getDate()} ${breve(d)}${anno}`;
}

// Intestazione dei gruppi in Archivio.
export function etichettaGiorno(iso, ora = new Date()) {
  const d = new Date(iso);
  const n = giorniCompresi(d, ora);
  if (n === 1) return 'Oggi';
  if (n === 2) return 'Ieri';
  const anno = d.getFullYear() === ora.getFullYear() ? '' : ` ${d.getFullYear()}`;
  return `${dataLunga(d)}${anno}`;
}

export const soloOra = (iso) => oraTesto(new Date(iso));

export function tempoBackup(iso, ora = new Date()) {
  if (!iso) return 'Nessun backup';
  const n = giorniCompresi(new Date(iso), ora) - 1;
  if (n <= 0) return 'Ultimo backup: oggi';
  if (n === 1) return 'Ultimo backup: ieri';
  return `Ultimo backup: ${n} giorni fa`;
}

// "28 ott – 4 nov"
export function intervalloBreve(da, a) {
  return `${da.getDate()} ${breve(da)} – ${a.getDate()} ${breve(a)}`;
}

// ---------- Filtri di Archivio ----------

export function filtra(voci, f, ora = new Date()) {
  let da = null;
  let a = null;
  if (f.periodo === 'settimana') {
    const oggi = inizioGiorno(ora);
    const dalLunedi = (oggi.getDay() + 6) % 7;
    da = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() - dalLunedi);
  } else if (f.periodo === 'mese') {
    da = new Date(ora.getFullYear(), ora.getMonth(), 1);
  } else if (f.periodo === 'date' && f.dal && f.al) {
    da = inizioGiorno(f.dal);
    a = fineGiorno(f.al);
  }
  return voci.filter((v) => {
    const q = new Date(v.quando);
    if (da && q < da) return false;
    if (a && q > a) return false;
    if (f.categorie && f.categorie.length && !v.categorie.some((c) => f.categorie.includes(c))) return false;
    if (f.soloDaCompletare && completa(v)) return false;
    return true;
  });
}

// ---------- Seduta ----------

function testoDal(d, ora) {
  const anno = d.getFullYear() === ora.getFullYear() ? '' : ` ${d.getFullYear()}`;
  return `${d.getDate()} ${MESI[d.getMonth()]}${anno}`;
}

const contaGiorni = (n) => (n === 1 ? '1 giorno' : `${n} giorni`);

// La soglia dell'ultima seduta è un istante: vale per le voci da lì in poi.
export function periodoSeduta(voci, ultimaSeduta, scelta, ora = new Date()) {
  if (scelta) {
    const da = inizioGiorno(scelta.dal);
    const a = fineGiorno(scelta.al);
    const voltaOggi = stessoGiorno(a, ora);
    const fine = voltaOggi ? 'a oggi' : `al ${testoDal(a, ora)}`;
    return {
      etichetta: `Dal ${testoDal(da, ora)} ${fine} · ${contaGiorni(giorniCompresi(da, a))}`,
      voci: ordina(voci.filter((v) => { const q = new Date(v.quando); return q >= da && q <= a; })),
      da,
      a,
    };
  }
  if (ultimaSeduta) {
    const da = new Date(ultimaSeduta);
    return {
      etichetta: `Dal ${testoDal(da, ora)} a oggi · ${contaGiorni(giorniCompresi(da, ora))}`,
      voci: ordina(voci.filter((v) => new Date(v.quando) >= da)),
      da,
      a: ora,
    };
  }
  return { etichetta: 'Dalla prima voce a oggi', voci: ordina(voci), da: null, a: ora };
}

function classifica(valori) {
  const conta = new Map();
  for (const x of valori) conta.set(x, (conta.get(x) || 0) + 1);
  return [...conta.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'it'))
    .slice(0, 3);
}

export function statistiche(voci) {
  const intensita = voci.flatMap((v) => v.emozioni.filter((e) => e.intensita != null).map((e) => e.intensita));
  const media = intensita.length ? intensita.reduce((s, x) => s + x, 0) / intensita.length : null;
  return {
    totale: voci.length,
    daCompletare: voci.filter((v) => !completa(v)).length,
    media: media == null ? null : media.toFixed(1).replace('.', ','),
    categorie: classifica(voci.flatMap((v) => v.categorie)),
    emozioni: classifica(voci.flatMap((v) => v.emozioni.map((e) => e.nome))),
    comportamenti: classifica(voci.flatMap((v) => v.comportamenti)),
  };
}

// ---------- Esportazione ----------

const elenco = (titolo, righe) => (righe.length ? [`${titolo}: ${righe.map(([n, c]) => `${n} (${c})`).join(', ')}`] : []);

export function testoEsportazione(periodo, ora = new Date()) {
  const s = statistiche(periodo.voci);
  const r = [`Diario – ${periodo.etichetta}`, ''];
  r.push(`Voci: ${s.totale}, di cui ${s.daCompletare} da completare`);
  if (s.media) r.push(`Intensità media: ${s.media}`);
  r.push(...elenco('Categorie più frequenti', s.categorie));
  r.push(...elenco('Emozioni più frequenti', s.emozioni));
  r.push(...elenco('Cosa ho fatto più spesso per difendermi', s.comportamenti));
  for (const v of periodo.voci) {
    r.push('', `— ${etichettaOra(v.quando, ora)}`);
    if (v.categorie.length) r.push(`Categorie: ${v.categorie.join(', ')}${v.altro?.categoria ? ` (${v.altro.categoria})` : ''}`);
    if (pulito(v.situazione)) r.push(`Cosa è successo: ${pulito(v.situazione)}`);
    if (pulito(v.pensiero)) r.push(`Cosa ho pensato: ${pulito(v.pensiero)}`);
    if (v.emozioni.length) r.push(`Cosa ho provato: ${v.emozioni.map((e) => (e.intensita == null ? e.nome : `${e.nome} ${e.intensita}`)).join(', ')}`);
    if (v.sensazioni.length) r.push(`Sensazioni nel corpo: ${v.sensazioni.join(', ')}`);
    if (v.comportamenti.length) r.push(`Cosa ho fatto per difendermi: ${v.comportamenti.join(', ')}${v.altro?.comportamento ? ` (${v.altro.comportamento})` : ''}`);
    if (pulito(v.fine)) r.push(`Com'è finita: ${pulito(v.fine)}`);
    if (!completa(v)) r.push('Da completare');
  }
  return r.join('\n');
}

// ---------- File di backup e di elenchi ----------

const listaTesti = (x) => Array.isArray(x) && x.every((t) => typeof t === 'string');

export function elenchiValidi(e) {
  return !!e && ['categorie', 'emozioni', 'sensazioni', 'comportamenti'].every((k) => listaTesti(e[k]) && e[k].length > 0);
}

export function voceValida(v) {
  return !!v && typeof v.id === 'string' && !isNaN(new Date(v.quando)) &&
    listaTesti(v.categorie) && listaTesti(v.sensazioni) && listaTesti(v.comportamenti) &&
    Array.isArray(v.emozioni) && v.emozioni.every((e) => e && typeof e.nome === 'string' && (e.intensita == null || (Number.isInteger(e.intensita) && e.intensita >= 0 && e.intensita <= 10)));
}

export function backupValido(b) {
  return !!b && b.tipo === 'diario-backup' && Array.isArray(b.voci) && b.voci.every(voceValida) && elenchiValidi(b.elenchi);
}

export function fileElenchiValido(f) {
  return !!f && f.tipo === 'diario-elenchi' && elenchiValidi(f);
}
