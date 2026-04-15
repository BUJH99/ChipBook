(() => {
    const sections = Array.from(document.querySelectorAll('.page-section'));
    const navItems = Array.from(document.querySelectorAll('[data-go-page]'));
    const frames = Array.from(document.querySelectorAll('[data-page-frame]'));
    const prevButton = document.getElementById('btn-prev');
    const nextButton = document.getElementById('btn-next');
    const indicator = document.getElementById('page-indicator');
    const tocStateByPage = new Map();
    const totalPages = sections.length;
    const headerOffset = 104;
    let currentPage = 1;
    let tocRoot = null;
    let tocToggle = null;
    let tocTitle = null;
    let tocNav = null;
    let tocEmpty = null;
    let tocOpen = window.innerWidth >= 1800;
    let tocRenderRaf = 0;
    const toIndex = (pageNum) => pageNum - 1;
    const currentPageId = () => `page-${currentPage}`;

    const isFormTarget = (target) => {
        if (!(target instanceof Element)) return false;
        return Boolean(target.closest('input, textarea, select, button, [contenteditable="true"]')) || target.isContentEditable;
    };

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
        const safeHeight = Math.max(480, Math.ceil(Number(height) || 0));
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

    const setTocOpen = (nextOpen) => {
        tocOpen = Boolean(nextOpen);
        if (!tocRoot || !tocToggle) return;
        tocRoot.classList.toggle('is-open', tocOpen);
        tocToggle.setAttribute('aria-expanded', String(tocOpen));
    };

    const handleTocItemClick = (item) => {
        const state = tocStateByPage.get(currentPageId());
        const frame = getCurrentFrame();
        if (!state || !frame) return;

        if (state.mode === 'action') {
            if (state.items.length) {
                state.items = state.items.map((entry) => ({
                    ...entry,
                    active: entry.key === item.key,
                }));
                scheduleTocRender();
            }

            if (frame.contentWindow) {
                try {
                    if (typeof frame.contentWindow.GuidebookPageHandleTocActivation === 'function') {
                        frame.contentWindow.GuidebookPageHandleTocActivation(item.key);
                    }
                } catch (error) {
                    // Keep the postMessage fallback for cases where direct access is unavailable.
                }

                frame.contentWindow.postMessage({
                    type: 'adt:page-toc-activate',
                    pageId: state.pageId,
                    key: item.key,
                }, '*');
            }

            const frameTop = window.scrollY + frame.getBoundingClientRect().top;
            const nextTop = Math.max(0, Math.round(frameTop - headerOffset + 12));
            window.scrollTo({ top: nextTop, behavior: 'smooth' });
        } else {
            const frameTop = window.scrollY + frame.getBoundingClientRect().top;
            const nextTop = Math.max(0, Math.round(frameTop + (Number(item.top) || 0) - headerOffset));
            window.scrollTo({ top: nextTop, behavior: 'smooth' });
        }

        if (window.innerWidth < 1800) {
            setTocOpen(false);
        }
    };

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

    const renderToc = () => {
        if (!tocRoot || !tocTitle || !tocNav || !tocEmpty) return;

        const state = tocStateByPage.get(currentPageId()) || null;
        const isDesktop = window.innerWidth >= 1280;
        tocRoot.style.display = isDesktop ? 'flex' : 'none';

        tocTitle.textContent = state?.title || '이 페이지';
        tocNav.innerHTML = '';

        if (!state) {
            tocEmpty.hidden = false;
            tocEmpty.textContent = '소목차를 불러오는 중입니다.';
            return;
        }

        if (!state.items.length) {
            tocEmpty.hidden = false;
            tocEmpty.textContent = '이 페이지에서 표시할 소목차가 아직 없습니다.';
            return;
        }

        tocEmpty.hidden = true;
        const activeKey = state.mode === 'action'
            ? state.items.find((item) => item.active)?.key || null
            : getActiveScrollItemKey(state);

        state.items.forEach((item) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'global-page-toc-item';
            button.textContent = item.label;
            if (item.key === activeKey) {
                button.classList.add('is-active');
            }
            button.addEventListener('click', () => handleTocItemClick(item));
            tocNav.appendChild(button);
        });
    };

    const scheduleTocRender = () => {
        if (tocRenderRaf) return;
        tocRenderRaf = window.requestAnimationFrame(() => {
            tocRenderRaf = 0;
            renderToc();
        });
    };

    const createTocShell = () => {
        if (tocRoot) return;

        tocRoot = document.createElement('aside');
        tocRoot.className = 'global-page-toc';
        tocRoot.innerHTML = `
            <button type="button" class="global-page-toc-toggle" aria-expanded="false">소목차</button>
            <div class="global-page-toc-panel">
                <div class="global-page-toc-header">
                    <div class="global-page-toc-eyebrow">This Page</div>
                    <div class="global-page-toc-title">이 페이지</div>
                </div>
                <nav class="global-page-toc-nav"></nav>
                <div class="global-page-toc-empty">소목차를 불러오는 중입니다.</div>
            </div>
        `;

        tocToggle = tocRoot.querySelector('.global-page-toc-toggle');
        tocTitle = tocRoot.querySelector('.global-page-toc-title');
        tocNav = tocRoot.querySelector('.global-page-toc-nav');
        tocEmpty = tocRoot.querySelector('.global-page-toc-empty');

        tocToggle.addEventListener('click', () => {
            setTocOpen(!tocOpen);
        });

        document.body.appendChild(tocRoot);
        setTocOpen(tocOpen);
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

    navItems.forEach((item) => {
        item.addEventListener('click', () => {
            goToPage(Number(item.dataset.goPage));
        });
    });

    prevButton.addEventListener('click', () => goToPage(currentPage - 1));
    nextButton.addEventListener('click', () => goToPage(currentPage + 1));

    document.addEventListener('keydown', (event) => {
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
            scheduleTocRender();
        });
    });

    window.addEventListener('scroll', scheduleTocRender, { passive: true });
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1800) {
            setTocOpen(true);
        }
        scheduleTocRender();
    });

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
            tocStateByPage.set(data.pageId, normalizeTocState(data));
            scheduleTocRender();
        }
    });

    createTocShell();
    ensurePageLoaded(1);
    syncUi();
})();
