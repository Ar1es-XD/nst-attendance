import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Zap, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  FolderPlus, 
  Trash2, 
  ExternalLink, 
  Info, 
  LogOut, 
  ShieldCheck, 
  Moon, 
  Sun, 
  RefreshCw, 
  GraduationCap, 
  Search, 
  Sparkles, 
  Layers, 
  Activity, 
  Calculator, 
  Plus, 
  Minus, 
  Code2, 
  Play,
  Flame
} from 'lucide-react';

const API_BASE = "";

// Sample realistic demo data matching Newton School CS curriculum
const DEMO_SEMESTERS = [
  {
    hash: 'demo-sem-3',
    title: 'Semester 3 (Computer Science)',
    shortName: 'Sem 3',
    isActive: true,
    learningUnits: [
      { id: 1, hash: 'sub-dsa-301', title: 'Data Structures & Algorithms', short_display_name: 'DSA' },
      { id: 2, hash: 'sub-os-302', title: 'Operating Systems & Linux Internals', short_display_name: 'OS' },
      { id: 3, hash: 'sub-fs-303', title: 'Full Stack Web Development', short_display_name: 'WebDev' },
      { id: 4, hash: 'sub-dbms-304', title: 'Database Management Systems', short_display_name: 'DBMS' },
      { id: 5, hash: 'sub-cn-305', title: 'Computer Networks & Security', short_display_name: 'CN' },
      { id: 6, hash: 'sub-ml-306', title: 'Machine Learning Foundations', short_display_name: 'ML' }
    ]
  },
  {
    hash: 'demo-sem-2',
    title: 'Semester 2 (Foundation Year)',
    shortName: 'Sem 2',
    isActive: false,
    learningUnits: [
      { id: 101, hash: 'sub-oops-201', title: 'Object Oriented Programming in Java', short_display_name: 'Java' },
      { id: 102, hash: 'sub-discrete-202', title: 'Discrete Mathematics', short_display_name: 'Math' }
    ]
  }
];

const DEMO_PERFORMANCES = {
  'demo-sem-3': { total_lectures: 202, total_lectures_attended: 159 },
  'sub-dsa-301': { total_lectures: 38, total_lectures_attended: 34 },
  'sub-os-302': { total_lectures: 34, total_lectures_attended: 26 },
  'sub-fs-303': { total_lectures: 44, total_lectures_attended: 40 },
  'sub-dbms-304': { total_lectures: 28, total_lectures_attended: 18 },
  'sub-cn-305': { total_lectures: 28, total_lectures_attended: 22 },
  'sub-ml-306': { total_lectures: 30, total_lectures_attended: 19 },
  'demo-sem-2': { total_lectures: 80, total_lectures_attended: 68 },
  'sub-oops-201': { total_lectures: 40, total_lectures_attended: 36 },
  'sub-discrete-202': { total_lectures: 40, total_lectures_attended: 32 }
};

