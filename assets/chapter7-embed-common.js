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
