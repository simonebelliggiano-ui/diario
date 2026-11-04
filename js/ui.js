// Elementi comuni dell'interfaccia: componenti, finestre, messaggi, gesti.

export const radice = () => document.getElementById('scr');
export const riduciMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function h(tag, props, ...figli) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  aggiungi(el, figli);
  return el;
}

function aggiungi(el, figli) {
  for (const f of figli.flat(Infinity)) {
    if (f == null || f === false) continue;
    el.append(f.nodeType ? f : document.createTextNode(String(f)));
  }
}

export function svuota(el, ...figli) {
  el.replaceChildren();
  aggiungi(el, figli);
  return el;
}

// ---------- Icone (Lucide, licenza ISC) ----------

const TRACCIATI = {
  'book-open': '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  archive: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
  'messages-square': '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  pencil: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  share: '<path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
};

export function icona(nome, classe = '') {
  const t = document.createElement('template');
  t.innerHTML = `<svg class="i ${classe}" viewBox="0 0 24 24" aria-hidden="true">${TRACCIATI[nome]}</svg>`;
  return t.content.firstChild;
}

export function metaCerchio() {
  const t = document.createElement('template');
  t.innerHTML = '<svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.75" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 1.25a4.75 4.75 0 0 1 0 9.5z" fill="currentColor"/></svg>';
  return t.content.firstChild;
}

export const etichettaDaCompletare = () => h('span', { class: 'tag' }, metaCerchio(), 'Da completare');

// ---------- Scelte ----------

// Unisce l'elenco attuale e le parole già scelte, che restano visibili anche se l'elenco è cambiato.
export function gruppoScelte({ elenco, scelte, alCambio, alAggiungi }) {
  const box = h('div', { class: 'chips' });
  const stato = new Set(scelte);
  const nodi = new Map();

  function creaChip(nome) {
    const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', onclick: () => alterna(nome) }, nome);
    nodi.set(nome, b);
    disegna(nome);
    return b;
  }
  function disegna(nome) {
    const b = nodi.get(nome);
    const on = stato.has(nome);
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
    const c = b.querySelector('svg');
    if (on && !c) b.prepend(icona('check'));
    if (!on && c) c.remove();
  }
  function alterna(nome) {
    if (stato.has(nome)) stato.delete(nome); else stato.add(nome);
    disegna(nome);
    alCambio([...stato], nome, stato.has(nome));
  }

  const tutti = [...elenco, ...scelte.filter((x) => !elenco.includes(x))];
  for (const nome of tutti) box.append(creaChip(nome));
  if (alAggiungi) {
    const piu = h('button', {
      class: 'chip add',
      type: 'button',
      onclick: async () => {
        const nome = await alAggiungi();
        if (!nome) return;
        if (!nodi.has(nome)) piu.before(creaChip(nome));
        if (!stato.has(nome)) alterna(nome);
      },
    }, '+ Aggiungi');
    box.append(piu);
  }
  return box;
}

// ---------- Campi di testo che crescono ----------

export function adatta(t) {
  t.style.height = 'auto';
  t.style.height = `${t.scrollHeight + 2}px`;
}

export function campoTesto({ classe = '', suggerimento, valore = '', alCambio, id, etichetta }) {
  const t = h('textarea', {
    class: `field ${classe}`,
    placeholder: suggerimento,
    rows: 1,
    id,
    'aria-label': etichetta,
    oninput: () => { adatta(t); alCambio(t.value); },
    onfocus: () => mostraCampo(t),
  });
  t.value = valore;
  requestAnimationFrame(() => adatta(t));
  return t;
}

// Tiene il campo visibile sopra la tastiera, che su iPhone arriva dopo il tocco.
export function mostraCampo(el) {
  setTimeout(() => {
    const sc = el.closest('[data-scorre]');
    if (!sc) return;
    const rs = sc.getBoundingClientRect();
    const re = el.getBoundingClientRect();
    const altoFoot = sc.parentElement?.querySelector(':scope > .foot')?.offsetHeight || 0;
    const kb = tastiera();
    const fondo = rs.bottom - altoFoot - kb - 12;
    if (re.bottom > fondo) sc.scrollBy({ top: Math.min(re.bottom - fondo, re.top - rs.top - 8), behavior: riduciMovimento() ? 'auto' : 'smooth' });
    else if (re.top < rs.top + 8) sc.scrollBy({ top: re.top - rs.top - 8, behavior: riduciMovimento() ? 'auto' : 'smooth' });
  }, 320);
}

