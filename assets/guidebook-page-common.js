(function () {
    const initializers = [];
    let initialized = false;
    let hasActionEngine = false;
    let pageActive = window.self === window.top;
    let pageDisposed = false;
    const lifecycles = new Set();
    let parentViewport = null;
    const viewportListeners = new Set();
    const modalFrames = new Set();
    let lastModalState = null;
    const syncViewport = () => viewportListeners.forEach((callback) => callback());
    const setParentViewport = (viewport) => {
        if (!viewport || !Number.isFinite(viewport.top) || !Number.isFinite(viewport.height)) return;
        parentViewport = { top: Math.max(0, viewport.top), height: Math.max(0, viewport.height) };
        syncViewport();
    };
    const runSafely = (callback) => {
        try { callback?.(); }
        catch (error) { console.error('ChipBook feature failed:', error); }
    };
    const isPageActive = () => pageActive && !document.hidden && !pageDisposed;
    const syncActivity = () => {
        if (!initialized) return;
        lifecycles.forEach((entry) => {
            const root = typeof entry.root === 'function' ? entry.root() : entry.root;
            const visible = !root || (root.isConnected && root.getClientRects().length > 0
                && !root.closest('[hidden], [aria-hidden="true"]'));
            const active = isPageActive() && visible && (!entry.isActive || entry.isActive());
            if (entry.active === Boolean(active)) return;
            entry.active = Boolean(active);
            runSafely(active ? entry.start : entry.stop);
        });
    };
    const registerLifecycle = (options) => {
        const entry = { ...options, active: false };
        lifecycles.add(entry);
        syncActivity();
        return () => {
            if (!lifecycles.delete(entry)) return;
            if (entry.active) runSafely(entry.stop);
            runSafely(entry.destroy);
        };
    };
    const registerViewportFeature = (root, create) => {
        let feature;
        let inViewport = typeof IntersectionObserver !== 'function';
        const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver((entries) => {
            inViewport = entries.some((entry) => entry.isIntersecting);
            syncActivity();
        }) : null;
        observer?.observe(root);
        return registerLifecycle({
            root,
            isActive: () => inViewport,
            start() { feature ||= create(root); feature?.start(); },
            stop() { feature?.stop(); },
            destroy() { observer?.disconnect(); feature?.destroy(); feature = null; },
        });
    };
    const setPageActive = (active) => {
        pageActive = Boolean(active);
        syncActivity();
        if (isPageActive()) {
            notifyHeight();
            notifyPageToc();
        }
    };
    const registerInitializer = (initialize) => {
        if (typeof initialize !== 'function') throw new TypeError('Page initializer must be a function');
        if (initialized) runSafely(initialize);
        else initializers.push(initialize);
    };
    const embedded = () => window.self !== window.top;
    const isObservableNode = (target) => {
        try {
            const NodeType = target?.ownerDocument?.defaultView?.Node || window.Node;
            if (typeof NodeType === 'function') {
                return target instanceof NodeType;
            }
        } catch (error) {
            return false;
        }

        return Boolean(
            target &&
            typeof target.nodeType === 'number' &&
            typeof target.nodeName === 'string'
        );
    };
    const observeTarget = (observer, target, options) => {
        if (!observer || !isObservableNode(target)) return;
        try {
            if (options) {
                observer.observe(target, options);
            } else {
                observer.observe(target);
            }
        } catch (error) {
            // Some embedded browser surfaces expose DOM handles that observers reject.
        }
    };
    const getPageId = () => document.body.dataset.pageId || document.documentElement.dataset.pageId || 'unknown';
    const normalizeText = (value) => (value || '').replace(/\s+/g, ' ').trim();
    const slugify = (value) => normalizeText(value)
        .toLowerCase()
        .replace(/[^a-z0-9\u3131-\u318e\uac00-\ud7a3]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'section';
    const guidebookTitleSuffixPattern = /\s+\|\s+[^|]+$/;
    const scrollTocHeadingSelector = 'h1, h2, h3, h4, h5, .practice-group-title';
    const buildParsedTocSelector = () => {
        const selectors = ['[data-guidebook-toc-title]', 'h3', '.practice-group-title'];
        if (document.querySelectorAll('.section-title').length > 1) {
            selectors.unshift('.section-title');
        }
        return selectors.join(', ');
    };
    const getPageTocTitle = () => normalizeText(document.title.replace(guidebookTitleSuffixPattern, ''));
    const lockEmbeddedScroll = () => {
        if (!embedded()) return;
        document.documentElement.style.overflowX = 'hidden';
        document.documentElement.style.overflowY = 'hidden';
        if (document.body) {
            document.body.style.overflowX = 'hidden';
            document.body.style.overflowY = 'hidden';
        }
    };
    const isFormTarget = (target) => {
        if (!(target instanceof Element)) return false;
        return Boolean(target.closest('input, textarea, select, button, [contenteditable="true"]')) || target.isContentEditable;
    };
    const postParent = (payload) => {
        if (!embedded()) return;
        window.parent.postMessage(payload, '*');
    };
    const scrollToElement = (element) => {
        if (!(element instanceof Element)) return;
        if (embedded()) postParent({ type: 'adt:page-anchor', pageId: getPageId(), top: element.getBoundingClientRect().top + window.scrollY });
        else element.scrollIntoView({ behavior: 'auto', block: 'start' });
    };
    const notifyModalState = () => {
        const open = modalFrames.size > 0 || Array.from(document.querySelectorAll('dialog[open], [aria-modal="true"]'))
            .some((element) => element.getClientRects().length > 0);
        if (open === lastModalState) return;
        lastModalState = open;
        postParent({ type: 'adt:page-modal', pageId: getPageId(), open });
    };
    const getCustomTocPayload = () => {
        if (typeof window.GuidebookPageCustomToc !== 'function') return null;
        const payload = window.GuidebookPageCustomToc();
        return payload && typeof payload === 'object' ? payload : null;
    };
    const getIndexedTocPartNumber = () => {
        if (document.body.dataset.chapterNumber) return document.body.dataset.chapterNumber;
        const badgeText = normalizeText(document.querySelector('.badge')?.textContent || '');
        const badgeMatch = badgeText.match(/(\d+)/);
        if (badgeMatch) return badgeMatch[1];
        const pageMatch = getPageId().match(/(\d+)$/);
        return pageMatch ? pageMatch[1] : '';
    };
    const stripLeadingTocIndex = (text) => normalizeText(text).replace(/^\d+\s*-\s*\d+\.\s*/, '').trim();
    const readActionTocTitle = (element, titleAttribute = 'data-guidebook-toc-title') => {
        if (!(element instanceof Element) || !titleAttribute) return '';
        return stripLeadingTocIndex(element.getAttribute(titleAttribute) || '');
    };
    const readParsedTocTitle = (element) => {
        if (!(element instanceof Element)) return '';
        if (element.hasAttribute('data-guidebook-toc-title')) {
            return stripLeadingTocIndex(element.getAttribute('data-guidebook-toc-title') || '');
        }
        if (element.matches(scrollTocHeadingSelector)) {
            return stripLeadingTocIndex(element.textContent || '');
        }
        return '';
    };
    const buildIndexedActionTocItems = (options = {}) => {
        const {
            panelSelector,
            keyDataset,
            activeKey,
            titleAttribute = 'data-guidebook-toc-title',
            partNumber = getIndexedTocPartNumber(),
            startIndex = 1,
        } = options;

        if (!panelSelector || !keyDataset) return [];

        const seen = new Set();
        return Array.from(document.querySelectorAll(panelSelector)).reduce((items, element) => {
            const key = element.dataset[keyDataset];
            if (!key || seen.has(key)) return items;
            seen.add(key);

            const title = readActionTocTitle(element, titleAttribute);
            if (!title) return items;

            const label = partNumber ? `${partNumber}-${startIndex + items.length}. ${title}` : title;
            items.push({
                key,
                label,
                active: key === activeKey,
            });
            return items;
        }, []);
    };
    const findByIdOrSelector = (value) => {
        if (!value || typeof value !== 'string') return null;
        return document.getElementById(value) || document.querySelector(value);
    };
    const createActionSectionEngine = (options = {}) => {
        const settings = Object.assign({
            defaultKey: '',
            labelSourceSelector: '',
            labelKeyDataset: '',
            titleAttribute: 'data-guidebook-toc-title',
            startIndex: 1,
            partNumber: getIndexedTocPartNumber(),
            panelStateMode: 'hidden',
            panelActiveClass: 'active',
            setAriaHidden: true,
            syncDelays: [0, 120, 360],
            scrollOnChange: true,
            scrollBehavior: 'auto',
            buttonLabelSelector: '',
            buttonKeyDataset: '',
            currentHeader: null,
        }, options);

        // Preview any section without generating a copy of the entire chapter.
        let aliases = {};
        try { aliases = JSON.parse(document.body.dataset.sectionAliases || '{}'); } catch { /* Older documents have no aliases. */ }
        const canonicalKey = key => aliases[key] || key;
        const requestedKey = new URLSearchParams(window.location.search).get('section');
        let activeKey = canonicalKey(requestedKey || document.body.dataset.defaultSection || settings.defaultKey);

        const readKey = (element, datasetName, resolver) => {
            if (!(element instanceof Element)) return '';
            if (typeof resolver === 'function') {
                const resolved = resolver(element);
                if (resolved) return resolved;
            }
            if (!datasetName || typeof datasetName !== 'string') return '';
            return element.dataset[datasetName] || '';
        };

        const getPanels = () => {
            if (!settings.panelSelector) return [];
            return Array.from(document.querySelectorAll(settings.panelSelector));
        };

        const getButtons = () => {
            if (!settings.buttonSelector) return [];
            return Array.from(document.querySelectorAll(settings.buttonSelector));
        };

        const buildItems = () => {
            if (typeof settings.buildItems === 'function') {
                return settings.buildItems({ activeKey }).map((item) => Object.assign({}, item, {
                    key: item.key,
                    label: normalizeText(item.label),
                    active: item.key === activeKey,
                }));
            }

            const keyDataset = settings.labelKeyDataset || settings.panelKeyDataset;
            const selector = settings.labelSourceSelector || settings.panelSelector;
            if (!selector || !keyDataset) return [];

            return buildIndexedActionTocItems({
                panelSelector: selector,
                keyDataset,
                activeKey,
                titleAttribute: settings.titleAttribute,
                partNumber: settings.partNumber,
                startIndex: settings.startIndex,
            });
        };

        const getActiveItem = (items = buildItems()) => {
            const matched = items.find((item) => item.key === activeKey);
            return matched || items[0] || null;
        };

        const syncBridge = () => {
            (Array.isArray(settings.syncDelays) ? settings.syncDelays : [0]).forEach((delay) => {
                window.setTimeout(() => {
                    notifyPageToc();
                    notifyHeight();
                }, Math.max(0, Number(delay) || 0));
            });
        };

        const updateCurrentHeader = (item, items) => {
            const config = settings.currentHeader;
            if (!config) return;

            const shell = findByIdOrSelector(config.shellId || config.shellSelector);
            const labelEl = findByIdOrSelector(config.labelId || config.labelSelector);
            const copyEl = findByIdOrSelector(config.copyId || config.copySelector);
            const copyText = typeof config.getCopy === 'function'
                ? normalizeText(config.getCopy({ activeKey, item, items }) || '')
                : '';

            if (labelEl && item?.label) {
                labelEl.textContent = item.label;
            }

            if (copyEl) {
                copyEl.textContent = copyText;
                copyEl.hidden = !copyText;
            }

            if (shell) {
                if (typeof config.apply === 'function') {
                    config.apply({ shell, activeKey, item, items });
                }

                if (config.mode === 'mount') {
                    const panel = getPanels().find((candidate) => readKey(candidate, settings.panelKeyDataset, settings.resolvePanelKey) === activeKey) || null;
                    let target = null;

                    if (typeof config.resolveTarget === 'function') {
                        target = config.resolveTarget({ activeKey, item, items, panel });
                    } else if (panel instanceof Element) {
                        const selector = config.targetSelector || '.card, .diagram-box';
                        target = panel.matches(selector) ? panel : panel.querySelector(selector);
                    }

                    if (target instanceof Element) {
                        target.prepend(shell);
                        shell.hidden = false;
                    }
                } else {
                    shell.hidden = false;
                }
            }
        };

        const applyPanelState = (panel, isActive) => {
            if (!(panel instanceof Element)) return;

            if (typeof settings.applyPanelState === 'function') {
                settings.applyPanelState({ panel, isActive, activeKey });
                return;
            }

            if (settings.panelStateMode === 'class') {
                panel.classList.toggle(settings.panelActiveClass, isActive);
            } else {
                panel.hidden = !isActive;
            }

            if (settings.setAriaHidden) {
                panel.setAttribute('aria-hidden', String(!isActive));
            }
        };

        const updateButtons = (items) => {
            const buttons = getButtons();
            if (!buttons.length) return;

            buttons.forEach((button, index) => {
                const key = readKey(button, settings.buttonKeyDataset || settings.panelKeyDataset, settings.resolveButtonKey);
                const item = items.find((entry) => entry.key === key) || null;
                const isActive = key === activeKey;

                if (item) {
                    const labelEl = settings.buttonLabelSelector
                        ? (button.matches(settings.buttonLabelSelector) ? button : button.querySelector(settings.buttonLabelSelector))
                        : null;
                    if (labelEl instanceof Element) {
                        labelEl.textContent = item.label;
                    }
                }

                if (typeof settings.applyButtonState === 'function') {
                    settings.applyButtonState({ button, isActive, item, index, items, activeKey });
                    return;
                }

                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-pressed', String(isActive));
            });
        };

        const setActive = (nextKey, behavior = {}) => {
            nextKey = canonicalKey(nextKey);
            const items = buildItems();
            const fallbackKey = items[0]?.key || settings.defaultKey || '';
            activeKey = items.some((item) => item.key === nextKey) ? nextKey : fallbackKey;
            const activeItem = getActiveItem(items);

            getPanels().forEach((panel) => {
                const key = readKey(panel, settings.panelKeyDataset, settings.resolvePanelKey);
                applyPanelState(panel, key === activeKey);
            });

            if (typeof settings.syncGroups === 'function') {
                settings.syncGroups({ activeKey, item: activeItem, items });
            }

            updateButtons(items);
            updateCurrentHeader(activeItem, items);

            syncActivity();

            if (typeof settings.onAfterSet === 'function') {
                settings.onAfterSet({ activeKey, item: activeItem, items });
            }

            if (behavior.scroll !== false && settings.scrollOnChange) {
                window.scrollTo({ top: 0, behavior: settings.scrollBehavior });
            }

            if (behavior.sync !== false) {
                window.requestAnimationFrame(() => {
                    syncBridge();
                });
            }

            return activeItem;
        };

        const bindButtons = () => {
            getButtons().forEach((button) => {
                if (button.dataset.guidebookSectionBound === 'true') return;
                button.dataset.guidebookSectionBound = 'true';
                button.addEventListener('click', () => {
                    const key = readKey(button, settings.buttonKeyDataset || settings.panelKeyDataset, settings.resolveButtonKey);
                    setActive(key);
                });
            });
        };

        const init = (behavior = {}) => {
            bindButtons();
            return setActive(activeKey || settings.defaultKey, {
                scroll: behavior.scroll,
                sync: behavior.sync,
            });
        };

        return {
            init,
            setActive,
            syncBridge,
            getActiveKey: () => activeKey,
            getItems: () => buildItems(),
            getTocPayload: () => ({
                mode: 'action',
                title: getPageTocTitle(),
                items: buildItems(),
            }),
        };
    };
    const initActionSectionPage = (options = {}) => {
        hasActionEngine = true;
        const engine = createActionSectionEngine(options);

        window.GuidebookPageCustomToc = () => engine.getTocPayload();
        window.GuidebookPageHandleTocActivation = (key) => {
            engine.setActive(key);
        };

        window.addEventListener('DOMContentLoaded', () => {
            if (typeof options.beforeInit === 'function') {
                options.beforeInit(engine);
            }

            engine.init({ scroll: false, sync: false });
            initStandalonePage();

            if (typeof options.afterInit === 'function') {
                options.afterInit(engine);
            }

            engine.syncBridge();
        });

        return engine;
    };
    const notifyHeight = () => {
        if (!isPageActive()) return;
        const pageShell = document.querySelector('.page-shell');
        const shellHeight = pageShell
            ? Math.max(
                Math.ceil(pageShell.getBoundingClientRect().height),
                pageShell.scrollHeight || 0,
                pageShell.offsetHeight || 0
            )
            : 0;
        const fallbackHeight = Math.max(
            document.body ? document.body.scrollHeight : 0,
            document.body ? document.body.offsetHeight : 0,
            document.documentElement ? document.documentElement.scrollHeight : 0,
            document.documentElement ? document.documentElement.offsetHeight : 0
        );
        const height = shellHeight || fallbackHeight;
        postParent({ type: 'adt:page-height', pageId: getPageId(), height });
    };
    const isElementVisible = (element) => {
        if (!(element instanceof Element)) return false;
        if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 || rect.height > 0;
    };
    const ensureAnchorId = (element, label, index = 0) => {
        if (element.id) return element.id;
        const base = `${getPageId()}-${slugify(label)}`;
        const nextId = index > 0 ? `${base}-${index}` : base;
        element.id = nextId;
        return nextId;
    };
    const collectParsedTocCandidates = () => Array.from(document.querySelectorAll(buildParsedTocSelector()))
        .filter(isElementVisible)
        .filter((element, index, candidates) => !candidates.slice(0, index).some((previous) => previous.contains(element)));
    const buildParsedTocItems = () => collectParsedTocCandidates()
        .map((element, index) => {
            const label = readParsedTocTitle(element);
            if (!label) return null;
            const id = ensureAnchorId(element, label || `item-${index + 1}`, index);
            return {
                key: id,
                id,
                label,
                top: Math.max(0, Math.round(element.getBoundingClientRect().top + window.scrollY)),
            };
        })
        .filter(Boolean);
    const notifyPageToc = () => {
        if (!isPageActive()) return;
        const customPayload = getCustomTocPayload();
        if (customPayload && Array.isArray(customPayload.items)) {
            postParent(Object.assign({
                type: 'adt:page-toc',
                pageId: getPageId(),
                title: getPageTocTitle(),
                mode: customPayload.mode === 'action' ? 'action' : 'scroll',
            }, customPayload));
            return;
        }
        const items = buildParsedTocItems();
        postParent({
            type: 'adt:page-toc',
            pageId: getPageId(),
            mode: 'scroll',
            title: getPageTocTitle(),
            items,
        });
    };
    const initParentBridge = () => {
        if (!embedded()) return;

        document.documentElement.classList.add('is-embedded');
        document.body?.classList.add('is-embedded');
        lockEmbeddedScroll();
        let syncRaf = 0;
        const scheduleBridgeSync = () => {
            if (!isPageActive() || syncRaf) return;
            syncRaf = window.requestAnimationFrame(() => {
                syncRaf = 0;
                notifyHeight();
                notifyPageToc();
                notifyModalState();
            });
        };

        postParent({ type: 'adt:ready', pageId: getPageId() });

        window.addEventListener('load', scheduleBridgeSync);
        window.addEventListener('resize', scheduleBridgeSync);

        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(scheduleBridgeSync);
            observeTarget(observer, document.documentElement);
            observeTarget(observer, document.body);
        } else {
            window.setInterval(() => {
                notifyHeight();
                notifyPageToc();
            }, 1000);
        }

        if (typeof MutationObserver !== 'undefined') {
            const mutationObserver = new MutationObserver(scheduleBridgeSync);
            observeTarget(mutationObserver, document.body, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'open', 'aria-modal'],
            });
        }

        document.addEventListener('keydown', (event) => {
            if (isFormTarget(event.target)) return;
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                postParent({
                    type: 'adt:navigate',
                    pageId: getPageId(),
                    delta: event.key === 'ArrowRight' ? 1 : -1,
                });
                event.preventDefault();
            }
        });

        window.addEventListener('message', (event) => {
            const data = event.data;
            if (event.source !== window.parent || !data || typeof data !== 'object') return;
            if (data.type === 'adt:page-active' && data.pageId === getPageId()) {
                setParentViewport(data.viewport);
                setPageActive(data.active);
                return;
            }
            if (data.type === 'adt:page-viewport' && data.pageId === getPageId()) {
                setParentViewport(data.viewport);
                return;
            }
            if (data.type === 'adt:page-toc-activate' && data.pageId === getPageId() && typeof window.GuidebookPageHandleTocActivation === 'function') {
                window.GuidebookPageHandleTocActivation(data.key);
            }
        });

        window.setTimeout(scheduleBridgeSync, 0);
        window.setTimeout(scheduleBridgeSync, 180);
        window.setTimeout(scheduleBridgeSync, 720);
    };

    const initStandalonePage = () => {
        if (initialized) return;
        initialized = true;
        initializers.forEach((initialize) => runSafely(initialize));
        initParentBridge();
        syncActivity();
        notifyHeight();
        notifyPageToc();
    };

    // Child documents report their own height, including under opaque file:// origins.
    // The parent never scans or rewrites a child document during measurement.
    const attachEmbeddedFrame = (frame, { root = frame, minHeight = 720 } = {}) => {
        let active = false;
        const sendViewport = () => {
            if (!active) return;
            const viewport = parentViewport || { top: 0, height: window.innerHeight };
            const rect = frame.getBoundingClientRect();
            const top = Math.max(rect.top, viewport.top);
            const bottom = Math.min(rect.bottom, viewport.top + viewport.height);
            frame.contentWindow?.postMessage({
                type: 'chipbook:frame-viewport', top: Math.max(0, top - rect.top), height: Math.max(0, bottom - top),
            }, '*');
        };
        const sendActivity = () => frame.contentWindow?.postMessage({
            type: 'chipbook:frame-active', active,
        }, '*');
        const onLoad = () => {
            frame.closest('.page7-source-shell')?.classList.add('is-ready');
            sendActivity();
            sendViewport();
        };
        const onMessage = (event) => {
            if (event.source !== frame.contentWindow) return;
            const data = event.data;
            if (data?.type === 'chipbook:frame-ready') { sendActivity(); sendViewport(); }
            if (data?.type === 'chipbook:frame-modal') {
                if (data.open) modalFrames.add(frame);
                else modalFrames.delete(frame);
                notifyModalState();
                return;
            }
            if (!active || data?.type !== 'chipbook:frame-height' || !Number.isFinite(data.height)) return;
            const height = Math.max(minHeight, Math.ceil(data.height));
            if (frame.style.height !== `${height}px`) {
                frame.style.height = `${height}px`;
                notifyHeight();
                sendViewport();
            }
            frame.closest('.page7-source-shell')?.classList.add('is-ready');
        };
        frame.setAttribute('scrolling', 'no');
        frame.addEventListener('load', onLoad);
        window.addEventListener('message', onMessage);
        viewportListeners.add(sendViewport);
        return registerLifecycle({
            root,
            start() {
                active = true;
                if (!frame.getAttribute('src')) frame.src = frame.dataset.src;
                sendActivity();
                sendViewport();
            },
            stop() { active = false; sendActivity(); },
            destroy() {
                frame.removeEventListener('load', onLoad);
                window.removeEventListener('message', onMessage);
                viewportListeners.delete(sendViewport);
                modalFrames.delete(frame);
                notifyModalState();
            },
        });
    };

    document.addEventListener('visibilitychange', syncActivity);
    document.addEventListener('toggle', () => {
        syncActivity();
        notifyHeight();
        notifyPageToc();
    }, true);
    window.addEventListener('resize', syncActivity);
    window.addEventListener('resize', syncViewport);
    window.addEventListener('scroll', syncViewport, { passive: true });
    window.addEventListener('pagehide', (event) => {
        pageDisposed = true;
        syncActivity();
        if (!event.persisted) {
            lifecycles.forEach((entry) => runSafely(entry.destroy));
            lifecycles.clear();
        }
    });
    window.addEventListener('pageshow', () => {
        pageDisposed = false;
        syncActivity();
    });

    window.GuidebookPage = Object.assign(window.GuidebookPage || {}, {
        registerInitializer,
        registerLifecycle,
        registerViewportFeature,
        isPageActive,
        syncActivity,
        attachEmbeddedFrame,
        observeTarget,
        buildIndexedActionTocItems,
        createActionSectionEngine,
        initStandalonePage,
        initActionSectionPage,
        notifyHeight,
        notifyPageToc,
        scrollToElement,
    });
    window.addEventListener('DOMContentLoaded', () => {
        if (!hasActionEngine) initStandalonePage();
    });
})();
