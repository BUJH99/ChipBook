(() => {
    function escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function highlightRtlSnippet(source) {
        const placeholders = [];
        const makeToken = () => `RTLTOKEN${'X'.repeat(placeholders.length + 1)}END`;
        const stashEscaped = (htmlSnippet) => {
            const token = makeToken();
            placeholders.push({ token, html: htmlSnippet });
            return token;
        };
        const stashRaw = (text, className) => stashEscaped(`<span class="${className}">${escapeHtml(text)}</span>`);

        let text = source.replace(/\r\n/g, '\n');
        text = text.replace(/\/\*[\s\S]*?\*\//g, (match) => stashRaw(match, 'tok-comment'));
        text = text.replace(/\/\/.*$/gm, (match) => stashRaw(match, 'tok-comment'));
        text = text.replace(/^#.*$/gm, (match) => stashRaw(match, 'tok-comment'));
        text = text.replace(/\(\*[\s\S]*?\*\)/g, (match) => stashRaw(match, 'tok-attr'));
        text = text.replace(/"[^"\n]*"/g, (match) => stashRaw(match, 'tok-string'));

        let html = escapeHtml(text);

        html = html.replace(/\b(always|assign|if|else|wire|reg|logic|begin|end|case|endcase|posedge|negedge|set_false_path|create_pblock|add_cells_to_pblock|get_cells|get_pblocks|set_property)\b/g, (match) => stashEscaped(`<span class="tok-keyword">${match}</span>`));
        html = html.replace(/\b(Tool|hint)\b/g, (match) => stashEscaped(`<span class="tok-comment">${match}</span>`));
        html = html.replace(/\b(\d+)\b/g, (match) => stashEscaped(`<span class="tok-number">${match}</span>`));
        html = html.replace(/(&lt;=|&gt;&gt;|&amp;|\\|\||\+|\*|\?|:|=|@)/g, (match) => stashEscaped(`<span class="tok-operator">${match}</span>`));
        html = html.replace(/\b(clk|addr|din|dout|we|sum|gray|q|p|reg_out|data_out|global_en|sync1|sync2|fast_path_a|fast_path_b|late_sig|pipe_reg|shift_reg|ram|a|b|c)\b/g, (match) => stashEscaped(`<span class="tok-signal">${match}</span>`));

        placeholders.forEach(({ token, html: replacement }) => {
            html = html.replace(token, replacement);
        });

        return html;
    }

    function applyRtlCodeHighlighting() {
        document.querySelectorAll('.rtl-tech-code code').forEach((block) => {
            if (block.dataset.highlighted === 'true') return;
            block.innerHTML = highlightRtlSnippet(block.textContent || '');
            block.dataset.highlighted = 'true';
        });
    }


    window.GuidebookPage.registerInitializer(() => {
        applyRtlCodeHighlighting();
    });
})();
