(function () {
    const params = new URLSearchParams(window.location.search);
    if (params.get('embed') !== 'chipbook') {
        return;
    }

    const MESSAGE_TYPE = 'chipbook:chapter7-height';
    let resizeObserver = null;
    let mutationObserver = null;
    let scheduled = false;

    const markEmbedChrome = () => {
        const chromeIds = [
            'page-controls',
            'btn-prev',
            'btn-next',
            'btn-page-prev',
            'btn-page-next',
            'page-indicator',
        ];

        chromeIds.forEach((id) => {
            const node = document.getElementById(id);
            const container = node && node.closest('div, nav, footer, section');
            if (container) {
                container.setAttribute('data-chipbook-embed-hide', 'true');
            }
        });
    };

    const readHeight = () => Math.max(
        document.documentElement ? document.documentElement.scrollHeight : 0,
        document.documentElement ? document.documentElement.offsetHeight : 0,
        document.body ? document.body.scrollHeight : 0,
        document.body ? document.body.offsetHeight : 0
    );

    const notifyParent = () => {
        scheduled = false;
        window.parent.postMessage({
            type: MESSAGE_TYPE,
            href: window.location.pathname,
            height: readHeight(),
        }, '*');
    };

    const queueNotify = () => {
        if (scheduled) {
            return;
        }
        scheduled = true;
        window.requestAnimationFrame(notifyParent);
    };

    document.documentElement.dataset.chipbookEmbed = 'true';

    window.addEventListener('DOMContentLoaded', () => {
        document.body.dataset.chipbookEmbed = 'true';
        markEmbedChrome();
        queueNotify();

        if ('ResizeObserver' in window) {
            resizeObserver = new ResizeObserver(queueNotify);
            resizeObserver.observe(document.documentElement);
            resizeObserver.observe(document.body);
        }

        if ('MutationObserver' in window) {
            mutationObserver = new MutationObserver(queueNotify);
            mutationObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true,
            });
        }

        ['click', 'input', 'change', 'transitionend', 'animationend'].forEach((eventName) => {
            document.addEventListener(eventName, () => {
                window.setTimeout(queueNotify, 0);
            }, true);
        });

        window.addEventListener('load', queueNotify);
        window.addEventListener('resize', queueNotify);
        window.setTimeout(queueNotify, 120);
        window.setTimeout(queueNotify, 480);
        window.setTimeout(queueNotify, 1200);
    });
})();

