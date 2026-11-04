// Prova i percorsi principali in un browser a 393 × 852. Uso: node prove/percorsi.mjs [cartella per le immagini]
// Serve il sito su http://localhost:8123 (python3 -m http.server 8123).
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const require = createRequire(process.cwd() + '/');
const { chromium } = require('playwright');

const URL = 'http://localhost:8123/';
const DIR = process.argv[2];
const errori = [];
const dorme = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, serviceWorkers: 'block', acceptDownloads: true });
const pg = await ctx.newPage();
pg.on('pageerror', (e) => errori.push(e.message));
pg.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
const foto = async (n) => { await dorme(450); if (DIR) await pg.screenshot({ path: `${DIR}/${n}.png` }); };
const testo = (s) => pg.getByText(s, { exact: true });
const bottone = (s) => pg.getByRole('button', { name: s, exact: true });

await pg.goto(URL);
// Primo avvio
await testo('Benvenuto').waitFor();
await foto('avvio-b');
// File non valido
fs.writeFileSync('/tmp/non-valido.json', '{"a":1}');
let [chooser] = await Promise.all([pg.waitForEvent('filechooser'), bottone('Importa i miei elenchi').click()]);
await chooser.setFiles('/tmp/non-valido.json');
await testo('Non riesco a leggere questo file.').waitFor();
await foto('avvio-errore');
// File di elenchi valido
fs.writeFileSync('/tmp/elenchi.json', JSON.stringify({ tipo: 'diario-elenchi', categorie: ['Prova uno', 'Relazioni', 'Altro'], emozioni: ['Rabbia', 'Ansia', 'Vergogna'], sensazioni: ['Tremore'], comportamenti: ['Ho evitato', 'Sono rimasto e ho aspettato', 'Altro'], aiuto: 'Aiuto di prova.' }));
[chooser] = await Promise.all([pg.waitForEvent('filechooser'), bottone('Riprova').click()]);
await chooser.setFiles('/tmp/elenchi.json');
await testo('Elenchi importati.').waitFor();
await dorme(350);
assert.equal(await pg.locator('.avvio').count(), 0);
await testo('Ancora nessuna voce.').first().waitFor();
await foto('home-vuota');

// Nuova voce: vuota, Salva spento
await bottone('Nuova voce').click();
await dorme(450);
assert.equal(await pg.locator('.sheet .save').isDisabled(), true);
await testo('Aiuto di prova.').waitFor();
await foto('nv-vuota');
// Tutte le emozioni visibili senza scorrere
const piede = await pg.locator('.sheet .foot').boundingBox();
const emo = await pg.locator('.sheet .chips').first().boundingBox();
assert.ok(emo.y + emo.height <= piede.y, 'le emozioni si vedono senza scorrere');

// Annulla su voce vuota chiude subito
await bottone('Annulla').click();
await dorme(450);
assert.equal(await pg.locator('.sheet').count(), 0);
assert.equal(await pg.locator('.dlg').count(), 0);

