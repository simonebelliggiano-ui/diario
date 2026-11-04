// Prove delle regole del diario. Si esegue con: node prove/logica.test.mjs
import assert from 'node:assert/strict';
import { backupValido, completa, etichettaGiorno, etichettaOra, fileElenchiValido, filtra, giorniCompresi, mancano, periodoSeduta, statistiche, tempoBackup, testoEsportazione } from '../js/logica.js';

const ORA = new Date(2026, 10, 4, 23, 40); // mercoledì 4 novembre 2026
const voce = (x) => ({ id: 'a', quando: new Date(2026, 10, 4, 18, 10).toISOString(), pensiero: '', situazione: '', fine: '', categorie: [], emozioni: [], sensazioni: [], comportamenti: [], altro: {}, ...x });
const piena = voce({ pensiero: 'p', situazione: 's', emozioni: [{ nome: 'Rabbia', intensita: 9 }], comportamenti: ['X'] });

// Completa: situazione, pensiero, emozione con intensità, comportamento
assert.equal(completa(piena), true);
assert.deepEqual(mancano(voce({ pensiero: 'p' })), ['cosa è successo', 'emozione con intensità', 'cosa ho fatto per difendermi']);
assert.deepEqual(mancano(voce({ situazione: 's' })), ['cosa ho pensato', 'emozione con intensità', 'cosa ho fatto per difendermi']);
assert.equal(completa({ ...piena, emozioni: [{ nome: 'Rabbia', intensita: null }] }), false);
assert.equal(completa({ ...piena, emozioni: [{ nome: 'Rabbia', intensita: 0 }] }), true, 'lo zero è un valore');
assert.equal(completa({ ...piena, pensiero: '   ' }), false);

// Date
assert.equal(etichettaOra(new Date(2026, 10, 4, 8, 15).toISOString(), ORA), 'Oggi, 8:15');
assert.equal(etichettaOra(new Date(2026, 10, 3, 23, 40).toISOString(), ORA), 'Ieri, 23:40');
assert.equal(etichettaOra(new Date(2026, 10, 2, 22, 5).toISOString(), ORA), 'Lunedì, 22:05');
assert.equal(etichettaOra(new Date(2026, 9, 1, 9, 30).toISOString(), ORA), '1 ott, 9:30');
assert.equal(etichettaGiorno(new Date(2026, 10, 2, 22, 5).toISOString(), ORA), 'Lunedì 2 novembre');
assert.equal(giorniCompresi(new Date(2026, 9, 28), new Date(2026, 10, 4)), 8);
assert.equal(tempoBackup(null, ORA), 'Nessun backup');
assert.equal(tempoBackup(new Date(2026, 9, 23).toISOString(), ORA), 'Ultimo backup: 12 giorni fa');

// Seduta
const voci = [voce({ id: '1' }), voce({ id: '2', quando: new Date(2026, 9, 29, 10).toISOString() }), voce({ id: '3', quando: new Date(2026, 9, 1, 10).toISOString() })];
let p = periodoSeduta(voci, new Date(2026, 9, 28).toISOString(), null, ORA);
assert.equal(p.etichetta, 'Dal 28 ottobre a oggi · 8 giorni');
assert.deepEqual(p.voci.map((v) => v.id), ['1', '2']);
p = periodoSeduta(voci, null, null, ORA);
assert.equal(p.etichetta, 'Dalla prima voce a oggi');
assert.equal(p.voci.length, 3);
// Seduta segnata oggi alle 23:40: la voce delle 18:10 non rientra
p = periodoSeduta(voci, ORA.toISOString(), null, ORA);
assert.equal(p.etichetta, 'Dal 4 novembre a oggi · 1 giorno');
assert.equal(p.voci.length, 0);
p = periodoSeduta(voci, null, { dal: new Date(2026, 9, 1), al: new Date(2026, 9, 2) }, ORA);
assert.equal(p.etichetta, 'Dal 1 ottobre al 2 ottobre · 2 giorni');
assert.equal(p.voci.length, 1);

// Statistiche
const st = statistiche([
  voce({ categorie: ['A', 'B'], emozioni: [{ nome: 'Ansia', intensita: 6 }, { nome: 'Paura', intensita: 7 }], comportamenti: ['X'] }),
  voce({ categorie: ['A'], emozioni: [{ nome: 'Ansia', intensita: null }] }),
]);
assert.equal(st.totale, 2);
assert.equal(st.daCompletare, 2);
assert.equal(st.media, '6,5');
assert.deepEqual(st.categorie, [['A', 2], ['B', 1]]);
assert.deepEqual(st.emozioni, [['Ansia', 2], ['Paura', 1]]);

// Filtri
assert.equal(filtra(voci, { periodo: 'settimana' }, ORA).length, 1, 'la settimana parte da lunedì');
assert.equal(filtra(voci, { periodo: 'mese' }, ORA).length, 1);
assert.equal(filtra([voce({ categorie: ['A'] }), voce({ categorie: ['B'] })], { periodo: 'tutto', categorie: ['B'] }, ORA).length, 1);
assert.equal(filtra([piena, voce({})], { periodo: 'tutto', soloDaCompletare: true }, ORA).length, 1);

// Esportazione
const t = testoEsportazione(periodoSeduta([piena], null, null, ORA), ORA);
assert.ok(t.includes('Cosa ho fatto per difendermi: X'));
assert.ok(t.includes('Rabbia 9'));

// File
const el = { categorie: ['A'], emozioni: ['B'], sensazioni: ['C'], comportamenti: ['D'] };
assert.equal(fileElenchiValido({ tipo: 'diario-elenchi', ...el }), true);
assert.equal(fileElenchiValido({ ...el }), false);
assert.equal(backupValido({ tipo: 'diario-backup', voci: [piena], elenchi: el }), true);
assert.equal(backupValido({ tipo: 'diario-backup', voci: [{ id: 1 }], elenchi: el }), false);
assert.equal(backupValido({ tipo: 'altro' }), false);

console.log('Regole: tutte le prove superate');
