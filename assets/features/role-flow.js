(() => {
    function initJobRoleFlowInteractive() {
        const root = document.getElementById('adt-role-flow');
        if (!root) return;

        const buttons = root.querySelectorAll('[data-role-flow-filter]');
        const items = root.querySelectorAll('[data-role-flow-item], [data-role-flow-target], [data-role-flow-support]');

        const setRole = (role) => {
            root.dataset.activeRole = role;
            root.classList.toggle('is-filtered', role !== 'all');

            buttons.forEach((button) => {
                button.classList.toggle('is-active', button.dataset.roleFlowFilter === role);
            });

            items.forEach((item) => {
                const rawTargets = item.dataset.jobs || item.dataset.roleFlowTarget || '';
                const jobs = rawTargets.split(/\s+/).filter(Boolean);
                const isMatch = role === 'all' ? true : jobs.includes(role);
                item.classList.toggle('is-match', isMatch);
            });
        };

        buttons.forEach((button) => {
            button.addEventListener('click', () => setRole(button.dataset.roleFlowFilter));
        });

        setRole(root.dataset.activeRole || 'all');
    }

    window.GuidebookPage.registerInitializer(() => {
        initJobRoleFlowInteractive();
    });
})();