// Cattura: solo pensiero
const inizio = Date.now();
await bottone('Nuova voce').click();
await pg.locator('#nv-pensiero').fill('Ho pensato che avrei perso il treno e che avrei dovuto partire prima.');
assert.equal(await pg.locator('.sheet .save').isEnabled(), true);
// Emozione: nessun valore finché non si tocca
await bottone('Rabbia').click();
await testo("Scegli l'intensità").first().waitFor();
await dorme(300);
await foto('nv-emozione-vuota');
// Tocco sul cursore: valore scelto
const trk = await pg.locator('.sheet .trk').first().boundingBox();
await pg.mouse.click(trk.x + 14 + (trk.width - 28) * 0.9, trk.y + trk.height / 2);
await pg.getByText('Rabbia · 9').waitFor();
await bottone('Relazioni').scrollIntoViewIfNeeded();
await bottone('Relazioni').click();
// Aggiungi al volo
await pg.locator('.sheet .chip.add').first().click();
await pg.locator('.dlg input').fill('Delusione');
await foto('nv-aggiungi');
await pg.locator('.dlg').getByRole('button', { name: 'Aggiungi', exact: true }).click();
await pg.getByText('Delusione ·', { exact: false }).first().waitFor();
await foto('nv-compilata');
// Annulla con testo: conferma, poi continua
await bottone('Annulla').click();
await testo('Eliminare questa voce?').waitFor();
await foto('nv-conferma');
await bottone('Continua a scrivere').click();
await dorme(350);
assert.equal(await pg.locator('#nv-pensiero').inputValue() !== '', true);
// Bozza conservata se l'app si chiude
await dorme(450);
await pg.reload();
await pg.locator('#nv-pensiero').waitFor();
assert.ok((await pg.locator('#nv-pensiero').inputValue()).startsWith('Ho pensato che'), 'il testo si ritrova dopo la chiusura');
assert.equal(await pg.locator('.sheet .sl').count(), 2);
// Cosa è successo
await bottone('+ Aggiungi cosa è successo').click();
await dorme(320);
await pg.locator('#nv-situazione').fill('Stavo tornando a casa dopo una giornata di lavoro. '.repeat(8));
const altezza = await pg.locator('#nv-situazione').evaluate((t) => t.offsetHeight);
assert.ok(altezza > 200, 'il campo cresce con il testo');
await foto('nv-testo-lungo');
// Errore di salvataggio: il testo resta
await pg.evaluate(() => { window.__put = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = () => { throw new Error('prova'); }; });
await pg.locator('.sheet .save').click();
await testo('Salvataggio non riuscito. Il testo è ancora qui.').waitFor();
await foto('nv-errore');
await pg.evaluate(() => { IDBObjectStore.prototype.put = window.__put; });
await bottone('Riprova').click();
await pg.getByText('Voce salvata').waitFor();
console.log('Cattura con tocchi automatici:', Date.now() - inizio, 'ms');
await dorme(300);
assert.equal(await pg.locator('.vista.on .row').count(), 1);
await foto('home-messaggio');

// Voce incompleta
await bottone('Completa ora').click();
await dorme(420);
await pg.getByText('Mancano: emozione', { exact: false }).count();
const mancaTesto = await pg.locator('.miss').innerText();
assert.ok(mancaTesto.includes('cosa ho fatto per difendermi'), mancaTesto);
assert.ok(!mancaTesto.includes('cosa è successo'));
await foto('voce-alto');
// Il pensiero si vede all'apertura in una voce breve; categorie chiuse
assert.equal(await pg.locator('.pagina .chip.fissa').count(), 2 - 1);
// Comportamento e fine
await testo('Cosa ho fatto per difendermi?').scrollIntoViewIfNeeded();
await pg.getByText('Per esempio: ho cercato rassicurazione su internet', { exact: false }).waitFor();
await pg.locator('.pagina').getByRole('button', { name: 'Altro', exact: true }).last().click();
await dorme(300);
await pg.locator('.pagina textarea[placeholder="Scrivi qui"]').last().fill('Ho alzato la voce');
await foto('voce-altro');
await dorme(500);
await testo('Salvato').waitFor();
assert.equal(await pg.locator('.miss').isHidden(), true, 'la voce ora è completa');
await bottone('Fine').click();
await dorme(420);
await testo('Ultime voci').waitFor();

// Seconda voce, incompleta, per Archivio e Seduta
await bottone('Nuova voce').click();
await pg.locator('#nv-pensiero').fill('Pensiero di una voce da completare');
await bottone('Ansia').click();
await pg.locator('.sheet .save').click();
await pg.getByText('Voce salvata').waitFor();
await dorme(400);
await foto('home-due');

