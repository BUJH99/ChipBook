#!/usr/bin/env python3
"""Generate a lightweight preview index; chapter HTML is never duplicated."""
from __future__ import annotations

import html
from urllib.parse import quote

from site_common import ARTIFACTS_ROOT, load_registry, write_text


def build_previews():
    groups = []
    for page in load_registry()['pages']:
        url = '../../' + page['src'].removeprefix('./')
        items = []
        if page.get('tocMode') != 'action':
            groups.append(f'<section><h2>{page["number"]}. {html.escape(page["title"])}</h2><a href="{html.escape(url, quote=True)}">Open interactive page</a></section>')
            continue
        for section in page['sections']:
            link = url + '?section=' + quote(section['key'])
            items.append(f'<li><a href="{html.escape(link, quote=True)}">{html.escape(section["title"])}</a></li>')
        groups.append(f'<section><h2>{page["number"]}. {html.escape(page["title"])}</h2><ul>{"".join(items)}</ul></section>')
    output = ARTIFACTS_ROOT / 'previews' / 'index.html'
    write_text(output, '<!doctype html><html lang="ko"><meta charset="utf-8">'
               '<meta name="viewport" content="width=device-width,initial-scale=1">'
               '<title>ChipBook section previews</title><style>'
               'body{font:16px/1.7 system-ui;max-width:60rem;margin:auto;padding:2rem;color:#191f28}'
               'a{color:#2563eb}section{border-top:1px solid #e5e7eb;margin-top:2rem}'
               '</style><h1>ChipBook section previews</h1>'
               '<p>Each link opens the actual chapter at the selected section.</p>' + ''.join(groups) + '</html>\n')
    return output


if __name__ == '__main__':
    print('[ok]', build_previews())
