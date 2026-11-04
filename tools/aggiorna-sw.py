#!/usr/bin/env python3
"""Scrive in sw.js l'elenco dei file e una versione calcolata dal loro contenuto.
Va eseguito prima di ogni pubblicazione: così l'app sa quando c'è un aggiornamento."""
import hashlib, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
file = ['./', 'index.html', 'manifest.webmanifest']
for cartella in ('css', 'js', 'font', 'icone'):
    file += sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / cartella).rglob('*') if p.is_file() and p.name != 'LICENZE.txt')
h = hashlib.sha256()
for f in file[1:]:
    h.update((ROOT / f).read_bytes())
sw = (ROOT / 'sw.js').read_text()
sw = re.sub(r"const VERSIONE = '.*?';", f"const VERSIONE = '{h.hexdigest()[:12]}';", sw)
elenco = ',\n'.join(f"  '{f}'" for f in file)
sw = re.sub(r"const FILE = \[.*?\];", f"const FILE = [\n{elenco},\n];", sw, flags=re.S)
(ROOT / 'sw.js').write_text(sw)
print(h.hexdigest()[:12], len(file), 'file')
