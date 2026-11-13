#!/usr/bin/env python3
"""Check local runtime references and reject scattered temporary artifacts."""
from __future__ import annotations

import argparse
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

from prepare_pages_artifact import runtime_page_files, runtime_asset_files
from site_common import REPO_ROOT, load_text


class References(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.urls: list[str] = []

    def handle_starttag(self, tag, attrs) -> None:
        for name, value in attrs:
            if name in {'src', 'href', 'data-src', 'data-page-src'} and value:
                self.urls.append(value)


def local_reference(source: Path, url: str, root: Path) -> Path | None:
    parts = urlsplit(url)
    if parts.scheme or parts.netloc or not parts.path or url.startswith(('#', '{')):
        return None
    path = unquote(parts.path)
    return ((root / path.lstrip('/')) if path.startswith('/') else source.parent / path).resolve()


def validate_references(root: Path = REPO_ROOT) -> list[str]:
    errors = []
    runtime = [root / path.relative_to(REPO_ROOT) for path in runtime_page_files()]
    assets = [root / path.relative_to(REPO_ROOT) for path in runtime_asset_files()]
    for asset in assets:
        if not asset.is_file():
            errors.append(f'Missing declared runtime asset: {asset.relative_to(root)}')
    sources = runtime + [asset for asset in assets if asset.suffix == '.css']
    for source in sources:
        if not source.is_file():
            errors.append(f'Missing runtime file: {source.relative_to(root)}')
            continue
        text = load_text(source)
        if source.suffix == '.html':
            parser = References()
            parser.feed(text)
            urls = parser.urls
            if re.search(r'\{\{(?:page-|section:|chapter-)', text):
                errors.append(f'Unrendered template: {source.relative_to(root)}')
        else:
            urls = [match.strip(' \"\'') for match in re.findall(r'url\(([^)]+)\)', text)]
        for url in urls:
            target = local_reference(source, url, root)
            if target is not None and not target.is_file():
                errors.append(f'{source.relative_to(root)} -> missing {url}')
    return errors


def validate_layout() -> list[str]:
    errors = []
    for name in ('design-mockups', 'output', 'legacy', '_site', '.playwright-cli', '.playwright-mcp'):
        if (REPO_ROOT / name).exists():
            errors.append(f'Generated or retired directory outside .artifacts/: {name}')
    for pattern in ('*.png', '*.generation.json', '*.prompt.txt', '*.prompts.txt'):
        for path in REPO_ROOT.glob(pattern):
            errors.append(f'Artifact outside .artifacts/: {path.name}')
    for path in (REPO_ROOT / 'pages').glob('*/*.html'):
        errors.append(f'Duplicate preview HTML outside .artifacts/: {path.relative_to(REPO_ROOT)}')
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=REPO_ROOT, help='Validate a prepared artifact instead')
    args = parser.parse_args()
    errors = validate_references(args.root.resolve())
    if args.root.resolve() == REPO_ROOT:
        errors += validate_layout()
    for message in errors:
        print('[error]', message)
    if not errors:
        print('[ok] runtime references and artifact boundaries')
    return bool(errors)


if __name__ == '__main__':
    raise SystemExit(main())
