#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
PAGE_PROFILES: dict[str, str] = {
    "pages/page-9-off-chip-interface.html": "static-triptych",
    "pages/page-10-solution.html": "static-triptych",
    "pages/page-11-ai-accelerator.html": "static-triptych",
    "pages/page-13-practice-bank.html": "practice-bank",
    "pages/page-14-mock-exam.html": "mock-exam",
}
TRIPTYCH_SECTION_FILES: dict[str, list[str]] = {
    "page-9-off-chip-interface.html": [
        "sections/01-interface-stack.html",
        "sections/02-common-interfaces.html",
        "sections/03-debug-checklist.html",
    ],
    "page-10-solution.html": [
        "sections/01-integration-stack.html",
        "sections/02-solution-thinking.html",
        "sections/03-interview-memory-hooks.html",
    ],
    "page-11-ai-accelerator.html": [
        "sections/01-accelerator-stack.html",
        "sections/02-dataflow.html",
        "sections/03-metric-debug.html",
    ],
}


@dataclass(frozen=True)
class Part:
    relative_path: str
    content: str


def load_text(path: Path) -> str:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return handle.read()


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        handle.write(content)


def find_open_tag(text: str, start: int = 0, *, tag: str = "div", contains: str | None = None) -> int:
    pattern = re.compile(rf"<{tag}\b[^>]*>", re.IGNORECASE)
    for match in pattern.finditer(text, start):
        if contains is None or contains in match.group(0):
            return match.start()
    raise ValueError(f"Could not find <{tag}> tag containing {contains!r}")


def find_open_tag_end(text: str, start: int) -> int:
    end = text.find(">", start)
    if end < 0:
        raise ValueError("Could not find end of opening tag")
    return end + 1


def find_matching_close(text: str, start: int, *, tag: str = "div") -> int:
    token_pattern = re.compile(rf"</?{tag}\b[^>]*>", re.IGNORECASE)
    depth = 0
    for match in token_pattern.finditer(text, start):
        token = match.group(0)
        if token.startswith("</"):
            depth -= 1
            if depth == 0:
                return match.end()
        elif not token.endswith("/>"):
            depth += 1
    raise ValueError(f"Could not find matching </{tag}>")


def make_manifest(source: Path, source_dir: Path, part_files: list[str]) -> str:
    manifest = {
        "output": os.path.relpath(source, source_dir).replace("\\", "/"),
        "parts": part_files,
    }
    return json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"


def write_parts(source: Path, parts: list[Part]) -> Path:
    page_dir = source.with_suffix("")
    source_dir = page_dir / "source"
    part_files = [part.relative_path for part in parts]

    for part in parts:
        write_text(source_dir / part.relative_path, part.content)
    write_text(source_dir / "page-build.json", make_manifest(source, source_dir, part_files))

    reconstructed = "".join(load_text(source_dir / relative_path) for relative_path in part_files)
    original = load_text(source)
    if reconstructed != original:
        raise ValueError(f"Reconstructed output does not match the original file for {source}")

    return page_dir


def extract_triptych(source: Path, text: str) -> list[Part]:
    section_files = TRIPTYCH_SECTION_FILES.get(source.name)
    if not section_files:
        raise ValueError(f"No triptych section mapping exists for {source.name}")

    content_start = find_open_tag(text, contains='class="space-y-8"')
    content_open_end = find_open_tag_end(text, content_start)
    content_end = find_matching_close(text, content_start)

    first_child_start = find_open_tag(text, content_open_end)
    first_child_end = find_matching_close(text, first_child_start)
    stack_start = find_open_tag(text, first_child_end)
    stack_end = find_matching_close(text, stack_start)
    grid_start = find_open_tag(text, stack_end, contains='class="grid grid-cols-1 xl:grid-cols-2 gap-6"')
    grid_open_end = find_open_tag_end(text, grid_start)
    grid_end = find_matching_close(text, grid_start)

    second_card_start = find_open_tag(text, grid_open_end)
    second_card_end = find_matching_close(text, second_card_start)
    third_card_start = find_open_tag(text, second_card_end)
    third_card_end = find_matching_close(text, third_card_start)

    return [
        Part("00-shell-start.html", text[:first_child_start]),
        Part(section_files[0], text[first_child_start:grid_start]),
        Part("20-grid-start.html", text[grid_start:second_card_start]),
        Part(section_files[1], text[second_card_start:third_card_start]),
        Part(section_files[2], text[third_card_start:third_card_end]),
        Part("29-grid-end.html", text[third_card_end:content_end]),
        Part("99-shell-end.html", text[content_end:]),
    ]


