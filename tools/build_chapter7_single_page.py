#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "chapter7change"
DATA_OUTPUT_FILE = ROOT / "assets" / "chapter7-single-page-data.js"
PAGE_OUTPUT_FILE = ROOT / "pages" / "page-7-uvm-verification.html"
RUNTIME_FILE = ROOT / "assets" / "chapter7-single-page-runtime.js"
SCOPE_SELECTOR = '[data-chapter7-runtime-root]'
PAYLOAD_START_MARKER = "<!-- CHAPTER7_PAYLOAD_START -->"
PAYLOAD_END_MARKER = "<!-- CHAPTER7_PAYLOAD_END -->"
RUNTIME_START_MARKER = "<!-- CHAPTER7_RUNTIME_START -->"
RUNTIME_END_MARKER = "<!-- CHAPTER7_RUNTIME_END -->"

PARTS = {
    "uvm-basics": "7-1.html",
    "uvm-overview": "7-2.html",
    "uvm-core": "7-3.html",
    "component-object": "7-4.html",
    "stimulus-tlm": "7-5.html",
    "register-model": "7-6.html",
    "checking-reporting": "7-7.html",
    "execution-commandline": "7-8.html",
}


def extract_first(pattern: str, text: str) -> str:
    match = re.search(pattern, text, flags=re.IGNORECASE | re.DOTALL)
    if not match:
        raise ValueError(f"Pattern not found: {pattern}")
    return match.group(1) if match.lastindex else match.group(0)


def extract_main(html: str) -> str:
    return extract_first(r"(<main\b[^>]*>.*?</main>)", html).strip()


def extract_styles(html: str) -> list[str]:
    return [match.strip() for match in re.findall(r"<style[^>]*>(.*?)</style>", html, flags=re.IGNORECASE | re.DOTALL) if match.strip()]


def extract_scripts(html: str) -> list[str]:
    scripts: list[str] = []
    for match in re.finditer(r"<script(?P<attrs>[^>]*)>(?P<content>.*?)</script>", html, flags=re.IGNORECASE | re.DOTALL):
        attrs = match.group("attrs") or ""
        content = (match.group("content") or "").strip()
        if "src=" in attrs.lower():
            continue
        if not content:
            continue
        if "tailwind.config" in content:
            continue
        scripts.append(content)
    return scripts


def split_selector_list(selector_text: str) -> list[str]:
    selectors: list[str] = []
    buffer: list[str] = []
    depth_round = depth_square = depth_curly = 0
    in_string = False
    quote = ""
    escape = False

    for char in selector_text:
        if in_string:
            buffer.append(char)
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == quote:
                in_string = False
            continue

        if char in ("'", '"'):
            in_string = True
            quote = char
            buffer.append(char)
            continue

        if char == "(":
            depth_round += 1
        elif char == ")":
            depth_round = max(0, depth_round - 1)
        elif char == "[":
            depth_square += 1
        elif char == "]":
            depth_square = max(0, depth_square - 1)
        elif char == "{":
            depth_curly += 1
        elif char == "}":
            depth_curly = max(0, depth_curly - 1)
        elif char == "," and depth_round == depth_square == depth_curly == 0:
            selectors.append("".join(buffer).strip())
            buffer = []
            continue

        buffer.append(char)

    tail = "".join(buffer).strip()
    if tail:
        selectors.append(tail)
    return selectors


def prefix_selector(selector: str) -> str:
    stripped = selector.strip()
    if not stripped:
        return stripped

    if stripped.startswith(SCOPE_SELECTOR):
        return stripped

    if stripped.startswith("::"):
        return f"{SCOPE_SELECTOR}{stripped}"

    leading_root_pattern = re.compile(r"^(html|body|:root)(?=($|[\s>+~.#[:]))")
    if leading_root_pattern.search(stripped):
        return leading_root_pattern.sub(SCOPE_SELECTOR, stripped, count=1)

    return f"{SCOPE_SELECTOR} {stripped}"


def prefix_selector_list(selector_text: str) -> str:
    return ", ".join(prefix_selector(selector) for selector in split_selector_list(selector_text))


def read_prelude(css: str, start: int) -> tuple[str, int, str]:
    i = start
    length = len(css)
    buffer: list[str] = []
    depth_round = depth_square = 0
    in_string = False
    quote = ""
    escape = False

    while i < length:
        if css.startswith("/*", i):
            end = css.find("*/", i + 2)
            if end == -1:
                buffer.append(css[i:])
                return "".join(buffer), length, ""
            buffer.append(css[i:end + 2])
            i = end + 2
            continue

        char = css[i]
        if in_string:
            buffer.append(char)
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == quote:
                in_string = False
            i += 1
            continue

        if char in ("'", '"'):
            in_string = True
            quote = char
            buffer.append(char)
            i += 1
            continue

        if char == "(":
            depth_round += 1
        elif char == ")":
            depth_round = max(0, depth_round - 1)
        elif char == "[":
            depth_square += 1
        elif char == "]":
            depth_square = max(0, depth_square - 1)
        elif char in "{;" and depth_round == depth_square == 0:
            return "".join(buffer).strip(), i + 1, char

        buffer.append(char)
        i += 1

    return "".join(buffer).strip(), length, ""


