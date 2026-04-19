(function () {
    const data = window.Chapter7SinglePageData || {};
    const panelSelector = '[data-page7-panel]';
    const mountSelector = '[data-chapter7-mount]';
    const rootAttribute = 'data-chapter7-runtime-root';
    const rootSelector = `[${rootAttribute}]`;
    const microtask = typeof queueMicrotask === 'function'
        ? queueMicrotask.bind(window)
        : (callback) => Promise.resolve().then(callback);

    let current = null;

    const cssEscape = (value) => {
        if (window.CSS && typeof window.CSS.escape === 'function') {
            return window.CSS.escape(value);
        }
        return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
    };

    const getPanel = (key) => document.querySelector(`${panelSelector}[data-page7-panel="${key}"]`);
    const getMountNode = (key) => getPanel(key)?.querySelector(mountSelector) || null;

    const normalizeScript = (source) => source.replace(
        /window\.([A-Za-z_$][\w$]*)\s*=\s*function\b/g,
        'const $1 = window.$1 = function'
    );

    const cleanupCurrent = () => {
        if (!current) {
            return;
        }

        current.intervals.forEach((id) => window.clearInterval(id));
        current.timeouts.forEach((id) => window.clearTimeout(id));
        current.rafs.forEach((id) => window.cancelAnimationFrame(id));
        current.windowListeners.forEach(({ type, handler, options }) => window.removeEventListener(type, handler, options));
        current.documentListeners.forEach(({ type, handler, options }) => document.removeEventListener(type, handler, options));
        current.appendedHeadNodes.forEach((node) => {
            if (node && node.parentNode) {
                node.parentNode.removeChild(node);
            }
        });
        current.appendedBodyNodes.forEach((node) => {
            if (node && node.parentNode) {
                node.parentNode.removeChild(node);
            }
        });
        if (current.styleEl && current.styleEl.parentNode) {
            current.styleEl.parentNode.removeChild(current.styleEl);
        }
        if (current.mountNode) {
            current.mountNode.replaceChildren();
        }

        current = null;
    };

    const trackedSetTimeout = (state) => (callback, delay, ...args) => {
        const id = window.setTimeout(() => {
            state.timeouts.delete(id);
            callback(...args);
        }, delay);
        state.timeouts.add(id);
        return id;
    };

    const trackedClearTimeout = (state) => (id) => {
        state.timeouts.delete(id);
        return window.clearTimeout(id);
    };

    const trackedSetInterval = (state) => (callback, delay, ...args) => {
        const id = window.setInterval(callback, delay, ...args);
        state.intervals.add(id);
        return id;
    };

    const trackedClearInterval = (state) => (id) => {
        state.intervals.delete(id);
        return window.clearInterval(id);
    };

    const trackedRequestAnimationFrame = (state) => (callback) => {
        const id = window.requestAnimationFrame((timestamp) => {
            state.rafs.delete(id);
            callback(timestamp);
        });
        state.rafs.add(id);
        return id;
    };

    const trackedCancelAnimationFrame = (state) => (id) => {
        state.rafs.delete(id);
        return window.cancelAnimationFrame(id);
    };

    const normalizeLabel = (value) => String(value || '').replace(/^\d+\s*-\s*\d+\.\s*/, '').trim();

    const createLocalActionSectionEngine = (root, realGuidebook, options = {}) => {
        const settings = Object.assign({
            defaultKey: '',
            panelSelector: '',
            panelKeyDataset: '',
            buttonSelector: '',
            buttonKeyDataset: '',
            titleAttribute: 'data-guidebook-toc-title',
            panelStateMode: 'hidden',
            panelActiveClass: 'active',
            currentHeader: null,
        }, options);

        let activeKey = settings.defaultKey;

        const findWithinRoot = (value) => {
            if (!value || typeof value !== 'string') {
                return null;
            }
            return root.querySelector(`#${cssEscape(value)}`) || root.querySelector(value);
        };

        const getPanels = () => settings.panelSelector ? Array.from(root.querySelectorAll(settings.panelSelector)) : [];
        const getButtons = () => settings.buttonSelector ? Array.from(root.querySelectorAll(settings.buttonSelector)) : [];
        const readDataset = (element, datasetName) => {
            if (!(element instanceof Element) || !datasetName) {
                return '';
            }
            return element.dataset[datasetName] || '';
        };
        const buildItems = () => getPanels().map((panel) => ({
            key: readDataset(panel, settings.panelKeyDataset),
            label: normalizeLabel(panel.getAttribute(settings.titleAttribute) || ''),
        })).filter((item) => item.key && item.label);

        const applyPanels = () => {
            getPanels().forEach((panel) => {
                const isActive = readDataset(panel, settings.panelKeyDataset) === activeKey;
                if (settings.panelStateMode === 'class') {
                    panel.classList.toggle(settings.panelActiveClass, isActive);
                } else {
                    panel.hidden = !isActive;
                }
                panel.setAttribute('aria-hidden', String(!isActive));
            });
        };

        const applyButtons = (items) => {
            getButtons().forEach((button) => {
                const key = readDataset(button, settings.buttonKeyDataset || settings.panelKeyDataset);
                const isActive = key === activeKey;
                const item = items.find((entry) => entry.key === key) || null;

                if (typeof settings.applyButtonState === 'function') {
                    settings.applyButtonState({ button, isActive, item, items, activeKey });
                } else {
                    button.classList.toggle('is-active', isActive);
                    button.setAttribute('aria-pressed', String(isActive));
                }
            });
        };

        const updateCurrentHeader = (item, items) => {
            const config = settings.currentHeader;
            if (!config) {
                return;
            }

            const shell = findWithinRoot(config.shellId || config.shellSelector);
            const labelEl = findWithinRoot(config.labelId || config.labelSelector);
            const copyEl = findWithinRoot(config.copyId || config.copySelector);
            const copyText = typeof config.getCopy === 'function'
                ? String(config.getCopy({ activeKey, item, items }) || '').trim()
                : '';

            if (labelEl && item?.label) {
                labelEl.textContent = item.label;
            }
            if (copyEl) {
                copyEl.textContent = copyText;
                copyEl.hidden = !copyText;
            }
            if (shell) {
                shell.hidden = false;
                if (typeof config.apply === 'function') {
                    config.apply({ shell, activeKey, item, items });
                }
            }
        };

        const syncBridge = () => {
            if (realGuidebook && typeof realGuidebook.notifyHeight === 'function') {
                realGuidebook.notifyHeight();
            }
        };

        const setActive = (nextKey) => {
            const items = buildItems();
            const fallbackKey = items[0]?.key || settings.defaultKey || '';
            activeKey = items.some((item) => item.key === nextKey) ? nextKey : fallbackKey;
            const activeItem = items.find((item) => item.key === activeKey) || items[0] || null;

            applyPanels();
            applyButtons(items);
            updateCurrentHeader(activeItem, items);

            if (typeof settings.onAfterSet === 'function') {
                settings.onAfterSet({ activeKey, item: activeItem, items });
            }

            syncBridge();
            return activeItem;
        };

        const init = () => {
            getButtons().forEach((button) => {
                if (button.dataset.chapter7LocalBound === 'true') {
                    return;
                }
                button.dataset.chapter7LocalBound = 'true';
                button.addEventListener('click', () => {
                    const key = readDataset(button, settings.buttonKeyDataset || settings.panelKeyDataset);
                    setActive(key);
                });
            });

            return setActive(activeKey);
        };

        return {
            init,
            setActive,
            syncBridge,
            getActiveKey: () => activeKey,
            getItems: () => buildItems(),
            getTocPayload: () => ({ mode: 'action', title: document.title, items: buildItems() }),
        };
    };

    const createGuidebookProxy = (state) => {
        const real = window.GuidebookPage || {};
        return Object.assign({}, real, {
            initActionSectionPage(options = {}) {
                const engine = createLocalActionSectionEngine(state.root, real, options);
                if (typeof options.beforeInit === 'function') {
                    options.beforeInit(engine);
                }
                engine.init();
                if (typeof options.afterInit === 'function') {
                    options.afterInit(engine);
                }
                if (typeof real.notifyHeight === 'function') {
                    real.notifyHeight();
                }
                return engine;
            },
            initStandalonePage() {
                if (typeof real.notifyHeight === 'function') {
                    real.notifyHeight();
                }
                if (typeof real.notifyPageToc === 'function') {
                    real.notifyPageToc();
                }
            },
        });
    };

    const createWindowProxy = (state) => {
        const proxy = new Proxy(Object.create(null), {
            get(_, property) {
                if (property === 'window' || property === 'self') {
                    return proxy;
                }
                if (property === 'document') {
                    return document;
                }
                if (property === 'addEventListener') {
                    return (type, handler, options) => {
                        state.windowListeners.push({ type, handler, options });
                        window.addEventListener(type, handler, options);
                    };
                }
                if (property === 'removeEventListener') {
                    return (type, handler, options) => {
                        window.removeEventListener(type, handler, options);
                    };
                }
                if (property === 'GuidebookPage') {
                    return state.guidebookProxy;
                }
                if (property in state.locals) {
                    return state.locals[property];
                }
                const value = window[property];
                return typeof value === 'function' ? value.bind(window) : value;
            },
            set(_, property, value) {
                state.locals[property] = value;
                return true;
            },
            has(_, property) {
                return property in state.locals || property in window || property === 'GuidebookPage';
            },
        });

        return proxy;
    };

    const createBodyProxy = (state) => ({
        appendChild(node) {
            state.appendedBodyNodes.push(node);
            return document.body.appendChild(node);
        },
        removeChild(node) {
            return document.body.removeChild(node);
        },
        get classList() {
            return document.body.classList;
        },
        get style() {
            return document.body.style;
        },
    });

    const createHeadProxy = (state) => ({
        appendChild(node) {
            state.appendedHeadNodes.push(node);
            return document.head.appendChild(node);
        },
        removeChild(node) {
            return document.head.removeChild(node);
        },
    });

    const createDocumentProxy = (root, state) => {
        const bodyProxy = createBodyProxy(state);
        const headProxy = createHeadProxy(state);

        return new Proxy(document, {
            get(target, property) {
                if (property === 'querySelector') {
                    return (selector) => root.querySelector(selector);
                }
                if (property === 'querySelectorAll') {
                    return (selector) => root.querySelectorAll(selector);
                }
                if (property === 'getElementById') {
                    return (id) => root.querySelector(`#${cssEscape(id)}`) || target.getElementById(id);
                }
                if (property === 'addEventListener') {
                    return (type, handler, options) => {
                        if (type === 'DOMContentLoaded') {
                            microtask(() => handler(new Event('DOMContentLoaded')));
                            return;
                        }
                        state.documentListeners.push({ type, handler, options });
                        target.addEventListener(type, handler, options);
                    };
                }
                if (property === 'removeEventListener') {
                    return (type, handler, options) => {
                        target.removeEventListener(type, handler, options);
                    };
                }
                if (property === 'body') {
                    return bodyProxy;
                }
                if (property === 'head') {
                    return headProxy;
                }
                if (property === 'documentElement') {
                    return target.documentElement;
                }
                if (property === 'currentScript') {
                    return null;
                }

                const value = target[property];
                return typeof value === 'function' ? value.bind(target) : value;
            },
        });
    };

    const executeScripts = (scripts, root, state) => {
        if (!Array.isArray(scripts)) {
            return;
        }

        state.guidebookProxy = createGuidebookProxy(state);
        const windowProxy = createWindowProxy(state);
        const documentProxy = createDocumentProxy(root, state);
        const timeout = trackedSetTimeout(state);
        const clearTimeoutProxy = trackedClearTimeout(state);
        const interval = trackedSetInterval(state);
        const clearIntervalProxy = trackedClearInterval(state);
        const raf = trackedRequestAnimationFrame(state);
        const cancelRaf = trackedCancelAnimationFrame(state);

        scripts.forEach((source) => {
            const runner = new Function(
                'window',
                'document',
                'setTimeout',
                'clearTimeout',
                'setInterval',
                'clearInterval',
                'requestAnimationFrame',
                'cancelAnimationFrame',
                normalizeScript(source)
            );

            runner(
                windowProxy,
                documentProxy,
                timeout,
                clearTimeoutProxy,
                interval,
                clearIntervalProxy,
                raf,
                cancelRaf
            );
        });
    };

    const notifyHeight = () => {
        if (!window.GuidebookPage || typeof window.GuidebookPage.notifyHeight !== 'function') {
            return;
        }
        window.GuidebookPage.notifyHeight();
    };

    const stripRedundantChrome = (key, root) => {
        root.querySelectorAll('[data-chipbook-embed-hide]').forEach((node) => node.remove());

        if (key === 'uvm-basics') {
            return;
        }

        root.querySelectorAll('#btn-prev, #btn-next, #page-indicator').forEach((node) => node.remove());
    };

    const mount = (key) => {
        const part = data[key];
        const mountNode = getMountNode(key);
        if (!part || !mountNode) {
            return;
        }
        if (current && current.key === key) {
            return;
        }

        cleanupCurrent();

        const root = document.createElement('div');
        root.setAttribute(rootAttribute, '');
        root.className = 'chapter7-runtime-root';
        root.innerHTML = part.html || '';
        stripRedundantChrome(key, root);
        mountNode.replaceChildren(root);

        const styleEl = document.createElement('style');
        styleEl.dataset.chapter7RuntimeStyle = key;
        styleEl.textContent = Array.isArray(part.styles) ? part.styles.join('\n\n') : '';
        document.head.appendChild(styleEl);

        const state = {
            key,
            mountNode,
            root,
            styleEl,
            locals: Object.create(null),
            appendedHeadNodes: [],
            appendedBodyNodes: [],
            windowListeners: [],
            documentListeners: [],
            timeouts: new Set(),
            intervals: new Set(),
            rafs: new Set(),
            guidebookProxy: null,
        };

        executeScripts(part.scripts, root, state);

        current = state;
        notifyHeight();
        window.setTimeout(notifyHeight, 120);
        window.setTimeout(notifyHeight, 480);
        window.setTimeout(notifyHeight, 960);
    };

    window.Chapter7SinglePageRuntime = {
        mount,
        cleanup: cleanupCurrent,
        getActiveKey: () => current?.key || '',
        getData: () => data,
    };
})();
