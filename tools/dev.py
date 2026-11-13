#!/usr/bin/env python3
"""One entry point for building, checking, previewing and packaging ChipBook."""
from __future__ import annotations

import argparse
import subprocess
import sys
import os

from site_common import REPO_ROOT
from prepare_pages_artifact import runtime_page_files


def run(*args):
    subprocess.run(args, cwd=REPO_ROOT, check=True)


def python(script, *args):
    run(sys.executable, str(REPO_ROOT / 'tools' / script), *args)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['build', 'check', 'test', 'setup-browser', 'test-browser', 'serve', 'preview', 'package'])
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    if args.command == 'build':
        python('build_site.py')
    elif args.command == 'check':
        python('build_site.py', '--check')
        run('node', str(REPO_ROOT / 'tools/check_scripts.cjs'), *[str(path) for path in runtime_page_files()])
    elif args.command == 'test':
        run(sys.executable, '-m', 'unittest', 'discover', '-s', 'tools', '-p', 'test_*.py')
        run('node', '--test', *[str(path) for path in sorted((REPO_ROOT / 'tools').glob('test_*.cjs'))])
    elif args.command in {'test-browser', 'setup-browser'}:
        os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', str(REPO_ROOT / '.artifacts/cache/playwright'))
        cli = str(REPO_ROOT / 'node_modules/@playwright/test/cli.js')
        if args.command == 'setup-browser':
            run('node', cli, 'install', 'chromium')
        else:
            python('build_site.py')
            python('prepare_pages_artifact.py')
            run('node', cli, 'test', '--config', 'tools/playwright.config.cjs')
    elif args.command == 'serve':
        python('build_site.py')
        run(sys.executable, '-m', 'http.server', str(args.port), '--bind', '127.0.0.1')
    elif args.command == 'preview':
        python('build_site.py')
        python('build_previews.py')
    elif args.command == 'package':
        python('build_site.py')
        python('prepare_pages_artifact.py')
        python('validate_site.py', '--root', '.artifacts/site')
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as error:
        raise SystemExit(error.returncode)
