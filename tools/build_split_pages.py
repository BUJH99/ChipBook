#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
PAGES_ROOT = REPO_ROOT / "pages"
MANIFEST_NAME = "page-build.json"


def load_text(path: Path) -> str:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return handle.read()


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        handle.write(content)


def discover_manifests() -> list[Path]:
    return sorted(PAGES_ROOT.glob(f"*/{MANIFEST_NAME}"))


def resolve_manifest_targets(raw_targets: list[str]) -> list[Path]:
    if not raw_targets:
        manifests = discover_manifests()
        if not manifests:
            raise FileNotFoundError(f"No {MANIFEST_NAME} files found under {PAGES_ROOT}")
        return manifests

    manifests: list[Path] = []
    for raw_target in raw_targets:
        target = (REPO_ROOT / raw_target).resolve() if not Path(raw_target).is_absolute() else Path(raw_target).resolve()
        if target.is_dir():
            manifest_path = target / MANIFEST_NAME
        else:
            manifest_path = target

        if manifest_path.name != MANIFEST_NAME:
            raise FileNotFoundError(f"Expected a {MANIFEST_NAME} file or a page folder, got: {raw_target}")
        if not manifest_path.is_file():
            raise FileNotFoundError(f"Manifest not found: {manifest_path}")
        manifests.append(manifest_path)

    return manifests


def expand_part_patterns(manifest_dir: Path, patterns: list[str]) -> list[Path]:
    parts: list[Path] = []
    for pattern in patterns:
        matches = sorted(manifest_dir.glob(pattern))
        if matches:
            parts.extend(path for path in matches if path.is_file())
            continue

        direct_path = manifest_dir / pattern
        if direct_path.is_file():
            parts.append(direct_path)
            continue

        raise FileNotFoundError(f"Part pattern did not match any files: {pattern} ({manifest_dir})")

    if not parts:
        raise ValueError(f"No part files resolved for {manifest_dir / MANIFEST_NAME}")
    return parts


def render_manifest(manifest_path: Path, check_only: bool = False) -> bool:
    manifest_dir = manifest_path.parent
    manifest = json.loads(load_text(manifest_path))

    output = manifest.get("output")
    part_patterns = manifest.get("parts")

    if not isinstance(output, str) or not output.strip():
        raise ValueError(f"'output' must be a non-empty string in {manifest_path}")
    if not isinstance(part_patterns, list) or not part_patterns or not all(isinstance(item, str) for item in part_patterns):
        raise ValueError(f"'parts' must be a non-empty string list in {manifest_path}")

    part_files = expand_part_patterns(manifest_dir, part_patterns)
    rendered = "".join(load_text(path) for path in part_files)
    output_path = (manifest_dir / output).resolve()
    current = load_text(output_path) if output_path.exists() else None
    changed = current != rendered

    if not check_only and changed:
        write_text(output_path, rendered)

    print(f"[{'changed' if changed else 'ok'}] {output_path.relative_to(REPO_ROOT)}")
    return changed


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        description="Build split page folders back into final pages/*.html files."
    )
    parser.add_argument(
        "targets",
        nargs="*",
        help="Optional page folder(s) or page-build.json path(s). Defaults to every manifest under pages/.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Check whether outputs are up to date without rewriting files.",
    )
    args = parser.parse_args(argv)

    try:
        manifests = resolve_manifest_targets(args.targets)
        changed = False
        for manifest_path in manifests:
            changed = render_manifest(manifest_path, check_only=args.check) or changed
        return 1 if args.check and changed else 0
    except Exception as error:  # pragma: no cover - CLI error handling
        print(f"build_split_pages.py: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
