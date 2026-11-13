#!/usr/bin/env python3
"""Package generated chapters and explicit runtime assets for GitHub Pages."""
from __future__ import annotations

import argparse
import json
import shutil
import fnmatch
from pathlib import Path
from urllib.parse import urlsplit, unquote

from site_common import ARTIFACTS_ROOT, REPO_ROOT, load_registry, load_text

DEFAULT_OUTPUT_DIR = ARTIFACTS_ROOT / 'site'


def resolve_output_dir(value: str) -> Path:
    path = Path(value)
    return (path if path.is_absolute() else REPO_ROOT / path).resolve()


def ensure_safe_output_dir(output_dir: Path) -> None:
    """Recreation is allowed only below the dedicated build directory."""
    output_dir = output_dir.resolve()
    allowed_root = DEFAULT_OUTPUT_DIR.resolve()
    if not allowed_root.is_relative_to(REPO_ROOT.resolve() / '.artifacts'):
        raise ValueError('Build output must not traverse a symlink outside .artifacts')
    if output_dir != allowed_root and not output_dir.is_relative_to(allowed_root):
        raise ValueError(f'Output must be {allowed_root} or one of its subdirectories')


def runtime_page_files() -> list[Path]:
    files = {REPO_ROOT / 'index.html'}
    for page in load_registry()['pages']:
        files.add(REPO_ROOT / page['src'])
        manifest_path = REPO_ROOT / page['buildManifest']
        manifest = json.loads(load_text(manifest_path))
        for pattern in manifest.get('runtimeFiles', []):
            matches = sorted(manifest_path.parent.glob(pattern))
            if not matches:
                raise ValueError(f'Runtime pattern has no matches: {manifest_path}: {pattern}')
            for path in matches:
                if not path.resolve().is_relative_to(REPO_ROOT / 'pages'):
                    raise ValueError(f'Runtime file must stay inside pages/: {path}')
                if path.is_file():
                    files.add(path)
    return sorted(files)


def runtime_asset_files() -> list[Path]:
    manifest = json.loads(load_text(REPO_ROOT / 'src/app/runtime-assets.json'))
    files = set()
    for pattern in manifest['include']:
        for path in REPO_ROOT.glob(pattern):
            if not path.is_file():
                continue
            if not path.resolve().is_relative_to((REPO_ROOT / 'assets').resolve()):
                raise ValueError(f'Runtime asset must stay inside assets/: {path}')
            relative = path.relative_to(REPO_ROOT).as_posix()
            if not any(fnmatch.fnmatchcase(relative, exclude) for exclude in manifest.get('exclude', [])):
                files.add(path)
    for page in load_registry()['pages']:
        page_manifest = json.loads(load_text(REPO_ROOT / page['buildManifest']))
        for reference in page_manifest.get('runtimeAssets', []):
            url = urlsplit(reference)
            if url.scheme or url.netloc:
                raise ValueError(f'runtimeAssets must declare local files: {reference}')
            asset = ((REPO_ROOT / page['src']).parent / unquote(url.path)).resolve()
            if not asset.is_relative_to((REPO_ROOT / 'assets').resolve()) or not asset.is_file():
                raise ValueError(f'Missing or invalid dynamic asset in {page["id"]}: {reference}')
            files.add(asset)
    return sorted(files)


def build_artifact_dir(output_dir: Path) -> None:
    output_dir = output_dir.resolve()
    ensure_safe_output_dir(output_dir)
    files = runtime_page_files()
    files.extend(runtime_asset_files())
    missing = [path for path in files if not path.is_file()]
    if missing:
        raise FileNotFoundError(f'Missing runtime files: {missing}')
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True)
    for source in files:
        target = output_dir / source.relative_to(REPO_ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
    (output_dir / '.nojekyll').write_text('', encoding='utf-8')


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', default=str(DEFAULT_OUTPUT_DIR), help='Build folder below .artifacts/site')
    args = parser.parse_args()
    output_dir = resolve_output_dir(args.output)
    build_artifact_dir(output_dir)
    print(f'[ok] prepared Pages artifact at {output_dir}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
