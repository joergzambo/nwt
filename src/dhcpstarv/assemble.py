"""Setzt page.html + base.css + starv.js zu tools/dhcp-starvation.html zusammen."""
import json, os
here = os.path.dirname(os.path.abspath(__file__))
read = lambda *p: open(os.path.join(here, *p), encoding='utf-8').read()
LIST = ['L-1', 'L-2', 'M-1', 'M-2', 'M-3', 'M-5', 'S-1', 'S-2', 'S-3', 'S-4']
js = read('starv.js'); assert '</script' not in js
out = read('page.html').replace('/*BASECSS*/', read('..', 'intervlan', 'base.css'), 1).replace('/*DSJS*/', js, 1).replace('/*LIST*/', json.dumps(LIST), 1)
open(os.path.join(here, '..', '..', 'tools', 'dhcp-starvation.html'), 'w', encoding='utf-8').write(out)
print('tools/dhcp-starvation.html', len(out) // 1024, 'KiB')
