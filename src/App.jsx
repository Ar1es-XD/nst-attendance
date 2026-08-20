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
  Search, 
  Sparkles, 
  Calculator, 
  Plus, 
  Minus, 
  Code2, 
  Play, 
  Flame,
  Swords,
  Crosshair,
  Trophy,
  Gamepad2,
  Shield,
  Target
} from 'lucide-react';

const API_BASE = "";

// Sample realistic demo data matching Newton School CS curriculum
const DEMO_SEMESTERS = [
  {
    hash: 'demo-sem-3',
    title: 'Semester 3 (Computer Science & AI)',
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

// Calculate gamified rank and status tier
const getTierInfo = (percent, threshold = 75) => {
  if (percent >= 90) return { tier: 'S-RANK', label: 'GOD-MODE', color: 'var(--accent-cyan)', bg: 'rgba(0, 240, 255, 0.12)', border: '#00f0ff' };
  if (percent >= 80) return { tier: 'A-RANK', label: 'OPTIMAL SHIELD', color: 'var(--accent-safe)', bg: 'rgba(0, 255, 157, 0.12)', border: '#00ff9d' };
  if (percent >= threshold) return { tier: 'B-RANK', label: 'SURVIVAL ZONE', color: 'var(--accent-warning)', bg: 'rgba(255, 230, 0, 0.12)', border: '#ffe600' };
  return { tier: 'CRITICAL', label: 'SHIELD BREACHED', color: 'var(--accent-danger)', bg: 'rgba(255, 0, 85, 0.14)', border: '#ff0055' };
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

  // Custom groups state (Guilds / Clans)
  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem('newton_attendance_groups');
    return saved ? JSON.parse(saved) : [
      { id: 'group-theory', name: 'Core CS Theory Clan', subjectHashes: ['sub-dsa-301', 'sub-os-302', 'sub-dbms-304'], threshold: 75 },
      { id: 'group-labs', name: 'Web & Systems Lab Raids', subjectHashes: ['sub-fs-303', 'sub-cn-305'], threshold: 80 }
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

  // Global settings - Default Dark for ultimate Cyber Game HUD aesthetic
  const [theme, setTheme] = useState(() => localStorage.getItem('newton_theme') || 'dark');
  const [targetThreshold, setTargetThreshold] = useState(() => {
    const saved = localStorage.getItem('newton_target_threshold');
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 100) {
        return parsed;
      }
    }
    return 75;
  });

  // Save adjustments to localStorage
  useEffect(() => {
    localStorage.setItem('newton_attendance_adjustments', JSON.stringify(adjustments));
  }, [adjustments]);

  // Save groups to localStorage
  useEffect(() => {
    localStorage.setItem('newton_attendance_groups', JSON.stringify(groups));
  }, [groups]);

  // Save target threshold to localStorage
  useEffect(() => {
    localStorage.setItem('newton_target_threshold', targetThreshold.toString());
  }, [targetThreshold]);

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
    setSemesterTitle('Semester 3 (Computer Science & AI)');
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

  // API Call helper
  const fetchNewtonAPI = useCallback(async (endpoint, bearerToken) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.status === 401 || res.status === 403) {
      throw new Error("AUTHENTICATION PROTOCOL FAILED: Token expired or invalid.");
    }
    if (!res.ok) {
      throw new Error(`COMM LINK ERROR: Server responded with status ${res.status}`);
    }
    return await res.json();
  }, []);

  // Fetch complete student dashboard
  const loadLiveDashboard = useCallback(async (authToken, targetSemHash = null) => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch User Profile
      const profileData = await fetchNewtonAPI('/api/v1/user/profile/', authToken);
      setProfile(profileData);

      // 2. Fetch User Courses / Learning Units
      const coursesData = await fetchNewtonAPI('/api/v1/user/learning-units/', authToken);
      let enrolledSemesters = [];
      if (Array.isArray(coursesData)) {
        enrolledSemesters = coursesData;
      } else if (coursesData && Array.isArray(coursesData.results)) {
        enrolledSemesters = coursesData.results;
      } else if (coursesData && Array.isArray(coursesData.learningUnits)) {
        enrolledSemesters = coursesData.learningUnits;
      }

      setSemesters(enrolledSemesters);

      // Determine active semester
      let currentSem = null;
      if (targetSemHash) {
        currentSem = enrolledSemesters.find(s => s.hash === targetSemHash);
      }
      if (!currentSem) {
        currentSem = enrolledSemesters.find(s => s.isActive) || enrolledSemesters[0];
      }

      if (currentSem) {
        setSelectedSemesterHash(currentSem.hash);
        setSemesterTitle(currentSem.title || `Unit ${currentSem.hash}`);

        // 3. Fetch overall semester performance
        try {
          const semPerf = await fetchNewtonAPI(`/api/v1/user/learning-units/${currentSem.hash}/performance/`, authToken);
          if (semPerf && semPerf.total_lectures !== undefined) {
            setOverallPerf(semPerf);
          }
        } catch (e) {
          console.warn("Could not fetch overall semester performance:", e);
        }

        // 4. Fetch subject list & their individual performance
        const units = currentSem.learningUnits || [];
        const subjectsWithPerf = await Promise.all(units.map(async (unit) => {
          let rawAttended = 0;
          let rawTotal = 0;
          try {
            const perf = await fetchNewtonAPI(`/api/v1/user/learning-units/${unit.hash}/performance/`, authToken);
            if (perf) {
              rawAttended = perf.total_lectures_attended || 0;
              rawTotal = perf.total_lectures || 0;
            }
          } catch (err) {
            console.warn(`Performance fetch failed for unit ${unit.hash}:`, err);
          }

          return {
            id: unit.id,
            hash: unit.hash,
            name: unit.title,
            shortName: unit.short_display_name,
            rawAttended,
            rawTotal
          };
        }));

        setSubjectsData(subjectsWithPerf);
      }
    } catch (err) {
      console.error("Dashboard sync failure:", err);
      setError(err.message || "Failed to establish uplink with LMS. Please verify token.");
      // Clear token if invalid
      if (err.message.includes("AUTHENTICATION PROTOCOL FAILED")) {
        localStorage.removeItem('newton_bearer_token');
        setToken('');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchNewtonAPI]);

  // Initial token loader
  useEffect(() => {
    if (token) {
      loadLiveDashboard(token);
    }
  }, [token, loadLiveDashboard]);

  // Handle switching semesters
  const handleSemesterChange = (newSemHash) => {
    if (isDemoMode) {
      const sem = DEMO_SEMESTERS.find(s => s.hash === newSemHash);
      if (sem) {
        setSelectedSemesterHash(sem.hash);
        setSemesterTitle(sem.title);
        setOverallPerf(DEMO_PERFORMANCES[sem.hash] || { total_lectures: 0, total_lectures_attended: 0 });
        const demoSubs = sem.learningUnits.map(unit => {
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
      return;
    }

    if (token) {
      loadLiveDashboard(token, newSemHash);
    }
  };

  // Connect form submission handler
  const handleConnect = (e) => {
    e.preventDefault();
    if (!inputToken.trim()) {
      setError("Please paste a valid JWT or Bearer token.");
      return;
    }
    const clean = inputToken.replace(/^Bearer\s+/i, '').trim();
    localStorage.setItem('newton_bearer_token', clean);
    setIsDemoMode(false);
    setToken(clean);
  };

  // Disconnect handler
  const handleDisconnect = () => {
    localStorage.removeItem('newton_bearer_token');
    setToken('');
    setProfile(null);
    setSemesters([]);
    setSubjectsData([]);
    setIsDemoMode(false);
  };

  // 1-Click Auto-Extractor Console Snippet
  const universalSnippet = `(()=>{try{const t=localStorage.getItem('token')||sessionStorage.getItem('token')||document.cookie.match(/token=([^;]+)/)?.[1];if(!t)return alert('⚠️ No active session found. Please ensure you are logged into my.newtonschool.co');const d='${window.location.origin}${window.location.pathname}?token='+encodeURIComponent(t);console.log('⚡ Session extracted. Redirecting to HUD...');window.location.href=d;}catch(e){alert('Extractor Error: '+e.message)}})();`;

  const copySnippet = () => {
    navigator.clipboard.writeText(universalSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  // Network Request Interceptor Hook
  const interceptorSnippet = `(() => {
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    this.addEventListener('load', function() {
      const auth = this.getResponseHeader('Authorization') || this.getResponseHeader('authorization');
      if (auth) console.log('🔑 Captured Token:', auth);
    });
    origOpen.apply(this, arguments);
  };
  console.log('🚀 Network interceptor installed. Perform any action in LMS to capture token.');
})();`;

  const copyInterceptor = () => {
    navigator.clipboard.writeText(interceptorSnippet);
    setCopiedInterceptor(true);
    setTimeout(() => setCopiedInterceptor(false), 2500);
  };

  // Mathematical Planner calculation engine
  const calculateAttendanceStats = useCallback((attended, total, threshold) => {
    if (total === 0) {
      return {
        percent: 0,
        bunkable: 0,
        required: 0,
        status: 'safe',
        tier: getTierInfo(0, threshold)
      };
    }

    const currentPercent = (attended / total) * 100;
    const targetFraction = threshold / 100;

    let bunkable = 0;
    let required = 0;

    if (currentPercent >= threshold) {
      bunkable = Math.floor((attended - targetFraction * total) / targetFraction);
      bunkable = Math.max(0, bunkable);
    } else {
      const denom = 1 - targetFraction;
      if (denom > 0) {
        required = Math.ceil((targetFraction * total - attended) / denom);
        required = Math.max(0, required);
      }
    }

    let status = 'safe';
    if (currentPercent < threshold) {
      status = 'danger';
    } else if (currentPercent < threshold + 3) {
      status = 'warning';
    }

    return {
      percent: currentPercent,
      bunkable,
      required,
      status,
      tier: getTierInfo(currentPercent, threshold)
    };
  }, []);

  // Modify simulated attendance for a specific subject
  const adjustSubjectAttendance = (subjectHash, type, delta) => {
    setAdjustments(prev => {
      const current = prev[subjectHash] || { attended: 0, total: 0 };
      let newAttended = current.attended;
      let newTotal = current.total;

      if (type === 'attend') {
        newAttended += delta;
        newTotal += delta;
      } else if (type === 'miss') {
        newTotal += delta;
      }

      if (newTotal < 0) newTotal = 0;
      if (newAttended < 0) newAttended = 0;
      if (newAttended > newTotal) newAttended = newTotal;

      if (newAttended === 0 && newTotal === 0) {
        const copy = { ...prev };
        delete copy[subjectHash];
        return copy;
      }

      return {
        ...prev,
        [subjectHash]: { attended: newAttended, total: newTotal }
      };
    });
  };

  // Reset adjustments for a specific subject
  const resetAdjustment = (subjectHash) => {
    setAdjustments(prev => {
      const copy = { ...prev };
      delete copy[subjectHash];
      return copy;
    });
  };

  // Reset all adjustments
  const resetAllAdjustments = () => {
    setAdjustments({});
  };

  // Batch simulation helper (e.g. attend all +1 or miss all +1)
  const applyBatchSimulation = (type, count = 1) => {
    subjectsData.forEach(sub => {
      adjustSubjectAttendance(sub.hash, type === 'attend_all' ? 'attend' : 'miss', count);
    });
  };

  // Processed subjects list with live simulations and math applied
  const processedSubjects = useMemo(() => {
    return subjectsData.map(subject => {
      const adj = adjustments[subject.hash] || { attended: 0, total: 0 };
      const attended = subject.rawAttended + adj.attended;
      const total = subject.rawTotal + adj.total;
      const stats = calculateAttendanceStats(attended, total, targetThreshold);

      return {
        ...subject,
        attended,
        total,
        adjAttended: adj.attended,
        adjTotal: adj.total,
        hasAdjustments: adj.attended !== 0 || adj.total !== 0,
        ...stats
      };
    });
  }, [subjectsData, adjustments, targetThreshold, calculateAttendanceStats]);

  // Overall aggregate stats calculation
  const overallStats = useMemo(() => {
    let totalAttended = 0;
    let totalConducted = 0;

    if (processedSubjects.length > 0) {
      processedSubjects.forEach(s => {
        totalAttended += s.attended;
        totalConducted += s.total;
      });
    } else {
      totalAttended = overallPerf.total_lectures_attended || 0;
      totalConducted = overallPerf.total_lectures || 0;
    }

    const stats = calculateAttendanceStats(totalAttended, totalConducted, targetThreshold);
    return {
      attended: totalAttended,
      total: totalConducted,
      ...stats
    };
  }, [processedSubjects, overallPerf, targetThreshold, calculateAttendanceStats]);

  // Filtered subjects based on search query and status filter
  const filteredSubjects = useMemo(() => {
    return processedSubjects.filter(sub => {
      const matchesSearch = searchQuery === '' || 
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (sub.shortName && sub.shortName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        sub.hash.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'safe') return sub.status === 'safe';
      if (statusFilter === 'warning') return sub.status === 'warning';
      if (statusFilter === 'danger') return sub.status === 'danger';
      if (statusFilter === 'simulated') return sub.hasAdjustments;
      return true;
    });
  }, [processedSubjects, searchQuery, statusFilter]);

  // Health summary metrics
  const healthStats = useMemo(() => {
    const total = processedSubjects.length;
    const safeCount = processedSubjects.filter(s => s.status === 'safe').length;
    const warningCount = processedSubjects.filter(s => s.status === 'warning').length;
    const dangerCount = processedSubjects.filter(s => s.status === 'danger').length;
    const simulatedCount = processedSubjects.filter(s => s.hasAdjustments).length;

    return {
      total,
      safeCount,
      warningCount,
      dangerCount,
      simulatedCount,
      totalSimulations: Object.keys(adjustments).length
    };
  }, [processedSubjects, adjustments]);

  // Subject Group Management Handlers
  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || newGroupSubjects.length === 0) return;

    const newGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName.trim(),
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
      {/* Top HUD Command Navigation Bar */}
      <nav className="algora-nav">
        <div className="brand-wrapper">
          <div className="brand-badge-logo">
            <span className="logo-inner">NST</span>
          </div>
          <div className="brand-meta">
            <div className="brand-heading-row">
              <span className="brand-name">NST // ATTENDANCE HUD</span>
              {isAuthenticated && (
                <span className={`status-pill ${isDemoMode ? 'demo' : 'live'}`}>
                  <span className="pulse-dot"></span>
                  {isDemoMode ? 'MISSION: SANDBOX' : 'MISSION: LIVE LINK'}
                </span>
              )}
            </div>
            {profile && (
              <span className="user-identity">
                OPERATIVE: {profile.first_name} {profile.last_name} · <span className="mono">[LVL.3 CS WARRIOR]</span> · <span className="mono">@{profile.username || profile.email?.split('@')[0]}</span>
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
              title="Resync telemetry with LMS"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>SYNC RADAR</span>
            </button>
          )}

          <button 
            className="btn-icon-square" 
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            title="Toggle Visual Mode (Cyber Dark / Mecha Light)"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {isAuthenticated && (
            <button 
              className="btn-algora btn-algora-danger" 
              onClick={handleDisconnect}
              title="Abort session"
            >
              <LogOut size={14} />
              <span>ABORT</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main View: Connect Gateway vs Authenticated Command Center */}
      {!isAuthenticated ? (
        /* ==========================================================================
           CONNECT GATEWAY (Cyber Battle Gateway)
           ========================================================================== */
        <div>
          <div className="connect-hero">
            <div className="connect-hero-tag">
              <Gamepad2 size={14} />
              <span>PROTOCOL V3.0 // ACADEMIC COMBAT ENGINE</span>
            </div>
            <h1 className="connect-hero-title">
              COMMAND YOUR ATTENDANCE WITH <span className="gradient-text">TACTICAL MASTERY</span>.
            </h1>
            <p className="connect-hero-desc">
              Real-time LMS combat telemetry, instant stealth-bunk calculation algorithm, and tactical scenario simulations to keep your academic shield impenetrable.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn-algora btn-algora-primary" onClick={copySnippet} style={{ padding: '0.75rem 1.6rem', fontSize: '0.86rem' }}>
                <Zap size={16} />
                <span>{copiedSnippet ? 'EXECUTED CONSOLE COMMAND!' : 'INITIALIZE AUTO SCANNER'}</span>
              </button>
              <button className="btn-algora btn-algora-secondary" onClick={enableDemoMode} style={{ padding: '0.75rem 1.6rem', fontSize: '0.86rem' }}>
                <Play size={16} />
                <span>LAUNCH DEMO SIMULATION</span>
              </button>
            </div>
          </div>

          <div className="connect-methods-grid">
            {/* Bento Card 1: 1-Click DevTools Extractor */}
            <div className="bento-card glow-cyan">
              <div className="bento-card-header">
                <div className="bento-title-group">
                  <span className="eyebrow cyan">01 // AUTO DEVTOOLS SCANNER</span>
                  <h3 className="bento-title">⚡ Instant Console Ingestion</h3>
                </div>
                <div className="status-pill demo">Fast Pass</div>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Run this automated script inside your browser's DevTools console on the Newton School LMS tab. It extracts your active operative key and redirects securely:
              </p>

              <div className="terminal-card">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <span></span><span></span><span></span>
                  </div>
                  <span className="terminal-title">TERMINAL // devtools_scanner.js</span>
                  <button 
                    className="btn-algora btn-algora-primary" 
                    onClick={copySnippet}
                    style={{ padding: '0.25rem 0.65rem', fontSize: '0.7rem' }}
                  >
                    {copiedSnippet ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedSnippet ? 'ARMED' : 'COPY'}</span>
                  </button>
                </div>
                <div className="terminal-body">
                  {universalSnippet.slice(0, 110)}... [CLICK COPY TO ARM CODE]
                </div>
              </div>

              <ul className="step-instruction-list">
                <li className="step-item">
                  <span className="step-badge">1</span>
                  <span>Open your <a href="https://my.newtonschool.co/course/u4fvf1rm9v2e/details" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>Newton School LMS tab <ExternalLink size={11} style={{ display: 'inline' }} /></a></span>
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
                  <span className="eyebrow cyan">02 // DIRECT ACCESS KEY</span>
                  <h3 className="bento-title">🔑 Direct Bearer Token</h3>
                </div>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                If you already have your bearer authentication token from request headers or curl, paste it directly:
              </p>

              <form onSubmit={handleConnect}>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="eyebrow" style={{ display: 'block', marginBottom: '0.4rem' }}>
                    Bearer Token / JWT Token:
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
                  <div style={{ color: 'var(--accent-danger)', background: 'var(--accent-danger-subtle)', border: '1px solid var(--accent-danger)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-xs)', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <AlertTriangle size={15} />
                    <span>{error}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn-algora btn-algora-primary" style={{ flex: 1 }} disabled={loading}>
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    <span>INITIALIZE HUD</span>
                  </button>
                  <button type="button" className="btn-algora btn-algora-secondary" onClick={enableDemoMode} title="Try without credentials">
                    SANDBOX
                  </button>
                </div>
              </form>

              {/* Network Interceptor Hook Secondary Section */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="eyebrow purple">03 // NETWORK INTERCEPTOR</span>
                  <button className="btn-algora btn-algora-secondary" onClick={copyInterceptor} style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem' }}>
                    {copiedInterceptor ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedInterceptor ? 'COPIED' : 'COPY HOOK'}</span>
                  </button>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Hooks into active XMLHttpRequest/fetch on LMS and captures token on any button click.
                </p>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={14} color="var(--accent-safe)" />
            <span>Zero-Trust Protocol: Your session keys remain strictly stored in local browser memory and never touch remote proxy servers.</span>
          </div>
        </div>
      ) : (
        /* ==========================================================================
           LIVE LMS COMMAND CENTER (Cyberpunk RPG Battle Station)
           ========================================================================== */
        <div>
          {/* Top Intelligence Toolbar */}
          <div className="intelligence-bar">
            <div className="control-cluster">
              <div className="unit-select-wrapper">
                <Crosshair size={18} color="var(--accent-cyan)" />
                <span className="eyebrow" style={{ marginRight: '0.2rem' }}>SECTOR:</span>
                {semesters.length > 0 ? (
                  <select 
                    className="algora-select"
                    value={selectedSemesterHash}
                    onChange={(e) => handleSemesterChange(e.target.value)}
                  >
                    {semesters.map(s => (
                      <option key={s.hash} value={s.hash}>
                        {s.title} {s.isActive ? '· [ACTIVE SECTOR]' : ''}
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
                <Target size={15} color="var(--accent-cyan)" />
                <span className="eyebrow">BARRIER:</span>
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
                {[
                  { val: 75, label: 'CASUAL' },
                  { val: 80, label: 'HARDCORE' },
                  { val: 85, label: 'ELITE' },
                  { val: 90, label: 'S-RANK' }
                ].map(item => (
                  <button 
                    key={item.val}
                    className={`preset-pill-btn ${targetThreshold === item.val ? 'active' : ''}`}
                    onClick={() => setTargetThreshold(item.val)}
                  >
                    {item.val}% {item.label}
                  </button>
                ))}
              </div>

              {healthStats.totalSimulations > 0 && (
                <button 
                  className="btn-algora btn-algora-secondary" 
                  onClick={resetAllAdjustments}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.76rem' }}
                >
                  <RotateCcw size={13} />
                  <span>RELOAD DECK ({healthStats.totalSimulations})</span>
                </button>
              )}
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--accent-danger)', background: 'var(--accent-danger-subtle)', border: '1px solid var(--accent-danger)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-xs)', fontSize: '0.86rem', marginBottom: '1.5rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Bento Stats Hero Metrics (HUD Gauges) */}
          <div className="stats-bento-grid">
            {/* Metric 1: Overall Percentage / Shield Integrity */}
            <div className={`bento-card metric-card ${overallStats.status === 'safe' ? 'glow-safe' : overallStats.status === 'danger' ? 'glow-danger' : ''}`}>
              <div className="metric-top">
                <span className="eyebrow">SHIELD INTEGRITY</span>
                <div className={`metric-icon-bubble ${overallStats.status === 'safe' ? '' : overallStats.status === 'warning' ? 'amber' : 'crimson'}`}>
                  <Shield size={16} />
                </div>
              </div>
              <div className="metric-value-row">
                <span className="metric-huge-number">{overallStats.percent.toFixed(1)}%</span>
                <span className={`metric-delta-tag ${overallStats.percent >= targetThreshold ? 'safe' : 'danger'}`}>
                  {overallStats.tier.tier}
                </span>
              </div>
              <span className="metric-subtext">
                {overallStats.percent >= targetThreshold 
                  ? `Shield integrity holds above minimum barrier of ${targetThreshold}%`
                  : `WARNING: Shield breached below mandated ${targetThreshold}% threshold`
                }
              </span>
            </div>

            {/* Metric 2: Net Action Verdict / Stealth Ammo */}
            <div className={`bento-card metric-card ${overallStats.percent >= targetThreshold ? 'glow-safe' : 'glow-danger'}`}>
              <div className="metric-top">
                <span className="eyebrow">STEALTH BUNK AMMO</span>
                <div className={`metric-icon-bubble ${overallStats.percent >= targetThreshold ? '' : 'crimson'}`}>
                  {overallStats.percent >= targetThreshold ? <Flame size={16} /> : <AlertTriangle size={16} />}
                </div>
              </div>
              <div className="metric-value-row">
                <span className="metric-huge-number" style={{ color: overallStats.percent >= targetThreshold ? 'var(--accent-safe)' : 'var(--accent-danger)' }}>
                  {overallStats.percent >= targetThreshold 
                    ? `Bunk ${overallStats.bunkable}x` 
                    : `Grind ${overallStats.required}x`
                  }
                </span>
              </div>
              <span className="metric-subtext">
                {overallStats.percent >= targetThreshold 
                  ? `Stealth charges available before shield drops below ${targetThreshold}%`
                  : `Consecutive boss raids required to restore barrier integrity`
                }
              </span>
            </div>

            {/* Metric 3: Total Conducted vs Attended */}
            <div className="bento-card metric-card">
              <div className="metric-top">
                <span className="eyebrow">QUEST CLEARS</span>
                <div className="metric-icon-bubble cyan">
                  <Calculator size={16} />
                </div>
              </div>
              <div className="metric-value-row">
                <span className="metric-huge-number mono">{overallStats.attended} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {overallStats.total}</span></span>
              </div>
              <span className="metric-subtext">
                Total lectures attended across all enrolled sectors
              </span>
            </div>

            {/* Metric 4: Health Breakdown */}
            <div className="bento-card metric-card">
              <div className="metric-top">
                <span className="eyebrow">SQUAD READINESS</span>
                <div className="metric-icon-bubble amber">
                  <Trophy size={16} />
                </div>
              </div>
              <div className="metric-value-row">
                <span className="metric-huge-number mono">{healthStats.safeCount} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {healthStats.total}</span></span>
                <span className="metric-delta-tag safe">READY</span>
              </div>
              <span className="metric-subtext">
                {healthStats.dangerCount === 0 
                  ? 'All courses in optimal operational standing' 
                  : `${healthStats.dangerCount} course(s) require immediate XP grinding`
                }
              </span>
            </div>
          </div>

          {/* Quick Batch Simulator Drawer / Banner (Combat Deck) */}
          <div className="batch-sim-banner">
            <div className="batch-sim-info">
              <Swords size={20} color="var(--accent-cyan)" />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.1rem' }}>
                  <span className="eyebrow cyan">COMBAT DECK // TACTICAL SIMULATION</span>
                  {healthStats.totalSimulations > 0 && (
                    <span className="status-pill demo" style={{ fontSize: '0.64rem', padding: '0.1rem 0.45rem' }}>
                      {healthStats.totalSimulations} ACTIVE OVERRIDE{healthStats.totalSimulations > 1 ? 'S' : ''}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  Execute universal timetable combat scenarios to stress-test your academic shield:
                </span>
              </div>
            </div>

            <div className="batch-sim-actions">
              <button className="btn-algora btn-algora-secondary" onClick={() => applyBatchSimulation('attend_all', 1)} style={{ fontSize: '0.74rem', padding: '0.35rem 0.65rem' }}>
                <Plus size={13} color="var(--accent-safe)" />
                <span>+1 RAID DAY (ALL PRESENT)</span>
              </button>
              <button className="btn-algora btn-algora-secondary" onClick={() => applyBatchSimulation('miss_all', 1)} style={{ fontSize: '0.74rem', padding: '0.35rem 0.65rem' }}>
                <Minus size={13} color="var(--accent-danger)" />
                <span>+1 STEALTH DAY (BUNK ALL)</span>
              </button>
              <button className="btn-algora btn-algora-secondary" onClick={() => applyBatchSimulation('attend_all', 3)} style={{ fontSize: '0.74rem', padding: '0.35rem 0.65rem' }}>
                <span>+3 RAID STREAK (FULL WEEK)</span>
              </button>
              <button className="btn-algora btn-algora-secondary" onClick={() => applyBatchSimulation('miss_all', 3)} style={{ fontSize: '0.74rem', padding: '0.35rem 0.65rem' }}>
                <span>FULL WEEK STEALTH BUNK</span>
              </button>
              <button 
                className={`btn-algora ${healthStats.totalSimulations > 0 ? 'btn-algora-danger' : 'btn-algora-secondary'}`}
                onClick={resetAllAdjustments}
                disabled={healthStats.totalSimulations === 0}
                style={{ fontSize: '0.74rem', padding: '0.35rem 0.75rem' }}
                title="Reset all tactical overrides back to live telemetry"
              >
                <RotateCcw size={13} />
                <span>RESET COMBAT DECK {healthStats.totalSimulations > 0 ? `(${healthStats.totalSimulations})` : ''}</span>
              </button>
            </div>
          </div>

          {/* Search, Filter & View Controls */}
          <div className="search-filter-row">
            <div className="search-input-box">
              <Search size={16} color="var(--accent-cyan)" />
              <input 
                type="text"
                placeholder="Search active quest by name or code..."
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
                <span>ALL QUESTS</span>
                <span className="filter-count">{processedSubjects.length}</span>
              </button>
              <button 
                className={`filter-tab-btn ${statusFilter === 'safe' ? 'active' : ''}`}
                onClick={() => setStatusFilter('safe')}
              >
                <span style={{ color: 'var(--accent-safe)' }}>●</span>
                <span>SHIELDED</span>
                <span className="filter-count">{processedSubjects.filter(s => s.status === 'safe').length}</span>
              </button>
              <button 
                className={`filter-tab-btn ${statusFilter === 'warning' ? 'active' : ''}`}
                onClick={() => setStatusFilter('warning')}
              >
                <span style={{ color: 'var(--accent-warning)' }}>●</span>
                <span>CAUTION</span>
                <span className="filter-count">{processedSubjects.filter(s => s.status === 'warning').length}</span>
              </button>
              <button 
                className={`filter-tab-btn ${statusFilter === 'danger' ? 'active' : ''}`}
                onClick={() => setStatusFilter('danger')}
              >
                <span style={{ color: 'var(--accent-danger)' }}>●</span>
                <span>CRITICAL</span>
                <span className="filter-count">{processedSubjects.filter(s => s.status === 'danger').length}</span>
              </button>
              {healthStats.totalSimulations > 0 && (
                <button 
                  className={`filter-tab-btn ${statusFilter === 'simulated' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('simulated')}
                >
                  <Sparkles size={12} color="var(--accent-cyan)" />
                  <span>SIMULATED</span>
                  <span className="filter-count">{processedSubjects.filter(s => s.hasAdjustments).length}</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="main-layout-grid">
            {/* Left Column: Subjects Bento Stream (Active Quests) */}
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
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.4rem', fontFamily: 'var(--font-hud)' }}>NO ACTIVE QUESTS MATCH CRITERIA</h3>
                  <p style={{ fontSize: '0.85rem' }}>Refine your radar search query or clear your status filter.</p>
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
                            <span className="subject-code-tag">#{subject.shortName || subject.hash} · [{subject.tier.tier}]</span>
                          </div>

                          <div className="tile-rate-badge">
                            <div className={`rate-percentage-number ${subject.status}`}>
                              {subject.percent.toFixed(1)}%
                            </div>
                            <div className="rate-raw-fraction">
                              {subject.attended} / {subject.total} raids
                            </div>
                          </div>
                        </div>

                        {/* Segmented Cyber Health Bar with Target Marker */}
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
                                title={`Mandated Threshold: ${targetThreshold}%`}
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
                            <span>NO RAIDS CONDUCTED YET.</span>
                          </>
                        ) : subject.percent >= targetThreshold ? (
                          <>
                            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                            <span>
                              STEALTH READY: Safe to bunk <strong>{subject.bunkable}</strong> more {subject.bunkable === 1 ? 'raid' : 'raids'} above {targetThreshold}%.
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                            <span>
                              SHIELD BREACHED: Must clear <strong>{subject.required}</strong> consecutive {subject.required === 1 ? 'boss raid' : 'boss raids'} for {targetThreshold}%.
                            </span>
                          </>
                        )}
                      </div>

                      {/* Interactive Tactile Stepper Simulator */}
                      <div className="simulator-box">
                        <div className="simulator-box-header">
                          <span className="eyebrow" style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Swords size={11} color="var(--accent-cyan)" />
                            TACTICAL OVERRIDE
                          </span>
                          {subject.hasAdjustments && (
                            <button 
                              onClick={() => resetAdjustment(subject.hash)}
                              className="btn-algora btn-algora-danger"
                              style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem', height: 'auto', borderRadius: '2px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              title="Reset simulation for this sector"
                            >
                              <RotateCcw size={10} />
                              <span>RESET</span>
                            </button>
                          )}
                        </div>

                        <div className="stepper-row">
                          {/* Attend Stepper */}
                          <div className="stepper-unit">
                            <span className="stepper-label">RAID (+1)</span>
                            <div className="stepper-controls">
                              <button 
                                className="stepper-btn"
                                onClick={() => adjustSubjectAttendance(subject.hash, 'attend', -1)}
                                title="Subtract simulated raid attend"
                              >
                                -
                              </button>
                              <span className={`stepper-number ${subject.adjAttended > 0 ? 'active-sim' : ''}`}>
                                {subject.adjAttended >= 0 ? `+${subject.adjAttended}` : subject.adjAttended}
                              </span>
                              <button 
                                className="stepper-btn"
                                onClick={() => adjustSubjectAttendance(subject.hash, 'attend', 1)}
                                title="Add simulated raid attend"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Miss Stepper */}
                          <div className="stepper-unit">
                            <span className="stepper-label">BUNK (+1)</span>
                            <div className="stepper-controls">
                              <button 
                                className="stepper-btn"
                                onClick={() => adjustSubjectAttendance(subject.hash, 'miss', -1)}
                                title="Subtract simulated stealth skip"
                              >
                                -
                              </button>
                              <span className={`stepper-number ${subject.adjTotal - subject.adjAttended > 0 ? 'active-miss' : ''}`}>
                                +{subject.adjTotal - subject.adjAttended}
                              </span>
                              <button 
                                className="stepper-btn"
                                onClick={() => adjustSubjectAttendance(subject.hash, 'miss', 1)}
                                title="Add simulated stealth skip"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {subject.hasAdjustments && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                            LMS: {subject.rawAttended}/{subject.rawTotal} &rarr; PROJECTED: {subject.attended}/{subject.total}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Custom Groups (Guilds) & Combat Math */}
            <div className="sidebar-stack">
              
              {/* Subject Groups Bento Box (Guilds / Clans) */}
              <div className="bento-card">
                <div className="bento-card-header">
                  <div className="bento-title-group">
                    <span className="eyebrow purple">GUILDS & CLANS</span>
                    <h3 className="bento-title">Tactical Clusters</h3>
                  </div>
                  <button 
                    className="btn-algora btn-algora-secondary"
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.74rem' }}
                    onClick={() => setShowCreateGroup(prev => !prev)}
                  >
                    <FolderPlus size={13} />
                    <span>NEW CLAN</span>
                  </button>
                </div>

                {/* Create Group Form Inline Drawer */}
                {showCreateGroup && (
                  <form onSubmit={handleCreateGroup} style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-xs)', border: '1px dashed var(--border-medium)', marginBottom: '1.25rem' }}>
                    <span className="eyebrow" style={{ marginBottom: '0.4rem', display: 'block' }}>Create Clan Bucket:</span>
                    <input 
                      type="text"
                      placeholder="Clan Name (e.g. Lab Raids, Core Theory)"
                      className="algora-select"
                      style={{ width: '100%', marginBottom: '0.75rem' }}
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />

                    <span className="eyebrow" style={{ marginBottom: '0.4rem', display: 'block' }}>Assign Quests:</span>
                    <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', padding: '0.5rem', background: 'var(--bg-canvas)', marginBottom: '0.75rem' }}>
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
                      <button type="submit" className="btn-algora btn-algora-primary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.76rem' }}>FORM CLAN</button>
                      <button type="button" className="btn-algora btn-algora-secondary" style={{ padding: '0.4rem', fontSize: '0.76rem' }} onClick={() => setShowCreateGroup(false)}>CANCEL</button>
                    </div>
                  </form>
                )}

                {/* Groups List */}
                <div>
                  {groups.length === 0 ? (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
                      No custom clans formed. Guilds let you aggregate combined battle attendance across combinations of quests.
                    </p>
                  ) : (
                    groups.map(group => {
                      const stats = getGroupStats(group);
                      return (
                        <div key={group.id} className="group-tile">
                          <div className="group-tile-header">
                            <div>
                              <div className="group-title-text">{group.name}</div>
                              <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                                {group.subjectHashes.length} QUESTS CONSOLIDATED
                              </span>
                            </div>
                            <button 
                              onClick={() => handleDeleteGroup(group.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', opacity: 0.7 }}
                              title="Disband Clan"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '0.5rem 0' }}>
                            <span className={`rate-percentage-number ${stats.status}`} style={{ fontSize: '1.25rem' }}>
                              {stats.percent.toFixed(1)}%
                            </span>
                            <span className="group-stats-fraction">{stats.attended} / {stats.total} raids</span>
                          </div>

                          {/* Group Threshold Slider */}
                          <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <span className="eyebrow" style={{ fontSize: '0.68rem' }}>BARRIER: {stats.threshold}%</span>
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
                                <span>Can bunk <strong>{stats.bunkable}</strong> ammo tokens</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle size={13} />
                                <span>Requires <strong>{stats.required}</strong> consecutive raids</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Combat Math Algorithms & Proofs */}
              <div className="bento-card">
                <div className="bento-card-header" style={{ marginBottom: '0.75rem' }}>
                  <div className="bento-title-group">
                    <span className="eyebrow cyan">COMBAT ALGORITHMS</span>
                    <h4 className="bento-title" style={{ fontSize: '0.98rem' }}>Tactical Proofs</h4>
                  </div>
                  <Code2 size={18} color="var(--accent-cyan)" />
                </div>

                <div className="formula-box">
                  <div style={{ marginBottom: '0.6rem' }}>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-hud)', fontSize: '0.78rem' }}>STEALTH BUNK CAPACITY:</strong>
                    <code className="formula-code">
                      ⌊(Attended - T × Total) / T⌋
                    </code>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Where T = Target % / 100.</span>
                  </div>

                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-hud)', fontSize: '0.78rem' }}>SHIELD RECOVERY QUOTA:</strong>
                    <code className="formula-code">
                      ⌈(T × Total - Attended) / (1 - T)⌉
                    </code>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Consecutive raids required to restore compliance.</span>
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
