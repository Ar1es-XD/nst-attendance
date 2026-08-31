// ==UserScript==
// @name         Newton School Attendance 1-Click Sync
// @namespace    https://newt-att.vercel.app/
// @version      1.0.0
// @description  1-Click Live Attendance Sync directly from Newton School LMS
// @author       NST Attendance Team
// @match        https://my.newtonschool.co/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
  'use strict';

  const TRACKER_URL = window.location.origin.includes('localhost') ? 'http://localhost:5173' : 'https://newt-att.vercel.app';

  const isValidToken = (str) => {
    if (typeof str !== 'string') return false;
    const clean = str.replace(/^Bearer\s+/i, '').trim();
    if (clean.length < 20 || clean.length > 2000) return false;
    if (/^(true|false|null|undefined|http|\/|<!DOCTYPE|<html|\{|\[)/i.test(clean)) return false;
    return /^[A-Za-z0-9_\-.]+$/.test(clean);
  };

  const getToken = () => {
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
    return null;
  };

  // Add floating button to Newton School LMS page
  const btn = document.createElement('button');
  btn.innerHTML = '🎓 Open Attendance Planner';
  btn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999999;background:#bf2f1f;color:#fff;border:none;padding:12px 20px;border-radius:30px;font-family:sans-serif;font-weight:700;font-size:14px;box-shadow:0 8px 24px rgba(191,47,31,0.4);cursor:pointer;transition:transform 0.2s;';
  btn.onmouseover = () => { btn.style.transform = 'scale(1.05)'; };
  btn.onmouseout = () => { btn.style.transform = 'scale(1)'; };
  
  btn.onclick = () => {
    const token = getToken();
    if (token) {
      window.open(`${TRACKER_URL}/?token=${encodeURIComponent(token)}`, '_blank');
    } else {
      alert('Click on any course on this page first to refresh token, then click this button!');
    }
  };

  document.body.appendChild(btn);
})();
