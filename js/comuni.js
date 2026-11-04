// Parti usate da più schermate.
import { S, salvaElenchi } from './dati.js';
import { chiediNome, messaggio } from './ui.js';

export async function aggiungiAElenco(chiave, titolo) {
  const nome = await chiediNome({ titolo, azione: 'Aggiungi' });
  if (!nome) return null;
  const esistente = S.elenchi[chiave].find((x) => x.toLowerCase() === nome.toLowerCase());
  if (esistente) return esistente;
  try {
    await salvaElenchi({ ...S.elenchi, [chiave]: [...S.elenchi[chiave], nome] });
  } catch {
    messaggio('Salvataggio non riuscito.');
    return null;
  }
  return nome;
}