const DEMO_PROFILE = {
  first_name: 'Alex',
  last_name: 'Rivera',
  email: 'alex.rivera@newtonschool.co',
  username: 'alex_r302'
};

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

  const [isDemoMode, setIsDemoMode] = useState(false);
  const [inputToken, setInputToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedInterceptor, setCopiedInterceptor] = useState(false);
  
  // Profile, Course, and Performance states
  const [profile, setProfile] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemesterHash, setSelectedSemesterHash] = useState('u4fvf1rm9v2e');
  const [semesterTitle, setSemesterTitle] = useState("Semester 3");
  const [subjectsData, setSubjectsData] = useState([]);
  const [overallPerf, setOverallPerf] = useState({ total_lectures: 0, total_lectures_attended: 0 });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'safe' | 'warning' | 'danger' | 'simulated'

  // Custom groups state
  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem('newton_attendance_groups');
    return saved ? JSON.parse(saved) : [
      { id: 'group-theory', name: 'Core CS Theory', subjectHashes: ['sub-dsa-301', 'sub-os-302', 'sub-dbms-304'], threshold: 75 },
      { id: 'group-labs', name: 'Web & Systems Lab', subjectHashes: ['sub-fs-303', 'sub-cn-305'], threshold: 80 }
    ];
  });
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSubjects, setNewGroupSubjects] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // Manual Adjustments/Overrides state (Simulation Mode)
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

  // Load Demo Mode data
  const enableDemoMode = () => {
    setIsDemoMode(true);
    setProfile(DEMO_PROFILE);
    setSemesters(DEMO_SEMESTERS);
    setSelectedSemesterHash('demo-sem-3');
    setSemesterTitle('Semester 3 (Computer Science)');
    setOverallPerf(DEMO_PERFORMANCES['demo-sem-3']);
    
    const demoSubjects = DEMO_SEMESTERS[0].learningUnits.map(unit => {
      const perf = DEMO_PERFORMANCES[unit.hash] || { total_lectures: 0, total_lectures_attended: 0 };
      return {
        id: unit.id,
        hash: unit.hash,
        name: unit.title,
        shortName: unit.short_display_name,
        rawAttended: perf.total_lectures_attended,
        rawTotal: perf.total_lectures
      };
    });
    setSubjectsData(demoSubjects);
    setError('');
  };

  const loadLiveDashboard = useCallback(async (authToken, semHash) => {
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
          throw new Error('Authentication failed (401 Unauthorized). Your token may have expired. Please paste a fresh token or use the 1-Click Console Scanner.');
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

      if (extractedSemesters.length > 0 && foundActiveUnits.length === 0) {
        // Fallback to first semester if hash not matched
        activeSemHash = extractedSemesters[0].hash;
        setSemesterTitle(extractedSemesters[0].title);
        foundActiveUnits = extractedSemesters[0].learningUnits || [];
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
  }, []);

  // When active token exists, fetch live profile and attendance
  useEffect(() => {
    if (token && token !== 'null' && token !== 'undefined') {
      setIsDemoMode(false);
      loadLiveDashboard(token, selectedSemesterHash);
    }
  }, [token, loadLiveDashboard, selectedSemesterHash]);

  const handleSemesterChange = (newSemHash) => {
    setSelectedSemesterHash(newSemHash);
    if (isDemoMode) {
      const selected = DEMO_SEMESTERS.find(s => s.hash === newSemHash);
      if (selected) {
        setSemesterTitle(selected.title);
        setOverallPerf(DEMO_PERFORMANCES[newSemHash] || { total_lectures: 0, total_lectures_attended: 0 });
        const demoSubs = selected.learningUnits.map(unit => {
          const perf = DEMO_PERFORMANCES[unit.hash] || { total_lectures: 0, total_lectures_attended: 0 };
          return {
            id: unit.id,
            hash: unit.hash,
            name: unit.title,
            shortName: unit.short_display_name,
            rawAttended: perf.total_lectures_attended,
            rawTotal: perf.total_lectures
          };
        });
        setSubjectsData(demoSubs);
      }
    } else {
      loadLiveDashboard(token, newSemHash);
    }
  };

  const handleConnect = (e) => {
    if (e) e.preventDefault();
    const clean = inputToken.replace(/^Bearer\s+/i, '').trim();
    if (!clean || clean === 'null' || clean === 'undefined') {
      setError('Please paste a valid Bearer token.');
      return;
    }
    localStorage.setItem('newton_bearer_token', clean);
    setToken(clean);
  };

  const handleDisconnect = () => {
    localStorage.removeItem('newton_bearer_token');
    setToken('');
    setInputToken('');
    setIsDemoMode(false);
    setProfile(null);
    setSemesters([]);
    setSubjectsData([]);
    setAdjustments({});
    setError('');
  };

  // Dynamic origin snippet for easy extraction
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

  // Universal Extractor Snippet for DevTools
  const universalSnippet = `(() => {
  const isCandidate = (str) => {
    if (typeof str !== 'string') return false;
    const s = str.trim().replace(/^Bearer\\s+/i, '');
    if (s.length < 20 || s.length > 500) return false;
    if (s.startsWith('http') || s.includes('<') || s.includes(' ') || s.includes('{')) return false;
    return /^[a-zA-Z0-9_.-]+$/.test(s);
  };

  let found = null;
  const directKeys = ['authToken', 'token', 'auth_token', 'user_token', 'access_token', 'accessToken', 'key', 'auth'];
  for (const k of directKeys) {
    const val = localStorage.getItem(k);
    if (isCandidate(val)) { found = val.trim().replace(/^Bearer\\s+/i, ''); break; }
  }

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
              if (typeof subVal === 'object' && subVal !== null) queue.push(subVal);
            }
          }
          if (found) break;
        }
      } catch (e) {}
      if (found) break;
    }
  }

  if (found) {
    console.log('%c[✓] Token found: ' + found, 'color: #00F5A0; font-weight: bold;');
    try { if (navigator.clipboard) navigator.clipboard.writeText(found); } catch(e) {}
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

  // Math helper function for attendance calculations
  const calculateAttendanceStats = (attended, total, thresholdPercent) => {
    const threshold = thresholdPercent / 100;
    if (total === 0) return { percent: 0, status: 'safe', bunkable: 0, required: 0 };
    
    const percent = (attended / total) * 100;
    
    if (percent >= thresholdPercent) {
      const bunkable = Math.floor((attended - threshold * total) / threshold);
      return {
        percent,
        status: percent >= thresholdPercent + 5 ? 'safe' : 'warning',
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
  const processedSubjects = useMemo(() => {
    return subjectsData.map(sub => {
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
  }, [subjectsData, adjustments, targetThreshold]);

  // Filtered subjects based on search query & status filter
  const filteredSubjects = useMemo(() => {
    return processedSubjects.filter(sub => {
      const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (sub.shortName && sub.shortName.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'safe') return sub.status === 'safe';
      if (statusFilter === 'warning') return sub.status === 'warning';
      if (statusFilter === 'danger') return sub.status === 'danger';
      if (statusFilter === 'simulated') return sub.hasAdjustments;
      return true;
    });
  }, [processedSubjects, searchQuery, statusFilter]);

  // Overall aggregate summary metrics
  const overallStats = useMemo(() => {
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
  }, [processedSubjects, overallPerf, targetThreshold]);

  // Health summary metrics
  const healthStats = useMemo(() => {
    const total = processedSubjects.length;
    const safeCount = processedSubjects.filter(s => s.status === 'safe' || s.status === 'warning').length;
    const dangerCount = processedSubjects.filter(s => s.status === 'danger').length;
    const totalSimulations = Object.values(adjustments).reduce((acc, curr) => acc + Math.abs(curr.adjAttended || 0) + Math.abs(curr.adjTotal || 0), 0);

    return { total, safeCount, dangerCount, totalSimulations };
  }, [processedSubjects, adjustments]);

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

  // Batch Simulators (e.g. simulate missing 1 full day across all subjects)
  const applyBatchSimulation = (type, amount = 1) => {
    setAdjustments(prev => {
      const next = { ...prev };
      processedSubjects.forEach(sub => {
        const current = next[sub.hash] || { adjAttended: 0, adjTotal: 0 };
        let newAtt = current.adjAttended;
        let newTot = current.adjTotal;

        if (type === 'attend_all') {
          newAtt += amount;
          newTot += amount;
        } else if (type === 'miss_all') {
          newTot += amount;
        }

        const original = subjectsData.find(c => c.hash === sub.hash) || { rawAttended: 0, rawTotal: 0 };
        if (original.rawAttended + newAtt >= 0 && original.rawTotal + newTot >= 0) {
          next[sub.hash] = { adjAttended: newAtt, adjTotal: newTot };
        }
      });
      return next;
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

  // Custom Groups Management
  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      alert('Please enter a group title');
      return;
    }
    if (newGroupSubjects.length === 0) {
      alert('Please select at least one subject for the group');
      return;
    }

    const newGroup = {
      id: `group-${Date.now()}`,
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

  const isAuthenticated = Boolean((token && profile) || isDemoMode);

  return (
    <div className="app-container">
      {/* Top Glassmorphic Navigation Bar */}
      <nav className="algora-nav">
        <div className="brand-wrapper">
          <div className="brand-badge-logo">
            <span className="logo-inner">N+</span>
          </div>
          <div className="brand-meta">
            <div className="brand-heading-row">
              <span className="brand-name">Newton School Attendance</span>
              {isAuthenticated && (
                <span className={`status-pill ${isDemoMode ? 'demo' : 'live'}`}>
                  <span className="pulse-dot"></span>
                  {isDemoMode ? 'Demo Sandbox' : 'Live LMS Sync'}
                </span>
              )}
            </div>
            {profile && (
              <span className="user-identity">
                {profile.first_name} {profile.last_name} · <span className="mono">@{profile.username || profile.email?.split('@')[0]}</span>
              </span>
            )}
          </div>
        </div>

        <div className="nav-actions">
          {isAuthenticated && (
            <button 
              className="btn-algora btn-algora-secondary" 
              onClick={() => isDemoMode ? enableDemoMode() : loadLiveDashboard(token, selectedSemesterHash)}
              disabled={loading}
              title="Sync latest attendance from LMS"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          )}

          <button 
            className="btn-icon-square" 
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            title="Toggle theme (Dark / Light)"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {isAuthenticated && (
            <button 
              className="btn-algora btn-algora-danger" 
              onClick={handleDisconnect}
              title="Disconnect session"
            >
              <LogOut size={14} />
              <span>Exit</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main View: Connect Gateway vs Authenticated Command Center */}
      {!isAuthenticated ? (
        /* ==========================================================================
           CONNECT GATEWAY (Algora Developer Aesthetic)
           ========================================================================== */
        <div>
          <div className="connect-hero">
            <div className="connect-hero-tag">
              <Sparkles size={14} />
              <span>ATTENDANCE INTELLIGENCE FOR NEWTON SCHOOL</span>
            </div>
            <h1 className="connect-hero-title">
              Bunk with <span className="gradient-text">mathematical certainty</span>.
            </h1>
            <p className="connect-hero-desc">
              Real-time LMS synchronization, instant bunk capacity calculations, and a high-precision what-if simulator to keep your academic record secure.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn-algora btn-algora-primary" onClick={copySnippet} style={{ padding: '0.7rem 1.4rem', fontSize: '0.92rem' }}>
                <Zap size={16} />
                <span>{copiedSnippet ? 'Copied Console Command!' : 'Copy 1-Click Auto Extractor'}</span>
              </button>
              <button className="btn-algora btn-algora-secondary" onClick={enableDemoMode} style={{ padding: '0.7rem 1.4rem', fontSize: '0.92rem' }}>
                <Play size={16} />
                <span>Explore Live Demo Sandbox</span>
              </button>
            </div>
          </div>

          <div className="connect-methods-grid">
            {/* Bento Card 1: 1-Click DevTools Extractor */}
            <div className="bento-card glow-mint">
              <div className="bento-card-header">
                <div className="bento-title-group">
                  <span className="eyebrow mint">01 // RECOMMENDED METHOD</span>
                  <h3 className="bento-title">⚡ 1-Click Console Scanner</h3>
                </div>
                <div className="status-pill live">Instant Sync</div>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Run this automated script inside your browser's DevTools console on the Newton School LMS tab. It extracts your active session and redirects here securely:
              </p>

              <div className="terminal-card">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <span></span><span></span><span></span>
                  </div>
                  <span className="terminal-title">bash / devtools_console.js</span>
                  <button 
                    className="btn-algora btn-algora-primary" 
                    onClick={copySnippet}
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                  >
                    {copiedSnippet ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedSnippet ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="terminal-body">
                  {universalSnippet.slice(0, 110)}... [click copy to grab full code]
                </div>
              </div>

              <ul className="step-instruction-list">
                <li className="step-item">
                  <span className="step-badge">1</span>
                  <span>Open your <a href="https://my.newtonschool.co/course/u4fvf1rm9v2e/details" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-mint)', textDecoration: 'underline' }}>Newton School LMS tab <ExternalLink size={11} style={{ display: 'inline' }} /></a></span>
                </li>
                <li className="step-item">
                  <span className="step-badge">2</span>
                  <span>Press <kbd>F12</kbd> (or <kbd>Cmd</kbd> + <kbd>Option</kbd> + <kbd>I</kbd>) &rarr; <strong>Console</strong></span>
                </li>
                <li className="step-item">
                  <span className="step-badge">3</span>
                  <span>Paste code and press <kbd>Enter</kbd></span>
                </li>
              </ul>
            </div>

            {/* Bento Card 2: Manual Direct Token Input */}
            <div className="bento-card">
              <div className="bento-card-header">
                <div className="bento-title-group">
                  <span className="eyebrow cyan">02 // MANUAL ACCESS</span>
                  <h3 className="bento-title">🔑 Direct Bearer Token</h3>
                </div>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                If you already have your bearer authentication token from request headers or curl, paste it directly:
              </p>

              <form onSubmit={handleConnect}>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="eyebrow" style={{ display: 'block', marginBottom: '0.4rem' }}>
                    Bearer Token / JWT:
                  </label>
                  <textarea 
                    rows={3}
                    className="algora-select mono"
                    style={{ width: '100%', resize: 'none', fontSize: '0.8rem', padding: '0.75rem' }}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value)}
                  />
                </div>

                {error && (
                  <div style={{ color: 'var(--accent-crimson)', background: 'var(--accent-crimson-subtle)', border: '1px solid rgba(255,71,87,0.2)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <AlertTriangle size={15} />
                    <span>{error}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn-algora btn-algora-primary" style={{ flex: 1 }} disabled={loading}>
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    <span>Authenticate Session</span>
                  </button>
                  <button type="button" className="btn-algora btn-algora-secondary" onClick={enableDemoMode} title="Try without credentials">
                    Demo Mode
                  </button>
                </div>
              </form>

              {/* Network Interceptor Hook Secondary Section */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="eyebrow purple">03 // NETWORK INTERCEPTOR</span>
                  <button className="btn-algora btn-algora-secondary" onClick={copyInterceptor} style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}>
                    {copiedInterceptor ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedInterceptor ? 'Copied' : 'Copy Interceptor'}</span>
                  </button>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Hooks into active XMLHttpRequest/fetch on LMS and captures token on any button click.
                </p>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={14} color="var(--accent-mint)" />
            <span>Zero-Trust Architecture: Your bearer tokens remain strictly stored in local browser memory and never touch remote proxy servers.</span>
          </div>
        </div>
      ) : (
        /* ==========================================================================
           LIVE LMS COMMAND CENTER (Algora Developer Aesthetic)
           ========================================================================== */
        <div>
          {/* Top Intelligence Toolbar */}
          <div className="intelligence-bar">
            <div className="control-cluster">
              <div className="unit-select-wrapper">
                <GraduationCap size={18} color="var(--accent-mint)" />
                <span className="eyebrow" style={{ marginRight: '0.2rem' }}>Unit:</span>
                {semesters.length > 0 ? (
                  <select 
                    className="algora-select"
                    value={selectedSemesterHash}
                    onChange={(e) => handleSemesterChange(e.target.value)}
                  >
                    {semesters.map(s => (
                      <option key={s.hash} value={s.hash}>
                        {s.title} {s.isActive ? '· [Current]' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    {semesterTitle} ({selectedSemesterHash})
                  </span>
                )}
              </div>
            </div>

            <div className="control-cluster">
              <div className="target-slider-panel">
                <span className="eyebrow">Target:</span>
                <input 
                  type="range"
                  min="50"
                  max="100"
                  value={targetThreshold}
                  onChange={(e) => setTargetThreshold(parseInt(e.target.value))}
                  className="algora-range-input"
                />
                <span className="slider-value-badge">{targetThreshold}%</span>
              </div>

              <div className="preset-pills-row">
                {[75, 80, 85, 90].map(val => (
                  <button 
                    key={val}
                    className={`preset-pill-btn ${targetThreshold === val ? 'active' : ''}`}
                    onClick={() => setTargetThreshold(val)}
                  >
                    {val}%
                  </button>
                ))}
              </div>

              {healthStats.totalSimulations > 0 && (
                <button 
                  className="btn-algora btn-algora-secondary" 
                  onClick={resetAllAdjustments}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                >
                  <RotateCcw size={13} />
                  <span>Reset Simulations ({healthStats.totalSimulations})</span>
                </button>
              )}
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--accent-crimson)', background: 'var(--accent-crimson-subtle)', border: '1px solid rgba(255,71,87,0.25)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', fontSize: '0.86rem', marginBottom: '1.5rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Bento Stats Hero Metrics */}
          <div className="stats-bento-grid">
            {/* Metric 1: Overall Percentage */}
            <div className={`bento-card metric-card ${overallStats.status === 'safe' ? 'glow-mint' : overallStats.status === 'danger' ? 'glow-crimson' : ''}`}>
              <div className="metric-top">
                <span className="eyebrow">AGGREGATE RATE</span>
                <div className={`metric-icon-bubble ${overallStats.status === 'safe' ? '' : overallStats.status === 'warning' ? 'amber' : 'crimson'}`}>
                  <Activity size={16} />
                </div>
              </div>
              <div className="metric-value-row">
                <span className="metric-huge-number">{overallStats.percent.toFixed(1)}%</span>
                <span className={`metric-delta-tag ${overallStats.percent >= targetThreshold ? 'safe' : 'danger'}`}>
                  {overallStats.percent >= targetThreshold 
                    ? `+${(overallStats.percent - targetThreshold).toFixed(1)}%`
                    : `-${(targetThreshold - overallStats.percent).toFixed(1)}%`
                  }
                </span>
              </div>
              <span className="metric-subtext">
                {overallStats.percent >= targetThreshold 
                  ? `Safely above minimum target of ${targetThreshold}%`
                  : `Currently below mandated ${targetThreshold}% threshold`
                }
              </span>
            </div>

            {/* Metric 2: Net Action Verdict */}
            <div className={`bento-card metric-card ${overallStats.percent >= targetThreshold ? 'glow-mint' : 'glow-crimson'}`}>
              <div className="metric-top">
                <span className="eyebrow">NET VERDICT</span>
                <div className={`metric-icon-bubble ${overallStats.percent >= targetThreshold ? '' : 'crimson'}`}>
                  {overallStats.percent >= targetThreshold ? <Flame size={16} /> : <AlertTriangle size={16} />}
                </div>
              </div>
              <div className="metric-value-row">
                <span className="metric-huge-number" style={{ color: overallStats.percent >= targetThreshold ? 'var(--accent-mint)' : 'var(--accent-crimson)' }}>
                  {overallStats.percent >= targetThreshold 
                    ? `Bunk ${overallStats.bunkable}` 
                    : `Attend ${overallStats.required}`
                  }
                </span>
              </div>
              <span className="metric-subtext">
                {overallStats.percent >= targetThreshold 
                  ? `Lectures can be safely skipped while staying ≥ ${targetThreshold}%`
                  : `Consecutive classes required to recover target`
                }
              </span>
            </div>

            {/* Metric 3: Total Conducted vs Attended */}
            <div className="bento-card metric-card">
              <div className="metric-top">
                <span className="eyebrow">TOTAL RATIO</span>
                <div className="metric-icon-bubble cyan">
                  <Calculator size={16} />
                </div>
              </div>
              <div className="metric-value-row">
                <span className="metric-huge-number mono">{overallStats.attended} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {overallStats.total}</span></span>
              </div>
              <span className="metric-subtext">
                Total lectures attended across all enrolled subjects
              </span>
            </div>

            {/* Metric 4: Health Breakdown */}
            <div className="bento-card metric-card">
              <div className="metric-top">
                <span className="eyebrow">COURSE HEALTH</span>
                <div className="metric-icon-bubble amber">
                  <Layers size={16} />
                </div>
              </div>
              <div className="metric-value-row">
                <span className="metric-huge-number mono">{healthStats.safeCount} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {healthStats.total}</span></span>
                <span className="metric-delta-tag safe">Safe</span>
              </div>
              <span className="metric-subtext">
                {healthStats.dangerCount === 0 
                  ? 'All courses currently in good standing' 
                  : `${healthStats.dangerCount} course(s) require immediate attendance boost`
                }
              </span>
            </div>
          </div>

          {/* Quick Batch Simulator Drawer / Banner */}
          <div className="batch-sim-banner">
            <div className="batch-sim-info">
              <Sparkles size={20} color="var(--accent-mint)" />
              <div>
                <span className="eyebrow mint" style={{ display: 'block', marginBottom: '0.1rem' }}>WHAT-IF ENGINE // BATCH PROJECTIONS</span>
                <span style={{ fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Simulate universal timetable schedule scenarios across all courses:
                </span>
              </div>
            </div>

            <div className="batch-sim-actions">
              <button className="btn-algora btn-algora-secondary" onClick={() => applyBatchSimulation('attend_all', 1)} style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}>
                <Plus size={13} color="var(--accent-mint)" />
                <span>+1 All (Day Present)</span>
              </button>
              <button className="btn-algora btn-algora-secondary" onClick={() => applyBatchSimulation('miss_all', 1)} style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}>
                <Minus size={13} color="var(--accent-crimson)" />
                <span>+1 Miss All (Bunk Day)</span>
              </button>
              <button className="btn-algora btn-algora-secondary" onClick={() => applyBatchSimulation('attend_all', 3)} style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}>
                <span>+3 Full Week Present</span>
              </button>
              <button className="btn-algora btn-algora-secondary" onClick={() => applyBatchSimulation('miss_all', 3)} style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}>
                <span>Miss Full Week</span>
              </button>
            </div>
          </div>

          {/* Search, Filter & View Controls */}
          <div className="search-filter-row">
            <div className="search-input-box">
              <Search size={16} color="var(--text-muted)" />
              <input 
                type="text"
                placeholder="Search subject by title or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="filter-pills-group">
              <button 
                className={`filter-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                <span>All Subjects</span>
                <span className="filter-count">{processedSubjects.length}</span>
              </button>
              <button 
                className={`filter-tab-btn ${statusFilter === 'safe' ? 'active' : ''}`}
                onClick={() => setStatusFilter('safe')}
              >
                <span style={{ color: 'var(--accent-mint)' }}>●</span>
                <span>Safe</span>
                <span className="filter-count">{processedSubjects.filter(s => s.status === 'safe').length}</span>
              </button>
              <button 
                className={`filter-tab-btn ${statusFilter === 'warning' ? 'active' : ''}`}
                onClick={() => setStatusFilter('warning')}
              >
                <span style={{ color: 'var(--accent-amber)' }}>●</span>
                <span>Caution</span>
                <span className="filter-count">{processedSubjects.filter(s => s.status === 'warning').length}</span>
              </button>
              <button 
                className={`filter-tab-btn ${statusFilter === 'danger' ? 'active' : ''}`}
                onClick={() => setStatusFilter('danger')}
              >
                <span style={{ color: 'var(--accent-crimson)' }}>●</span>
                <span>Critical</span>
                <span className="filter-count">{processedSubjects.filter(s => s.status === 'danger').length}</span>
              </button>
              {healthStats.totalSimulations > 0 && (
                <button 
                  className={`filter-tab-btn ${statusFilter === 'simulated' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('simulated')}
                >
                  <Sparkles size={12} color="var(--accent-cyan)" />
                  <span>Simulated</span>
                  <span className="filter-count">{processedSubjects.filter(s => s.hasAdjustments).length}</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="main-layout-grid">
            {/* Left Column: Subjects Bento Stream */}
            <div>
              {loading ? (
                <div className="subjects-stream">
                  <div className="skeleton-box"></div>
                  <div className="skeleton-box"></div>
                  <div className="skeleton-box"></div>
                  <div className="skeleton-box"></div>
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="bento-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
                  <Search size={32} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>No matching courses found</h3>
                  <p style={{ fontSize: '0.85rem' }}>Try refining your search query or reset your status filter.</p>
                </div>
              ) : (
                <div className="subjects-stream">
                  {filteredSubjects.map(subject => (
                    <div key={subject.hash} className={`subject-bento-tile ${subject.status}`}>
                      {/* Tile Header & Stats */}
                      <div>
                        <div className="tile-top-row">
                          <div>
                            <h4 className="subject-title-text">{subject.name}</h4>
                            <span className="subject-code-tag">#{subject.shortName || subject.hash}</span>
                          </div>

                          <div className="tile-rate-badge">
                            <div className={`rate-percentage-number ${subject.status}`}>
                              {subject.percent.toFixed(1)}%
                            </div>
                            <div className="rate-raw-fraction">
                              {subject.attended} / {subject.total} classes
                            </div>
                          </div>
                        </div>

                        {/* Glowing Progress Bar with Target Marker */}
                        <div style={{ marginTop: '0.85rem' }}>
                          <div className="progress-track-wrapper">
                            <div className="progress-track">
                              <div 
                                className={`progress-fill ${subject.status}`} 
                                style={{ width: `${Math.min(100, Math.max(0, subject.percent))}%` }}
                              ></div>
                              <div 
                                className="progress-target-marker" 
                                style={{ left: `${targetThreshold}%` }}
                                title={`Threshold: ${targetThreshold}%`}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Verdict Banner */}
                      <div className={`action-verdict-banner ${subject.status}`}>
                        {subject.total === 0 ? (
                          <>
                            <Info size={15} />
                            <span>No lectures conducted yet.</span>
                          </>
                        ) : subject.percent >= targetThreshold ? (
                          <>
                            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                            <span>
                              Safe to bunk <strong>{subject.bunkable}</strong> more {subject.bunkable === 1 ? 'class' : 'classes'} while staying above {targetThreshold}%.
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                            <span>
                              Must attend <strong>{subject.required}</strong> consecutive {subject.required === 1 ? 'class' : 'classes'} to reach {targetThreshold}%.
                            </span>
                          </>
                        )}
                      </div>

                      {/* Interactive Tactile Stepper Simulator */}
                      <div className="simulator-box">
                        <div className="simulator-box-header">
                          <span className="eyebrow" style={{ fontSize: '0.68rem' }}>
                            <Sparkles size={11} color="var(--accent-mint)" />
                            WHAT-IF STEPPER
                          </span>
                          {subject.hasAdjustments && (
                            <button 
                              onClick={() => resetAdjustment(subject.hash)}
                              style={{ background: 'none', border: 'none', color: 'var(--accent-crimson)', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                            >
                              Reset
                            </button>
                          )}
                        </div>

                        <div className="stepper-row">
                          {/* Attend Stepper */}
                          <div className="stepper-unit">
                            <span className="stepper-label">Attend (+1)</span>
                            <div className="stepper-controls">
                              <button 
                                className="stepper-btn"
                                onClick={() => adjustSubjectAttendance(subject.hash, 'attend', -1)}
                                title="Subtract simulated attend"
                              >
                                -
                              </button>
                              <span className={`stepper-number ${subject.adjAttended > 0 ? 'active-sim' : ''}`}>
                                {subject.adjAttended >= 0 ? `+${subject.adjAttended}` : subject.adjAttended}
                              </span>
                              <button 
                                className="stepper-btn"
                                onClick={() => adjustSubjectAttendance(subject.hash, 'attend', 1)}
                                title="Add simulated attend"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Miss Stepper */}
                          <div className="stepper-unit">
                            <span className="stepper-label">Miss (+1)</span>
                            <div className="stepper-controls">
                              <button 
                                className="stepper-btn"
                                onClick={() => adjustSubjectAttendance(subject.hash, 'miss', -1)}
                                title="Subtract simulated miss"
                              >
                                -
                              </button>
                              <span className={`stepper-number ${subject.adjTotal - subject.adjAttended > 0 ? 'active-miss' : ''}`}>
                                +{subject.adjTotal - subject.adjAttended}
                              </span>
                              <button 
                                className="stepper-btn"
                                onClick={() => adjustSubjectAttendance(subject.hash, 'miss', 1)}
                                title="Add simulated miss"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {subject.hasAdjustments && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                            LMS: {subject.rawAttended}/{subject.rawTotal} &rarr; Projected: {subject.attended}/{subject.total}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Custom Groups & Math Explainer */}
            <div className="sidebar-stack">
              
              {/* Subject Groups Bento Box */}
              <div className="bento-card">
                <div className="bento-card-header">
                  <div className="bento-title-group">
                    <span className="eyebrow purple">AGGREGATIONS</span>
                    <h3 className="bento-title">Subject Groups</h3>
                  </div>
                  <button 
                    className="btn-algora btn-algora-secondary"
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.76rem' }}
                    onClick={() => setShowCreateGroup(prev => !prev)}
                  >
                    <FolderPlus size={13} />
                    <span>New Group</span>
                  </button>
                </div>

                {/* Create Group Form Modal / Inline Drawer */}
                {showCreateGroup && (
                  <form onSubmit={handleCreateGroup} style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-medium)', marginBottom: '1.25rem' }}>
                    <span className="eyebrow" style={{ marginBottom: '0.4rem', display: 'block' }}>Create Custom Bucket:</span>
                    <input 
                      type="text"
                      placeholder="Group Name (e.g. Lab Courses, Minor)"
                      className="algora-select"
                      style={{ width: '100%', marginBottom: '0.75rem' }}
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />

                    <span className="eyebrow" style={{ marginBottom: '0.4rem', display: 'block' }}>Select Courses:</span>
                    <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', background: 'var(--bg-canvas)', marginBottom: '0.75rem' }}>
                      {processedSubjects.map(sub => (
                        <label key={sub.hash} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0.25rem 0', cursor: 'pointer' }}>
                          <input 
                            type="checkbox"
                            checked={newGroupSubjects.includes(sub.hash)}
                            onChange={() => toggleGroupSubject(sub.hash)}
                          />
                          <span>{sub.name}</span>
                        </label>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button type="submit" className="btn-algora btn-algora-primary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.78rem' }}>Create</button>
                      <button type="button" className="btn-algora btn-algora-secondary" style={{ padding: '0.4rem', fontSize: '0.78rem' }} onClick={() => setShowCreateGroup(false)}>Cancel</button>
                    </div>
                  </form>
                )}

                {/* Groups List */}
                <div>
                  {groups.length === 0 ? (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
                      No custom groups created. Groups let you calculate aggregate attendance across combinations of subjects (e.g. Practicals vs Core).
                    </p>
                  ) : (
                    groups.map(group => {
                      const stats = getGroupStats(group);
                      return (
                        <div key={group.id} className="group-tile">
                          <div className="group-tile-header">
                            <div>
                              <div className="group-title-text">{group.name}</div>
                              <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {group.subjectHashes.length} course(s) aggregated
                              </span>
                            </div>
                            <button 
                              onClick={() => handleDeleteGroup(group.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--accent-crimson)', cursor: 'pointer', opacity: 0.6 }}
                              title="Delete group"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '0.5rem 0' }}>
                            <span className={`rate-percentage-number ${stats.status}`} style={{ fontSize: '1.25rem' }}>
                              {stats.percent.toFixed(1)}%
                            </span>
                            <span className="group-stats-fraction">{stats.attended} / {stats.total} classes</span>
                          </div>

                          {/* Group Threshold Slider */}
                          <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <span className="eyebrow" style={{ fontSize: '0.68rem' }}>Target: {stats.threshold}%</span>
                            <input 
                              type="range"
                              min="50"
                              max="100"
                              value={stats.threshold}
                              onChange={(e) => handleUpdateGroupThreshold(group.id, e.target.value)}
                              className="algora-range-input"
                              style={{ width: '80px' }}
                            />
                          </div>

                          <div className={`action-verdict-banner ${stats.status}`} style={{ marginTop: '0.6rem', padding: '0.45rem 0.65rem', fontSize: '0.76rem' }}>
                            {stats.percent >= stats.threshold ? (
                              <>
                                <CheckCircle2 size={13} />
                                <span>Can bunk <strong>{stats.bunkable}</strong> classes</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle size={13} />
                                <span>Need <strong>{stats.required}</strong> consecutive classes</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Math Formula & Algora Engineering Inspector */}
              <div className="bento-card">
                <div className="bento-card-header" style={{ marginBottom: '0.75rem' }}>
                  <div className="bento-title-group">
                    <span className="eyebrow cyan">MATHEMATICAL ENGINE</span>
                    <h4 className="bento-title" style={{ fontSize: '1rem' }}>Formulas & Proofs</h4>
                  </div>
                  <Code2 size={18} color="var(--accent-cyan)" />
                </div>

                <div className="formula-box">
                  <div style={{ marginBottom: '0.6rem' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Bunkable Capacity:</strong>
                    <code className="formula-code">
                      ⌊(Attended - T × Total) / T⌋
                    </code>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Where T = Target % / 100.</span>
                  </div>

                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Recovery Requirement:</strong>
                    <code className="formula-code">
                      ⌈(T × Total - Attended) / (1 - T)⌉
                    </code>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Consecutive lectures to restore compliance.</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
