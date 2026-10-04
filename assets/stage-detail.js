(() => {
    'use strict';

    const assetBase = new URL('.', document.currentScript.src);
    const init = () => {
        const root = document.querySelector('.stage-detail');
        if (!root) return;
        const tabs = [...root.querySelectorAll('[data-sd-stage]')];
        const panels = [...root.querySelectorAll('[data-sd-panel]')];
        const nav = root.querySelector('.sd-stage-nav');
        const live = root.querySelector('[data-sd-live]');
        const dialog = root.querySelector('[data-sd-dialog]');
        const dialogImage = root.querySelector('[data-sd-dialog-image]');
        const dialogCaption = root.querySelector('[data-sd-dialog-caption]');
        const viewers = new Map();
        let viewerLibrary;
        let zoomTrigger;
        let activeKey = 'spec';
        let resizeFrame = 0;

        const syncHeight = () => {
            if (resizeFrame) return;
            resizeFrame = requestAnimationFrame(() => {
                resizeFrame = 0;
                window.GuidebookPage?.notifyHeight();
            });
        };
        const syncViewers = () => {
            viewers.forEach((viewer, host) => viewer.setActive(!host.closest('[hidden]') && !document.hidden));
        };
        const keyFromHash = () => new URLSearchParams(location.hash.slice(1)).get('stage');
        const loadViewer = () => {
            if (window.ChipBookStage3D) return Promise.resolve(window.ChipBookStage3D);
            if (!viewerLibrary) viewerLibrary = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = new URL('stage-detail-3d.bundle.js', assetBase).href;
                script.onload = () => {
                    if (window.ChipBookStage3D) resolve(window.ChipBookStage3D);
                    else { viewerLibrary = null; script.remove(); reject(new Error('3D library did not initialize.')); }
                };
                script.onerror = () => { viewerLibrary = null; script.remove(); reject(new Error('3D library could not be loaded.')); };
                document.head.append(script);
            });
            return viewerLibrary;
        };
        const setStage = (key, options = {}) => {
            const index = tabs.findIndex((tab) => tab.dataset.sdStage === key);
            if (index < 0) return;
            activeKey = key;
            tabs.forEach((tab, n) => {
                tab.setAttribute('aria-selected', String(n === index));
                tab.tabIndex = n === index ? 0 : -1;
            });
            panels.forEach((panel) => { panel.hidden = panel.dataset.sdPanel !== key; });
            root.dataset.activeStage = key;
            if (options.announce !== false) live.textContent = `${tabs[index].querySelector('.sd-tab-number').textContent} ${tabs[index].querySelector('.sd-tab-name').textContent} 스테이지를 선택했습니다.`;
            if (options.persist !== false) {
                try { history.replaceState(null, '', `#stage=${key}`); } catch (_) { /* file previews may restrict history. */ }
            }
            if (options.focus) tabs[index].focus({ preventScroll: true });
            if (options.scroll) nav.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
            if (options.focus || options.reveal) tabs[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
            syncViewers();
            syncHeight();
        };
        const closeViewer = () => {
            if (dialog.open) dialog.close();
        };
        const sizeDialogImage = () => {
            const isVector = /\.svg(?:[?#]|$)/i.test(dialogImage.currentSrc || dialogImage.src);
            if (!isVector && dialogImage.naturalWidth) {
                const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
                dialogImage.style.setProperty('--sd-image-limit', `${dialogImage.naturalWidth / pixelRatio}px`);
            } else {
                dialogImage.style.removeProperty('--sd-image-limit');
            }
        };
        const positionDialog = () => {
            let top = 24;
            let height = window.innerHeight - 48;
            try {
                if (window.frameElement && window.parent !== window) {
                    const frame = window.frameElement.getBoundingClientRect();
                    const parentHeader = window.parent.document.querySelector('header');
                    const parentToc = window.parent.document.querySelector('[data-page-toc-shell]');
                    const safeTop = Math.max(24, (parentHeader?.getBoundingClientRect().bottom || 0) + 12, (parentToc?.getBoundingClientRect().bottom || 0) + 12);
                    top = Math.max(16, -frame.top + safeTop);
                    height = Math.min(window.innerHeight - top - 16, window.parent.innerHeight - safeTop - 24);
                }
            } catch (_) { /* Cross-origin embeds retain the local viewport placement. */ }
            dialog.style.setProperty('--sd-dialog-top', `${top}px`);
            dialog.style.setProperty('--sd-dialog-height', `${Math.max(240, height)}px`);
        };
        const showDiagram = (button) => {
            const image = button.querySelector('img:not(.sd-icon)');
            if (!image) return;
            zoomTrigger = button;
            dialogImage.style.removeProperty('--sd-image-limit');
            dialogImage.src = image.currentSrc || image.src;
            dialogImage.alt = image.alt;
            dialogCaption.textContent = button.dataset.sdCaption || '';
            root.querySelector('#sd-dialog-title').textContent = button.getAttribute('aria-label').replace(' 그림 확대', '');
            positionDialog();
            dialog.showModal();
            sizeDialogImage();
            root.querySelector('[data-sd-close]').focus();
        };
        const setView = async (button) => {
            const panel = button.closest('[data-sd-panel]');
            const mode = button.dataset.sdView;
            panel.querySelectorAll('[data-sd-view]').forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
            panel.querySelectorAll('[data-sd-view-panel]').forEach((candidate) => { candidate.hidden = candidate.dataset.sdViewPanel !== mode; });
            const host = panel.querySelector('[data-sd-3d]');
            syncViewers();
            syncHeight();
            if (mode !== '3d' || viewers.has(host)) return;
            if (host.dataset.loading === 'true') return;
            host.dataset.loading = 'true';
            try {
                const { mountViewer } = await loadViewer();
                viewers.set(host, mountViewer(host));
                syncViewers();
            } catch (error) {
                const loading = host.querySelector('.sd-3d-loading');
                if (loading) loading.textContent = '3D 화면을 열 수 없습니다. 그림으로 보기에서 같은 과정을 확인할 수 있습니다.';
                host.dataset.error = 'true';
                console.error('Stage Detail 3D could not initialize:', error);
            } finally {
                delete host.dataset.loading;
                syncHeight();
            }
        };

        root.addEventListener('click', (event) => {
            const button = event.target.closest('button');
            if (!button || !root.contains(button)) return;
            if (button.hasAttribute('data-sd-stage')) setStage(button.dataset.sdStage, { reveal: true });
            else if (button.hasAttribute('data-sd-go') && !button.disabled) setStage(button.dataset.sdGo, { focus: true, scroll: true });
            else if (button.hasAttribute('data-sd-zoom')) showDiagram(button);
            else if (button.hasAttribute('data-sd-close')) closeViewer();
            else if (button.hasAttribute('data-sd-view')) setView(button);
        });
        nav.addEventListener('keydown', (event) => {
            const tab = event.target.closest('[data-sd-stage]');
            if (!tab) return;
            const current = tabs.indexOf(tab);
            let next;
            if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
            else if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = tabs.length - 1;
            if (next === undefined) return;
            event.preventDefault();
            event.stopPropagation();
            setStage(tabs[next].dataset.sdStage, { focus: true });
        });
        root.querySelectorAll('.sd-detail-viewport').forEach((viewport) => viewport.addEventListener('keydown', (event) => {
            // Keep horizontal diagram scrolling inside the chapter's keyboard navigation.
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') event.stopPropagation();
        }));
        dialog.addEventListener('click', (event) => {
            if (event.target !== dialog) return;
            const rect = dialog.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeViewer();
        });
        dialog.addEventListener('close', () => {
            dialogImage.removeAttribute('src');
            dialogImage.style.removeProperty('--sd-image-limit');
            if (zoomTrigger?.isConnected && !zoomTrigger.closest('[hidden]')) zoomTrigger.focus({ preventScroll: true });
        });
        dialogImage.addEventListener('load', sizeDialogImage);
        root.querySelectorAll('img').forEach((image) => image.addEventListener('load', syncHeight));
        window.addEventListener('resize', () => { if (dialog.open) { positionDialog(); sizeDialogImage(); } syncHeight(); });
        window.addEventListener('hashchange', () => {
            const key = keyFromHash();
            if (tabs.some((tab) => tab.dataset.sdStage === key)) {
                window.GuidebookPageHandleTocActivation?.('stage-detail');
                setStage(key, { persist: false, reveal: true });
            }
        });
        document.addEventListener('visibilitychange', syncViewers);
        new MutationObserver(() => {
            if (root.hidden) closeViewer();
            syncViewers();
        }).observe(root, { attributes: true, attributeFilter: ['hidden'] });
        const initial = keyFromHash();
        if (tabs.some((tab) => tab.dataset.sdStage === initial)) {
            window.GuidebookPageHandleTocActivation?.('stage-detail');
            setStage(initial, { persist: false, announce: false });
        } else setStage(activeKey, { persist: false, announce: false });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
