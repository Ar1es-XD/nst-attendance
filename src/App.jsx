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
  RefreshCw,
  Search,
  Sparkles,
  Calculator,
  Plus,
  Minus,
  Code2,
  Play,
  Flame,
  Layers,
  BookOpen,
  Sliders
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

  // Custom groups state (Subject Buckets)
  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem('newton_attendance_groups');
    return saved ? JSON.parse(saved) : [
      { id: 'group-theory', name: 'Core CS Theory', subjectHashes: ['sub-dsa-301', 'sub-os-302', 'sub-dbms-304'], threshold: 75 },
      { id: 'group-labs', name: 'Web & Systems Labs', subjectHashes: ['sub-fs-303', 'sub-cn-305'], threshold: 80 }
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

  // Target threshold state (default 75%)
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

  // Full Live LMS Dashboard loader using official Newton School API hierarchy
  const loadLiveDashboard = useCallback(async (authToken, semHash = null) => {
    if (!authToken) return;
    setLoading(true);
    setError('');
    const cleanToken = authToken.replace(/^Bearer\s+/i, '').trim();

    const headers = {
      'Authorization': `Bearer ${cleanToken}`,
      'Accept': 'application/json'
    };

    try {
      // 1. Fetch User Profile (/api/v1/user/me/)
      const profRes = await fetch(`${API_BASE}/api/v1/user/me/`, { headers });
      if (!profRes.ok) {
        if (profRes.status === 401 || profRes.status === 403) {
          throw new Error('Authentication expired (401 Unauthorized). Please paste a fresh Bearer token or use the Network Interceptor.');
        }
        throw new Error(`Profile request failed: HTTP ${profRes.status}`);
      }
      const profData = await profRes.json();
      setProfile(profData);

      // 2. Fetch Applied Courses Hierarchy (/api/v2/course/all/applied/?pagination=false&completed=false)
      const appliedRes = await fetch(`${API_BASE}/api/v2/course/all/applied/?pagination=false&completed=false`, { headers });
      if (!appliedRes.ok) throw new Error('Failed to retrieve applied courses list.');
      const appliedData = await appliedRes.json();

      // Extract all semester admin units
      const extractedSemesters = [];
      let activeSemHash = semHash || selectedSemesterHash || 'u4fvf1rm9v2e';
      let foundActiveUnits = [];

      if (Array.isArray(appliedData)) {
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
      }

      if (extractedSemesters.length > 0 && foundActiveUnits.length === 0) {
        // Fallback to first semester or active semester if hash not matched
        const activeOne = extractedSemesters.find(s => s.isActive) || extractedSemesters[0];
        activeSemHash = activeOne.hash;
        setSemesterTitle(activeOne.title);
        foundActiveUnits = activeOne.learningUnits || [];
      }

      setSemesters(extractedSemesters);
      setSelectedSemesterHash(activeSemHash);

      // 3. Fetch Overall Semester Performance (/api/v2/course/h/{hash}/self_performance/)
      try {
        const semPerfRes = await fetch(`${API_BASE}/api/v2/course/h/${activeSemHash}/self_performance/`, { headers });
        if (semPerfRes.ok) {
          const semPerf = await semPerfRes.json();
          setOverallPerf(semPerf);
        }
      } catch (err) {
        console.warn("Overall performance fetch error:", err);
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
  }, [selectedSemesterHash]);

  // When active token exists, fetch live profile and attendance
  useEffect(() => {
    if (token && token !== 'null' && token !== 'undefined') {
      setIsDemoMode(false);
      loadLiveDashboard(token, selectedSemesterHash);
    }
  }, [token, loadLiveDashboard, selectedSemesterHash]);

  // Handle switching semesters
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
    } else if (token) {
      loadLiveDashboard(token, newSemHash);
    }
  };

  // Connect form submission handler
  const handleConnect = (e) => {
    if (e) e.preventDefault();
    const clean = inputToken.replace(/^Bearer\s+/i, '').trim();
    if (!clean || clean === 'null' || clean === 'undefined') {
      setError('Please paste a valid Bearer token.');
      return;
    }
    localStorage.setItem('newton_bearer_token', clean);
    setIsDemoMode(false);
    setToken(clean);
  };

  // Disconnect handler
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

  // Dynamic origin URL for the extractor redirect
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

  // Robust Network Request Interceptor Hook with instant storage extraction and auto-redirect
  const interceptorSnippet = `(() => {
  const targetOrigin = '${currentOrigin}';
  let redirected = false;

  const showBanner = (msg, isSuccess = false) => {
    try {
      const id = 'nst-token-banner';
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('div');
        el.id = id;
        el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999999;background:#18181b;color:#ffffff;padding:12px 24px;border-radius:12px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;box-shadow:0 10px 30px rgba(0,0,0,0.5);border:2px solid #bf2f1f;display:flex;align-items:center;gap:10px;animation:fadeIn 0.3s ease;';
        document.body.appendChild(el);
      }
      el.innerHTML = isSuccess
        ? '🚀 <strong style="color:#22c55e;">Token Captured!</strong> Redirecting to Attendance Tracker...'
        : '🛰️ <strong>NST Interceptor Armed:</strong> ' + msg;
    } catch(e) {}
  };

  const saveAndOpen = (tok) => {
    if (redirected || !tok || typeof tok !== 'string' || tok.length < 15) return;
    const t = tok.replace(/^Bearer\\s+/i, '').trim();
    if (!t || t === 'null' || t === 'undefined') return;
    redirected = true;
    console.log('%c[NST ATTENDANCE] Token captured: ' + t.slice(0, 15) + '...', 'color: #bf2f1f; font-weight: bold;');
    try { if (navigator.clipboard) navigator.clipboard.writeText(t); } catch(e) {}
    showBanner('Token captured!', true);
    setTimeout(() => {
      window.location.href = targetOrigin + '/?token=' + encodeURIComponent(t);
    }, 300);
  };

  const isJwt = (str) => typeof str === 'string' && (/^eyJ[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+/.test(str.replace(/^Bearer\\s+/i, '').trim()));

  const scanStorage = (storage) => {
    try {
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        const v = storage.getItem(k);
        if (!v) continue;
        if (isJwt(v)) return v;
        try {
          const parsed = JSON.parse(v);
          if (typeof parsed === 'object' && parsed !== null) {
            for (const subKey in parsed) {
              const subVal = parsed[subKey];
              if (isJwt(subVal)) return subVal;
              if (typeof subVal === 'string') {
                try {
                  const nested = JSON.parse(subVal);
                  for (const nKey in nested) {
                    if (isJwt(nested[nKey])) return nested[nKey];
                  }
                } catch(e) {}
              }
            }
          }
        } catch(e) {}
      }
    } catch(e) {}
    return null;
  };

  // 1. Check existing browser storage immediately for token
  const existingToken = scanStorage(localStorage) || scanStorage(sessionStorage);
  if (existingToken) {
    saveAndOpen(existingToken);
    return;
  }

  // 2. Intercept XMLHttpRequest headers
  const oldSetHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function(k, v) {
    if (k && k.toLowerCase() === 'authorization' && v) saveAndOpen(v);
    return oldSetHeader.apply(this, arguments);
  };

  // 3. Intercept Fetch API headers
  const oldFetch = window.fetch;
  window.fetch = async function(...args) {
    const h = args[1] && args[1].headers;
    if (h) {
      const auth = typeof h.get === 'function' ? h.get('Authorization') : (h.Authorization || h.authorization);
      if (auth) saveAndOpen(auth);
    }
    return oldFetch.apply(this, args);
  };

  // 4. Fire background probe request
  try {
    fetch('/api/v1/user/me/', { credentials: 'include' }).catch(() => {});
  } catch(e) {}

  showBanner('Click "My Timeline" or any course on this page to auto-launch.');
})();`;

  const copyAndOpenLMS = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanSnippet = interceptorSnippet.replace(/\n\s+/g, ' ');
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(cleanSnippet);
      }
    } catch (err) {
      console.warn("Clipboard copy warning:", err);
    }
    setCopiedInterceptor(true);
    setTimeout(() => setCopiedInterceptor(false), 3000);

    // Automatically launch / open LMS in a new tab
    const lmsUrl = "https://my.newtonschool.co/course/u4fvf1rm9v2e/details?tab=my-timeline";
    window.open(lmsUrl, '_blank');
  };

  const bookmarkletHref = `javascript:${encodeURIComponent(interceptorSnippet.replace(/\n\s+/g, ' '))}`;

  // Mathematical calculation engine
  const calculateAttendanceStats = useCallback((attended, total, thresholdPercent) => {
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
  }, []);

  // Modify simulated attendance for a specific subject
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

  // Processed subjects list with live simulations and math applied
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
  }, [subjectsData, adjustments, targetThreshold, calculateAttendanceStats]);

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
  }, [processedSubjects, overallPerf, targetThreshold, calculateAttendanceStats]);

  // Filtered subjects based on search query and status filter
  const filteredSubjects = useMemo(() => {
    return processedSubjects.filter(sub => {
      const matchesSearch = searchQuery === '' ||
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.shortName && sub.shortName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        sub.hash.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'safe') return sub.status === 'safe' || sub.status === 'warning';
      if (statusFilter === 'warning') return sub.status === 'warning';
      if (statusFilter === 'danger') return sub.status === 'danger';
      if (statusFilter === 'simulated') return sub.hasAdjustments;
      return true;
    });
  }, [processedSubjects, searchQuery, statusFilter]);

  // Health summary metrics
  const healthStats = useMemo(() => {
    const total = processedSubjects.length;
    const safeCount = processedSubjects.filter(s => s.status === 'safe' || s.status === 'warning').length;
    const dangerCount = processedSubjects.filter(s => s.status === 'danger').length;
    const totalSimulations = Object.values(adjustments).reduce((acc, curr) => acc + Math.abs(curr.adjAttended || 0) + Math.abs(curr.adjTotal || 0), 0);

    return { total, safeCount, dangerCount, totalSimulations };
  }, [processedSubjects, adjustments]);

  // Custom Groups Management
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
      {/* Auto-scrolling Ticker (Flat Art Pattern) */}
      <div className="ticker-container">
        <div className="ticker-track">
          {/* Target Threshold & Overall Delta */}
          <div className="ticker-item">
            <span className={`status-dot ${overallStats.percent >= targetThreshold ? 'green' : 'yellow'}`}></span>
            <span>Target Threshold: {targetThreshold}%</span>
            <span className="pixel-tag">
              {overallStats.percent >= targetThreshold
                ? `BUFFER +${(overallStats.percent - targetThreshold).toFixed(1)}% (${overallStats.bunkable} BUNKABLE)`
                : `NEED +${(targetThreshold - overallStats.percent).toFixed(1)}% (ATTEND ${overallStats.required})`}
            </span>
          </div>

          {/* Dynamic Subject Status Stream */}
          {(processedSubjects.length > 0 ? processedSubjects : [
            { hash: 'dsa', name: 'DSA & Algorithms', percent: 92.4, status: 'safe' },
            { hash: 'web', name: 'Advanced Web Dev', percent: 88.5, status: 'safe' },
            { hash: 'os', name: 'Operating Systems', percent: 85.0, status: 'safe' },
            { hash: 'dbms', name: 'Database Management', percent: 68.2, status: 'danger' }
          ]).map(sub => (
            <div key={sub.hash} className="ticker-item">
              <span className={`status-dot ${sub.status === 'safe' ? 'green' : sub.status === 'warning' ? 'yellow' : 'red'}`}></span>
              <span>{sub.shortName || sub.name}</span>
              <span className="pixel-tag">
                {sub.percent.toFixed(1)}% {sub.status === 'safe' ? 'SAFE' : sub.status === 'warning' ? 'CAUTION' : 'LOW'}
              </span>
            </div>
          ))}

          {/* Repeat for continuous 40s seamless loop */}
          <div className="ticker-item">
            <span className={`status-dot ${overallStats.percent >= targetThreshold ? 'green' : 'yellow'}`}></span>
            <span>Target Threshold: {targetThreshold}%</span>
            <span className="pixel-tag">
              {overallStats.percent >= targetThreshold
                ? `BUFFER +${(overallStats.percent - targetThreshold).toFixed(1)}% (${overallStats.bunkable} BUNKABLE)`
                : `NEED +${(targetThreshold - overallStats.percent).toFixed(1)}% (ATTEND ${overallStats.required})`}
            </span>
          </div>

          {(processedSubjects.length > 0 ? processedSubjects : [
            { hash: 'dsa', name: 'DSA & Algorithms', percent: 92.4, status: 'safe' },
            { hash: 'web', name: 'Advanced Web Dev', percent: 88.5, status: 'safe' },
            { hash: 'os', name: 'Operating Systems', percent: 85.0, status: 'safe' },
            { hash: 'dbms', name: 'Database Management', percent: 68.2, status: 'danger' }
          ]).map(sub => (
            <div key={`dup-${sub.hash}`} className="ticker-item">
              <span className={`status-dot ${sub.status === 'safe' ? 'green' : sub.status === 'warning' ? 'yellow' : 'red'}`}></span>
              <span>{sub.shortName || sub.name}</span>
              <span className="pixel-tag">
                {sub.percent.toFixed(1)}% {sub.status === 'safe' ? 'SAFE' : sub.status === 'warning' ? 'CAUTION' : 'LOW'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Flat Art Course Header Navigation */}
      <nav className="art-nav">
        <div className="nav-brand-group">
          <div className="brand-icon-box">
            NST
          </div>
          <div className="brand-details">
            <div className="brand-title-row">
              <span className="brand-main-title">Newton School Attendance</span>
              {isAuthenticated && (
                <span className={`tag-badge ${isDemoMode ? 'orange' : 'terracotta'}`}>
                  <span className={`status-dot ${isDemoMode ? 'yellow' : 'green'}`}></span>
                  {isDemoMode ? 'Sandbox Demo' : 'Live LMS Sync'}
                </span>
              )}
            </div>
            {profile && (
              <span className="user-tagline">
                Student: <strong>{profile.first_name} {profile.last_name}</strong> · <span className="font-mono">@{profile.username || profile.email?.split('@')[0]}</span>
              </span>
            )}
          </div>
        </div>

        <div className="nav-controls">
          {isAuthenticated && (
            <button
              className="btn-art btn-art-secondary"
              onClick={() => isDemoMode ? enableDemoMode() : loadLiveDashboard(token, selectedSemesterHash)}
              disabled={loading}
              title="Resync data from LMS"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh LMS</span>
            </button>
          )}

          {isAuthenticated && (
            <button
              className="btn-art btn-art-destructive"
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
           CONNECT GATEWAY (Flat Art Course Workbook Style)
           ========================================================================== */
        <div>
          <div className="connect-hero-box">
            <div className="hero-pill-badge">
              <BookOpen size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
              <span>FLAT ART COURSE // ATTENDANCE WORKBOOK</span>
            </div>
            <h1 className="hero-main-heading">
              Calculate bunk capacity with <span className="hero-accent-text">mathematical certainty</span>.
            </h1>
            <p className="hero-description">
              A warm, paper-like attendance workbook for Newton School students. Real-time LMS telemetry, exact bunk quotas, and multi-course simulation.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <button className="btn-art btn-art-primary" onClick={copyAndOpenLMS} style={{ padding: '0.85rem 1.75rem', fontSize: '0.94rem' }}>
                <Zap size={16} />
                <span>{copiedInterceptor ? 'Copied & Opening LMS! 🚀' : '⚡ 1-Click Intercept & Open LMS'}</span>
              </button>
              <button className="btn-art btn-art-secondary" onClick={enableDemoMode} style={{ padding: '0.85rem 1.75rem', fontSize: '0.94rem' }}>
                <Play size={16} />
                <span>Explore Live Demo Sandbox</span>
              </button>
            </div>
          </div>

          <div className="connect-grid-layout">
            {/* Card 1: Direct Bearer Token Input */}
            <div className="art-card">
              <div className="art-card-header">
                <div>
                  <span className="tag-badge terracotta" style={{ marginBottom: '0.5rem' }}>01 // DIRECT TOKEN</span>
                  <h3 className="art-card-title">🔑 Direct Bearer Token</h3>
                </div>
                <span className="tag-badge green">Instant</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.55 }}>
                Paste your active Bearer token or JWT session key copied from network request headers:
              </p>

              <form onSubmit={handleConnect}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Bearer Token / JWT:
                  </label>
                  <textarea
                    rows={4}
                    className="art-select font-mono"
                    style={{ width: '100%', resize: 'none', fontSize: '0.82rem', padding: '0.75rem', borderRadius: 'var(--radius-nested)' }}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... or Bearer token"
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value)}
                  />
                </div>

                {error && (
                  <div style={{ color: 'var(--destructive)', backgroundColor: 'var(--destructive-subtle)', border: '1.5px solid hsl(0, 84%, 60%, 0.3)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-button)', fontSize: '0.84rem', marginBottom: '1rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <button type="submit" className="btn-art btn-art-primary" style={{ flex: 1 }} disabled={loading}>
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    <span>Load Attendance</span>
                  </button>
                  <button type="button" className="btn-art btn-art-secondary" onClick={enableDemoMode} title="Try without credentials">
                    Demo Mode
                  </button>
                </div>
              </form>

              <ul className="instructions-list" style={{ marginTop: '1.25rem' }}>
                <li className="instruction-step">
                  <span className="step-num-badge">1</span>
                  <span>Open <a href="https://my.newtonschool.co/course/u4fvf1rm9v2e/details?tab=my-timeline" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>Newton School LMS <ExternalLink size={11} style={{ display: 'inline' }} /></a> &rarr; Press <kbd>F12</kbd></span>
                </li>
                <li className="instruction-step">
                  <span className="step-num-badge">2</span>
                  <span>Go to <strong>Network</strong> tab &rarr; Filter for <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>/api/</code></span>
                </li>
                <li className="instruction-step">
                  <span className="step-num-badge">3</span>
                  <span>Copy <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>Authorization</code> header value & paste above</span>
                </li>
              </ul>
            </div>

            {/* Card 2: Network Request Interceptor */}
            <div className="art-card">
              <div className="art-card-header">
                <div>
                  <span className="tag-badge pink" style={{ marginBottom: '0.5rem' }}>02 // 1-CLICK INTERCEPTOR</span>
                  <h3 className="art-card-title">🛰️ Network Interceptor</h3>
                </div>
                <button
                  className="btn-art btn-art-primary"
                  onClick={copyAndOpenLMS}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem', borderRadius: 'var(--radius-pill)' }}
                >
                  {copiedInterceptor ? <Check size={13} /> : <Zap size={13} />}
                  <span>{copiedInterceptor ? 'Opening LMS...' : '1-Click Launch'}</span>
                </button>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Click below to copy the console command and auto-launch Newton School LMS in 1 click:
              </p>

              <div className="workbook-code-box">
                <div className="workbook-code-header">
                  <span className="workbook-code-title">JAVASCRIPT // network_interceptor.js</span>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <a
                      href={bookmarkletHref}
                      className="btn-art btn-art-secondary"
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem', borderRadius: 'var(--radius-pill)', textDecoration: 'none' }}
                      title="Drag this button to your browser bookmarks bar for 1-click sync!"
                      onClick={(e) => copyAndOpenLMS(e)}
                    >
                      <span>🔖 Bookmarklet</span>
                    </a>
                    <button
                      className="btn-art btn-art-primary"
                      onClick={copyAndOpenLMS}
                      style={{ padding: '0.2rem 0.65rem', fontSize: '0.72rem', borderRadius: 'var(--radius-pill)' }}
                    >
                      {copiedInterceptor ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedInterceptor ? 'Copied' : 'Copy & Open LMS'}</span>
                    </button>
                  </div>
                </div>
                <div className="workbook-code-body">
                  {interceptorSnippet.slice(0, 120)}... [Click button to auto-copy & launch LMS]
                </div>
              </div>

              <ul className="instructions-list">
                <li className="instruction-step">
                  <span className="step-num-badge">1</span>
                  <span>Click <strong>1-Click Launch</strong> (copies command & automatically opens LMS)</span>
                </li>
                <li className="instruction-step">
                  <span className="step-num-badge">2</span>
                  <span>On LMS, press <kbd>F12</kbd> &rarr; <strong>Console</strong> &rarr; <kbd>Cmd/Ctrl</kbd>+<kbd>V</kbd> &rarr; <kbd>Enter</kbd></span>
                </li>
                <li className="instruction-step">
                  <span className="step-num-badge">3</span>
                  <span>The script auto-detects session credentials and redirects back immediately! (Or drag <strong>🔖 Bookmarklet</strong> to your bookmarks bar for 1-click sync)</span>
                </li>
              </ul>
            </div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={16} color="var(--primary)" />
            <span>Zero-Trust Architecture: Your session tokens remain stored strictly in local browser memory and never leave your machine.</span>
          </div>
        </div>
      ) : (
        /* ==========================================================================
           AUTHENTICATED COMMAND CENTER (Flat Art Course Workbook Dashboard)
           ========================================================================== */
        <div>
          {/* Top Intelligence Toolbar */}
          <div className="toolbar-panel">
            <div className="toolbar-group">
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Sector / Semester:</span>
              {semesters.length > 0 ? (
                <select
                  className="art-select"
                  value={selectedSemesterHash}
                  onChange={(e) => handleSemesterChange(e.target.value)}
                >
                  {semesters.map(s => (
                    <option key={s.hash} value={s.hash}>
                      {s.title} {s.isActive ? '· [Current Active]' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                  {semesterTitle} ({selectedSemesterHash})
                </span>
              )}
            </div>

            <div className="toolbar-group">
              <div className="target-slider-box">
                <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Target:</span>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={targetThreshold}
                  onChange={(e) => setTargetThreshold(parseInt(e.target.value))}
                  className="art-range-input"
                />
                <span className="target-slider-number">{targetThreshold}%</span>
              </div>

              <div className="preset-pills-cluster">
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
                  className="btn-art btn-art-secondary"
                  onClick={resetAllAdjustments}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                >
                  <RotateCcw size={13} />
                  <span>Reset Overrides ({healthStats.totalSimulations})</span>
                </button>
              )}
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--destructive)', backgroundColor: 'var(--destructive-subtle)', border: '2px solid var(--destructive)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-button)', fontSize: '0.88rem', marginBottom: '1.75rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* 4 Flat Metric Hero Tiles */}
          <div className="metrics-grid">
            {/* Tile 1: Overall Percentage */}
            <div className="metric-tile">
              <div className="metric-top-row">
                <div className="metric-label-group">
                  <span className={`status-dot ${overallStats.status === 'safe' ? 'green' : overallStats.status === 'warning' ? 'yellow' : 'red'}`}></span>
                  <span>AGGREGATE RATE</span>
                </div>
                <span className={`tag-badge ${overallStats.percent >= targetThreshold ? 'green' : 'red'}`}>
                  {overallStats.percent >= targetThreshold ? 'COMPLIANT' : 'LOW ATTENDANCE'}
                </span>
              </div>
              <div className="metric-number-row">
                <span className="metric-large-val">{overallStats.percent.toFixed(1)}%</span>
              </div>
              <span className="metric-note">
                {overallStats.percent >= targetThreshold
                  ? `Safely above minimum target of ${targetThreshold}%`
                  : `Currently below mandated ${targetThreshold}% threshold`
                }
              </span>
            </div>

            {/* Tile 2: Net Action Verdict */}
            <div className="metric-tile">
              <div className="metric-top-row">
                <div className="metric-label-group">
                  <span className={`status-dot ${overallStats.percent >= targetThreshold ? 'green' : 'red'}`}></span>
                  <span>ACTION VERDICT</span>
                </div>
                {overallStats.percent >= targetThreshold ? <Flame size={18} color="var(--primary)" /> : <AlertTriangle size={18} color="var(--destructive)" />}
              </div>
              <div className="metric-number-row">
                <span className="metric-large-val" style={{ color: overallStats.percent >= targetThreshold ? 'var(--status-green)' : 'var(--destructive)' }}>
                  {overallStats.percent >= targetThreshold
                    ? `Bunk ${overallStats.bunkable} ${overallStats.bunkable === 1 ? 'Class' : 'Classes'}`
                    : `Attend ${overallStats.required} ${overallStats.required === 1 ? 'Class' : 'Classes'}`
                  }
                </span>
              </div>
              <span className="metric-note">
                {overallStats.percent >= targetThreshold
                  ? `+${(overallStats.percent - targetThreshold).toFixed(1)}% buffer · Safe to skip ${overallStats.bunkable} ${overallStats.bunkable === 1 ? 'lecture' : 'lectures'} while staying ≥ ${targetThreshold}%`
                  : `Need +${(targetThreshold - overallStats.percent).toFixed(1)}% · Must attend ${overallStats.required} consecutive ${overallStats.required === 1 ? 'lecture' : 'lectures'} to reach ${targetThreshold}%`
                }
              </span>
            </div>

            {/* Tile 3: Attendance Ratio */}
            <div className="metric-tile">
              <div className="metric-top-row">
                <div className="metric-label-group">
                  <span className="status-dot gray"></span>
                  <span>TOTAL RATIO</span>
                </div>
                <Calculator size={18} color="var(--text-muted)" />
              </div>
              <div className="metric-number-row">
                <span className="metric-large-val font-mono">{overallStats.attended} <span style={{ fontSize: '1.3rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {overallStats.total}</span></span>
              </div>
              <span className="metric-note">
                Total lectures attended across all enrolled subjects
              </span>
            </div>

            {/* Tile 4: Course Health Breakdown */}
            <div className="metric-tile">
              <div className="metric-top-row">
                <div className="metric-label-group">
                  <span className="status-dot yellow"></span>
                  <span>COURSE HEALTH</span>
                </div>
                <Layers size={18} color="var(--tag-gold)" />
              </div>
              <div className="metric-number-row">
                <span className="metric-large-val font-mono">{healthStats.safeCount} <span style={{ fontSize: '1.3rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {healthStats.total}</span></span>
                <span className="tag-badge green">SAFE</span>
              </div>
              <span className="metric-note">
                {healthStats.dangerCount === 0
                  ? 'All enrolled courses currently in good standing'
                  : `${healthStats.dangerCount} course(s) require immediate attendance boost`
                }
              </span>
            </div>
          </div>

          {/* Quick Batch Simulator Strip */}
          <div className="batch-simulator-card">
            <div className="batch-info-cluster">
              <Sparkles size={20} color="var(--primary)" />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.15rem' }}>
                  <span className="tag-badge terracotta">WHAT-IF ENGINE // PROJECTIONS</span>
                  {healthStats.totalSimulations > 0 && (
                    <span className="tag-badge orange">
                      {healthStats.totalSimulations} ACTIVE OVERRIDE{healthStats.totalSimulations > 1 ? 'S' : ''}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Simulate universal schedule scenarios to test your attendance:
                </span>
              </div>
            </div>

            <div className="batch-actions-cluster">
              <button className="btn-art btn-art-secondary" onClick={() => applyBatchSimulation('attend_all', 1)} style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
                <Plus size={13} color="var(--status-green)" />
                <span>+1 All (Day Present)</span>
              </button>
              <button className="btn-art btn-art-secondary" onClick={() => applyBatchSimulation('miss_all', 1)} style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
                <Minus size={13} color="var(--destructive)" />
                <span>+1 Miss All (Bunk Day)</span>
              </button>
              <button className="btn-art btn-art-secondary" onClick={() => applyBatchSimulation('attend_all', 3)} style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
                <span>+3 Full Week Present</span>
              </button>
              <button className="btn-art btn-art-secondary" onClick={() => applyBatchSimulation('miss_all', 3)} style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
                <span>Miss Full Week</span>
              </button>
              <button
                className={`btn-art ${healthStats.totalSimulations > 0 ? 'btn-art-destructive' : 'btn-art-secondary'}`}
                onClick={resetAllAdjustments}
                disabled={healthStats.totalSimulations === 0}
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                title="Reset all simulated adjustments back to portal values"
              >
                <RotateCcw size={13} />
                <span>Reset All {healthStats.totalSimulations > 0 ? `(${healthStats.totalSimulations})` : ''}</span>
              </button>
            </div>
          </div>

          {/* Search, Filter & View Controls */}
          <div className="filter-search-row">
            <div className="search-field-box">
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search course name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="filter-tabs-cluster">
              <button
                className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                <span>All Courses</span>
                <span className="filter-num">{processedSubjects.length}</span>
              </button>
              <button
                className={`filter-tab ${statusFilter === 'safe' ? 'active' : ''}`}
                onClick={() => setStatusFilter('safe')}
              >
                <span className="status-dot green"></span>
                <span>Safe</span>
                <span className="filter-num">{processedSubjects.filter(s => s.status === 'safe' || s.status === 'warning').length}</span>
              </button>
              <button
                className={`filter-tab ${statusFilter === 'warning' ? 'active' : ''}`}
                onClick={() => setStatusFilter('warning')}
              >
                <span className="status-dot yellow"></span>
                <span>Caution</span>
                <span className="filter-num">{processedSubjects.filter(s => s.status === 'warning').length}</span>
              </button>
              <button
                className={`filter-tab ${statusFilter === 'danger' ? 'active' : ''}`}
                onClick={() => setStatusFilter('danger')}
              >
                <span className="status-dot red"></span>
                <span>Low Attendance</span>
                <span className="filter-num">{processedSubjects.filter(s => s.status === 'danger').length}</span>
              </button>
              {healthStats.totalSimulations > 0 && (
                <button
                  className={`filter-tab ${statusFilter === 'simulated' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('simulated')}
                >
                  <Sparkles size={12} color="var(--primary)" />
                  <span>Simulated</span>
                  <span className="filter-num">{processedSubjects.filter(s => s.hasAdjustments).length}</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Content Layout Grid */}
          <div className="main-course-grid">
            {/* Left Column: Subject Cards Stream */}
            <div>
              {loading ? (
                <div className="courses-stream">
                  <div className="art-skeleton"></div>
                  <div className="art-skeleton"></div>
                  <div className="art-skeleton"></div>
                  <div className="art-skeleton"></div>
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="art-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
                  <Search size={32} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)' }}>No Courses Match Search</h3>
                  <p style={{ fontSize: '0.88rem' }}>Try refining your query or reset the status filter.</p>
                </div>
              ) : (
                <div className="courses-stream">
                  {filteredSubjects.map(subject => (
                    <div key={subject.hash} className="course-card">
                      {/* Course Card Header */}
                      <div>
                        <div className="course-top-meta">
                          <div>
                            <h4 className="course-name-heading">{subject.name}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                              <span className="tag-badge terracotta">#{subject.shortName || subject.hash}</span>
                              <span className={`status-dot ${subject.status === 'safe' ? 'green' : subject.status === 'warning' ? 'yellow' : 'red'}`}></span>
                            </div>
                          </div>

                          <div className="course-rate-col">
                            <div className="rate-big-pct" style={{ color: subject.status === 'safe' ? 'var(--status-green)' : subject.status === 'warning' ? 'var(--tag-gold)' : 'var(--destructive)' }}>
                              {subject.percent.toFixed(1)}%
                            </div>
                            <div className="rate-fraction-text">
                              {subject.attended} / {subject.total} classes
                            </div>
                          </div>
                        </div>

                        {/* Flat Progress Bar with Target Marker */}
                        <div style={{ marginTop: '1rem' }}>
                          <div className="flat-progress-rail">
                            <div
                              className={`flat-progress-fill ${subject.status}`}
                              style={{ width: `${Math.min(100, Math.max(0, subject.percent))}%` }}
                            ></div>
                            <div
                              className="progress-notch"
                              style={{ left: `${targetThreshold}%` }}
                              title={`Target: ${targetThreshold}%`}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Action Verdict Banner */}
                      <div className={`action-verdict-box ${subject.status}`}>
                        {subject.total === 0 ? (
                          <>
                            <Info size={16} />
                            <span>No lectures conducted yet.</span>
                          </>
                        ) : subject.percent >= targetThreshold ? (
                          <>
                            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                            <span>
                              Safe to bunk <strong>{subject.bunkable}</strong> more {subject.bunkable === 1 ? 'class' : 'classes'} while staying &ge; {targetThreshold}%.
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                            <span>
                              Must attend <strong>{subject.required}</strong> consecutive {subject.required === 1 ? 'class' : 'classes'} to reach {targetThreshold}%.
                            </span>
                          </>
                        )}
                      </div>

                      {/* Interactive Tactile Stepper Simulator */}
                      <div className="stepper-simulator-panel">
                        <div className="stepper-header-row">
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Sliders size={12} color="var(--primary)" />
                            WHAT-IF ADJUSTMENTS
                          </span>
                          {subject.hasAdjustments && (
                            <button
                              onClick={() => resetAdjustment(subject.hash)}
                              className="btn-art btn-art-destructive"
                              style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', height: 'auto', borderRadius: 'var(--radius-pill)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              title="Reset simulation for this course"
                            >
                              <RotateCcw size={10} />
                              <span>Reset</span>
                            </button>
                          )}
                        </div>

                        <div className="stepper-grid-units">
                          {/* Attend Stepper */}
                          <div className="stepper-unit-box">
                            <span className="stepper-unit-label">ATTEND (+1)</span>
                            <div className="stepper-pill-controls">
                              <button
                                className="stepper-click-btn"
                                onClick={() => adjustSubjectAttendance(subject.hash, 'attend', -1)}
                                title="Subtract simulated attend"
                              >
                                -
                              </button>
                              <span className={`stepper-count-num ${subject.adjAttended > 0 ? 'active-plus' : ''}`}>
                                {subject.adjAttended >= 0 ? `+${subject.adjAttended}` : subject.adjAttended}
                              </span>
                              <button
                                className="stepper-click-btn"
                                onClick={() => adjustSubjectAttendance(subject.hash, 'attend', 1)}
                                title="Add simulated attend"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Miss Stepper */}
                          <div className="stepper-unit-box">
                            <span className="stepper-unit-label">MISS (+1)</span>
                            <div className="stepper-pill-controls">
                              <button
                                className="stepper-click-btn"
                                onClick={() => adjustSubjectAttendance(subject.hash, 'miss', -1)}
                                title="Subtract simulated miss"
                              >
                                -
                              </button>
                              <span className={`stepper-count-num ${subject.adjTotal - subject.adjAttended > 0 ? 'active-minus' : ''}`}>
                                +{subject.adjTotal - subject.adjAttended}
                              </span>
                              <button
                                className="stepper-click-btn"
                                onClick={() => adjustSubjectAttendance(subject.hash, 'miss', 1)}
                                title="Add simulated miss"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {subject.hasAdjustments && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                            LMS: {subject.rawAttended}/{subject.rawTotal} &rarr; Projected: {subject.attended}/{subject.total}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Custom Subject Groups & Math Proofs */}
            <div className="sidebar-column">

              {/* Subject Groups Card */}
              <div className="art-card">
                <div className="art-card-header">
                  <div>
                    <span className="tag-badge pink" style={{ marginBottom: '0.4rem' }}>AGGREGATIONS</span>
                    <h3 className="art-card-title">Subject Groups</h3>
                  </div>
                  <button
                    className="btn-art btn-art-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    onClick={() => setShowCreateGroup(prev => !prev)}
                  >
                    <FolderPlus size={13} />
                    <span>New Group</span>
                  </button>
                </div>

                {/* Create Group Form Drawer */}
                {showCreateGroup && (
                  <form onSubmit={handleCreateGroup} style={{ backgroundColor: 'var(--bg-muted)', padding: '1rem', borderRadius: 'var(--radius-nested)', border: '2px solid var(--border-color)', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Group Title:</span>
                    <input
                      type="text"
                      placeholder="e.g. Lab Practicals, Theory Bucket"
                      className="art-select"
                      style={{ width: '100%', marginBottom: '0.75rem' }}
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />

                    <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Select Courses:</span>
                    <div style={{ maxHeight: '140px', overflowY: 'auto', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-button)', padding: '0.5rem', backgroundColor: 'var(--bg-surface)', marginBottom: '0.85rem' }}>
                      {processedSubjects.map(sub => (
                        <label key={sub.hash} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-primary)', padding: '0.3rem 0', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={newGroupSubjects.includes(sub.hash)}
                            onChange={() => toggleGroupSubject(sub.hash)}
                          />
                          <span>{sub.name}</span>
                        </label>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" className="btn-art btn-art-primary" style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem' }}>Create Group</button>
                      <button type="button" className="btn-art btn-art-secondary" style={{ padding: '0.45rem', fontSize: '0.8rem' }} onClick={() => setShowCreateGroup(false)}>Cancel</button>
                    </div>
                  </form>
                )}

                {/* Groups List */}
                <div>
                  {groups.length === 0 ? (
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
                      No custom groups created. Groups let you aggregate combined attendance across combinations of subjects.
                    </p>
                  ) : (
                    groups.map(group => {
                      const stats = getGroupStats(group);
                      return (
                        <div key={group.id} className="group-item-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <div>
                              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.96rem', color: 'var(--text-primary)' }}>{group.name}</div>
                              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                {group.subjectHashes.length} course(s) aggregated
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteGroup(group.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--destructive)', cursor: 'pointer', opacity: 0.7 }}
                              title="Delete Group"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '0.6rem 0' }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.35rem', color: stats.status === 'safe' ? 'var(--status-green)' : stats.status === 'warning' ? 'var(--tag-gold)' : 'var(--destructive)' }}>
                              {stats.percent.toFixed(1)}%
                            </span>
                            <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stats.attended} / {stats.total} classes</span>
                          </div>

                          {/* Group Target Slider */}
                          <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>Target: {stats.threshold}%</span>
                            <input
                              type="range"
                              min="50"
                              max="100"
                              value={stats.threshold}
                              onChange={(e) => handleUpdateGroupThreshold(group.id, e.target.value)}
                              className="art-range-input"
                              style={{ width: '80px' }}
                            />
                          </div>

                          <div className={`action-verdict-box ${stats.status}`} style={{ marginTop: '0.6rem', padding: '0.5rem 0.75rem', fontSize: '0.78rem' }}>
                            {stats.percent >= stats.threshold ? (
                              <>
                                <CheckCircle2 size={14} />
                                <span>Safe to bunk <strong>{stats.bunkable}</strong> classes</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle size={14} />
                                <span>Must attend <strong>{stats.required}</strong> consecutive classes</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Mathematical Proofs Workbook Card */}
              <div className="art-card">
                <div className="art-card-header" style={{ marginBottom: '0.75rem' }}>
                  <div>
                    <span className="tag-badge gold" style={{ marginBottom: '0.4rem' }}>ALGORITHMS</span>
                    <h4 className="art-card-title" style={{ fontSize: '1.05rem' }}>Formulas & Proofs</h4>
                  </div>
                  <Code2 size={18} color="var(--primary)" />
                </div>

                <div className="formula-card-content">
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.84rem' }}>Bunkable Class Capacity:</strong>
                    <code className="formula-code-line">
                      ⌊(Attended - T × Total) / T⌋
                    </code>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Where T = Target % / 100.</span>
                  </div>

                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.84rem' }}>Recovery Requirement:</strong>
                    <code className="formula-code-line">
                      ⌈(T × Total - Attended) / (1 - T)⌉
                    </code>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Consecutive lectures needed to restore threshold.</span>
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
