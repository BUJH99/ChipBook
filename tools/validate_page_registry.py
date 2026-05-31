#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = REPO_ROOT / "src" / "app" / "page-registry.json"
EXCLUDED_PARTS = {"uvm_refactoring"}


def load_registry() -> dict[str, object]:
    with REGISTRY_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def resolve_repo_path(raw_path: str) -> Path:
    normalized = raw_path[2:] if raw_path.startswith("./") else raw_path
    return (REPO_ROOT / normalized).resolve()


def is_excluded(path: Path) -> bool:
    try:
        relative = path.relative_to(REPO_ROOT)
    except ValueError:
        return True
    return any(part in EXCLUDED_PARTS for part in relative.parts)


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def validate_artifact_path(raw_path: object, label: str, errors: list[str], must_be_file: bool = True) -> None:
    if raw_path is None:
        return
    if not isinstance(raw_path, str) or not raw_path.strip():
        errors.append(f"{label} must be a non-empty string")
        return

    path = resolve_repo_path(raw_path)
    require(not is_excluded(path), f"{label} points into excluded uvm_refactoring: {raw_path}", errors)
    if must_be_file:
        require(path.is_file(), f"{label} file not found: {raw_path}", errors)
    else:
        require(path.exists(), f"{label} path not found: {raw_path}", errors)


def validate_page(page: dict[str, object], index: int, seen_ids: set[str], seen_numbers: set[int], errors: list[str]) -> None:
    page_label = f"pages[{index}]"
    page_id = page.get("id")
    number = page.get("number")

    require(isinstance(page_id, str) and page_id.strip(), f"{page_label}.id is required", errors)
    require(isinstance(number, int), f"{page_label}.number must be an integer", errors)
    if isinstance(number, int):
        require(number not in seen_numbers, f"Duplicate page number: {number}", errors)
        seen_numbers.add(number)
        require(page_id == f"page-{number}", f"{page_label}.id should match page-{number}, got {page_id!r}", errors)
    if isinstance(page_id, str):
        require(page_id not in seen_ids, f"Duplicate page id: {page_id}", errors)
        seen_ids.add(page_id)

    validate_artifact_path(page.get("src"), f"{page_label}.src", errors)
    validate_artifact_path(page.get("buildManifest"), f"{page_label}.buildManifest", errors)
    validate_artifact_path(page.get("generator"), f"{page_label}.generator", errors)
    validate_artifact_path(page.get("debugDir"), f"{page_label}.debugDir", errors, must_be_file=False)

    source_text = ""
    if isinstance(page.get("src"), str):
        source_path = resolve_repo_path(page["src"])
        if source_path.is_file() and not is_excluded(source_path):
            source_text = source_path.read_text(encoding="utf-8", errors="replace")

    if source_text and isinstance(page_id, str):
        require(
            f'data-page-id="{page_id}"' in source_text,
            f"{page_label}.src does not declare data-page-id=\"{page_id}\"",
            errors,
        )

    section_attribute = page.get("sectionAttribute")
    sections = page.get("sections")
    require(isinstance(sections, list) and len(sections) > 0, f"{page_label}.sections must be a non-empty list", errors)
    if not isinstance(sections, list):
        return

    seen_section_keys: set[str] = set()
    for section_index, section in enumerate(sections):
        section_label = f"{page_label}.sections[{section_index}]"
        require(isinstance(section, dict), f"{section_label} must be an object", errors)
        if not isinstance(section, dict):
            continue

        key = section.get("key")
        title = section.get("title")
        require(isinstance(key, str) and key.strip(), f"{section_label}.key is required", errors)
        require(isinstance(title, str) and title.strip(), f"{section_label}.title is required", errors)
        if isinstance(key, str):
            require(key not in seen_section_keys, f"Duplicate section key in {page_label}: {key}", errors)
            seen_section_keys.add(key)

            if isinstance(section_attribute, str) and section_attribute and source_text:
                pattern = rf'{re.escape(section_attribute)}="{re.escape(key)}"'
                require(
                    re.search(pattern, source_text) is not None,
                    f"{page_label}.src does not contain {section_attribute}=\"{key}\"",
                    errors,
                )

        validate_artifact_path(section.get("source"), f"{section_label}.source", errors)


def validate_registry(registry: dict[str, object]) -> list[str]:
    errors: list[str] = []
    site = registry.get("site")
    pages = registry.get("pages")
    require(isinstance(site, dict), "site must be an object", errors)
    require(isinstance(pages, list) and len(pages) > 0, "pages must be a non-empty list", errors)
    if not isinstance(pages, list):
        return errors

    seen_ids: set[str] = set()
    seen_numbers: set[int] = set()
    for index, page in enumerate(pages):
        require(isinstance(page, dict), f"pages[{index}] must be an object", errors)
        if isinstance(page, dict):
            validate_page(page, index, seen_ids, seen_numbers, errors)

    page_numbers = [page.get("number") for page in pages if isinstance(page, dict)]
    integer_page_numbers = [number for number in page_numbers if isinstance(number, int)]
    if len(integer_page_numbers) == len(page_numbers):
        require(
            integer_page_numbers == sorted(integer_page_numbers),
            f"page numbers should be in ascending order, got {integer_page_numbers}",
            errors,
        )
    return errors


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Validate src/app/page-registry.json against current page files.")
    parser.parse_args(argv)

    try:
        errors = validate_registry(load_registry())
    except Exception as error:  # pragma: no cover - CLI error handling
        print(f"validate_page_registry.py: {error}", file=sys.stderr)
        return 2

    if errors:
        for error in errors:
            print(f"[error] {error}", file=sys.stderr)
        return 1

    print("[ok] src/app/page-registry.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