(function () {
    const defaultApplyButtonState = ({ button, isActive }) => {
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    };

    const readDatasetValue = (element, datasetName, resolver) => {
        if (!(element instanceof Element)) {
            return '';
        }

        if (typeof resolver === 'function') {
            const resolved = resolver(element);
            if (resolved) {
                return resolved;
            }
        }

        if (!datasetName) {
            return '';
        }

        return element.dataset[datasetName] || '';
    };

    const createFallbackEngine = (options = {}) => {
        const settings = Object.assign({
            defaultKey: '',
            panelSelector: '',
            panelKeyDataset: '',
            buttonSelector: '.chapter7-tab-btn',
            buttonKeyDataset: 'target',
            shellId: '',
            accentColor: '#2563eb',
            scrollOnChange: false,
            scrollBehavior: 'auto',
            applyButtonState: defaultApplyButtonState,
            onAfterSet: null,
            resolveButtonKey: null,
            resolvePanelKey: null,
        }, options);

        let activeKey = settings.defaultKey;

        const getPanels = () => {
            if (!settings.panelSelector) {
                return [];
            }

            return Array.from(document.querySelectorAll(settings.panelSelector));
        };

        const getButtons = () => {
            if (!settings.buttonSelector) {
                return [];
            }

            return Array.from(document.querySelectorAll(settings.buttonSelector));
        };

        const updateShell = () => {
            if (!settings.shellId) {
                return;
            }

            const shell = document.getElementById(settings.shellId);
            if (shell) {
                shell.style.setProperty('--chapter7-tab-accent', settings.accentColor);
            }
        };

        const setActive = (nextKey, behavior = {}) => {
            const panels = getPanels();
            const knownKeys = panels
                .map((panel) => readDatasetValue(panel, settings.panelKeyDataset, settings.resolvePanelKey))
                .filter(Boolean);
            const fallbackKey = knownKeys.includes(settings.defaultKey) ? settings.defaultKey : (knownKeys[0] || '');

            activeKey = knownKeys.includes(nextKey) ? nextKey : fallbackKey;

            panels.forEach((panel) => {
                const key = readDatasetValue(panel, settings.panelKeyDataset, settings.resolvePanelKey);
                const isActive = key === activeKey;
                panel.hidden = !isActive;
                panel.setAttribute('aria-hidden', String(!isActive));
            });

            getButtons().forEach((button) => {
                const key = readDatasetValue(button, settings.buttonKeyDataset, settings.resolveButtonKey);
                settings.applyButtonState({ button, isActive: key === activeKey, activeKey });
            });

            updateShell();

            if (typeof settings.onAfterSet === 'function') {
                settings.onAfterSet({ activeKey });
            }

            if (behavior.scroll !== false && settings.scrollOnChange) {
                window.scrollTo({ top: 0, behavior: settings.scrollBehavior });
            }
        };

        const bindButtons = () => {
            getButtons().forEach((button) => {
                if (button.dataset.chapter7TabBound === 'true') {
                    return;
                }

                button.dataset.chapter7TabBound = 'true';
                button.addEventListener('click', (event) => {
                    if (button.tagName === 'A' || button.getAttribute('href') === '#') {
                        event.preventDefault();
                    }

                    const nextKey = readDatasetValue(button, settings.buttonKeyDataset, settings.resolveButtonKey);
                    setActive(nextKey, { scroll: false });
                });
            });
        };

        const init = () => {
            updateShell();
            bindButtons();
            setActive(activeKey || settings.defaultKey, { scroll: false });
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init, { once: true });
        } else {
            init();
        }

        return {
            init,
            setActive,
            getActiveKey: () => activeKey,
        };
    };

    window.Chapter7EmbedTabs = {
        init(options = {}) {
            const settings = Object.assign({
                accentColor: '#2563eb',
                buttonSelector: '.chapter7-tab-btn',
                buttonKeyDataset: 'target',
                scrollOnChange: false,
                applyButtonState: defaultApplyButtonState,
            }, options);

            const canUseGuidebookInit =
                document.readyState === 'loading' &&
                window.GuidebookPage &&
                typeof window.GuidebookPage.initActionSectionPage === 'function';

            if (canUseGuidebookInit) {
                return window.GuidebookPage.initActionSectionPage({
                    defaultKey: settings.defaultKey,
                    panelSelector: settings.panelSelector,
                    panelKeyDataset: settings.panelKeyDataset,
                    buttonSelector: settings.buttonSelector,
                    buttonKeyDataset: settings.buttonKeyDataset,
                    titleAttribute: settings.titleAttribute || 'data-guidebook-toc-title',
                    scrollOnChange: settings.scrollOnChange,
                    applyButtonState: settings.applyButtonState,
                    resolveButtonKey: settings.resolveButtonKey,
                    resolvePanelKey: settings.resolvePanelKey,
                    labelSourceSelector: settings.labelSourceSelector,
                    labelKeyDataset: settings.labelKeyDataset,
                    buildItems: settings.buildItems,
                    currentHeader: settings.shellId ? {
                        shellId: settings.shellId,
                        mode: settings.currentHeaderMode || 'static',
                        apply: ({ shell, activeKey, item, items }) => {
                            shell.style.setProperty('--chapter7-tab-accent', settings.accentColor);
                            if (typeof settings.applyShell === 'function') {
                                settings.applyShell({ shell, activeKey, item, items });
                            }
                        },
                    } : null,
                    onAfterSet: settings.onAfterSet,
                });
            }

            return createFallbackEngine(settings);
        },
    };
})();