// Archivio e filtri
await bottone('Archivio').click();
await dorme(300);
await testo('Oggi').waitFor();
assert.equal(await pg.locator('.vista.on .arow').count(), 2);
await foto('archivio');
await pg.locator('.vista.on .filters').getByRole('button', { name: 'Da completare' }).click();
await dorme(250);
assert.equal(await pg.locator('.vista.on .arow').count(), 1);
await foto('archivio-filtro');
await pg.locator('.vista.on .filters').getByRole('button', { name: 'Categoria' }).click();
await dorme(450);
await foto('archivio-categoria');
await pg.locator('.panel').getByRole('button', { name: 'Prova uno', exact: true }).click();
await pg.locator('.panel').getByRole('button', { name: 'Applica', exact: true }).click();
await testo('Nessuna voce con questi filtri.').waitFor();
await foto('archivio-nessuna');
await bottone('Togli i filtri').click();
await dorme(250);
assert.equal(await pg.locator('.vista.on .arow').count(), 2);
await bottone('Scegli date').click();
await dorme(450);
await foto('archivio-date');
await pg.locator('.panel').getByRole('button', { name: 'Applica', exact: true }).click();
await dorme(300);
assert.ok(await pg.locator('.vista.on .filters .chip.on').first().innerText().then((t) => t.includes('–')), 'il filtro mostra le date');
await bottone('Tutto').click();

// Seduta
await bottone('Seduta').click();
await dorme(300);
await testo('Dalla prima voce a oggi').waitFor();
await foto('seduta');
assert.equal(await pg.locator('.vista.on .tile strong').first().innerText(), '2');
await pg.locator('.vista.on .sed-scorre').evaluate((e) => e.scrollTo(0, 9999));
await foto('seduta-scorsa');
// Esporta
await bottone('Esporta').click();
await dorme(450);
await foto('seduta-esporta');
await pg.locator('.panel').getByRole('button', { name: 'Annulla', exact: true }).click();
await dorme(350);
// Seduta fatta: le voci di oggi escono dal periodo
await bottone('Seduta fatta').click();
await dorme(450);
await foto('seduta-conferma');
await bottone('Conferma').click();
await testo('Nessuna voce in questo periodo.').waitFor();
await pg.getByText('a oggi · 1 giorno', { exact: false }).waitFor();
assert.equal(await bottone('Esporta').isDisabled(), true);
await foto('seduta-dopo');

// Impostazioni
await bottone('Diario').click();
await dorme(250);
await pg.getByRole('button', { name: 'Impostazioni' }).click();
await dorme(420);
await testo('Nessun backup').waitFor();
await foto('impostazioni');
// Tema scuro
await bottone('Scuro').click();
await dorme(150);
assert.ok(await pg.locator('#scr').evaluate((e) => e.classList.contains('t-scuro')));
await foto('impostazioni-scuro');
// Elenco
await pg.getByRole('button', { name: 'Emozioni' }).click();
await dorme(420);
await foto('elenco');
await pg.getByRole('button', { name: '+ Aggiungi' }).click();
await pg.locator('.dlg input').fill('Sollievo');
await pg.locator('.dlg').getByRole('button', { name: 'Aggiungi', exact: true }).click();
await testo('Sollievo').waitFor();
await pg.getByRole('button', { name: 'Rinomina Rabbia' }).click();
await pg.locator('.dlg input').fill('Collera');
await pg.locator('.dlg').getByRole('button', { name: 'Rinomina', exact: true }).click();
await testo('Collera').waitFor();
await pg.getByRole('button', { name: 'Elimina Ansia' }).click();
await dorme(300);
await foto('elenco-elimina');
await pg.locator('.dlg').getByRole('button', { name: 'Elimina', exact: true }).click();
await dorme(300);
assert.equal(await pg.locator('.erow').filter({ hasText: 'Ansia' }).count(), 0);
await pg.locator('.pagina').last().getByRole('button', { name: 'Indietro' }).click();
await dorme(420);

// Le voci già scritte non cambiano
const dati = () => pg.evaluate(() => new Promise((ok) => { const r = indexedDB.open('diario'); r.onsuccess = () => { const q = r.result.transaction('voci').objectStore('voci').getAll(); q.onsuccess = () => ok(q.result); }; }));
const voci = await dati();
assert.ok(voci.some((v) => v.emozioni.some((e) => e.nome === 'Rabbia')), 'la voce conserva «Rabbia»');
assert.ok(voci.some((v) => v.emozioni.some((e) => e.nome === 'Ansia')), 'la voce conserva «Ansia»');

