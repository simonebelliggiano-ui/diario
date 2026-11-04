// Barra in basso, pagine che entrano da destra e aggiornamento delle viste.
import { h, icona, radice, gestoIndietro, riduciMovimento, chiudiMessaggio } from './ui.js';

const VISTE = [];
let attuale = 0;
const pila = [];
const sotto = () => document.getElementById('sotto');

export function registraVista(n, disegna) { VISTE[n] = disegna; }

export function aggiornaViste(opzioni) {
  VISTE.forEach((d) => d(opzioni));
}

const TAB = [['book-open', 'Diario'], ['archive', 'Archivio'], ['messages-square', 'Seduta']];
let cap;
const bottoni = [];

export function creaTabs() {
  const nav = document.getElementById('tabs');
  cap = h('span', { class: 'cap' });
  nav.append(cap);
  TAB.forEach(([ic, testo], i) => {
    const b = h('button', { type: 'button', onclick: () => vaiA(i) }, icona(ic), testo);
    bottoni[i] = b;
    nav.append(b);
  });
  segnaTab();
}

function segnaTab() {
  bottoni.forEach((b, i) => {
    b.classList.toggle('on', i === attuale);
    if (i === attuale) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  cap.className = `cap at${attuale}`;
  for (let i = 0; i < 3; i++) document.getElementById(`v${i}`).classList.toggle('on', i === attuale);
}

export function vaiA(n) {
  if (n === attuale) return;
  chiudiMessaggio();
  attuale = n;
  segnaTab();
}

export const tabAttuale = () => attuale;
export const ciSonoPagine = () => pila.length > 0;

function sottostante() {
  return pila.length ? pila[pila.length - 1].el : sotto();
}
const classeSpinta = (el) => (el === sotto() ? 'spinto' : 'spinta');

export function apriPagina(el, { allaChiusura } = {}) {
  chiudiMessaggio();
  const sopra = sottostante();
  radice().append(el);
  sopra.inert = true;
  const voce = { el, allaChiusura, sopra };
  pila.push(voce);
  gestoIndietro(el, {
    alMuovere: (dx) => {
      if (riduciMovimento()) return;
      const p = Math.min(1, dx / el.offsetWidth);
      el.style.transition = 'none';
      sopra.style.transition = 'none';
      el.style.transform = `translateX(${dx}px)`;
      sopra.style.transform = `translateX(${-24 * (1 - p)}%)`;
    },
    alRilascio: (chiudi) => {
      el.style.transition = '';
      sopra.style.transition = '';
      void el.offsetWidth;
      el.style.transform = '';
      sopra.style.transform = '';
      if (chiudi && pila[pila.length - 1] === voce) chiudiPagina();
    },
  });
  void el.offsetWidth;
  requestAnimationFrame(() => {
    el.classList.add('on');
    sopra.classList.add(classeSpinta(sopra));
  });
}

export function chiudiPagina() {
  const voce = pila.pop();
  if (!voce) return;
  const { el, sopra, allaChiusura } = voce;
  el.inert = true;
  el.classList.remove('on');
  sopra.classList.remove(classeSpinta(sopra));
  sopra.inert = false;
  allaChiusura?.();
  setTimeout(() => el.remove(), riduciMovimento() ? 150 : 340);
}
