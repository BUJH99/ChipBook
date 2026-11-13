"""Shared paths, text IO and document components for the static build tools."""
from __future__ import annotations

import html
import hashlib
import json
import re
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS_ROOT = REPO_ROOT / '.artifacts'
REGISTRY_PATH = REPO_ROOT / 'src' / 'app' / 'page-registry.json'
HEAD_TEMPLATE = REPO_ROOT / 'src' / 'templates' / 'page-head.html'


def load_text(path: Path) -> str:
    return path.read_text(encoding='utf-8')


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(4):
        try:
            path.write_text(content, encoding='utf-8', newline='\n')
            return
        except OSError as error:
            if error.errno not in (13, 22) or attempt == 3:
                raise
            time.sleep(.05 * (attempt + 1))


def versioned_asset(url: str) -> str:
    """Content versions prevent a cached iframe from mixing new HTML and old JS."""
    if '?' in url or '#' in url or not re.match(r'^(?:\.\./|\./)?assets/', url):
        return url
    relative = re.sub(r'^(?:\.\./|\./)', '', url)
    path = REPO_ROOT / relative
    if not path.is_file():
        return url
    data = path.read_bytes()
    if path.name == 'visual-atlas.js':
        companion = path.with_name('visual-atlas-3d.js')
        if companion.is_file():
            data += companion.read_bytes()
    return url + '?v=' + hashlib.sha256(data).hexdigest()[:12]


def load_registry() -> dict:
    return json.loads(load_text(REGISTRY_PATH))


def section_title(section: dict) -> str:
    return section.get('tocTitle') or section['title']


def render_section_tokens(text: str, page: dict) -> str:
    """Registry-owned labels are compiled into HTML, so file previews need no fetch."""
    values = {'chapter-title': page['title'], 'chapter-number': str(page['number'])}
    for index, section in enumerate(page['sections'], 1):
        prefix = 'section:' + section['key']
        values[prefix + ':title'] = section['title']
        values[prefix + ':toc'] = section_title(section)
        values[prefix + ':label'] = f"{page['number']}-{index}. {section_title(section)}"

    for alias, target in page.get('sectionAliases', {}).items():
        for suffix in ('title', 'toc', 'label'):
            source = f'section:{target}:{suffix}'
            if source not in values:
                raise ValueError(f'Unknown section alias target {target!r} in {page["id"]}')
            values[f'section:{alias}:{suffix}'] = values[source]

    def replace(match):
        key = match.group(1)
        if key not in values:
            raise ValueError(f"Unknown registry label token {key!r} in {page['id']}")
        return html.escape(values[key], quote=True)
    return re.sub(r'\{\{((?:section:[^{}]+|chapter-[^{}]+))\}\}', replace, text)


def render_scripts(scripts) -> str:
    tags = []
    allowed = {'src', 'defer', 'async', 'type', 'crossorigin'}
    for script in scripts:
        if isinstance(script, str):
            script = {'src': script}
        if not isinstance(script, dict) or not isinstance(script.get('src'), str) or not script['src']:
            raise ValueError('Script dependencies must have a nonempty src')
        if '<' in script['src'] or '>' in script['src']:
            raise ValueError('Use a script URL and structured attributes, not an HTML tag')
        if set(script) - allowed:
            raise ValueError(f'Unsupported script attributes: {set(script) - allowed}')
        attrs = []
        for name, value in script.items():
            if name in {'defer', 'async'}:
                if not isinstance(value, bool):
                    raise ValueError(f'{name} must be a boolean')
                if value: attrs.append(name)
            else:
                if name == 'src':
                    value = versioned_asset(value)
                attrs.append(f'{name}="{html.escape(str(value), quote=True)}"')
        tags.append('    <script ' + ' '.join(attrs) + '></script>')
    return '\n'.join(tags)


def render_head(title: str, *, asset_prefix: str = '../assets/', styles=(), scripts=()) -> str:
    """One head component for the entry point and all generated chapter pages."""
    values = {
        'title': html.escape(title),
        'asset-prefix': asset_prefix,
        'styles': '\n'.join(f'    <link rel="stylesheet" href="{html.escape(url, quote=True)}">' for url in styles),
        'scripts': render_scripts(scripts),
    }
    rendered = load_text(HEAD_TEMPLATE).rstrip()
    for key, value in values.items():
        rendered = rendered.replace('{{' + key + '}}', value)
    rendered = re.sub(r'(href=")([^"]+)(")', lambda m: m[1] + versioned_asset(m[2]) + m[3], rendered)
    return rendered
