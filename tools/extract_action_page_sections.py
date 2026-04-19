#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


def camel_to_kebab(value: str) -> str:
    return re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", value).lower()


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "section"


def load_text(path: Path) -> str:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return handle.read()


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        handle.write(content)


def find_section_close_start(text: str, start_at: int) -> int:
    match = re.search(r"\r?\n\s*</section>\s*\r?\n\s*</main>", text[start_at:])
    if not match:
        raise ValueError("Could not find the closing </section> block near the end of the page")
    return start_at + match.start()


def collect_panel_groups(text: str, dataset_key: str) -> list[tuple[str, int]]:
    attr_name = camel_to_kebab(dataset_key)
    pattern = re.compile(rf"<[a-zA-Z0-9:-]+\b[^>]*\bdata-{re.escape(attr_name)}=\"([^\"]+)\"[^>]*>")

    ordered: list[tuple[str, int]] = []
    seen: set[str] = set()
    for match in pattern.finditer(text):
        key = match.group(1)
        if key in seen:
            continue
        seen.add(key)
        ordered.append((key, match.start()))

    if not ordered:
        raise ValueError(f"No data-{attr_name} markers found in the page")
    return ordered


def build_manifest(source: Path, manifest_dir: Path, section_files: list[str]) -> dict[str, object]:
    return {
        "output": os.path.relpath(source, manifest_dir).replace("\\", "/"),
        "parts": [
            "00-shell-start.html",
            *section_files,
            "99-shell-end.html",
        ],
    }


def extract_sections(source: Path, dataset_key: str) -> Path:
    text = load_text(source)
    panel_groups = collect_panel_groups(text, dataset_key)
    last_group_start = panel_groups[-1][1]
    shell_end_start = find_section_close_start(text, last_group_start)

    page_dir = source.with_suffix("")
    source_dir = page_dir / "source"
    sections_dir = source_dir / "sections"

    section_files: list[str] = []
    first_start = panel_groups[0][1]
    write_text(source_dir / "00-shell-start.html", text[:first_start])

    for index, (key, start) in enumerate(panel_groups, start=1):
        end = panel_groups[index][1] if index < len(panel_groups) else shell_end_start
        filename = f"{index:02d}-{slugify(key)}.html"
        write_text(sections_dir / filename, text[start:end])
        section_files.append(f"sections/{filename}")

    write_text(source_dir / "99-shell-end.html", text[shell_end_start:])
    write_text(
        source_dir / "page-build.json",
        json.dumps(build_manifest(source, source_dir, section_files), ensure_ascii=False, indent=2) + "\n",
    )

    reconstructed = "".join(
        load_text(source_dir / relative_path)
        for relative_path in ["00-shell-start.html", *section_files, "99-shell-end.html"]
    )
    if reconstructed != text:
        raise ValueError(f"Reconstructed output does not match the original file for {source}")

    return page_dir


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        description="Extract action-section pages into folder-based HTML fragments."
    )
    parser.add_argument("source", help="Path to the source page HTML file")
    parser.add_argument(
        "--dataset-key",
        required=True,
        help="Dataset key used by initActionSectionPage, such as part1Panel",
    )
    args = parser.parse_args(argv)

    try:
        source = (REPO_ROOT / args.source).resolve() if not Path(args.source).is_absolute() else Path(args.source).resolve()
        if not source.is_file():
            raise FileNotFoundError(f"Source page not found: {source}")
        out_dir = extract_sections(source, args.dataset_key)
        print(f"[ok] extracted {source.relative_to(REPO_ROOT)} -> {out_dir.relative_to(REPO_ROOT)}")
        return 0
    except Exception as error:  # pragma: no cover - CLI error handling
        print(f"extract_action_page_sections.py: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
