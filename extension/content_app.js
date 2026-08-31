// Content Script injected into the Attendance Web App
(() => {
  // Notify web page that extension is active
  window.postMessage({ type: 'NST_EXTENSION_READY' }, '*');

  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'NST_REQUEST_TOKEN') {
      try {
        chrome.runtime.sendMessage({ type: 'NST_FETCH_TOKEN' }, (response) => {
          if (response && response.token) {
            window.postMessage({ type: 'NST_TOKEN_FOUND', token: response.token }, '*');
          } else {
            window.postMessage({ type: 'NST_TOKEN_NOT_FOUND' }, '*');
          }
        });
      } catch(err) {
        console.warn("Extension message error:", err);
      }
    }
  });
})();
