from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
TOOLS_DIR = REPO_ROOT / "tools"


def run_script(script_name: str, *args: str) -> None:
    command = [sys.executable, str(TOOLS_DIR / script_name), *args]
    subprocess.run(command, cwd=REPO_ROOT, check=True)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build and validate the ChipBook static page hierarchy."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Verify generated files without rewriting them.",
    )
    parser.add_argument(
        "--include-chapter7",
        action="store_true",
        help="Regenerate the chapter 7 single page before validating the site.",
    )
    args = parser.parse_args()

    if args.include_chapter7:
        if args.check:
            print("[skip] tools/build_chapter7_single_page.py has no --check mode")
        else:
            run_script("build_chapter7_single_page.py")

    split_args = ["--check"] if args.check else []
    index_args = ["--check"] if args.check else []

    run_script("build_split_pages.py", *split_args)
    run_script("build_index.py", *index_args)
    run_script("validate_page_registry.py")

    print("[ok] site hierarchy")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
