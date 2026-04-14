(() => {
    const sections = Array.from(document.querySelectorAll('.page-section'));
    const navItems = Array.from(document.querySelectorAll('[data-go-page]'));
    const frames = Array.from(document.querySelectorAll('[data-page-frame]'));
    const prevButton = document.getElementById('btn-prev');
    const nextButton = document.getElementById('btn-next');
    const indicator = document.getElementById('page-indicator');
    let currentPage = 1;
    const totalPages = sections.length;
    const toIndex = (pageNum) => pageNum - 1;

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
        const safeHeight = Math.max(480, Math.ceil(Number(height) || 0) + 12);
        frame.style.height = `${safeHeight}px`;
        frame.setAttribute('scrolling', 'no');
        markFrameReady(frame);
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
        });
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
    });

    ensurePageLoaded(1);
    syncUi();
})();