// Apertura di un riquadro con altezza che scorre.
export function sezioneApribile(contenuto, aperta = false) {
  return h('div', { class: `apribile ${aperta ? 'open' : ''}` }, h('div', null, contenuto));
}

// ---------- Cursore dell'intensità ----------

export function cursore({ nome, valore, alCambio }) {
  let v = valore;
  const etichetta = h('span', { class: 'sl-l' });
  const bg = h('span', { class: 't-bg' });
  const fill = h('span', { class: 't-fill' });
  const th = h('span', { class: 't-th' });
  const dots = h('span', { class: 'dots', 'aria-hidden': 'true' }, Array.from({ length: 11 }, () => h('i')));
  const trk = h('div', {
    class: 'trk',
    role: 'slider',
    tabindex: '0',
    'aria-label': `Intensità di ${nome}`,
    'aria-valuemin': '0',
    'aria-valuemax': '10',
  }, bg, fill, th, dots);
  const box = h('div', { class: 'sl' }, etichetta, trk, h('div', { class: 'ends' }, h('span', null, '0'), h('span', null, '10')));

  function disegna() {
    svuota(etichetta, nome, ' · ', v == null ? h('span', null, "Scegli l'intensità") : String(v));
    const vuoto = v == null;
    fill.hidden = vuoto;
    th.hidden = vuoto;
    dots.hidden = !vuoto;
    if (!vuoto) trk.style.setProperty('--p', `calc(14px + (100% - 28px) * ${v / 10})`);
    if (vuoto) trk.removeAttribute('aria-valuenow'); else trk.setAttribute('aria-valuenow', v);
  }
  function imposta(n) {
    if (n === v) return;
    v = n;
    disegna();
    alCambio(v);
  }
  const daX = (x) => {
    const r = trk.getBoundingClientRect();
    return Math.max(0, Math.min(10, Math.round(((x - r.left - 14) / (r.width - 28)) * 10)));
  };

  // Il valore si sceglie al tocco o trascinando in orizzontale. Se la pagina scorre, non cambia nulla.
  let inizio = null;
  trk.addEventListener('pointerdown', (e) => { inizio = e.clientX; trk.setPointerCapture?.(e.pointerId); });
  trk.addEventListener('pointermove', (e) => {
    if (inizio == null) return;
    if (!trk.classList.contains('drag') && Math.abs(e.clientX - inizio) < 4) return;
    trk.classList.add('drag');
    imposta(daX(e.clientX));
  });
  trk.addEventListener('pointerup', (e) => {
    if (inizio == null) return;
    inizio = null;
    trk.classList.remove('drag');
    imposta(daX(e.clientX));
  });
  trk.addEventListener('pointercancel', () => { inizio = null; trk.classList.remove('drag'); });
  trk.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { imposta(Math.min(10, (v ?? -1) + 1)); e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { imposta(Math.max(0, (v ?? 1) - 1)); e.preventDefault(); }
  });

  disegna();
  return box;
}

// ---------- Tastiera di iOS ----------

export function tastiera() {
  return parseInt(getComputedStyle(radice()).getPropertyValue('--kb')) || 0;
}

export function seguiTastiera() {
  const vv = window.visualViewport;
  if (!vv) return;
  const aggiorna = () => {
    const kb = Math.max(0, Math.round(document.documentElement.clientHeight - vv.height - vv.offsetTop));
    radice().style.setProperty('--kb', `${kb}px`);
    radice().classList.toggle('kbopen', kb > 80);
    if (window.scrollY) window.scrollTo(0, 0);
  };
  vv.addEventListener('resize', aggiorna);
  vv.addEventListener('scroll', aggiorna);
  aggiorna();
}

// ---------- Messaggi temporanei ----------

let toastAttivo = null;

