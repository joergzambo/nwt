"""Setzt page.html + base.css zu tools/mac-flooding.html zusammen (Lab, kein Generator)."""
import os
here = os.path.dirname(os.path.abspath(__file__))
read = lambda *p: open(os.path.join(here, *p), encoding='utf-8').read()
out = read('page.html').replace('/*BASECSS*/', read('..', 'intervlan', 'base.css'), 1)
open(os.path.join(here, '..', '..', 'tools', 'mac-flooding.html'), 'w', encoding='utf-8').write(out)
print('tools/mac-flooding.html', len(out) // 1024, 'KiB')
