"""Baut tools/standard-acl.html und tools/extended-acl.html aus acl.js + shared.js + common.js."""
import json, os
here = os.path.dirname(os.path.abspath(__file__))
read = lambda *p: open(os.path.join(here, *p), encoding='utf-8').read()
base = read('..', 'intervlan', 'base.css'); eng = read('acl.js'); assert '</script' not in eng
nz = read('..', 'netz', 'page.html')
css0 = nz[nz.index('/*BASECSS*/') + len('/*BASECSS*/'):nz.index('.mt td,.mt th')]
tail = nz[nz.index("var list=/*LIST*/;"):nz.index("})();\n</script>\n</body>")].replace('NAx.LVNAME', 'A.LVNAME').replace('NAx.makeTask(seed,lvl)', 'A.makeTask(seed,lvl,KIND)')
assert 'A.makeTask(seed,lvl,KIND)' in tail
LIST = ['L-1', 'L-2', 'L-3', 'M-1', 'M-2', 'M-3', 'M-4', 'S-1', 'S-2', 'S-3']
for kind, out, title in (('std', 'standard-acl', 'Standard-Access-Listen'), ('ext', 'extended-acl', 'Extended-Access-Listen')):
    page = ('<!DOCTYPE html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>' + title + '</title>\n<style>\n'
            + base + css0 + read('acl.css') + '</style>\n</head>\n<body>\n' + read(kind + '_body.html')
            + '<script>\n' + eng + '\n</script>\n<script>\n(function(){\n\'use strict\';\n' + read('shared.js') + read(kind + '.js') + read('common.js')
            + tail.replace('/*LIST*/', json.dumps(LIST), 1) + '})();\n</script>\n</body>\n</html>\n')
    open(os.path.join(here, '..', '..', 'tools', out + '.html'), 'w', encoding='utf-8').write(page)
    print('tools/' + out + '.html', len(page) // 1024, 'KiB')