export function messaggio(testo, { azione, alAzione, durata = 4000, basso = true } = {}) {
  chiudiMessaggio();
  const el = h('div', { class: `toast ${azione ? '' : 'solo'} ${basso ? 'low' : ''}`, role: 'status' },
    h('span', null, testo),
    azione && h('button', { type: 'button', onclick: () => { chiudiMessaggio(); alAzione(); } }, azione));
  radice().append(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
  const timer = setTimeout(chiudiMessaggio, durata);
  toastAttivo = { el, timer };
}

export function chiudiMessaggio() {
  if (!toastAttivo) return;
  const { el, timer } = toastAttivo;
  toastAttivo = null;
  clearTimeout(timer);
  el.classList.remove('on');
  setTimeout(() => el.remove(), 300);
}

// ---------- Finestre ----------

function velo(alTocco) {
  const v = h('div', { class: 'velo2', onclick: alTocco });
  radice().append(v);
  requestAnimationFrame(() => requestAnimationFrame(() => v.classList.add('on')));
  return v;
}

function chiudiStrato(el, v) {
  el.classList.remove('on');
  v.classList.remove('on');
  setTimeout(() => { el.remove(); v.remove(); }, 300);
}

// Conferma con pulsanti. Restituisce il valore del pulsante toccato.
export function conferma({ titolo, testo, pulsanti, affiancati = false }) {
  return new Promise((ok) => {
    const fine = (x) => { chiudiStrato(d, v); ok(x); };
    const v = velo(() => fine(null));
    const bott = pulsanti.map((p) => h('button', { class: `btn ${p.tipo || 'sec'}`, type: 'button', onclick: () => fine(p.valore) }, p.testo));
    const d = h('div', { class: 'dlg strato', role: 'dialog', 'aria-label': titolo },
      h('h2', null, titolo),
      testo && h('p', null, testo),
      affiancati ? h('div', { class: 'two' }, bott) : bott);
    radice().append(d);
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('on')));
  });
}

// Finestra con un campo "Nome" (Aggiungi, Rinomina). Va aperta durante il tocco, così parte la tastiera.
export function chiediNome({ titolo, azione, valore = '' }) {
  return new Promise((ok) => {
    const fine = (x) => { campo.blur(); chiudiStrato(d, v); ok(x); };
    const v = velo(() => fine(null));
    const campo = h('input', {
      class: 'field one',
      type: 'text',
      value: valore,
      'aria-label': 'Nome',
      enterkeyhint: 'done',
      autocapitalize: 'sentences',
      oninput: () => { btn.disabled = !campo.value.trim(); btn.className = `btn ${campo.value.trim() ? 'pri' : 'off'}`; },
      onkeydown: (e) => { if (e.key === 'Enter' && campo.value.trim()) fine(campo.value.trim()); },
    });
    const btn = h('button', { class: `btn ${valore ? 'pri' : 'off'}`, type: 'button', disabled: !valore, onclick: () => fine(campo.value.trim()) }, azione);
    const d = h('div', { class: 'dlg strato', role: 'dialog', 'aria-label': titolo },
      h('h2', null, titolo),
      h('label', null, 'Nome', campo),
      h('div', { class: 'two' }, h('button', { class: 'btn sec', type: 'button', onclick: () => fine(null) }, 'Annulla'), btn));
    radice().append(d);
    campo.focus();
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('on')));
  });
}

// Pannello dal basso. "costruisci" riceve la funzione per chiuderlo.
export function pannello({ titolo, costruisci, alChiudere }) {
  const fine = (x) => { chiudiStrato(p, v); alChiudere?.(x); };
  const v = velo(() => fine(null));
  const p = h('div', { class: 'panel strato', role: 'dialog', 'aria-label': titolo },
    h('div', { class: 'grab' }),
    h('h2', null, titolo),
    costruisci(fine));
  radice().append(p);
  requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add('on')));
  return fine;
}

// Campo data che apre il selettore di iOS.
export function campoData({ etichetta, testo, valore, max, min, alCambio }) {
  const b = h('b', null, testo);
  const inp = h('input', {
    class: 'sovra',
    type: 'date',
    value: valore,
    max,
    min,
    'aria-label': etichetta,
    onchange: () => { if (inp.value) alCambio(inp.value, b); },
  });
  return h('div', { class: 'dfield' }, h('span', null, etichetta), b, inp);
}

// ---------- Condivisione ----------

export async function condividiTesto(testo, titolo) {
  if (navigator.share) {
    try { await navigator.share({ title: titolo, text: testo }); return true; } catch (e) { if (e.name === 'AbortError') return false; }
  }
  try {
    await navigator.clipboard.writeText(testo);
    messaggio('Testo copiato.');
    return true;
  } catch { return false; }
}

export async function condividiFile(nome, contenuto) {
  const file = new File([contenuto], nome, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return true; } catch (e) { if (e.name === 'AbortError') return false; }
  }
  const url = URL.createObjectURL(file);
  const a = h('a', { href: url, download: nome });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return true;
}

