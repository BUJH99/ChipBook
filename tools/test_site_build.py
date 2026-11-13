"""Regression checks for build boundaries and deployable runtime content."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import prepare_pages_artifact as package
from site_common import ARTIFACTS_ROOT, render_head


class PackagingTests(unittest.TestCase):
    def setUp(self):
        (ARTIFACTS_ROOT / 'qa').mkdir(parents=True, exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=ARTIFACTS_ROOT / 'qa')
        self.root = Path(self.temp.name).resolve()
        self.output = self.root / '.artifacts/site'
        self.registry = {'pages': [{'id': 'page-1', 'src': 'pages/example.html', 'buildManifest': 'pages/example/source/page-build.json'}]}
        files = {
            'index.html': '<html>index</html>',
            'pages/example.html': '<html>chapter</html>',
            'pages/example/source/00-shell-start.html': 'authoring source',
            'pages/example/source/sections/live.html': '<html>live iframe</html>',
            'pages/example/source/page-build.json': json.dumps({'runtimeFiles': ['sections/*.html']}),
            'assets/image.png': 'runtime image bytes',
            'assets/source/editor.js': 'build input, not runtime',
            'src/app/runtime-assets.json': json.dumps({'include': ['assets/*.png']}),
        }
        for name, content in files.items():
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding='utf-8')
        self.patches = [patch.object(package, 'REPO_ROOT', self.root),
                        patch.object(package, 'DEFAULT_OUTPUT_DIR', self.output),
                        patch.object(package, 'load_registry', return_value=self.registry)]
        for item in self.patches: item.start()

    def tearDown(self):
        for item in self.patches: item.stop()
        self.temp.cleanup()

    def test_package_preserves_images_and_live_iframes_without_authoring_copies(self):
        package.build_artifact_dir(self.output)
        self.assertTrue((self.output / 'assets/image.png').is_file())
        self.assertFalse((self.output / 'assets/source/editor.js').exists())
        self.assertTrue((self.output / 'pages/example/source/sections/live.html').is_file())
        self.assertFalse((self.output / 'pages/example/source/00-shell-start.html').exists())
        self.assertFalse((self.output / 'pages/example/source/page-build.json').exists())
        self.assertTrue((self.output / '.nojekyll').is_file())

    def test_protected_directories_are_never_recreated(self):
        for target in [self.root, self.root / 'assets', self.root / 'pages', self.root / '.artifacts', self.root.parent]:
            with self.subTest(target=target), self.assertRaises(ValueError):
                package.build_artifact_dir(target)
        self.assertTrue((self.root / 'assets/image.png').exists())

    def test_missing_inputs_do_not_destroy_previous_package(self):
        self.output.mkdir(parents=True)
        marker = self.output / 'last-good.txt'
        marker.write_text('keep', encoding='utf-8')
        self.registry['pages'][0]['src'] = 'pages/missing.html'
        with self.assertRaises(FileNotFoundError):
            package.build_artifact_dir(self.output)
        self.assertEqual(marker.read_text(), 'keep')

    def test_document_head_escapes_text_and_attributes(self):
        head = render_head('A & <B>', styles=['../assets/test.css?x="value"'])
        self.assertIn('A &amp; &lt;B&gt;', head)
        self.assertIn('&quot;value&quot;', head)
        self.assertNotIn('{{', head)

    def test_missing_dynamic_asset_preserves_previous_package(self):
        manifest = self.root / 'pages/example/source/page-build.json'
        manifest.write_text(json.dumps({'runtimeFiles': ['sections/*.html'],
                                       'runtimeAssets': ['../assets/missing-dynamic.svg']}), encoding='utf-8')
        self.output.mkdir(parents=True)
        marker = self.output / 'last-good.txt'
        marker.write_text('keep', encoding='utf-8')
        with self.assertRaises(ValueError):
            package.build_artifact_dir(self.output)
        self.assertEqual(marker.read_text(), 'keep')


if __name__ == '__main__':
    unittest.main()
