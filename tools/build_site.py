from __future__ import annotations

import argparse
import subprocess
import sys
from site_common import REPO_ROOT


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
    args = parser.parse_args()

    subprocess.run(['node', str(TOOLS_DIR / 'build_assets.cjs'), *(['--check'] if args.check else [])],
                   cwd=REPO_ROOT, check=True)

    split_args = ["--check"] if args.check else []
    index_args = ["--check"] if args.check else []

    run_script("build_split_pages.py", *split_args)
    run_script("build_index.py", *index_args)
    run_script("validate_page_registry.py")
    run_script("validate_site.py")

    print("[ok] site hierarchy")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as error:
        raise SystemExit(error.returncode)