def extract_block(css: str, start: int) -> tuple[str, int]:
    depth = 1
    i = start
    length = len(css)
    buffer: list[str] = []
    in_string = False
    quote = ""
    escape = False

    while i < length:
        if css.startswith("/*", i):
            end = css.find("*/", i + 2)
            if end == -1:
                buffer.append(css[i:])
                return "".join(buffer), length
            buffer.append(css[i:end + 2])
            i = end + 2
            continue

        char = css[i]
        if in_string:
            buffer.append(char)
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == quote:
                in_string = False
            i += 1
            continue

        if char in ("'", '"'):
            in_string = True
            quote = char
            buffer.append(char)
            i += 1
            continue

        if char == "{":
            depth += 1
            buffer.append(char)
            i += 1
            continue

        if char == "}":
            depth -= 1
            if depth == 0:
                return "".join(buffer), i + 1
            buffer.append(char)
            i += 1
            continue

        buffer.append(char)
        i += 1

    return "".join(buffer), length


def scope_css(css: str) -> str:
    def process(block: str) -> str:
        i = 0
        length = len(block)
        output: list[str] = []

        while i < length:
            if block.startswith("/*", i):
                end = block.find("*/", i + 2)
                if end == -1:
                    output.append(block[i:])
                    break
                output.append(block[i:end + 2])
                i = end + 2
                continue

            if block[i].isspace():
                output.append(block[i])
                i += 1
                continue

            prelude, next_index, terminator = read_prelude(block, i)
            if not prelude and not terminator:
                break

            if terminator == ";":
                output.append(prelude)
                output.append(";")
                i = next_index
                continue

            if terminator != "{":
                output.append(prelude)
                i = next_index
                continue

            inner, i = extract_block(block, next_index)
            normalized_prelude = prelude.strip()
            if normalized_prelude.startswith("@"):
                lower = normalized_prelude.lower()
                if lower.startswith("@keyframes") or lower.startswith("@-webkit-keyframes") or lower.startswith("@font-face"):
                    output.append(normalized_prelude)
                    output.append("{")
                    output.append(inner)
                    output.append("}")
                else:
                    output.append(normalized_prelude)
                    output.append("{")
                    output.append(process(inner))
                    output.append("}")
                continue

            output.append(prefix_selector_list(normalized_prelude))
            output.append("{")
            output.append(inner)
            output.append("}")

        return "".join(output)

    return process(css).strip()


def build_payload() -> dict[str, dict[str, object]]:
    payload: dict[str, dict[str, object]] = {}
    for key, filename in PARTS.items():
        html = (SOURCE_DIR / filename).read_text(encoding="utf-8")
        payload[key] = {
            "html": extract_main(html),
            "styles": [scope_css(style) for style in extract_styles(html)],
            "scripts": extract_scripts(html),
            "source": f"chapter7change/{filename}",
        }
    return payload


def escape_inline_script(source: str) -> str:
    return source.replace("</script", "<\\/script")


def render_script_tag(script_body: str) -> str:
    indented = "\n".join(
        f"        {line}" if line else ""
        for line in script_body.rstrip().splitlines()
    )
    return f"    <script>\n{indented}\n    </script>"


def replace_marker_block(document: str, start_marker: str, end_marker: str, replacement: str) -> str:
    pattern = re.compile(
        rf"{re.escape(start_marker)}.*?{re.escape(end_marker)}",
        flags=re.DOTALL,
    )
    if not pattern.search(document):
        raise ValueError(f"Markers not found: {start_marker} ... {end_marker}")
    return pattern.sub(
        lambda _: f"{start_marker}\n{replacement}\n    {end_marker}",
        document,
        count=1,
    )


def render_payload_script(payload: dict[str, dict[str, object]]) -> str:
    payload_source = escape_inline_script(
        "window.Chapter7SinglePageData = "
        + json.dumps(payload, ensure_ascii=False, indent=2)
        + ";"
    )
    return render_script_tag(payload_source)


def render_runtime_script() -> str:
    runtime_source = escape_inline_script(RUNTIME_FILE.read_text(encoding="utf-8"))
    return render_script_tag(runtime_source)


def inject_inline_blocks(payload: dict[str, dict[str, object]]) -> None:
    page_html = PAGE_OUTPUT_FILE.read_text(encoding="utf-8")
    page_html = replace_marker_block(
        page_html,
        PAYLOAD_START_MARKER,
        PAYLOAD_END_MARKER,
        render_payload_script(payload),
    )
    page_html = replace_marker_block(
        page_html,
        RUNTIME_START_MARKER,
        RUNTIME_END_MARKER,
        render_runtime_script(),
    )
    PAGE_OUTPUT_FILE.write_text(page_html, encoding="utf-8")


def main() -> None:
    payload = build_payload()
    DATA_OUTPUT_FILE.write_text(
        "window.Chapter7SinglePageData = "
        + json.dumps(payload, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )
    inject_inline_blocks(payload)
    print(f"Wrote {DATA_OUTPUT_FILE}")
    print(f"Wrote {PAGE_OUTPUT_FILE}")


if __name__ == "__main__":
    main()
