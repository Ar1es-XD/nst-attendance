// Service worker for Newton School Attendance 1-Click Sync
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.type === 'NST_SAVE_TOKEN') {
    chrome.storage.local.set({ nst_token: req.token });
    sendResponse({ success: true });
    return false;
  }

  if (req.type === 'NST_FETCH_TOKEN') {
    chrome.storage.local.get(['nst_token'], (res) => {
      if (res && res.nst_token) {
        sendResponse({ token: res.nst_token });
      } else {
        // Query open Newton School tabs
        chrome.tabs.query({ url: '*://my.newtonschool.co/*' }, (tabs) => {
          if (tabs && tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'NST_GET_LMS_TOKEN' }, (resp) => {
              if (resp && resp.token) {
                chrome.storage.local.set({ nst_token: resp.token });
                sendResponse({ token: resp.token });
              } else {
                sendResponse({ token: null });
              }
            });
          } else {
            sendResponse({ token: null });
          }
        });
      }
    });
    return true; // Asynchronous sendResponse
  }
});
