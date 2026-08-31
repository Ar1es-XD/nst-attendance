import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
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
  Play,
  Flame,
  Layers,
  BookOpen
} from 'lucide-react';

const API_BASE = "";

// Realistic baseline demo data for previewing without credentials
const DEMO_SEMESTERS = [
  {
    hash: 'u4fvf1rm9v2e',
    title: "Newton School of Technology'25 (CS) (SVYASA) - Semester 3",
    shortName: "S3 B'25-CS",
    isActive: true,
    learningUnits: [
      { id: 1, hash: 'y4jra1o5yjcj', title: "Analysis and Design of Algorithms", short_display_name: 'ADA' },
      { id: 2, hash: 'x3300pxoaayu', title: "Analysis and Design of Algorithms Lab 2", short_display_name: 'ADA Lab 2' },
      { id: 3, hash: 'ar66n55tzlgl', title: "Advanced Programming", short_display_name: 'Advanced Programming' },
      { id: 4, hash: '3d7pc6pq59so', title: "AI for Interdisciplinary Applications", short_display_name: 'AI - IA' },
      { id: 5, hash: 'pqnjkav8dobe', title: "AI for Interdisciplinary Applications Lab", short_display_name: 'AI lab' },
      { id: 6, hash: 'rw4p1qnhjcfn', title: "Advanced Programming Lab 2", short_display_name: 'AP Lab 2' },
      { id: 7, hash: 'oojehllgsouk', title: "Calculus and linear Algebra for AI", short_display_name: 'Calculus and Algebra' },
      { id: 8, hash: 'qobpbvdsyekt', title: "Data Engineering", short_display_name: 'Data Engineering' },
      { id: 9, hash: 'onr65jwzgdgj', title: "Data Engineering Lab 2", short_display_name: 'DE Lab 2' },
      { id: 10, hash: 'abqtra71lo83', title: "Calculus and linear Algebra for AI Lab 2", short_display_name: 'Maths-3 Lab 2' },
      { id: 11, hash: 'pplfefkvvgtw', title: "YOGA 2", short_display_name: 'YOGA 2' }
    ]
  },
  {
    hash: 'c6ootz3nd2y8',
    title: "Newton School of Technology'25 (CS) (SVYASA) - Semester 2",
    shortName: "S2 B'25-CS",
    isActive: false,
    learningUnits: [
      { id: 101, hash: 'lpy9ubdndi3h', title: "Data Structures & Algorithms", short_display_name: 'DSA' },
      { id: 102, hash: 'ba5zr8ljtuei', title: "Web Application Programming", short_display_name: 'WAP' }
    ]
  }
];

const DEMO_PERFORMANCES = {
  'u4fvf1rm9v2e': { total_lectures: 49, total_lectures_attended: 41 },
  'y4jra1o5yjcj': { total_lectures: 5, total_lectures_attended: 5 },
  'x3300pxoaayu': { total_lectures: 4, total_lectures_attended: 4 },
  'ar66n55tzlgl': { total_lectures: 5, total_lectures_attended: 4 },
  '3d7pc6pq59so': { total_lectures: 2, total_lectures_attended: 1 },
  'pqnjkav8dobe': { total_lectures: 2, total_lectures_attended: 2 },
  'rw4p1qnhjcfn': { total_lectures: 6, total_lectures_attended: 4 },
  'oojehllgsouk': { total_lectures: 6, total_lectures_attended: 5 },
  'qobpbvdsyekt': { total_lectures: 4, total_lectures_attended: 4 },
  'onr65jwzgdgj': { total_lectures: 3, total_lectures_attended: 3 },
  'abqtra71lo83': { total_lectures: 6, total_lectures_attended: 4 },
  'pplfefkvvgtw': { total_lectures: 7, total_lectures_attended: 5 },
  'c6ootz3nd2y8': { total_lectures: 80, total_lectures_attended: 68 }
};

