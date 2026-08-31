// Content Script injected into https://my.newtonschool.co/*
(() => {
  const isValidToken = (str) => {
    if (typeof str !== 'string') return false;
    const clean = str.replace(/^Bearer\s+/i, '').trim();
    if (clean.length < 20 || clean.length > 2000) return false;
    if (/^(true|false|null|undefined|http|\/|<!DOCTYPE|<html|\{|\[)/i.test(clean)) return false;
    return /^[A-Za-z0-9_\-.]+$/.test(clean);
  };

  const scanStorage = () => {
    try {
      const priorityKeys = ['token', 'auth_token', 'access_token', 'authtoken', 'user_token', 'jwt', 'authorization', 'key', 'session_token'];
      for (const pk of priorityKeys) {
        const val = localStorage.getItem(pk) || sessionStorage.getItem(pk);
        if (isValidToken(val)) return val.replace(/^Bearer\s+/i, '').trim();
      }
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const val = localStorage.getItem(k);
        if (isValidToken(val)) return val.replace(/^Bearer\s+/i, '').trim();
      }
    } catch {}
    return null;
  };

  const saveToken = (tok) => {
    if (!isValidToken(tok)) return;
    const clean = tok.replace(/^Bearer\s+/i, '').trim();
    try {
      chrome.runtime.sendMessage({ type: 'NST_SAVE_TOKEN', token: clean });
    } catch {}
  };

  // 1. Initial Storage Scan
  const initial = scanStorage();
  if (initial) saveToken(initial);

  // 2. Intercept XMLHttpRequest headers
  const oldSetHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function(k, v) {
    if (k && k.toLowerCase() === 'authorization' && v) saveToken(v);
    return oldSetHeader.apply(this, arguments);
  };

  // 3. Intercept Fetch API headers
  const oldFetch = window.fetch;
  window.fetch = async function(...args) {
    const h = args[1] && args[1].headers;
    if (h) {
      const auth = typeof h.get === 'function' ? h.get('Authorization') : (h.Authorization || h.authorization);
      if (auth) saveToken(auth);
    }
    return oldFetch.apply(this, args);
  };

  // 4. Background Query Listener
  try {
    chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
      if (req && req.type === 'NST_GET_LMS_TOKEN') {
        const token = scanStorage();
        sendResponse({ token });
      }
    });
  } catch {}
})();
