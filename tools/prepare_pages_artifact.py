#!/usr/bin/env python3
from __future__ import annotations

import argparse
import shutil
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_DIR = REPO_ROOT / "_site"
SITE_ENTRIES = ("index.html", "assets", "pages")
IGNORED_NAMES = {
    ".DS_Store",
    "Thumbs.db",
    "__pycache__",
}


def resolve_output_dir(value: str) -> Path:
    output_dir = Path(value)
    if not output_dir.is_absolute():
        output_dir = REPO_ROOT / output_dir
    return output_dir.resolve()


def ensure_safe_output_dir(output_dir: Path) -> None:
    repo_root = REPO_ROOT.resolve()
    if output_dir == repo_root:
        raise ValueError("Output directory must not be the repository root")
    if repo_root not in output_dir.parents:
        raise ValueError(f"Output directory must be inside {repo_root}")


def ignore_artifact_noise(_directory: str, names: list[str]) -> set[str]:
    return {name for name in names if name in IGNORED_NAMES or name.endswith(".pyc")}


def copy_entry(name: str, output_dir: Path) -> None:
    source = REPO_ROOT / name
    target = output_dir / name
    if not source.exists():
        raise FileNotFoundError(f"Required site entry is missing: {source}")
    if source.is_dir():
        shutil.copytree(source, target, ignore=ignore_artifact_noise)
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)


def build_artifact_dir(output_dir: Path) -> None:
    ensure_safe_output_dir(output_dir)

    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True)

    for entry in SITE_ENTRIES:
        copy_entry(entry, output_dir)

    (output_dir / ".nojekyll").write_text("", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Prepare the minimal static directory uploaded to GitHub Pages."
    )
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT_DIR),
        help="Output directory to recreate. Defaults to ./_site.",
    )
    args = parser.parse_args()

    output_dir = resolve_output_dir(args.output)
    build_artifact_dir(output_dir)
    print(f"[ok] prepared Pages artifact at {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
