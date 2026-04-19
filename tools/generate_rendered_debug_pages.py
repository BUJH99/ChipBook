#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import os
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit


REPO_ROOT = Path(__file__).resolve().parents[1]
URL_ATTR_PATTERN = re.compile(r'(?P<attr>\b(?:src|href)\s*=\s*)(?P<quote>["\'])(?P<url>[^"\']+)(?P=quote)')
DEFAULT_KEY_PATTERN = re.compile(r"(?P<prefix>\bdefaultKey\s*:\s*')(?P<key>[^']+)(?P<suffix>')")
TITLE_PATTERN = re.compile(r"(<title>)(.*?)(</title>)", re.IGNORECASE | re.DOTALL)


def camel_to_kebab(value: str) -> str:
    return re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", value).lower()


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "section"


def titleize_key(value: str) -> str:
    return value.replace("-", " ").replace("_", " ").strip().title() or value


def load_text(path: Path) -> str:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return handle.read()


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        handle.write(content)


def collect_panel_keys(text: str, dataset_key: str) -> list[str]:
    attr_name = camel_to_kebab(dataset_key)
    pattern = re.compile(rf"<[a-zA-Z0-9:-]+\b[^>]*\bdata-{re.escape(attr_name)}=\"([^\"]+)\"[^>]*>")

    keys: list[str] = []
    seen: set[str] = set()
    for match in pattern.finditer(text):
        key = match.group(1)
        if key in seen:
            continue
        seen.add(key)
        keys.append(key)

    if not keys:
        raise ValueError(f"No data-{attr_name} markers found in the page")
    return keys


def collect_labels(text: str, dataset_key: str) -> dict[str, str]:
    attr_name = camel_to_kebab(dataset_key)
    pattern = re.compile(rf"<[a-zA-Z0-9:-]+\b[^>]*\bdata-{re.escape(attr_name)}=\"([^\"]+)\"[^>]*>")

    labels: dict[str, str] = {}
    for match in pattern.finditer(text):
        key = match.group(1)
        tag_text = match.group(0)
        label_match = re.search(r'\bdata-guidebook-toc-title="([^"]+)"', tag_text)
        label = (label_match.group(1) if label_match else "").strip()
        if key not in labels and label:
            labels[key] = label
    return labels


def rebase_urls(text: str, source_dir: Path, output_dir: Path) -> str:
    def replace(match: re.Match[str]) -> str:
        raw_url = match.group("url")
        parts = urlsplit(raw_url)
        if parts.scheme or raw_url.startswith(("#", "data:", "mailto:", "tel:", "javascript:", "//", "/")):
            return match.group(0)
        target = (source_dir / parts.path).resolve()
        relative_to_output = Path(os.path.relpath(target, output_dir)).as_posix()
        new_url = urlunsplit(("", "", relative_to_output, parts.query, parts.fragment))
        return f"{match.group('attr')}{match.group('quote')}{new_url}{match.group('quote')}"

    return URL_ATTR_PATTERN.sub(replace, text)


def replace_default_key(text: str, new_key: str) -> str:
    replaced, count = DEFAULT_KEY_PATTERN.subn(rf"\g<prefix>{new_key}\g<suffix>", text, count=1)
    if count != 1:
        raise ValueError("Could not find a unique defaultKey to replace")
    return replaced


def replace_title(text: str, label: str) -> str:
    def repl(match: re.Match[str]) -> str:
        original = re.sub(r"\s+", " ", match.group(2)).strip()
        return f"{match.group(1)}{html.escape(label)} | {original}{match.group(3)}"

    replaced, count = TITLE_PATTERN.subn(repl, text, count=1)
    return replaced if count else text


def choose_output_names(page_dir: Path, keys: list[str]) -> list[str]:
    section_dir = page_dir / "source" / "sections"
    if not section_dir.is_dir():
        section_dir = page_dir / "sections"
    section_files = sorted(path.name for path in section_dir.glob("*.html"))
    if len(section_files) == len(keys):
        return section_files
    return [f"{index:02d}-{slugify(key)}.html" for index, key in enumerate(keys, start=1)]


def render_page_variants(source: Path, dataset_key: str) -> Path:
    text = load_text(source)
    source_dir = source.parent
    page_dir = source.with_suffix("")
    page_dir.mkdir(parents=True, exist_ok=True)

    keys = collect_panel_keys(text, dataset_key)
    labels = collect_labels(text, dataset_key)
    output_names = choose_output_names(page_dir, keys)

    generated: list[tuple[str, str]] = []
    for key, filename in zip(keys, output_names):
        label = labels.get(key, titleize_key(key))
        rendered = replace_default_key(text, key)
        rendered = replace_title(rendered, label)
        rendered = rebase_urls(rendered, source_dir, page_dir)
        write_text(page_dir / filename, rendered)
        generated.append((filename, label))

    index_html = build_index_html(source.name, generated)
    write_text(page_dir / "index.html", index_html)
    return page_dir


def build_index_html(source_name: str, generated: list[tuple[str, str]]) -> str:
    links = "\n".join(
        f'        <li><a href="./{html.escape(filename)}">{html.escape(label)}</a></li>'
        for filename, label in generated
    )
    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{html.escape(source_name)} Debug Pages</title>
    <style>
        body {{
            margin: 0;
            font-family: Pretendard, system-ui, sans-serif;
            background: #f5f7fb;
            color: #1f2937;
        }}
        main {{
            max-width: 880px;
            margin: 0 auto;
            padding: 48px 24px 64px;
        }}
        h1 {{
            margin: 0 0 12px;
            font-size: 32px;
            line-height: 1.2;
        }}
        p {{
            margin: 0 0 24px;
            color: #4b5563;
            line-height: 1.7;
        }}
        ul {{
            list-style: none;
            padding: 0;
            margin: 0;
            display: grid;
            gap: 12px;
        }}
        a {{
            display: block;
            padding: 16px 18px;
            background: #ffffff;
            border: 1px solid #dbe3f1;
            border-radius: 16px;
            color: #2563eb;
            font-weight: 700;
            text-decoration: none;
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
        }}
        a:hover {{
            border-color: #93c5fd;
            background: #f8fbff;
        }}
    </style>
</head>
<body>
    <main>
        <h1>{html.escape(source_name)} Debug Pages</h1>
        <p>각 링크는 원본 페이지 로직을 유지한 채, 해당 소목차가 기본 활성 상태로 열리도록 만든 독립 HTML입니다.</p>
        <ul>
{links}
        </ul>
    </main>
</body>
</html>
"""


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        description="Generate rendered debug HTML files for each action-section state."
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
        page_dir = render_page_variants(source, args.dataset_key)
        print(f"[ok] rendered debug pages for {source.relative_to(REPO_ROOT)} -> {page_dir.relative_to(REPO_ROOT)}")
        return 0
    except Exception as error:  # pragma: no cover - CLI error handling
        print(f"generate_rendered_debug_pages.py: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