const DEMO_PROFILE = {
  first_name: 'NST',
  last_name: 'Student',
  email: 'student@newtonschool.co',
  username: 'nst_cs25'
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
      { id: 'group-theory', name: 'Core CS Theory', subjectHashes: ['y4jra1o5yjcj', 'ar66n55tzlgl', 'oojehllgsouk'], threshold: 75 },
      { id: 'group-labs', name: 'Practical & Labs', subjectHashes: ['x3300pxoaayu', 'rw4p1qnhjcfn', 'abqtra71lo83'], threshold: 80 }
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
    setSelectedSemesterHash('u4fvf1rm9v2e');
    setSemesterTitle("Newton School of Technology'25 (CS) (SVYASA) - Semester 3");
    setOverallPerf(DEMO_PERFORMANCES['u4fvf1rm9v2e']);

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
          throw new Error('Authentication expired (401 Unauthorized). Please paste a fresh Bearer token.');
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

      // 4. Fetch Each Individual Subject's Performance Concurrently
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
  const handleConnect = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const clean = inputToken.replace(/^Bearer\s+/i, '').trim();
    if (!clean || clean.length < 20) {
      setError('Please paste a valid Bearer token (minimum 20 characters).');
      return;
    }
    localStorage.setItem('newton_bearer_token', clean);
    setIsDemoMode(false);
    setToken(clean);
    await loadLiveDashboard(clean, selectedSemesterHash);
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
      if (threshold >= 1) {
        return { percent, status: 'danger', bunkable: 0, required: 999 };
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

  // Processed subjects with what-if simulations
  const processedSubjects = useMemo(() => {
    return subjectsData.map(subject => {
      const adj = adjustments[subject.hash] || { attended: 0, missed: 0 };
      const simulatedAttended = Math.max(0, subject.rawAttended + adj.attended);
      const simulatedMissed = Math.max(0, adj.missed);
      const simulatedTotal = Math.max(0, subject.rawTotal + adj.attended + simulatedMissed);

      const stats = calculateAttendanceStats(simulatedAttended, simulatedTotal, targetThreshold);
      const isSimulated = adj.attended !== 0 || adj.missed !== 0;

      return {
        ...subject,
        attended: simulatedAttended,
        total: simulatedTotal,
        percent: stats.percent,
        status: stats.status,
        bunkable: stats.bunkable,
        required: stats.required,
        isSimulated,
        adjustments: adj
      };
    });
  }, [subjectsData, adjustments, targetThreshold, calculateAttendanceStats]);

  // Overall aggregate metrics
  const overallStats = useMemo(() => {
    let totalAttended = 0;
    let totalClasses = 0;

    if (processedSubjects.length > 0) {
      processedSubjects.forEach(s => {
        totalAttended += s.attended;
        totalClasses += s.total;
      });
    } else {
      totalAttended = overallPerf.total_lectures_attended || 0;
      totalClasses = overallPerf.total_lectures || 0;
    }

    const stats = calculateAttendanceStats(totalAttended, totalClasses, targetThreshold);

    return {
      attended: totalAttended,
      total: totalClasses,
      percent: stats.percent,
      status: stats.status,
      bunkable: stats.bunkable,
      required: stats.required
    };
  }, [processedSubjects, overallPerf, targetThreshold, calculateAttendanceStats]);

  // Simulation Handlers
  const handleSimulateAttend = (subjectHash) => {
    setAdjustments(prev => {
      const current = prev[subjectHash] || { attended: 0, missed: 0 };
      return {
        ...prev,
        [subjectHash]: { ...current, attended: current.attended + 1 }
      };
    });
  };

  const handleSimulateBunk = (subjectHash) => {
    setAdjustments(prev => {
      const current = prev[subjectHash] || { attended: 0, missed: 0 };
      return {
        ...prev,
        [subjectHash]: { ...current, missed: current.missed + 1 }
      };
    });
  };

  const resetSubjectAdjustments = (subjectHash) => {
    setAdjustments(prev => {
      const next = { ...prev };
      delete next[subjectHash];
      return next;
    });
  };

  const resetAllAdjustments = () => {
    setAdjustments({});
  };

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    return processedSubjects.filter(sub => {
      const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (sub.shortName && sub.shortName.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'safe') return sub.status === 'safe';
      if (statusFilter === 'warning') return sub.status === 'warning';
      if (statusFilter === 'danger') return sub.status === 'danger';
      if (statusFilter === 'simulated') return sub.isSimulated;
      return true;
    });
  }, [processedSubjects, searchQuery, statusFilter]);

  // Health summary metrics
  const healthStats = useMemo(() => {
    const total = processedSubjects.length;
    const safeCount = processedSubjects.filter(s => s.status === 'safe').length;
    const dangerCount = processedSubjects.filter(s => s.status === 'danger').length;
    const totalSimulations = Object.keys(adjustments).length;
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
      {/* Auto-scrolling Ticker */}
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
            { hash: 'ada', name: 'Analysis & Design of Algorithms', percent: 100.0, status: 'safe' },
            { hash: 'ap', name: 'Advanced Programming', percent: 80.0, status: 'safe' },
            { hash: 'calc', name: 'Calculus & Linear Algebra', percent: 83.3, status: 'safe' },
            { hash: 'de', name: 'Data Engineering', percent: 100.0, status: 'safe' }
          ]).map(sub => (
            <div key={sub.hash} className="ticker-item">
              <span className={`status-dot ${sub.status === 'safe' ? 'green' : sub.status === 'warning' ? 'yellow' : 'red'}`}></span>
              <span>{sub.shortName || sub.name}</span>
              <span className="pixel-tag">
                {sub.percent.toFixed(1)}% {sub.status === 'safe' ? 'SAFE' : sub.status === 'warning' ? 'CAUTION' : 'LOW'}
              </span>
            </div>
          ))}

          {/* Seamless loop repeat */}
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
            { hash: 'ada', name: 'Analysis & Design of Algorithms', percent: 100.0, status: 'safe' },
            { hash: 'ap', name: 'Advanced Programming', percent: 80.0, status: 'safe' },
            { hash: 'calc', name: 'Calculus & Linear Algebra', percent: 83.3, status: 'safe' },
            { hash: 'de', name: 'Data Engineering', percent: 100.0, status: 'safe' }
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

      {/* Navigation Header */}
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
           CONNECT GATEWAY (Clean & Secure Manual Token Entry)
           ========================================================================== */
        <div>
          <div className="connect-hero-box">
            <div className="hero-pill-badge">
              <BookOpen size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
              <span>NEWTON SCHOOL // ATTENDANCE WORKBOOK</span>
            </div>
            <h1 className="hero-main-heading">
              Calculate bunk capacity with <span className="hero-accent-text">mathematical certainty</span>.
            </h1>
            <p className="hero-description">
              A paper-like attendance dashboard for Newton School students. Real-time LMS telemetry, exact bunk quotas, threshold proofs, and multi-course simulation.
            </p>
          </div>

          <div style={{ maxWidth: '680px', margin: '0 auto 2.5rem auto' }}>
            <div className="art-card" style={{ padding: '2rem' }}>
              <div className="art-card-header" style={{ marginBottom: '1.25rem' }}>
                <div>
                  <span className="tag-badge terracotta" style={{ marginBottom: '0.4rem' }}>01 // AUTHENTICATION</span>
                  <h3 className="art-card-title">🔑 Connect with Bearer Token</h3>
                </div>
                <span className="tag-badge green">Zero-Trust Local</span>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.55 }}>
                Paste your active Bearer token to load all enrolled courses, live lecture counts, and attendance telemetry:
              </p>

              <form onSubmit={handleConnect}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <textarea
                    rows={4}
                    className="art-select font-mono"
                    style={{ width: '100%', resize: 'none', fontSize: '0.85rem', padding: '0.85rem', borderRadius: 'var(--radius-nested)' }}
                    placeholder="Paste Bearer token here (e.g. 9kWNDZN99CiyR5yDrpvHBNqUDgkTu0 or JWT)"
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value)}
                  />
                </div>

                {error && (
                  <div style={{ color: 'var(--destructive)', backgroundColor: 'var(--destructive-subtle)', border: '1.5px solid hsl(0, 84%, 60%, 0.3)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-button)', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button type="submit" className="btn-art btn-art-primary" style={{ flex: 2, padding: '0.75rem 1.25rem', fontSize: '0.92rem' }} disabled={loading}>
                    {loading ? <RefreshCw size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                    <span>{loading ? 'Connecting LMS Telemetry...' : '🚀 Connect & Load Attendance'}</span>
                  </button>
                  <button type="button" className="btn-art btn-art-secondary" onClick={enableDemoMode} style={{ flex: 1, padding: '0.75rem 1.25rem', fontSize: '0.92rem' }} title="Preview without credentials">
                    <Play size={14} />
                    <span>Try Demo Mode</span>
                  </button>
                </div>
              </form>

              <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '2px dashed var(--border-color)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  💡 How to get your token in 5 seconds:
                </div>
                <ul className="instructions-list">
                  <li className="instruction-step">
                    <span className="step-num-badge">1</span>
                    <span>Open <a href="https://my.newtonschool.co/course/u4fvf1rm9v2e/details?tab=my-timeline" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'underline' }}>Newton School LMS <ExternalLink size={11} style={{ display: 'inline' }} /></a> &rarr; Press <kbd>F12</kbd> to open DevTools</span>
                  </li>
                  <li className="instruction-step">
                    <span className="step-num-badge">2</span>
                    <span>Go to the <strong>Network</strong> tab &rarr; Filter for <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>/api/</code></span>
                  </li>
                  <li className="instruction-step">
                    <span className="step-num-badge">3</span>
                    <span>Click any request &rarr; Copy the token from the <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>Authorization: Bearer &lt;token&gt;</code> header & paste it above!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={16} color="var(--primary)" />
            <span>Zero-Trust Architecture: Your token is stored strictly in your browser memory and never transmitted to any third-party server.</span>
          </div>
        </div>
      ) : (
        /* ==========================================================================
           AUTHENTICATED COMMAND CENTER (Live LMS Telemetry & Analytics Dashboard)
           ========================================================================== */
        <div>
          {/* Top Intelligence Toolbar */}
          <div className="toolbar-panel">
            <div className="toolbar-group">
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Semester:</span>
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
                  {semesterTitle}
                </span>
              )}
            </div>

            <div className="toolbar-group">
              <div className="target-slider-box">
                <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Target Threshold:</span>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={targetThreshold}
                  onChange={(e) => setTargetThreshold(parseInt(e.target.value, 10))}
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
                  <span>Reset Simulations ({healthStats.totalSimulations})</span>
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

          {/* 4 Metric Hero Tiles */}
          <div className="metrics-grid">
            {/* Tile 1: Overall Percentage */}
            <div className="metric-tile">
              <div className="metric-top-row">
                <div className="metric-label-group">
                  <span className={`status-dot ${overallStats.status === 'safe' ? 'green' : overallStats.status === 'warning' ? 'yellow' : 'red'}`}></span>
                  <span>AGGREGATE RATE</span>
                </div>
                <span className={`tag-badge ${overallStats.percent >= targetThreshold ? 'green' : 'red'}`}>
                  {overallStats.percent >= targetThreshold ? 'PASSED' : 'DEFICIT'}
                </span>
              </div>
              <div className="metric-main-value">
                {overallStats.percent.toFixed(1)}%
              </div>
              <div className="metric-footer-note">
                {overallStats.percent >= targetThreshold
                  ? `+${(overallStats.percent - targetThreshold).toFixed(1)}% safety buffer above ${targetThreshold}% threshold`
                  : `-${(targetThreshold - overallStats.percent).toFixed(1)}% deficit below ${targetThreshold}% threshold`}
              </div>
            </div>

            {/* Tile 2: Action Verdict */}
            <div className="metric-tile">
              <div className="metric-top-row">
                <div className="metric-label-group">
                  <Flame size={14} color="var(--primary)" />
                  <span>ACTION VERDICT</span>
                </div>
                <span className={`tag-badge ${overallStats.bunkable > 0 ? 'green' : overallStats.required > 0 ? 'red' : 'yellow'}`}>
                  {overallStats.bunkable > 0 ? 'CAPACITY' : overallStats.required > 0 ? 'ATTEND' : 'BALANCED'}
                </span>
              </div>
              <div className="metric-main-value">
                {overallStats.bunkable > 0
                  ? `${overallStats.bunkable} Classes`
                  : overallStats.required > 0
                  ? `${overallStats.required} Classes`
                  : '0 Classes'}
              </div>
              <div className="metric-footer-note">
                {overallStats.bunkable > 0
                  ? `Safe to skip ${overallStats.bunkable} lectures while remaining >= ${targetThreshold}%`
                  : overallStats.required > 0
                  ? `Must attend next ${overallStats.required} lectures consecutively to reach ${targetThreshold}%`
                  : `Exactly on target at ${targetThreshold}%`}
              </div>
            </div>

            {/* Tile 3: Total Ratio */}
            <div className="metric-tile">
              <div className="metric-top-row">
                <div className="metric-label-group">
                  <Calculator size={14} color="var(--primary)" />
                  <span>TOTAL RATIO</span>
                </div>
                <span className="tag-badge dark">LMS LOG</span>
              </div>
              <div className="metric-main-value">
                {overallStats.attended} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {overallStats.total}</span>
              </div>
              <div className="metric-footer-note">
                {overallStats.total - overallStats.attended} missed lectures across all courses
              </div>
            </div>

            {/* Tile 4: Health Overview */}
            <div className="metric-tile">
              <div className="metric-top-row">
                <div className="metric-label-group">
                  <Layers size={14} color="var(--primary)" />
                  <span>COURSE HEALTH</span>
                </div>
                <span className="tag-badge terracotta">{healthStats.total} COURSES</span>
              </div>
              <div className="metric-main-value">
                {healthStats.safeCount} <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Safe</span> · {healthStats.dangerCount} <span style={{ fontSize: '1.1rem', color: 'var(--destructive)', fontWeight: 500 }}>Low</span>
              </div>
              <div className="metric-footer-note">
                {healthStats.totalSimulations > 0
                  ? `Simulating overrides on ${healthStats.totalSimulations} courses`
                  : `Real-time data synced with Newton School`}
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="filter-tabs-box">
              {[
                { id: 'all', label: `All Courses (${processedSubjects.length})` },
                { id: 'safe', label: `Safe (>=${targetThreshold + 5}%)` },
                { id: 'warning', label: `Caution (${targetThreshold}-${targetThreshold + 4}%)` },
                { id: 'danger', label: `Low (<${targetThreshold}%)` },
                ...(healthStats.totalSimulations > 0 ? [{ id: 'simulated', label: `Simulated (${healthStats.totalSimulations})` }] : [])
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`filter-tab-btn ${statusFilter === tab.id ? 'active' : ''}`}
                  onClick={() => setStatusFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="art-select"
                style={{ paddingLeft: '2.4rem', width: '100%', fontSize: '0.85rem' }}
                placeholder="Search subject or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Courses Grid Stream */}
          <div className="courses-stream">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: 'var(--primary)' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800 }}>Fetching Live LMS Telemetry...</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Querying enrolled courses and performance metrics from Newton School API</p>
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--bg-card)' }}>
                <Info size={32} style={{ margin: '0 auto 0.75rem auto', color: 'var(--text-muted)' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800 }}>No courses match your filter</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Try clearing your search query or selecting a different status filter.</p>
                <button className="btn-art btn-art-secondary" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredSubjects.map(sub => (
                <div key={sub.hash} className={`course-card ${sub.status}`}>
                  <div className="course-header-row">
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <span className="code-pill">{sub.shortName || 'LU'}</span>
                        {sub.isSimulated && (
                          <span className="sim-badge">
                            <Sparkles size={10} />
                            <span>SIMULATED</span>
                          </span>
                        )}
                      </div>
                      <h4 className="course-name-title">{sub.name}</h4>
                    </div>

                    <div className="course-percent-box">
                      <div className="course-percent-val">
                        {sub.percent.toFixed(1)}%
                      </div>
                      <span className={`status-pill-badge ${sub.status}`}>
                        {sub.status === 'safe' ? 'SAFE' : sub.status === 'warning' ? 'CAUTION' : 'LOW'}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="progress-track">
                    <div
                      className={`progress-fill ${sub.status}`}
                      style={{ width: `${Math.min(100, sub.percent)}%` }}
                    />
                    <div
                      className="threshold-marker-line"
                      style={{ left: `${targetThreshold}%` }}
                      title={`Target: ${targetThreshold}%`}
                    />
                  </div>

                  {/* Attendance Stats & Simulation Controls */}
                  <div className="course-footer-row">
                    <div className="course-counts-group">
                      <span className="count-label">ATTENDED:</span>
                      <span className="count-val">{sub.attended} / {sub.total}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        ({sub.total - sub.attended} missed)
                      </span>
                    </div>

                    <div className="course-action-badge">
                      {sub.bunkable > 0 ? (
                        <span style={{ color: 'hsl(142, 60%, 35%)', fontWeight: 700, fontSize: '0.85rem' }}>
                          🟢 +{sub.bunkable} Bunkable
                        </span>
                      ) : sub.required > 0 ? (
                        <span style={{ color: 'var(--destructive)', fontWeight: 700, fontSize: '0.85rem' }}>
                          🔴 Attend {sub.required} Next
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>
                          🟡 On Target ({targetThreshold}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* What-If Simulator Controls */}
                  <div className="simulation-toolbar">
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      What-If Simulation:
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        className="btn-sim-tool"
                        onClick={() => handleSimulateAttend(sub.hash)}
                        title="Simulate attending next lecture"
                      >
                        <Plus size={12} />
                        <span>Attend (+1)</span>
                      </button>
                      <button
                        className="btn-sim-tool"
                        onClick={() => handleSimulateBunk(sub.hash)}
                        title="Simulate bunking next lecture"
                      >
                        <Minus size={12} />
                        <span>Bunk (+1)</span>
                      </button>
                      {sub.isSimulated && (
                        <button
                          className="btn-sim-tool reset"
                          onClick={() => resetSubjectAdjustments(sub.hash)}
                          title="Reset simulations for this course"
                        >
                          <RotateCcw size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Custom Subject Buckets / Groups Section */}
          <div className="art-card" style={{ marginTop: '2.5rem', padding: '1.75rem' }}>
            <div className="art-card-header" style={{ marginBottom: '1.25rem' }}>
              <div>
                <span className="tag-badge terracotta" style={{ marginBottom: '0.4rem' }}>FEATURE // AGGREGATIONS</span>
                <h3 className="art-card-title">📚 Custom Subject Buckets & Tracks</h3>
              </div>
              <button
                className="btn-art btn-art-primary"
                onClick={() => setShowCreateGroup(!showCreateGroup)}
                style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
              >
                <FolderPlus size={14} />
                <span>{showCreateGroup ? 'Close Editor' : 'New Bucket'}</span>
              </button>
            </div>

            {showCreateGroup && (
              <form onSubmit={handleCreateGroup} style={{ backgroundColor: 'var(--bg-muted)', padding: '1.25rem', borderRadius: 'var(--radius-nested)', border: '2px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Create New Subject Bucket</h4>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Bucket Name:</label>
                  <input
                    type="text"
                    className="art-select"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                    placeholder="e.g. Core CS Labs, Theory Group"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Select Included Courses:</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {processedSubjects.map(sub => (
                      <button
                        type="button"
                        key={sub.hash}
                        className={`preset-pill-btn ${newGroupSubjects.includes(sub.hash) ? 'active' : ''}`}
                        onClick={() => toggleGroupSubject(sub.hash)}
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                      >
                        {sub.shortName || sub.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn-art btn-art-primary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }} disabled={!newGroupName.trim() || newGroupSubjects.length === 0}>
                  Save Bucket
                </button>
              </form>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {groups.map(group => {
                const stats = getGroupStats(group);
                return (
                  <div key={group.id} className="art-card" style={{ padding: '1.25rem', border: '2px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 800 }}>{group.name}</h4>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--destructive)', cursor: 'pointer', padding: '0.2rem' }}
                        title="Delete bucket"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.65rem' }}>
                      <span style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: stats.percent >= stats.threshold ? 'hsl(142, 60%, 35%)' : 'var(--destructive)' }}>
                        {stats.percent.toFixed(1)}%
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {stats.attended} / {stats.total} classes
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: stats.bunkable > 0 ? 'hsl(142, 60%, 35%)' : 'var(--destructive)' }}>
                      {stats.bunkable > 0
                        ? `🟢 +${stats.bunkable} Bunkable in this group`
                        : stats.required > 0
                        ? `🔴 Attend ${stats.required} in this group`
                        : `🟡 Exactly at ${stats.threshold}%`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mathematical Proofs & Formulas Card */}
          <div className="art-card" style={{ marginTop: '2.5rem', padding: '1.75rem' }}>
            <div className="art-card-header" style={{ marginBottom: '1rem' }}>
              <div>
                <span className="tag-badge terracotta" style={{ marginBottom: '0.4rem' }}>DOCUMENTATION // THEOREM</span>
                <h3 className="art-card-title">📐 Mathematical Certainty Formulae</h3>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <div style={{ backgroundColor: 'var(--bg-muted)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-nested)', border: '2px solid var(--border-color)' }}>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>1. Bunk Capacity ($B$)</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--primary)', marginBottom: '0.35rem' }}>
                  B = floor((A - T * N) / T)
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>
                  Where $A$ is attended lectures, $N$ is total lectures, and $T$ is threshold ($0.75$).
                </p>
              </div>

              <div style={{ backgroundColor: 'var(--bg-muted)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-nested)', border: '2px solid var(--border-color)' }}>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>2. Recovery Requirement ($R$)</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--destructive)', marginBottom: '0.35rem' }}>
                  R = ceil((T * N - A) / (1 - T))
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>
                  Number of uninterrupted consecutive classes required to reach exactly $T\%$.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
