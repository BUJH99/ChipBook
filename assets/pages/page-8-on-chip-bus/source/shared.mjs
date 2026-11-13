const syncPageHeight = () => {
  window.requestAnimationFrame(() => {
    window.GuidebookPage.notifyHeight();
  });
};

export { syncPageHeight };
export function getSelectedWaveType(selector, fallbackType) {
  return document.querySelector(`${selector}[class*="bg-white"]`)?.dataset.wave || fallbackType;
}
export function runAction(action) {
  Promise.resolve().then(action).catch(error => {
    if (error.name !== 'AbortError') console.error('Bus lab failed:', error);
  });
}
