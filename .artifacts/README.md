# Local artifacts

All temporary or generated development material belongs in this directory.
Only this README is tracked. Only the prepared `site/` contents are deployed;
all other artifacts stay outside the deployment package.

- `mockups/`: visual concepts, prompts and generation metadata
- `previews/`: generated links to chapter and section previews
- `qa/`: screenshots, traces and verification output
- `site/`: the disposable GitHub Pages package
- `scratch/`: one-off scripts and experiments
- `backups/`: temporary copies of work in progress
- `cache/`: downloaded browser runtimes and other disposable development caches
- `retired/`: recoverable files removed from active source during cleanup

Use `python tools/dev.py preview` and `python tools/dev.py package` to generate
previews and a deployment package. Edit chapter source under `pages/*/source/`,
never the output in this directory or the generated `pages/*.html` files.
