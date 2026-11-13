"""Curriculum migration contracts: identities, deep links and packaged lesson assets."""
import json
import re
import unittest
import io
import zipfile
from unittest.mock import patch
from pathlib import Path
from urllib.parse import urlsplit, parse_qs, unquote
from site_common import REPO_ROOT, load_registry, load_text
from curriculum_content import lesson_questions, example_archive_bytes
from prepare_pages_artifact import runtime_asset_files


class CurriculumContracts(unittest.TestCase):
    def test_example_archive_is_deterministic_and_preserves_project_paths(self):
        first=example_archive_bytes();self.assertEqual(first,example_archive_bytes())
        with zipfile.ZipFile(io.BytesIO(first)) as archive:
            self.assertIn('src/TOP.sv',archive.namelist())
            self.assertIn('tb/GemmScoreboard.svh',archive.namelist())
            self.assertIn('mini_soc.py',archive.namelist())
            self.assertFalse(any('__pycache__' in name for name in archive.namelist()))
            self.assertEqual(archive.read('src/SystolicCore.sv'),load_text(REPO_ROOT/'assets/examples/src/SystolicCore.sv').encode('utf-8'))
            self.assertEqual(archive.namelist(),sorted(archive.namelist()))
            for info in archive.infolist():
                self.assertEqual(info.create_system,3)
                self.assertEqual(info.external_attr,0o100644 << 16)
        class WindowsZipInfo(zipfile.ZipInfo):
            def __init__(self,*args,**kwargs):
                super().__init__(*args,**kwargs)
                self.create_system=0
        with patch('curriculum_content.zipfile.ZipInfo',WindowsZipInfo):
            self.assertEqual(first,example_archive_bytes())
    def test_unique_lessons_and_legacy_practice_identity(self):
        registry=load_registry()
        self.assertEqual([p['number'] for p in registry['pages']],list(range(1,29)))
        self.assertEqual(sum(len(p['sections']) for p in registry['pages']),208)
        self.assertEqual(registry['pages'][26]['id'],'page-13')
        self.assertEqual(registry['pages'][27]['id'],'page-14')
        records=lesson_questions(registry)
        self.assertEqual(len(records),148)
        self.assertEqual(len({r['id'] for r in records}),148)
        for page in registry['pages']:
            keys={s['key'] for s in page['sections']}
            self.assertTrue(set(page.get('sectionAliases',{}).values())<=keys)

    def test_live_uvm_documents_are_packaged_separately(self):
        page=next(p for p in load_registry()['pages'] if p['number']==7)
        manifest_path=REPO_ROOT/page['buildManifest']
        manifest=json.loads(load_text(manifest_path))
        self.assertEqual(len(manifest['runtimeFiles']),15)
        for name in manifest['runtimeFiles']:
            text=load_text(manifest_path.parent/name)
            self.assertIn('<html',text.lower())
            self.assertNotIn('lesson-07-',name)

    def test_authored_deep_links_and_downloads_resolve(self):
        registry=load_registry();chapters={p['number']:p for p in registry['pages']}
        packaged={p.resolve() for p in runtime_asset_files()}
        for page in registry['pages']:
            for section in page['sections']:
                text=load_text(REPO_ROOT/section['source'])
                for href in re.findall(r'(?:href|src)="([^"]+)"',text):
                    url=urlsplit(href.replace('&amp;','&'))
                    if url.scheme or url.netloc:continue
                    if url.path.startswith('../assets/'):
                        target=(REPO_ROOT/'pages'/unquote(url.path)).resolve()
                        self.assertTrue(target.is_file(),f'{section["source"]}: {href}')
                        self.assertIn(target,packaged,str(target))
                    if url.path=='../index.html':
                        query=parse_qs(url.query)
                        if 'chapter' not in query:continue
                        target=chapters[int(query['chapter'][0])]
                        if 'section' in query:
                            keys={s['key'] for s in target['sections']}|set(target.get('sectionAliases',{}))
                            self.assertIn(query['section'][0],keys)


if __name__=='__main__':unittest.main()