// Backup
const [dl] = await Promise.all([pg.waitForEvent('download'), bottone('Crea backup').click()]);
const copia = '/tmp/diario-backup-prova.json';
await dl.saveAs(copia);
await testo('Backup creato.').waitFor();
await testo('Ultimo backup: oggi').waitFor();
const backup = JSON.parse(fs.readFileSync(copia, 'utf8'));
const ordinate = (l) => [...l].sort((a, b) => a.id.localeCompare(b.id));
assert.deepEqual(ordinate(backup.voci), ordinate(voci));

// File sbagliato: non cambia nulla
[chooser] = await Promise.all([pg.waitForEvent('filechooser'), bottone('Ripristina da backup').click()]);
await chooser.setFiles('/tmp/non-valido.json');
await testo('Questo file non è un backup di Diario.').waitFor();
await foto('ripristino-errore');
assert.equal((await dati()).length, 2);

// Ripristino: dati identici
await pg.evaluate(() => new Promise((ok) => { const r = indexedDB.open('diario'); r.onsuccess = () => { const t = r.result.transaction('voci', 'readwrite'); t.objectStore('voci').clear(); t.oncomplete = ok; }; }));
await dorme(4200);
[chooser] = await Promise.all([pg.waitForEvent('filechooser'), bottone('Ripristina da backup').click()]);
await chooser.setFiles(copia);
await testo('Ripristinare questo backup?').waitFor();
await foto('ripristino-conferma');
await pg.locator('.dlg').getByRole('button', { name: 'Ripristina', exact: true }).click();
await testo('Backup ripristinato.').waitFor();
assert.deepEqual(ordinate(await dati()), ordinate(voci));
await bottone('Indietro').click();
await dorme(420);
await foto('home-scuro');

// Gesto indietro dal bordo: la pagina segue il dito e si chiude
await pg.locator('.vista.on .row').first().click();
await dorme(420);
const cdp = await ctx.newCDPSession(pg);
const tocco = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
await tocco('touchStart', 6, 400);
for (const x of [20, 60, 120, 180, 240]) { await tocco('touchMove', x, 400); await dorme(16); }
const scostata = await pg.locator('.pagina').last().evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m41);
assert.ok(scostata > 150, `la pagina segue il dito (${scostata})`);
await foto('gesto-indietro');
await tocco('touchEnd');
await dorme(450);
assert.equal(await pg.locator('.pagina').count(), 0);

// Trascinare Nuova voce verso il basso: chiude se è vuota
await bottone('Nuova voce').click();
await dorme(450);
const sh = await pg.locator('.s-head').boundingBox();
await pg.mouse.move(sh.x + 200, sh.y + 40);
await pg.mouse.down();
for (let i = 1; i <= 8; i++) { await pg.mouse.move(sh.x + 200, sh.y + 40 + i * 25); await dorme(16); }
const spost = await pg.locator('.sheet').evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m42);
assert.ok(spost > 150, `il pannello segue il dito (${spost})`);
await pg.mouse.up();
await dorme(480);
assert.equal(await pg.locator('.sheet').count(), 0);

// Nessuno sborda in orizzontale
for (const n of [0, 1, 2]) {
  const s = await pg.locator(`#v${n}`).evaluate((e) => [...e.querySelectorAll('*')].filter((x) => { const r = x.getBoundingClientRect(); return r.width && !x.closest('.orb,.orb2') && !x.matches('.orb,.orb2') && (r.right > 393.5 || r.left < -0.5); }).map((x) => x.className));
  assert.deepEqual(s, [], `vista ${n}`);
}

assert.deepEqual(errori, []);
await browser.close();
console.log('Percorsi: tutte le prove superate');
