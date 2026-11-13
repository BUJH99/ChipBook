"""Build-time reuse of authored lessons and preserved interactive source fragments."""
from __future__ import annotations
import html
import json
import re
import base64
import io
import zipfile
from pathlib import Path
from site_common import REPO_ROOT, load_text

def example_archive_bytes():
    """Build a deterministic in-memory download; no archive is written into source."""
    root=REPO_ROOT/'assets/examples'
    output=io.BytesIO()
    with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
        for path in sorted(root.rglob('*'), key=lambda item: item.relative_to(root).as_posix()):
            if not path.is_file() or path.suffix not in {'.py','.sv','.svh','.sdc','.txt'}:continue
            info=zipfile.ZipInfo(path.relative_to(root).as_posix(),date_time=(2026,10,18,0,0,0))
            info.create_system=3
            info.external_attr=0o100644 << 16
            info.compress_type=zipfile.ZIP_DEFLATED
            archive.writestr(info,load_text(path).encode('utf-8'))
    return output.getvalue()

def render_example_download():
    payload=base64.b64encode(example_archive_bytes()).decode('ascii')
    return f'<div class="lesson-downloads"><h3>프로젝트 전체 내려받기</h3><p>src/·tb/ 폴더 구조와 Python reference, 실행 도구, SDC, 안내를 함께 제공합니다.</p><a download="chipbook-examples.zip" href="data:application/zip;base64,{payload}">ChipBook 설계 예제 ZIP</a></div>'

def expand_legacy_fragments(text: str) -> str:
    def include(match):
        path=(REPO_ROOT/match.group(1)).resolve()
        if not path.is_relative_to(REPO_ROOT/'pages') or path.suffix!='.html':
            raise ValueError(f'Legacy include must be chapter HTML: {path}')
        source=load_text(path)
        if re.search(r'<(?:script|html|body)\b',source,re.I):
            raise ValueError(f'Include a content fragment, not a standalone document: {path}')
        def panel(tag):
            value=tag.group(0)
            if not re.search(r'\sdata-(?:part\d+|page\d+)-panel=',value): return value
            value=re.sub(r'\sdata-(?:part\d+|page\d+)-panel="[^"]*"',' data-legacy-panel',value)
            value=re.sub(r'\shidden(?:="[^"]*")?','',value)
            value=re.sub(r'\saria-hidden="[^"]*"','',value)
            return value
        source=re.sub(r'<[^>]+>',panel,source)
        source=re.sub(r'\sdata-guidebook-toc-title="[^"]*"','',source)
        return '<div class="legacy-fragment">'+source+'</div>'
    return re.sub(r'\{\{legacy:([^{}]+)\}\}',include,text)

def lesson_questions(registry):
    """The standalone review bank does not require quizzes in chapter bodies."""
    catalog=REPO_ROOT/'pages/page-13-practice-bank/source/review-questions.json'
    chapters={page['number']:page for page in registry['pages']}
    result=[]
    for record in json.loads(load_text(catalog)):
        page=chapters[record['chapter']]
        key=page.get('sectionAliases',{}).get(record['key'],record['key'])
        section=next(section for section in page['sections'] if section['key']==key)
        result.append({**record,'key':key,'chapterTitle':page['title'],'title':section['title']})
    return result

def render_review_catalog(registry):
    records=lesson_questions(registry)
    e=html.escape
    chapters={r['chapter']:r['chapterTitle'] for r in records}
    result='<section class="lesson-review" aria-label="학습 절 복습 문제"><h3>학습 절 복습 문제</h3>'
    result+=f'<p>{len(records)}개 학습 절의 질문을 먼저 설명하고 해설을 확인하세요. 북마크한 질문은 오답 복습에서 다시 볼 수 있습니다.</p>'
    result+='<div class="lesson-lab-inputs"><label>질문 검색<input type="search" data-review-search placeholder="질문·키워드 검색"></label><label>학습 분야<select data-review-chapter><option value="">전체</option>'
    result+=''.join(f'<option value="{n}">{n:02} {e(t)}</option>' for n,t in chapters.items())+'</select></label></div><p data-review-count aria-live="polite"></p><div data-review-list>'
    for r in records:
        result+=f'''<article class="review-question" data-review-id="{r['id']}" data-review-chapter-number="{r['chapter']}"><div class="review-question-head"><span>{r['id']} · {e(r['title'])}</span><button type="button" data-review-bookmark="{r['id']}" aria-pressed="false">북마크</button></div><details><summary>{e(r['question'])}</summary><p>{e(r['answer'])}</p><a href="../index.html?chapter={r['chapter']}&amp;section={e(r['key'])}" target="_top">관련 본문에서 확인</a></details></article>'''
    result+='</div></section>'
    return result
