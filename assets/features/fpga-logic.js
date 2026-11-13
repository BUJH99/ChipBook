(() => {
    function initFpgaLogicInteractive() {

        const root = document.getElementById('fpga-logic-lab');
        if (!root) return;

        const buttons = root.querySelectorAll('[data-fpga-mode]');
        const setMode = (mode) => {
            root.dataset.mode = mode;
            buttons.forEach((button) => {
                button.classList.toggle('is-active', button.dataset.fpgaMode === mode);
            });
        };

        buttons.forEach((button) => {
            button.addEventListener('click', () => setMode(button.dataset.fpgaMode));
        });

        setMode(root.dataset.mode || 'comb');
    }

    window.GuidebookPage.registerInitializer(() => {
        initFpgaLogicInteractive();
    });
})();
