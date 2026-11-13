"""Registry changes must reach rendered labels and stale output must fail validation."""
import copy
import contextlib
import io
import unittest
from unittest.mock import patch

import build_split_pages
from site_common import REPO_ROOT, load_registry, render_scripts, render_section_tokens
from validate_page_registry import validate_registry


class MetadataTests(unittest.TestCase):
    def test_registry_title_change_is_rendered_and_stale_chapter_is_rejected(self):
        registry = copy.deepcopy(load_registry())
        page = registry['pages'][0]
        page['sections'][0]['title'] = 'New & explicit label'
        self.assertEqual(render_section_tokens('{{section:landscape:toc}}', page), 'New &amp; explicit label')
        self.assertTrue(any('TOC label' in message for message in validate_registry(registry)))
        with patch.object(build_split_pages, 'load_registry', return_value=registry), contextlib.redirect_stdout(io.StringIO()):
            self.assertTrue(build_split_pages.render_manifest(REPO_ROOT / page['buildManifest'], check_only=True))

    def test_abbreviated_toc_title_is_explicit_and_unknown_tokens_fail(self):
        page = {'id': 'page-7', 'number': 7, 'title': 'UVM',
                'sections': [{'key': 'sequence', 'title': 'Full explanatory title', 'tocTitle': 'Sequence'}]}
        text = render_section_tokens('{{section:sequence:title}} / {{section:sequence:label}}', page)
        self.assertEqual(text, 'Full explanatory title / 7-1. Sequence')
        with self.assertRaises(ValueError):
            render_section_tokens('{{section:missing:toc}}', page)

    def test_script_order_and_boolean_attributes_are_validated(self):
        rendered = render_scripts(['first.js', {'src': 'second.js', 'defer': True}])
        self.assertLess(rendered.index('first.js'), rendered.index('second.js'))
        self.assertIn('defer></script>', rendered)
        for invalid in ['<script src="x"></script>', {'src': 'x', 'defer': 'true'}, {'src': 'x', 'onclick': 'x()'}]:
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                render_scripts([invalid])


if __name__ == '__main__':
    unittest.main()
