import React, { useState, useEffect } from 'react';
import { 
  Key, 
  User, 
  BookOpen, 
  HelpCircle, 
  Moon, 
  Sun, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RotateCcw, 
  Sliders, 
  FolderPlus, 
  Trash2,
  ExternalLink,
  Info,
  LogOut,
  ArrowRight,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  Bookmark,
  Terminal,
  Search,
  GraduationCap
} from 'lucide-react';

const API_BASE = "";

export default function App() {
  // Check URL query parameter for ?token=... first, then localStorage
  const [token, setToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken && urlToken !== 'null' && urlToken !== 'undefined' && urlToken.trim() !== '') {
      const clean = urlToken.replace(/^Bearer\s+/i, '').trim();
      localStorage.setItem('newton_bearer_token', clean);
      window.history.replaceState({}, document.title, window.location.pathname);
      return clean;
    }
    const saved = localStorage.getItem('newton_bearer_token');
    if (saved && saved !== 'null' && saved !== 'undefined') {
      return saved;
    }
    return '';
  });

  const [inputToken, setInputToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  
  // Profile, Course, and Performance states
  const [profile, setProfile] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemesterHash, setSelectedSemesterHash] = useState('u4fvf1rm9v2e');
  const [semesterTitle, setSemesterTitle] = useState("Semester 3");
  const [subjectsData, setSubjectsData] = useState([]);
  const [overallPerf, setOverallPerf] = useState({ total_lectures: 0, total_lectures_attended: 0 });

  // Custom groups state
  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem('newton_attendance_groups');
    return saved ? JSON.parse(saved) : [];
  });
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSubjects, setNewGroupSubjects] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // Manual Adjustments/Overrides state
  const [adjustments, setAdjustments] = useState(() => {
    const saved = localStorage.getItem('newton_attendance_adjustments');
    return saved ? JSON.parse(saved) : {};
  });

  // Global settings
  const [theme, setTheme] = useState(() => localStorage.getItem('newton_theme') || 'dark');
  const [targetThreshold, setTargetThreshold] = useState(75);

  // Save adjustments to localStorage
  useEffect(() => {
    localStorage.setItem('newton_attendance_adjustments', JSON.stringify(adjustments));
  }, [adjustments]);

  // Save groups to localStorage
  useEffect(() => {
    localStorage.setItem('newton_attendance_groups', JSON.stringify(groups));
  }, [groups]);

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.remove('light-theme');
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
      root.classList.add('light-theme');
    }
    localStorage.setItem('newton_theme', theme);
  }, [theme]);

  // When active token exists, fetch live profile and attendance
  useEffect(() => {
    if (token && token !== 'null' && token !== 'undefined') {
      loadLiveDashboard(token, selectedSemesterHash);
    }
  }, [token]);

  const loadLiveDashboard = async (authToken, semHash) => {
    setLoading(true);
    setError('');
    const cleanToken = authToken.replace(/^Bearer\s+/i, '').trim();

    const headers = {
      'Authorization': `Bearer ${cleanToken}`,
      'Accept': 'application/json'
    };

    try {
      // 1. Fetch Profile
      const profRes = await fetch(`${API_BASE}/api/v1/user/me/`, { headers });
      if (!profRes.ok) {
        if (profRes.status === 401) {
          throw new Error('Authentication failed (401 Unauthorized). Your token may have expired. Please paste a fresh token.');
        }
        throw new Error(`Profile request failed: HTTP ${profRes.status}`);
      }
      const profData = await profRes.json();
      setProfile(profData);

      // 2. Fetch Applied Courses Hierarchy
      const appliedRes = await fetch(`${API_BASE}/api/v2/course/all/applied/?pagination=false&completed=false`, { headers });
      if (!appliedRes.ok) throw new Error('Failed to retrieve applied courses list.');
      const appliedData = await appliedRes.json();

      // Extract all semester admin units
      const extractedSemesters = [];
      let activeSemHash = semHash || 'u4fvf1rm9v2e';
      let foundActiveUnits = [];

      for (const entry of appliedData) {
        const adminUnits = entry.children_courses?.admin_unit_courses || [];
        for (const unit of adminUnits) {
          extractedSemesters.push({
            hash: unit.hash,
            title: unit.title || unit.short_display_name || unit.hash,
            shortName: unit.short_display_name,
            isActive: unit.is_active_admin_unit_course,
            learningUnits: unit.learning_unit_courses || []
          });

          if (unit.hash === activeSemHash) {
            setSemesterTitle(unit.title || unit.short_display_name);
            foundActiveUnits = unit.learning_unit_courses || [];
          }
        }
      }

      setSemesters(extractedSemesters);

      // 3. Fetch Overall Semester Performance
      const semPerfRes = await fetch(`${API_BASE}/api/v2/course/h/${activeSemHash}/self_performance/`, { headers });
      if (semPerfRes.ok) {
        const semPerf = await semPerfRes.json();
        setOverallPerf(semPerf);
      }

      // 4. Fetch Each Individual Subject's Performance
      const subjectsWithAttendance = await Promise.all(
        foundActiveUnits.map(async (unit, index) => {
          const subHash = unit.hash;
          try {
            const pRes = await fetch(`${API_BASE}/api/v2/course/h/${subHash}/self_performance/`, { headers });
            if (pRes.ok) {
              const pData = await pRes.json();
              return {
                id: unit.id || index,
                hash: subHash,
                name: unit.title || unit.short_display_name || `Subject ${index + 1}`,
                shortName: unit.short_display_name,
                rawAttended: pData.total_lectures_attended ?? 0,
                rawTotal: pData.total_lectures ?? 0
              };
            }
          } catch (e) {
            console.warn(`Failed to fetch performance for ${subHash}:`, e);
          }
          return {
            id: unit.id || index,
            hash: subHash,
            name: unit.title || unit.short_display_name || `Subject ${index + 1}`,
            shortName: unit.short_display_name,
            rawAttended: 0,
            rawTotal: 0
          };
        })
      );

      setSubjectsData(subjectsWithAttendance);

    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while communicating with the LMS API.');
    } finally {
      setLoading(false);
    }
  };

  const handleSemesterChange = (newSemHash) => {
    setSelectedSemesterHash(newSemHash);
    loadLiveDashboard(token, newSemHash);
  };

  const handleConnect = (e) => {
    if (e) e.preventDefault();
    const clean = inputToken.replace(/^Bearer\s+/i, '').trim();
    if (!clean || clean === 'null' || clean === 'undefined') {
      setError('Please paste a valid token.');
      return;
    }
    localStorage.setItem('newton_bearer_token', clean);
    setToken(clean);
  };

  const handleDisconnect = () => {
    localStorage.removeItem('newton_bearer_token');
    setToken('');
    setInputToken('');
    setProfile(null);
    setSemesters([]);
    setSubjectsData([]);
    setAdjustments({});
    setError('');
  };

  // Dynamic origin snippet so it works on any Vercel domain or localhost
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

  // Universal Extractor Snippet that works with Django DRF tokens, JWTs, and nested Redux/localStorage
  const universalSnippet = `(() => {
  const isCandidate = (str) => {
    if (typeof str !== 'string') return false;
    const s = str.trim().replace(/^Bearer\\s+/i, '');
    if (s.length < 20 || s.length > 500) return false;
    if (s.startsWith('http') || s.includes('<') || s.includes(' ') || s.includes('{')) return false;
    return /^[a-zA-Z0-9_.-]+$/.test(s);
  };

  let found = null;

  // 1. Direct keys
  const directKeys = ['authToken', 'token', 'auth_token', 'user_token', 'access_token', 'accessToken', 'key', 'auth'];
  for (const k of directKeys) {
    const val = localStorage.getItem(k);
    if (isCandidate(val)) { found = val.trim().replace(/^Bearer\\s+/i, ''); break; }
  }

  // 2. Search inside JSON objects in localStorage (Redux persist, etc.)
  if (!found) {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const raw = localStorage.getItem(k);
      if (isCandidate(raw)) { found = raw.trim().replace(/^Bearer\\s+/i, ''); break; }
      try {
        const obj = JSON.parse(raw);
        const queue = [obj];
        while (queue.length > 0) {
          const curr = queue.shift();
          if (curr && typeof curr === 'object') {
            for (const subKey of Object.keys(curr)) {
              const subVal = curr[subKey];
              if (isCandidate(subVal) && /token|auth|key/i.test(subKey)) {
                found = subVal.trim().replace(/^Bearer\\s+/i, '');
                break;
              }
              if (typeof subVal === 'object' && subVal !== null) {
                queue.push(subVal);
              } else if (typeof subVal === 'string' && (subVal.startsWith('{') || subVal.startsWith('['))) {
                try { queue.push(JSON.parse(subVal)); } catch (e) {}
              }
            }
          }
          if (found) break;
        }
      } catch (e) {}
      if (found) break;
    }
  }

  // 3. Search sessionStorage
  if (!found) {
    for (let i = 0; i < sessionStorage.length; i++) {
      const raw = sessionStorage.getItem(sessionStorage.key(i));
      if (isCandidate(raw)) { found = raw.trim().replace(/^Bearer\\s+/i, ''); break; }
    }
  }

  // 4. Search document.cookie
  if (!found) {
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const parts = c.trim().split('=');
      if (parts.length === 2 && isCandidate(parts[1]) && /token|auth/i.test(parts[0])) {
        found = parts[1].trim().replace(/^Bearer\\s+/i, '');
        break;
      }
    }
  }

  if (found) {
    console.log('%c[✓] Token found: ' + found, 'color: #10b981; font-weight: bold;');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(found);
      }
    } catch(e) {}
    window.open('${currentOrigin}/?token=' + encodeURIComponent(found));
  } else {
    alert('Could not find active token. Please ensure you are logged into my.newtonschool.co!');
  }
})();`;


  const copySnippet = () => {
    navigator.clipboard.writeText(universalSnippet.replace(/\n\s+/g, ' '));
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 3000);
  };

  const [copiedInterceptor, setCopiedInterceptor] = useState(false);
  const interceptorSnippet = `(() => {
  const saveAndOpen = (tok) => {
    if (!tok || tok.length < 15) return;
    const t = tok.replace(/^Bearer\\s+/i, '').trim();
    console.log('[SUCCESS] Token captured:', t);
    try { if (navigator.clipboard) navigator.clipboard.writeText(t); } catch(e) {}
    window.location.href = '${currentOrigin}/?token=' + encodeURIComponent(t);
  };

  const oldSetHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function(k, v) {
    if (k && k.toLowerCase() === 'authorization' && v) saveAndOpen(v);
    return oldSetHeader.apply(this, arguments);
  };

  const oldFetch = window.fetch;
  window.fetch = async function(...args) {
    const h = args[1] && args[1].headers;
    if (h) {
      const auth = typeof h.get === 'function' ? h.get('Authorization') : (h.Authorization || h.authorization);
      if (auth) saveAndOpen(auth);
    }
    return oldFetch.apply(this, args);
  };

  alert('Interceptor active! Now click My Timeline or any link on this page.');
})();`;

  const copyInterceptor = () => {
    navigator.clipboard.writeText(interceptorSnippet.replace(/\n\s+/g, ' '));
    setCopiedInterceptor(true);
    setTimeout(() => setCopiedInterceptor(false), 3000);
  };




  const bookmarkletCode = `javascript:(function(){const t=localStorage.getItem('authToken')||localStorage.getItem('token');if(!t){alert('Please log in to my.newtonschool.co first!');return;}window.open('${currentOrigin}/?token='+encodeURIComponent(t));})();`;

  // Math helper function for attendance calculations
  const calculateAttendanceStats = (attended, total, thresholdPercent) => {
    const threshold = thresholdPercent / 100;
    if (total === 0) return { percent: 0, status: 'safe', bunkable: 0, required: 0 };
    
    const percent = (attended / total) * 100;
    
    if (percent >= thresholdPercent) {
      const bunkable = Math.floor((attended - threshold * total) / threshold);
      return {
        percent,
        status: percent > thresholdPercent + 5 ? 'safe' : 'warning',
        bunkable: Math.max(0, bunkable),
        required: 0
      };
    } else {
      if (threshold === 1.0) {
        return {
          percent,
          status: 'danger',
          bunkable: 0,
          required: Infinity
        };
      }
      const required = Math.ceil((threshold * total - attended) / (1 - threshold));
      return {
        percent,
        status: 'danger',
        bunkable: 0,
        required: Math.max(0, required)
      };
    }
  };

  // Process subjects with adjustments applied
  const getProcessedSubjects = () => {
    return subjectsData.map((sub, index) => {
      const hash = sub.hash;
      const adj = adjustments[hash] || { adjAttended: 0, adjTotal: 0 };
      
      const attended = Math.max(0, sub.rawAttended + adj.adjAttended);
      const total = Math.max(0, sub.rawTotal + adj.adjTotal);
      
      const stats = calculateAttendanceStats(attended, total, targetThreshold);

      return {
        ...sub,
        attended,
        total,
        adjAttended: adj.adjAttended,
        adjTotal: adj.adjTotal,
        hasAdjustments: adj.adjAttended !== 0 || adj.adjTotal !== 0,
        ...stats
      };
    });
  };

  const processedSubjects = getProcessedSubjects();

  // Calculate overall summary metrics
  const getOverallStats = () => {
    if (processedSubjects.length === 0) {
      const att = overallPerf.total_lectures_attended ?? 0;
      const tot = overallPerf.total_lectures ?? 0;
      return { attended: att, total: tot, ...calculateAttendanceStats(att, tot, targetThreshold) };
    }
    
    let sumAttended = 0;
    let sumTotal = 0;
    
    processedSubjects.forEach(s => {
      sumAttended += s.attended;
      sumTotal += s.total;
    });
    
    const stats = calculateAttendanceStats(sumAttended, sumTotal, targetThreshold);
    return {
      attended: sumAttended,
      total: sumTotal,
      ...stats
    };
  };

  const overallStats = getOverallStats();

  // Manage adjustments (Simulation Mode)
  const adjustSubjectAttendance = (subjectHash, type, value) => {
    setAdjustments(prev => {
      const current = prev[subjectHash] || { adjAttended: 0, adjTotal: 0 };
      let newAtt = current.adjAttended;
      let newTot = current.adjTotal;

      if (type === 'attend') {
        newAtt += value;
        newTot += value;
      } else if (type === 'miss') {
        newTot += value;
      }

      const subject = subjectsData.find(c => c.hash === subjectHash) || { rawAttended: 0, rawTotal: 0 };
      const finalAttended = subject.rawAttended + newAtt;
      const finalTotal = subject.rawTotal + newTot;

      if (finalAttended < 0 || finalTotal < 0 || finalAttended > finalTotal) {
        return prev;
      }

      return {
        ...prev,
        [subjectHash]: { adjAttended: newAtt, adjTotal: newTot }
      };
    });
  };

  const resetAdjustment = (subjectHash) => {
    setAdjustments(prev => {
      const next = { ...prev };
      delete next[subjectHash];
      return next;
    });
  };

  const resetAllAdjustments = () => {
    setAdjustments({});
  };

  // Manage Custom Subject Groups
  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      alert('Please enter a group name');
      return;
    }
    if (newGroupSubjects.length === 0) {
      alert('Please select at least one subject for the group');
      return;
    }

    const newGroup = {
      id: Date.now().toString(),
      name: newGroupName,
      subjectHashes: newGroupSubjects,
      threshold: targetThreshold
    };

    setGroups(prev => [...prev, newGroup]);
    setNewGroupName('');
    setNewGroupSubjects([]);
    setShowCreateGroup(false);
  };

  const handleDeleteGroup = (groupId) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const handleUpdateGroupThreshold = (groupId, val) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, threshold: parseInt(val) } : g));
  };

  const toggleGroupSubject = (subjectHash) => {
    setNewGroupSubjects(prev => 
      prev.includes(subjectHash) 
        ? prev.filter(h => h !== subjectHash)
        : [...prev, subjectHash]
    );
  };

  const getGroupStats = (group) => {
    let groupAtt = 0;
    let groupTot = 0;
    
    group.subjectHashes.forEach(hash => {
      const sub = processedSubjects.find(s => s.hash === hash);
      if (sub) {
        groupAtt += sub.attended;
        groupTot += sub.total;
      }
    });

    const threshold = group.threshold || targetThreshold;
    const stats = calculateAttendanceStats(groupAtt, groupTot, threshold);

    return {
      attended: groupAtt,
      total: groupTot,
      threshold,
      ...stats
    };
  };

  const getStatusClass = (status) => {
    if (status === 'safe') return 'status-safe';
    if (status === 'warning') return 'status-warning';
    return 'status-danger';
  };

  const getPercentageColorClass = (status) => {
    if (status === 'safe') return 'percentage-safe';
    if (status === 'warning') return 'percentage-warning';
    return 'percentage-danger';
  };

  const getProgressColorClass = (status) => {
    if (status === 'safe') return 'progress-safe';
    if (status === 'warning') return 'progress-warning';
    return 'progress-danger';
  };

  const getCalcBannerClass = (status) => {
    if (status === 'safe') return 'calc-banner-safe';
    if (status === 'warning') return 'calc-banner-warning';
    return 'calc-banner-danger';
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo">N+</div>
          <div>
            <h1 className="brand-title">
              Newton School Attendance
              <span className="brand-badge" style={{ backgroundColor: token && profile ? 'var(--color-success-light)' : 'var(--bg-tertiary)', color: token && profile ? 'var(--color-success-dark)' : 'var(--text-secondary)' }}>
                {token && profile ? '● Live LMS Sync' : 'Ready'}
              </span>
            </h1>
            {profile && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {profile.first_name} {profile.last_name} ({profile.email || profile.username})
              </p>
            )}
          </div>
        </div>
        <div className="header-controls">
          {token && profile && (
            <button 
              className="btn btn-secondary" 
              onClick={() => loadLiveDashboard(token, selectedSemesterHash)}
              disabled={loading}
              title="Refresh attendance from LMS"
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          )}
          <button 
            className="theme-switch-btn" 
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            title="Toggle light/dark theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {token && profile && (
            <button 
              className="btn btn-secondary" 
              onClick={handleDisconnect} 
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}
            >
              <LogOut size={15} /> Logout
            </button>
          )}
        </div>
      </header>

      {/* If not authenticated with a valid token, show Token Connection Screen */}
      {!token || !profile ? (
        <div style={{ maxWidth: '680px', margin: '2rem auto' }}>
          
          {/* Universal 1-Click Auto-Scanner */}
          <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Zap size={22} color="var(--color-primary)" />
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>⚡ Universal 1-Click Auto-Connect</h2>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Paste this command into the DevTools Console on your Newton School LMS tab to automatically connect:
            </p>

            <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                <Terminal size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <code style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--color-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {universalSnippet.slice(0, 60)}...
                </code>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={copySnippet}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', gap: '0.4rem', flexShrink: 0 }}
              >
                {copiedSnippet ? <Check size={14} /> : <Copy size={14} />}
                {copiedSnippet ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            <ol style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <li>Open your <a href="https://my.newtonschool.co/course/u4fvf1rm9v2e/details" target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Newton School tab <ExternalLink size={11} style={{ display: 'inline' }} /></a>.</li>
              <li>Press <kbd style={{ background: 'var(--bg-primary)', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>F12</kbd> &rarr; <strong>Console</strong> tab.</li>
              <li>Paste the code and press <kbd style={{ background: 'var(--bg-primary)', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>Enter</kbd>.</li>
            </ol>
          </div>

          {/* Network Interceptor Alternative */}
          <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--color-success)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Zap size={22} color="var(--color-success)" />
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>⚡ Method 2: Live Click Interceptor (100% Guaranteed)</h2>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
              If storage is cleared, paste this interceptor in the console on Newton School. It hooks into outgoing requests and grabs your token the moment you click any button:
            </p>

            <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                <Terminal size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <code style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--color-success)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {interceptorSnippet.slice(0, 60)}...
                </code>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={copyInterceptor}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', gap: '0.4rem', flexShrink: 0, background: 'var(--color-success)' }}
              >
                {copiedInterceptor ? <Check size={14} /> : <Copy size={14} />}
                {copiedInterceptor ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            <ol style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <li>On Newton School tab console, paste this code and press <kbd style={{ background: 'var(--bg-primary)', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>Enter</kbd>.</li>
              <li>Click on any tab (e.g. <strong>My Timeline</strong>) or refresh the page.</li>
            </ol>
          </div>

          {/* Direct Manual Paste */}
          <div className="card">

            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              📝 Paste Token Directly
            </h3>
            
            <form onSubmit={handleConnect}>
              <div className="token-input-group">
                <textarea 
                  id="token-field"
                  className="token-input"
                  rows={2}
                  placeholder="Paste Bearer token here..."
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                />
              </div>

              {error && (
                <div style={{ color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid rgba(244,63,94,0.2)' }}>
                  <AlertTriangle size={15} style={{ display: 'inline', marginRight: '5px' }} />
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Connect Account'}
              </button>
            </form>
          </div>

        </div>
      ) : (
        /* Live LMS Dashboard */
        <>
          {/* Top Control Bar */}
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <GraduationCap size={20} color="var(--color-primary)" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Academic Unit:</span>
                
                {semesters.length > 0 ? (
                  <select 
                    className="form-input" 
                    style={{ margin: 0, width: 'auto', padding: '0.4rem 2rem 0.4rem 0.75rem', fontSize: '0.85rem', fontWeight: 600 }}
                    value={selectedSemesterHash}
                    onChange={(e) => handleSemesterChange(e.target.value)}
                  >
                    {semesters.map(s => (
                      <option key={s.hash} value={s.hash}>{s.title} {s.isActive ? ' (Current)' : ''}</option>
                    ))}
                  </select>
                ) : (
                  <code style={{ background: 'var(--bg-tertiary)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                    {semesterTitle} ({selectedSemesterHash})
                  </code>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '260px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Target Attendance:</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{targetThreshold}%</span>
                </div>
                <input 
                  type="range"
                  min="50"
                  max="100"
                  value={targetThreshold}
                  onChange={(e) => setTargetThreshold(parseInt(e.target.value))}
                  className="slider-input"
                  style={{ width: '120px' }}
                />
              </div>
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(244,63,94,0.2)' }}>
              <AlertTriangle size={16} style={{ display: 'inline', marginRight: '8px' }} />
              {error}
            </div>
          )}

          {/* Stats Summary Panel */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Overall Attendance</span>
              <span className="stat-value">{overallStats.percent.toFixed(1)}%</span>
              <span className={`stat-desc ${getPercentageColorClass(overallStats.status)}`} style={{ fontWeight: 600 }}>
                {overallStats.percent >= targetThreshold ? 'Above Target' : 'Below Target'}
              </span>
              <div className="stat-icon">📈</div>
            </div>

            <div className="stat-card">
              <span className="stat-label">Total Conducted</span>
              <span className="stat-value">{overallStats.total}</span>
              <span className="stat-desc">Classes across {processedSubjects.length} subjects</span>
              <div className="stat-icon">🏫</div>
            </div>

            <div className="stat-card">
              <span className="stat-label">Total Attended</span>
              <span className="stat-value">{overallStats.attended}</span>
              <span className="stat-desc">Classes present</span>
              <div className="stat-icon">✅</div>
            </div>

            <div className="stat-card">
              <span className="stat-label">Status & Action</span>
              {overallStats.percent >= targetThreshold ? (
                <>
                  <span className="stat-value" style={{ color: 'var(--color-success)' }}>
                    Bunk {overallStats.bunkable}
                  </span>
                  <span className="stat-desc">Safe while &ge; {targetThreshold}%</span>
                </>
              ) : (
                <>
                  <span className="stat-value" style={{ color: 'var(--color-danger)' }}>
                    Attend {overallStats.required}
                  </span>
                  <span className="stat-desc">Consecutive classes needed</span>
                </>
              )}
              <div className="stat-icon">🛡️</div>
            </div>
          </div>

          {/* Dashboard Two-Column Grid */}
          <div className="dashboard-grid">
            {/* Left: Subjects List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card-title-container" style={{ margin: 0 }}>
                <h2>Subject Breakdown ({processedSubjects.length} Courses)</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}
                    onClick={resetAllAdjustments}
                  >
                    <RotateCcw size={14} /> Reset Simulations
                  </button>
                </div>
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="card skeleton skeleton-card"></div>
                  <div className="card skeleton skeleton-card"></div>
                  <div className="card skeleton skeleton-card"></div>
                </div>
              ) : processedSubjects.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
                  <p>No active subjects found for this semester.</p>
                </div>
              ) : (
                <div className="subjects-grid">
                  {processedSubjects.map(subject => (
                    <div key={subject.hash} className={`card subject-card ${getStatusClass(subject.status)}`}>
                      <div className="subject-header">
                        <div>
                          <h3 className="subject-title">{subject.name}</h3>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Portal: {subject.rawAttended}/{subject.rawTotal}
                          </span>
                          {subject.hasAdjustments && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, marginLeft: '0.5rem' }}>
                              (Simulated: {subject.attended}/{subject.total})
                            </span>
                          )}
                        </div>
                        <div className="subject-stats-text">
                          <div className={`subject-percentage ${getPercentageColorClass(subject.status)}`}>
                            {subject.percent.toFixed(1)}%
                          </div>
                          <div>{subject.attended} / {subject.total} classes</div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="progress-container">
                        <div 
                          className={`progress-bar ${getProgressColorClass(subject.status)}`}
                          style={{ width: `${Math.min(100, subject.percent)}%` }}
                        ></div>
                        <div 
                          className="progress-threshold-line"
                          style={{ left: `${targetThreshold}%` }}
                          title={`Threshold ${targetThreshold}%`}
                        ></div>
                      </div>

                      {/* Calculations Banner */}
                      <div className={`calc-banner ${getCalcBannerClass(subject.status)}`}>
                        {subject.total === 0 ? (
                          <>
                            <Info size={16} />
                            <span>No classes conducted yet for this subject.</span>
                          </>
                        ) : subject.percent >= targetThreshold ? (
                          <>
                            <CheckCircle2 size={16} />
                            <span>
                              <strong>Safe!</strong> You can bunk <strong>{subject.bunkable}</strong> more classes while staying above {targetThreshold}%.
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={16} />
                            <span>
                              <strong>Attendance low!</strong> You must attend <strong>{subject.required}</strong> consecutive classes to reach {targetThreshold}%.
                            </span>
                          </>
                        )}
                      </div>

                      {/* Manual Override Controls */}
                      <div className="adjustments-panel">
                        <span className="adj-title">Simulation / What-if Planning</span>
                        <div className="adj-controls-grid">
                          <div className="adj-control-group">
                            <span className="adj-label">Simulate Attend (+1)</span>
                            <div className="adj-btn-container">
                              <button className="adj-btn" onClick={() => adjustSubjectAttendance(subject.hash, 'attend', -1)}>-</button>
                              <span className={`adj-value ${subject.adjAttended > 0 ? 'adj-value-simulated' : ''}`}>
                                {subject.adjAttended >= 0 ? `+${subject.adjAttended}` : subject.adjAttended}
                              </span>
                              <button className="adj-btn" onClick={() => adjustSubjectAttendance(subject.hash, 'attend', 1)}>+</button>
                            </div>
                          </div>

                          <div className="adj-control-group">
                            <span className="adj-label">Simulate Miss (+1)</span>
                            <div className="adj-btn-container">
                              <button className="adj-btn" onClick={() => adjustSubjectAttendance(subject.hash, 'miss', -1)}>-</button>
                              <span className={`adj-value ${subject.adjTotal - subject.adjAttended > 0 ? 'adj-value-simulated' : ''}`}>
                                +{subject.adjTotal - subject.adjAttended}
                              </span>
                              <button className="adj-btn" onClick={() => adjustSubjectAttendance(subject.hash, 'miss', 1)}>+</button>
                            </div>
                          </div>
                        </div>
                        {subject.hasAdjustments && (
                          <button className="reset-adj-btn" onClick={() => resetAdjustment(subject.hash)}>Reset simulations for this subject</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side: Saved Groups & Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Calculations Explainer Card */}
              <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '1rem' }}>
                  <Sliders size={18} color="var(--color-primary)" />
                  How Calculations Work
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                  <strong>Bunkable Formula:</strong>
                  <code style={{ display: 'block', backgroundColor: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px', margin: '0.3rem 0', fontFamily: 'monospace' }}>
                    Bunkable = &lfloor;(Attended - Target &times; Total) / Target&rfloor;
                  </code>
                </p>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong>Required Consecutive Formula:</strong>
                  <code style={{ display: 'block', backgroundColor: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px', margin: '0.3rem 0', fontFamily: 'monospace' }}>
                    Required = &lceil;(Target &times; Total - Attended) / (1 - Target)&rceil;
                  </code>
                </p>
              </div>

              {/* Subject Groups Manager */}
              <div className="card">
                <div className="card-title-container">
                  <h3>Subject Groups</h3>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', gap: '0.2rem', alignItems: 'center' }}
                    onClick={() => setShowCreateGroup(prev => !prev)}
                  >
                    <FolderPlus size={14} /> New Group
                  </button>
                </div>

                {/* Create Group Form */}
                {showCreateGroup && (
                  <form onSubmit={handleCreateGroup} className="card create-group-card" style={{ padding: '1rem', borderStyle: 'dashed' }}>
                    <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Create New Group</h4>
                    <input 
                      type="text" 
                      placeholder="Group Name (e.g. Core Programming)"
                      className="form-input"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Select Subjects:</span>
                    <div className="subject-selector-grid">
                      {processedSubjects.map(sub => (
                        <label key={sub.hash} className="subject-checkbox-label">
                          <input 
                            type="checkbox"
                            checked={newGroupSubjects.includes(sub.hash)}
                            onChange={() => toggleGroupSubject(sub.hash)}
                          />
                          {sub.name}
                        </label>
                      ))}
                    </div>
                    <div className="btn-group" style={{ margin: 0 }}>
                      <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem', fontSize: '0.8rem' }}>Create</button>
                      <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => setShowCreateGroup(false)}>Cancel</button>
                    </div>
                  </form>
                )}

                {/* Groups List */}
                <div className="groups-container">
                  {groups.length === 0 ? (
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                      No subject groups created yet. Groups let you aggregate and verify attendance across multiple related courses (e.g. Theory vs Practical).
                    </p>
                  ) : (
                    groups.map(group => {
                      const stats = getGroupStats(group);
                      return (
                        <div key={group.id} className={`card group-card ${getStatusClass(stats.status)}`} style={{ padding: '1rem' }}>
                          <div className="group-card-header">
                            <div>
                              <span className="group-name">{group.name}</span>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                {group.subjectHashes.length} subject(s) grouped
                              </div>
                            </div>
                            <button 
                              className="btn-icon-only" 
                              style={{ width: '28px', height: '28px', border: 'none', background: 'transparent' }}
                              onClick={() => handleDeleteGroup(group.id)}
                              title="Delete group"
                            >
                              <Trash2 size={14} color="var(--color-danger)" />
                            </button>
                          </div>

                          <div className="group-card-header" style={{ margin: '0.5rem 0' }}>
                            <span className={`subject-percentage ${getPercentageColorClass(stats.status)}`} style={{ fontSize: '1.1rem' }}>
                              {stats.percent.toFixed(1)}%
                            </span>
                            <span className="group-stats">{stats.attended} / {stats.total} classes</span>
                          </div>

                          {/* Group-specific target threshold slider */}
                          <div className="group-slider-container">
                            <div className="group-slider-header">
                              <span className="group-slider-label">Target:</span>
                              <span className="group-slider-value">{stats.threshold}%</span>
                            </div>
                            <input 
                              type="range"
                              min="50"
                              max="100"
                              value={stats.threshold}
                              onChange={(e) => handleUpdateGroupThreshold(group.id, e.target.value)}
                              className="slider-input"
                            />
                          </div>

                          {/* Group calculations indicator */}
                          <div className={`calc-banner ${getCalcBannerClass(stats.status)}`} style={{ margin: '0.75rem 0 0 0', padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
                            {stats.percent >= stats.threshold ? (
                              <>
                                <CheckCircle2 size={14} />
                                <span>Can bunk <strong>{stats.bunkable}</strong> classes</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle size={14} />
                                <span>Attend <strong>{stats.required}</strong> consecutive classes</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