def extract_practice_bank(text: str) -> list[Part]:
    overview_start = find_open_tag(text, contains='id="practice-difficulty-overview"')
    filter_start = find_open_tag(text, contains='class="practice-filter-shell"')
    groups_start = find_open_tag(text, contains='id="practice-question-groups"')
    groups_end = find_matching_close(text, groups_start)

    return [
        Part("00-shell-start.html", text[:overview_start]),
        Part("sections/01-practice-overview.html", text[overview_start:filter_start]),
        Part("sections/02-practice-filters.html", text[filter_start:groups_start]),
        Part("sections/03-practice-bank.html", text[groups_start:groups_end]),
        Part("99-shell-end.html", text[groups_end:]),
    ]


def extract_mock_exam(text: str) -> list[Part]:
    start_screen_start = find_open_tag(text, contains='id="mock-start-screen"')
    start_screen_end = find_matching_close(text, start_screen_start)
    exam_start = find_open_tag(text, start_screen_end, contains='id="mock-exam-container"')
    exam_end = find_matching_close(text, exam_start)
    submit_start = find_open_tag(text, exam_end, contains='id="mock-submit-btn"')
    submit_end = find_matching_close(text, submit_start)
    result_start = find_open_tag(text, submit_end, contains='id="mock-result-screen"')
    result_end = find_matching_close(text, result_start)

    return [
        Part("00-shell-start.html", text[:start_screen_start]),
        Part("sections/01-mock-start.html", text[start_screen_start:exam_start]),
        Part("sections/02-mock-exam.html", text[exam_start:result_start]),
        Part("sections/03-mock-result.html", text[result_start:result_end]),
        Part("99-shell-end.html", text[result_end:]),
    ]


def extract(source: Path, profile: str) -> Path:
    text = load_text(source)
    if profile == "static-triptych":
        parts = extract_triptych(source, text)
    elif profile == "practice-bank":
        parts = extract_practice_bank(text)
    elif profile == "mock-exam":
        parts = extract_mock_exam(text)
    else:
        raise ValueError(f"Unsupported profile: {profile}")

    return write_parts(source, parts)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Extract small static pages into source/section fragments.")
    parser.add_argument("sources", nargs="*", help="HTML page files to extract. Defaults to every known profile.")
    args = parser.parse_args(argv)

    try:
        raw_sources = args.sources or sorted(PAGE_PROFILES)
        for raw_source in raw_sources:
            source = (REPO_ROOT / raw_source).resolve() if not Path(raw_source).is_absolute() else Path(raw_source).resolve()
            try:
                relative = source.relative_to(REPO_ROOT).as_posix()
            except ValueError:
                raise ValueError(f"Source must stay inside the repository: {source}") from None
            if relative.startswith("uvm_refactoring/"):
                raise ValueError(f"Refusing to extract excluded path: {relative}")
            if not source.is_file():
                raise FileNotFoundError(f"Source page not found: {source}")

            profile = PAGE_PROFILES.get(relative)
            if not profile:
                raise ValueError(f"No extraction profile for {relative}")

            out_dir = extract(source, profile)
            print(f"[ok] extracted {source.relative_to(REPO_ROOT)} -> {out_dir.relative_to(REPO_ROOT)}")
        return 0
    except Exception as error:  # pragma: no cover - CLI error handling
        print(f"extract_static_page_sections.py: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
