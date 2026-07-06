(() => {
    const sections = Array.from(document.querySelectorAll('.page-section'));
    const navItems = Array.from(document.querySelectorAll('[data-go-page]'));
    const frames = Array.from(document.querySelectorAll('[data-page-frame]'));
    const prevButton = document.getElementById('btn-prev');
    const nextButton = document.getElementById('btn-next');
    const indicator = document.getElementById('page-indicator');
    const tocRoot = document.querySelector('[data-page-toc-shell]');
    const tocToggle = document.querySelector('[data-page-toc-toggle]');
    const tocTitle = document.querySelector('[data-page-toc-title]');
    const tocNav = document.querySelector('[data-page-toc-nav]');
    const tocEmpty = document.querySelector('[data-page-toc-empty]');
    const chapterInput = document.querySelector('[data-chapter-input]');
    const chapterStepButtons = Array.from(document.querySelectorAll('[data-chapter-step]'));
    const tocStateByPage = new Map();
    const pendingTocActivationByPage = new Map();
    const totalPages = sections.length;
    const headerOffset = 104;
    let currentPage = 1;
    let tocRenderRaf = 0;
    const toIndex = (pageNum) => pageNum - 1;
    const currentPageId = () => {
        const frame = frames[toIndex(currentPage)] || null;
        return frame?.dataset.pageId || `page-${currentPage}`;
    };
    const frameHeightOverscan = 40;

    const isFormTarget = (target) => {
        if (!(target instanceof Element)) return false;
        return Boolean(target.closest('input, textarea, select, button, [contenteditable="true"]')) || target.isContentEditable;
    };

    const isFinePointer = () => (
        typeof window.matchMedia === 'function'
        && window.matchMedia('(min-width: 1440px) and (hover: hover) and (pointer: fine)').matches
    );

    const setTocExpanded = (expanded) => {
        if (!tocRoot || !tocToggle) return;
        const nextExpanded = Boolean(expanded);
        tocRoot.classList.toggle('is-expanded', nextExpanded);
        tocToggle.setAttribute('aria-expanded', String(nextExpanded));
    };

    const isTocExpanded = () => Boolean(tocRoot?.classList.contains('is-expanded'));

    const ensurePageLoaded = (pageNum) => {
        const frame = frames[toIndex(pageNum)];
        if (!frame || frame.dataset.loaded === 'true') return;
        frame.src = frame.dataset.pageSrc;
        frame.dataset.loaded = 'true';
    };

    const markFrameReady = (frame) => {
        const shell = frame.closest('[data-page-shell]');
        if (shell) shell.classList.add('is-ready');
    };

    const resizeFrame = (pageId, height) => {
        const frame = document.querySelector(`[data-page-id="${pageId}"]`);
        if (!frame) return;
        const safeHeight = Math.max(480, Math.ceil(Number(height) || 0) + frameHeightOverscan);
        const currentHeight = Number.parseFloat(frame.style.height) || Math.round(frame.getBoundingClientRect().height) || 0;
        if (Math.abs(currentHeight - safeHeight) <= 1) {
            markFrameReady(frame);
            return;
        }
        frame.style.height = `${safeHeight}px`;
        frame.setAttribute('scrolling', 'no');
        markFrameReady(frame);
        scheduleTocRender();
    };

    const getCurrentFrame = () => frames[toIndex(currentPage)] || null;

    const sendTocActivationToFrame = (frame, pageId, key) => {
        if (!frame || !pageId || !key) return;

        const send = () => {
            if (!frame.contentWindow) return;

            try {
                if (typeof frame.contentWindow.GuidebookPageHandleTocActivation === 'function') {
                    frame.contentWindow.GuidebookPageHandleTocActivation(key);
                }
            } catch (error) {
                // Keep the postMessage fallback for embedded/cross-context browser surfaces.
            }

            frame.contentWindow.postMessage({
                type: 'adt:page-toc-activate',
                pageId,
                key,
            }, '*');
        };

        [0, 100, 300].forEach((delay) => {
            window.setTimeout(send, delay);
        });
    };

    const applyPendingTocActivation = (pageId) => {
        const pendingKey = pendingTocActivationByPage.get(pageId);
        const state = tocStateByPage.get(pageId);
        if (!pendingKey || !state || state.mode !== 'action') return;

        const hasPendingItem = state.items.some((entry) => entry.key === pendingKey);
        if (!hasPendingItem) return;

        state.items = state.items.map((entry) => ({
            ...entry,
            active: entry.key === pendingKey,
        }));
        scheduleTocRender();

        const frame = Array.from(frames).find((candidate) => candidate.dataset.pageId === pageId) || null;
        sendTocActivationToFrame(frame, pageId, pendingKey);
    };

    const normalizeTocState = (data) => ({
        pageId: data.pageId,
        mode: data.mode === 'action' ? 'action' : 'scroll',
        title: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : '이 페이지',
        items: Array.isArray(data.items)
            ? data.items
                .filter((item) => item && typeof item.label === 'string' && item.label.trim())
                .map((item, index) => ({
                    key: typeof item.key === 'string' && item.key ? item.key : `${data.pageId}-toc-${index + 1}`,
                    label: item.label.trim(),
                    top: Number(item.top) || 0,
                    active: Boolean(item.active),
                }))
            : [],
    });

    const getActiveScrollItemKey = (state) => {
        const frame = getCurrentFrame();
        if (!frame || !state || state.mode !== 'scroll' || !state.items.length) return null;

        const frameTop = window.scrollY + frame.getBoundingClientRect().top;
        const threshold = window.scrollY + headerOffset + 12;
        let activeKey = state.items[0].key;

        state.items.forEach((item) => {
            const absoluteTop = frameTop + (Number(item.top) || 0);
            if (absoluteTop <= threshold) {
                activeKey = item.key;
            }
        });

        return activeKey;
    };

    const getCurrentTocItemByKey = (key) => {
        const state = tocStateByPage.get(currentPageId());
        if (!state || !key) return null;
        return state.items.find((item) => item.key === key) || null;
    };

    const handleTocItemClick = (item) => {
        const state = tocStateByPage.get(currentPageId());
        const frame = getCurrentFrame();
        if (!state || !frame) return;

        if (state.mode === 'action') {
            pendingTocActivationByPage.set(state.pageId, item.key);

            if (state.items.length) {
                state.items = state.items.map((entry) => ({
                    ...entry,
                    active: entry.key === item.key,
                }));
                scheduleTocRender();
            }

            sendTocActivationToFrame(frame, state.pageId, item.key);

            const frameTop = window.scrollY + frame.getBoundingClientRect().top;
            const nextTop = Math.max(0, Math.round(frameTop - headerOffset + 12));
            window.scrollTo({ top: nextTop, behavior: 'auto' });
            return;
        }

        const frameTop = window.scrollY + frame.getBoundingClientRect().top;
        const nextTop = Math.max(0, Math.round(frameTop + (Number(item.top) || 0) - headerOffset));
        window.scrollTo({ top: nextTop, behavior: 'smooth' });
    };

    const createTocButton = () => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'page-side-toc-item';
        button.addEventListener('click', () => {
            const item = getCurrentTocItemByKey(button.dataset.tocKey);
            if (!item) return;
            handleTocItemClick(item);
            setTocExpanded(false);
        });
        return button;
    };

    const updateTocButton = (button, item, activeKey) => {
        button.dataset.tocKey = item.key;
        if (button.textContent !== item.label) {
            button.textContent = item.label;
        }
        button.classList.toggle('is-active', item.key === activeKey);
    };

    const renderTocItems = (state, activeKey) => {
        const children = Array.from(tocNav.children);
        const canPatchInPlace = children.length === state.items.length
            && children.every((child, index) => (
                child instanceof HTMLButtonElement
                && child.classList.contains('page-side-toc-item')
                && child.dataset.tocKey === state.items[index].key
            ));

        if (canPatchInPlace) {
            state.items.forEach((item, index) => {
                updateTocButton(children[index], item, activeKey);
            });
            return;
        }

        const fragment = document.createDocumentFragment();
        state.items.forEach((item) => {
            const button = createTocButton();
            updateTocButton(button, item, activeKey);
            fragment.appendChild(button);
        });
        tocNav.replaceChildren(fragment);
    };

    const renderToc = () => {
        if (!tocRoot || !tocTitle || !tocNav || !tocEmpty) return;

        const state = tocStateByPage.get(currentPageId()) || null;
        tocTitle.textContent = state?.title || '이 페이지';

        if (!state) {
            tocNav.replaceChildren();
            tocEmpty.hidden = false;
            tocEmpty.textContent = '소목차를 불러오는 중입니다.';
            return;
        }

        if (!state.items.length) {
            tocNav.replaceChildren();
            tocEmpty.hidden = false;
            tocEmpty.textContent = '이 페이지에서 표시할 소목차가 아직 없습니다.';
            return;
        }

        tocEmpty.hidden = true;
        const activeKey = state.mode === 'action'
            ? state.items.find((item) => item.active)?.key || null
            : getActiveScrollItemKey(state);

        renderTocItems(state, activeKey);
    };

    const scheduleTocRender = () => {
        if (tocRenderRaf) return;
        tocRenderRaf = window.requestAnimationFrame(() => {
            tocRenderRaf = 0;
            renderToc();
        });
    };

    const clampPage = (pageNum) => Math.min(totalPages, Math.max(1, pageNum));

    const parseChapterInputPage = () => {
        if (!chapterInput) return null;
        const parsedPage = Number.parseInt(chapterInput.value, 10);
        return Number.isFinite(parsedPage) ? clampPage(parsedPage) : null;
    };

    const syncChapterJump = () => {
        if (chapterInput) {
            chapterInput.min = '1';
            chapterInput.max = String(totalPages);
            chapterInput.value = String(currentPage);
        }

        chapterStepButtons.forEach((button) => {
            if (!(button instanceof HTMLButtonElement)) return;
            const delta = Number.parseInt(button.dataset.chapterStep || '0', 10);
            button.disabled = (delta < 0 && currentPage <= 1) || (delta > 0 && currentPage >= totalPages);
        });
    };

    const syncUi = () => {
        sections.forEach((section, index) => {
            section.classList.toggle('active', index === toIndex(currentPage));
        });
        navItems.forEach((item) => {
            const pageNum = Number(item.dataset.goPage);
            item.classList.toggle('active', pageNum === currentPage);
            item.setAttribute('aria-current', pageNum === currentPage ? 'page' : 'false');
        });
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages;
        indicator.textContent = `Page ${currentPage} of ${totalPages}`;
        syncChapterJump();
        scheduleTocRender();
    };

    const goToPage = (pageNum) => {
        if (pageNum < 1 || pageNum > totalPages) return;
        currentPage = pageNum;
        ensurePageLoaded(pageNum);
        syncUi();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.goToPage = goToPage;

    const commitChapterInput = () => {
        const pageNum = parseChapterInputPage();
        if (!pageNum) {
            syncChapterJump();
            return;
        }
        goToPage(pageNum);
        setTocExpanded(false);
    };

    navItems.forEach((item) => {
        item.addEventListener('click', () => {
            goToPage(Number(item.dataset.goPage));
            setTocExpanded(false);
        });
    });

    prevButton.addEventListener('click', () => goToPage(currentPage - 1));
    nextButton.addEventListener('click', () => goToPage(currentPage + 1));

    chapterStepButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const delta = Number.parseInt(button.dataset.chapterStep || '0', 10);
            goToPage(currentPage + delta);
            setTocExpanded(false);
        });
    });

    chapterInput?.addEventListener('focus', () => {
        chapterInput.select();
    });

    chapterInput?.addEventListener('change', commitChapterInput);

    chapterInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            commitChapterInput();
            chapterInput.blur();
        }
        if (event.key === 'Escape') {
            syncChapterJump();
            chapterInput.blur();
        }
    });

    tocToggle?.addEventListener('click', (event) => {
        event.stopPropagation();
        setTocExpanded(!isTocExpanded());
    });

    tocRoot?.addEventListener('mouseenter', () => {
        if (isFinePointer()) setTocExpanded(true);
    });

    tocRoot?.addEventListener('mouseleave', () => {
        if (isFinePointer()) setTocExpanded(false);
    });

    document.addEventListener('click', (event) => {
        if (!tocRoot || !isTocExpanded() || !(event.target instanceof Node)) return;
        if (!tocRoot.contains(event.target)) setTocExpanded(false);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isTocExpanded()) {
            setTocExpanded(false);
            return;
        }
        if (isFormTarget(event.target)) return;
        if (event.key === 'ArrowRight') goToPage(currentPage + 1);
        if (event.key === 'ArrowLeft') goToPage(currentPage - 1);
    });

    frames.forEach((frame) => {
        frame.setAttribute('scrolling', 'no');
        frame.addEventListener('load', () => {
            if (!frame.style.height) {
                frame.style.height = '960px';
            }
            markFrameReady(frame);
            applyPendingTocActivation(frame.dataset.pageId);
            scheduleTocRender();
        });
    });

    window.addEventListener('scroll', scheduleTocRender, { passive: true });
    window.addEventListener('resize', scheduleTocRender);

    window.addEventListener('message', (event) => {
        const data = event.data;
        if (!data || typeof data !== 'object') return;
        if (data.type === 'adt:page-height') {
            resizeFrame(data.pageId, data.height);
        }
        if (data.type === 'adt:navigate' && Number.isFinite(data.delta)) {
            goToPage(currentPage + data.delta);
        }
        if (data.type === 'adt:ready') {
            const frame = document.querySelector(`[data-page-id="${data.pageId}"]`);
            if (frame) markFrameReady(frame);
        }
        if (data.type === 'adt:page-toc' && typeof data.pageId === 'string') {
            const normalizedState = normalizeTocState(data);
            const pendingKey = pendingTocActivationByPage.get(data.pageId);
            const childActiveKey = normalizedState.items.find((item) => item.active)?.key || null;

            if (pendingKey && childActiveKey === pendingKey) {
                pendingTocActivationByPage.delete(data.pageId);
            } else if (pendingKey && normalizedState.mode === 'action' && normalizedState.items.some((item) => item.key === pendingKey)) {
                normalizedState.items = normalizedState.items.map((item) => ({
                    ...item,
                    active: item.key === pendingKey,
                }));
            }

            tocStateByPage.set(data.pageId, normalizedState);
            applyPendingTocActivation(data.pageId);
            scheduleTocRender();
        }
    });

    ensurePageLoaded(1);
    syncUi();
})();