export function scegliFile() {
  return new Promise((ok) => {
    const inp = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
    inp.addEventListener('change', () => { ok(inp.files[0] || null); inp.remove(); });
    inp.addEventListener('cancel', () => { ok(null); inp.remove(); });
    document.body.append(inp);
    inp.click();
  });
}

export async function leggiJson(file) {
  try { return JSON.parse(await file.text()); } catch { return null; }
}

// ---------- Gesti ----------

// Scorrimento dal bordo sinistro: la pagina segue il dito.
export function gestoIndietro(pagina, { alMuovere, alRilascio }) {
  let t = null;
  pagina.addEventListener('touchstart', (e) => {
    const x = e.touches[0].clientX - radice().getBoundingClientRect().left;
    if (e.touches.length === 1 && x < 24) t = { x0: e.touches[0].clientX, y0: e.touches[0].clientY, t0: e.timeStamp, attivo: false, dx: 0 };
  }, { passive: true });
  pagina.addEventListener('touchmove', (e) => {
    if (!t) return;
    const dx = e.touches[0].clientX - t.x0;
    const dy = e.touches[0].clientY - t.y0;
    if (!t.attivo) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { t = null; return; }
      if (dx < 8) return;
      t.attivo = true;
    }
    e.preventDefault();
    t.dx = Math.max(0, dx);
    alMuovere(t.dx);
  }, { passive: false });
  const fine = (e) => {
    if (!t) return;
    const { attivo, dx, t0 } = t;
    t = null;
    if (!attivo) return;
    const velocita = dx / Math.max(1, e.timeStamp - t0);
    alRilascio(dx > pagina.offsetWidth * 0.33 || velocita > 0.5);
  };
  pagina.addEventListener('touchend', fine);
  pagina.addEventListener('touchcancel', () => { if (t?.attivo) alRilascio(false); t = null; });
}

// Trascinamento verso il basso di un pannello: dalla testata, o dal contenuto quando è già in cima.
export function gestoGiu({ testata, contenuto, alMuovere, alRilascio }) {
  let d = null;
  const muovi = (y, ts) => {
    d.dy = Math.max(0, y - d.y0);
    d.ultimo = ts;
    alMuovere(d.dy);
  };
  const rilascia = (ts) => {
    const { dy, t0 } = d;
    d = null;
    alRilascio(dy, dy / Math.max(1, ts - t0));
  };

  testata.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    d = { y0: e.clientY, dy: 0, t0: e.timeStamp };
    testata.setPointerCapture?.(e.pointerId);
    alMuovere(0);
  });
  testata.addEventListener('pointermove', (e) => { if (d) muovi(e.clientY, e.timeStamp); });
  testata.addEventListener('pointerup', (e) => { if (d) rilascia(e.timeStamp); });
  testata.addEventListener('pointercancel', (e) => { if (d) rilascia(e.timeStamp); });

  let c = null;
  contenuto.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1 || contenuto.scrollTop > 0 || tastiera() > 80) return;
    if (e.target.closest('textarea, input, .trk')) return;
    c = { y: e.touches[0].clientY, x: e.touches[0].clientX };
  }, { passive: true });
  contenuto.addEventListener('touchmove', (e) => {
    if (!c && !d) return;
    const y = e.touches[0].clientY;
    if (!d) {
      const dy = y - c.y;
      const dx = Math.abs(e.touches[0].clientX - c.x);
      if (dy < -2 || dx > Math.abs(dy)) { c = null; return; }
      if (dy < 6) return;
      d = { y0: y, dy: 0, t0: e.timeStamp };
    }
    e.preventDefault();
    muovi(y, e.timeStamp);
  }, { passive: false });
  const fine = (e) => { c = null; if (d) rilascia(e.timeStamp); };
  contenuto.addEventListener('touchend', fine);
  contenuto.addEventListener('touchcancel', fine);
}

// Scorrere il contenuto chiude la tastiera, come nelle app di iPhone.
export function scorrereChiudeTastiera(sc) {
  sc.addEventListener('touchmove', (e) => {
    const a = document.activeElement;
    if (a && (a.tagName === 'TEXTAREA' || a.tagName === 'INPUT') && !e.target.closest('textarea, input')) a.blur();
  }, { passive: true });
}
