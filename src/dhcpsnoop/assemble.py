"""Setzt page.html + base.css zu tools/dhcp-snooping-dai.html zusammen (Abwehr)."""
import os
here = os.path.dirname(os.path.abspath(__file__))
read = lambda *p: open(os.path.join(here, *p), encoding='utf-8').read()
out = read('page.html').replace('/*BASECSS*/', read('..', 'intervlan', 'base.css'), 1)
open(os.path.join(here, '..', '..', 'tools', 'dhcp-snooping-dai.html'), 'w', encoding='utf-8').write(out)
print('tools/dhcp-snooping-dai.html', len(out) // 1024, 'KiB')
