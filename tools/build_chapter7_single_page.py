#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "pages" / "page-7-uvm-verification" / "source" / "page-build.json"


def main() -> int:
    command = [
        sys.executable,
        str(ROOT / "tools" / "build_split_pages.py"),
        str(MANIFEST.relative_to(ROOT)),
    ]
    subprocess.run(command, cwd=ROOT, check=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
