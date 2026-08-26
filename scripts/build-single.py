#!/usr/bin/env python3
"""Package the Vite build into one self-contained HTML for publishing.

Run `npm run build` first, then this. Output: .tmp/chronos-artifact.html
(no doctype/html/head/body wrapper: the artifact host supplies those).
"""
import glob
import os

html_parts = [
    '<title>Chronos</title>',
    '<link rel="preconnect" href="https://fonts.googleapis.com" />',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
    '<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;800;900'
    '&family=Barlow+Condensed:wght@400;500;600;700&display=swap" rel="stylesheet" />',
]
css = open(glob.glob('dist/assets/index-*.css')[0]).read()
js = open(glob.glob('dist/assets/index-*.js')[0]).read()
js = js.replace('</script>', '<\\/script>')
html_parts.append('<style>\n' + css + '\n</style>')
html_parts.append('<div id="root"></div>')
html_parts.append('<script type="module">\n' + js + '\n</script>')

os.makedirs('.tmp', exist_ok=True)
out = '.tmp/chronos-artifact.html'
open(out, 'w').write('\n'.join(html_parts))
print(f'{out}: {os.path.getsize(out) / 1024:.0f} KB')
