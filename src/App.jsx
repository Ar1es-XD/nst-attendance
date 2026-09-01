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
  BookOpen,
  Sliders,
  CheckCircle2,
  Code2,
  Copy,
  Calendar,
  Clock,
  Check,
  X
} from 'lucide-react';
import {
  fetchUserProfile,
  fetchAppliedSemesters,
  fetchCoursePerformance,
  fetchCourseLectures,
  DEMO_PROFILE,
  DEMO_SEMESTERS,
  DEMO_PERFORMANCES,
  DEMO_LECTURES
} from './services/lmsAdapter.js';
import {
  calculateSubjectMetrics,
  verifyActionCausation
} from './utils/causationEngine.js';

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
  const [_overallPerf, setOverallPerf] = useState({ total_lectures: 0, total_lectures_attended: 0 });

  // High-level navigation tab: 'workbook' | 'attendance-log'
  const [activeSectionTab, setActiveSectionTab] = useState('workbook');

  // Lectures state (timeline of conducted and upcoming classes)
  const [lectures, setLectures] = useState([]);
  const [lecturesLoading, setLecturesLoading] = useState(false);
  const [lectureFilterStatus, setLectureFilterStatus] = useState('all'); // 'all' | 'attended' | 'missed'
  const [lectureFilterCourse, setLectureFilterCourse] = useState('all');
  const [lectureSearch, setLectureSearch] = useState('');
  const [copiedToast, setCopiedToast] = useState('');

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

  // Manual Adjustments/Overrides state (Simulation Mode: { [hash]: { adjAttended: 0, adjTotal: 0 } })
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
    setLectures(DEMO_LECTURES);

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

    try {
      // 1. Fetch User Profile
      const profData = await fetchUserProfile(cleanToken);
      setProfile(profData);

      // 2. Fetch Applied Courses Hierarchy
      const extractedSemesters = await fetchAppliedSemesters(cleanToken);
      let activeSemHash = semHash || selectedSemesterHash || 'u4fvf1rm9v2e';
      let foundActiveUnits = [];

      const targetSem = extractedSemesters.find(s => s.hash === activeSemHash) || extractedSemesters.find(s => s.isActive) || extractedSemesters[0];
      if (targetSem) {
        activeSemHash = targetSem.hash;
        setSemesterTitle(targetSem.title);
        foundActiveUnits = targetSem.learningUnits || [];
      }

      setSemesters(extractedSemesters);
      setSelectedSemesterHash(activeSemHash);

      // 3. Fetch Overall Semester Performance
      try {
        const semPerf = await fetchCoursePerformance(cleanToken, activeSemHash);
        setOverallPerf(semPerf);
      } catch (err) {
        console.warn("Overall performance fetch error:", err);
      }

      // 4. Fetch Each Individual Subject's Performance Concurrently
      const subjectsWithAttendance = await Promise.all(
        foundActiveUnits.map(async (unit, index) => {
          const subHash = unit.hash;
          try {
            const pData = await fetchCoursePerformance(cleanToken, subHash);
            return {
              id: unit.id || index,
              hash: subHash,
              name: unit.title || unit.short_display_name || `Subject ${index + 1}`,
              shortName: unit.short_display_name,
              rawAttended: pData.total_lectures_attended ?? 0,
              rawTotal: pData.total_lectures ?? 0
            };
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

      // 5. Fetch Full Lecture Attendance Ledger for Class Attendance Log & Next Lecture Advisory
      try {
        setLecturesLoading(true);
        const lecs = await fetchCourseLectures(cleanToken, activeSemHash);
        setLectures(lecs);
      } catch (lecErr) {
        console.warn("Lectures fetch warning:", lecErr);
      } finally {
        setLecturesLoading(false);
      }

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
        setLectures(DEMO_LECTURES);
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
    setLectures([]);
    setAdjustments({});
    setError('');
  };

  // Mathematical calculation engine (delegates to causationEngine)
  const calculateAttendanceStats = useCallback((attended, total, thresholdPercent) => {
    return calculateSubjectMetrics(attended, total, thresholdPercent);
  }, []);

  // Processed subjects with fine-grained simulation adjustments
  const processedSubjects = useMemo(() => {
    return subjectsData.map(sub => {
      const hash = sub.hash;
      const adj = adjustments[hash] || { adjAttended: 0, adjTotal: 0 };

      const attended = Math.max(0, sub.rawAttended + (adj.adjAttended || 0));
      const total = Math.max(0, sub.rawTotal + (adj.adjTotal || 0));

      const stats = calculateSubjectMetrics(attended, total, targetThreshold);

      return {
        ...sub,
        attended,
        total,
        adjAttended: adj.adjAttended || 0,
        adjTotal: adj.adjTotal || 0,
        hasAdjustments: (adj.adjAttended || 0) !== 0 || (adj.adjTotal || 0) !== 0,
        ...stats
      };
    });
  }, [subjectsData, adjustments, targetThreshold]);

  // Causation verification report with per-subject buffer clamping and upcoming lecture advisory
  const causationReport = useMemo(() => {
    const upcoming = lectures.filter(l => l.attended === null);
    return verifyActionCausation({
      subjects: processedSubjects,
      targetThreshold,
      upcomingLectures: upcoming
    });
  }, [processedSubjects, targetThreshold, lectures]);

  const overallStats = causationReport.aggregate;

  // Filtered lectures for Class Attendance Log tab
  const filteredLectures = useMemo(() => {
    return lectures.filter(lec => {
      if (lectureFilterStatus === 'attended' && lec.attended !== true) return false;
      if (lectureFilterStatus === 'missed' && lec.attended !== false) return false;

      if (lectureFilterCourse !== 'all' && lec.course?.hash !== lectureFilterCourse) return false;

      if (lectureSearch.trim()) {
        const q = lectureSearch.toLowerCase();
        const titleMatch = (lec.title || '').toLowerCase().includes(q);
        const courseMatch = (lec.course?.title || '').toLowerCase().includes(q) || (lec.course?.short_display_name || '').toLowerCase().includes(q);
        const instMatch = `${lec.instructor_user?.first_name || ''} ${lec.instructor_user?.last_name || ''}`.toLowerCase().includes(q);
        if (!titleMatch && !courseMatch && !instMatch) return false;
      }

      return true;
    });
  }, [lectures, lectureFilterStatus, lectureFilterCourse, lectureSearch]);

  const lectureMetrics = useMemo(() => {
    let attendedCount = 0;
    let missedCount = 0;
    lectures.forEach(l => {
      if (l.attended === true) attendedCount++;
      else if (l.attended === false) missedCount++;
    });
    return {
      total: lectures.length,
      attended: attendedCount,
      missed: missedCount
    };
  }, [lectures]);

  const formatLectureDateTime = (isoStart, isoEnd) => {
    if (!isoStart) return { dateStr: 'Date TBA', timeStr: '' };
    try {
      const start = new Date(isoStart);
      const dateStr = start.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const startTimeStr = start.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      let timeStr = startTimeStr;
      if (isoEnd) {
        const end = new Date(isoEnd);
        const endTimeStr = end.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        timeStr = `${startTimeStr} – ${endTimeStr}`;
      }
      return { dateStr, timeStr };
    } catch {
      return { dateStr: isoStart, timeStr: '' };
    }
  };

  const handleCopyForTeacher = (lecture) => {
    const { dateStr, timeStr } = formatLectureDateTime(lecture.start_timestamp, lecture.end_timestamp);
    const firstName = lecture.instructor_user?.first_name ? lecture.instructor_user.first_name.trim() : '';
    const salutation = firstName ? `Hi ${firstName} Sir/Ma'am,` : `Hi Sir/Ma'am,`;
    const statusText = lecture.attended ? 'Attended' : 'Marked Absent';
    const studentName = profile?.first_name 
      ? `${profile.first_name} ${profile.last_name || ''}`.trim() 
      : 'Student';
    const courseTitle = lecture.course?.title || 'Class';
    const courseCode = lecture.course?.short_display_name ? ` (${lecture.course.short_display_name})` : '';

    let slackMsg = `${salutation}\n\nI noticed an attendance discrepancy on the portal for *${courseTitle}${courseCode}* on *${dateStr}* (${timeStr}).\n\n• *Topic:* ${lecture.title}\n• *Current Portal Status:* \`${statusText}\`\n\nI was present in this session—could you please check and update my attendance in the ledger when you get a chance? Thank you! 🙏\n\n— *${studentName}*`;

    if (isDemoMode) {
      slackMsg += `\n\n> ⚠️ _(Simulated demo fixture — please ensure live LMS token is connected before sending.)_`;
    }

    navigator.clipboard.writeText(slackMsg).then(() => {
      setCopiedToast(`Copied Slack DM for ${firstName || 'professor'} to clipboard!`);
      setTimeout(() => setCopiedToast(''), 3000);
    }).catch(() => {
      alert("Could not access clipboard. Please copy manually:\n\n" + slackMsg);
    });
  };

  // Simulation Adjustment Handlers
  const adjustSubjectAttendance = (subjectHash, type, delta) => {
    setAdjustments(prev => {
      const current = prev[subjectHash] || { adjAttended: 0, adjTotal: 0 };
      let newAttended = current.adjAttended || 0;
      let newTotal = current.adjTotal || 0;

      if (type === 'attend') {
        newAttended += delta;
        newTotal += delta;
      } else if (type === 'miss') {
        newTotal += delta;
      }

      if (newAttended === 0 && newTotal === 0) {
        const next = { ...prev };
        delete next[subjectHash];
        return next;
      }

      return {
        ...prev,
        [subjectHash]: {
          adjAttended: newAttended,
          adjTotal: newTotal
        }
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

  const applyBatchSimulation = (action, count = 1) => {
    setAdjustments(prev => {
      const next = { ...prev };
      processedSubjects.forEach(s => {
        const current = next[s.hash] || { adjAttended: 0, adjTotal: 0 };
        if (action === 'attend_all') {
          next[s.hash] = {
            adjAttended: (current.adjAttended || 0) + count,
            adjTotal: (current.adjTotal || 0) + count
          };
        } else if (action === 'miss_all') {
          next[s.hash] = {
            adjAttended: current.adjAttended || 0,
            adjTotal: (current.adjTotal || 0) + count
          };
        }
      });
      return next;
    });
  };

  const resetAllAdjustments = () => {
    setAdjustments({});
  };

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
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, threshold: parseInt(val, 10) } : g));
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
              A warm, paper-like attendance workbook for Newton School students. Real-time LMS telemetry, exact bunk quotas, threshold proofs, and multi-course simulation.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
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

            {/* Card 2: Workbook Capabilities & Formulas */}
            <div className="art-card">
              <div className="art-card-header">
                <div>
                  <span className="tag-badge gold" style={{ marginBottom: '0.5rem' }}>02 // WORKBOOK FEATURES</span>
                  <h3 className="art-card-title">📐 Certainty Engine</h3>
                </div>
                <span className="tag-badge terracotta">v2.0</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '1.25rem' }}>
                Engineered with mathematical precision to prevent debarment and track elective tracks:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ backgroundColor: 'var(--bg-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-nested)', border: '1.5px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <Flame size={14} color="var(--primary)" />
                    <strong style={{ fontSize: '0.85rem' }}>Exact Bunk Quota Calculation</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Computes <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>floor((A - T*N)/T)</code> so you know exactly how many lectures you can safely miss.
                  </p>
                </div>

                <div style={{ backgroundColor: 'var(--bg-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-nested)', border: '1.5px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <Sparkles size={14} color="var(--tag-orange)" />
                    <strong style={{ fontSize: '0.85rem' }}>Real-time What-If Stepper Simulation</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Fine-grained simulation on every course with instant recalculation of required attendance.
                  </p>
                </div>

                <div style={{ backgroundColor: 'var(--bg-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-nested)', border: '1.5px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <Layers size={14} color="var(--status-green)" />
                    <strong style={{ fontSize: '0.85rem' }}>Custom Subject Buckets & Tracks</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Group Labs, Core CS, and Electives into custom threshold groups with isolated analytics.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="btn-art btn-art-secondary" onClick={enableDemoMode} style={{ width: '100%', fontSize: '0.86rem' }}>
                  <Play size={13} />
                  <span>Preview Full Dashboard (Demo)</span>
                </button>
              </div>
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
          {/* OFFLINE / DEMO DATA ACTIVE BANNER */}
          {isDemoMode && (
            <div className="demo-mode-alert-banner">
              <AlertTriangle size={20} color="var(--destructive)" style={{ flexShrink: 0 }} />
              <div>
                <strong>DEMO / SIMULATED DATA ACTIVE:</strong> You are currently viewing offline baseline fixture data. 
                Do not cite these class dates, topics, or attendance records in teacher inquiries until a live LMS session is connected.
              </div>
            </div>
          )}

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

            {/* Tile 2: Net Action Verdict & Causation Engine */}
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

              {/* Causation Verification & Skippable Class Identification */}
              <div className="causation-block">
                {overallStats.percent >= targetThreshold ? (
                  <>
                    {causationReport.safeSubjects.length > 0 && (
                      <div>
                        <div className="causation-section-title">Verified Safe to Skip (Buffer):</div>
                        <div className="causation-pills-row">
                          {causationReport.safeSubjects.map(s => (
                            <span key={s.hash} className="causation-pill safe" title={`Current: ${s.currentPercent.toFixed(1)}%, If 1 missed: ${s.projectedPercentIfSkipped.toFixed(1)}%`}>
                              ✓ {s.shortName} (+{s.bunkable} safe)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {causationReport.restrictedSubjects.filter(s => !s.hasZeroLectures).length > 0 && (
                      <div style={{ marginTop: '0.2rem' }}>
                        <div className="causation-section-title">Restricted (Avoid Skipping):</div>
                        <div className="causation-pills-row">
                          {causationReport.restrictedSubjects.filter(s => !s.hasZeroLectures).slice(0, 3).map(s => (
                            <span key={s.hash} className="causation-pill restricted" title={`Skipping drops this course by ${s.projectedDrop.toFixed(1)}% to ${s.projectedPercentIfSkipped.toFixed(1)}%`}>
                              ✕ {s.shortName} ({s.currentPercent.toFixed(1)}% → {s.projectedPercentIfSkipped.toFixed(1)}%)
                            </span>
                          ))}
                          {causationReport.restrictedSubjects.filter(s => !s.hasZeroLectures).length > 3 && (
                            <span className="causation-pill restricted" style={{ fontSize: '0.7rem' }}>
                              +{causationReport.restrictedSubjects.filter(s => !s.hasZeroLectures).length - 3} more restricted
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="causation-section-title">Deficit Causation Drivers:</div>
                    <div className="causation-pills-row">
                      {causationReport.deficitDrivers.map(d => (
                        <span key={d.hash} className="causation-pill deficit">
                          ⚠️ {d.shortName}: {d.currentPercent.toFixed(1)}% (needs +{d.required} classes)
                        </span>
                      ))}
                    </div>
                  </>
                )}

                <div className="causation-summary-text">
                  {causationReport.causationSummary}
                </div>

                {causationReport.nextLectureAdvisory && (
                  <div className={`next-lecture-advisory ${causationReport.nextLectureAdvisory.isSafeToSkip ? 'safe' : 'unsafe'}`}>
                    <strong>Next Class:</strong> {causationReport.nextLectureAdvisory.courseShortName} — {causationReport.nextLectureAdvisory.message}
                  </div>
                )}
              </div>
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
                <span className="metric-large-val font-mono">{overallStats.attended} <span style={{ fontSize: '1.05rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {overallStats.total}</span></span>
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
                <span className="metric-large-val font-mono">{healthStats.safeCount} <span style={{ fontSize: '1.05rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {healthStats.total}</span></span>
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

          {/* Main Navigation Tabs: Course Workbook vs Class Attendance Log */}
          <div className="section-tabs-bar">
            <button
              className={`section-tab-btn ${activeSectionTab === 'workbook' ? 'active' : ''}`}
              onClick={() => setActiveSectionTab('workbook')}
            >
              <BookOpen size={16} />
              <span>📚 Course Workbook & Simulator</span>
            </button>
            <button
              className={`section-tab-btn ${activeSectionTab === 'attendance-log' ? 'active' : ''}`}
              onClick={() => setActiveSectionTab('attendance-log')}
            >
              <CheckCircle2 size={16} />
              <span>🗓️ Class Attendance Log (Teacher Reference)</span>
              <span className="tab-counter-badge">{lectures.length}</span>
            </button>
          </div>

          {activeSectionTab === 'workbook' ? (
            <>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                              <span className="tag-badge terracotta">#{subject.shortName || subject.hash}</span>
                              <span className={`status-dot ${subject.status === 'safe' ? 'green' : subject.status === 'warning' ? 'yellow' : 'red'}`}></span>
                              {subject.hasAdjustments && (
                                <span className="tag-badge pink">
                                  <Sparkles size={10} />
                                  <span>SIMULATED</span>
                                </span>
                              )}
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
            </>
          ) : (
            /* ==========================================================================
               CLASS ATTENDANCE LOG (Teacher Reference Tab)
               ========================================================================== */
            <div className="attendance-log-container">
              <div className="log-header-cluster">
                <div className="log-title-area">
                  <h3>Verified Lecture Attendance Ledger</h3>
                  <p>
                    Full chronological record of enrolled classes, timestamps, topics, and faculty for syllabus tracking and dispute references.
                  </p>
                </div>

                <div className="log-stats-bar">
                  <div className="log-stat-chip">
                    <span>Total Classes:</span>
                    <span className="num">{lectureMetrics.total}</span>
                  </div>
                  <div className="log-stat-chip" style={{ borderColor: 'var(--status-green)' }}>
                    <span className="status-dot green"></span>
                    <span>Attended:</span>
                    <span className="num" style={{ color: 'var(--status-green)' }}>{lectureMetrics.attended}</span>
                  </div>
                  <div className="log-stat-chip" style={{ borderColor: 'var(--destructive)' }}>
                    <span className="status-dot red"></span>
                    <span>Missed:</span>
                    <span className="num" style={{ color: 'var(--destructive)' }}>{lectureMetrics.missed}</span>
                  </div>
                </div>
              </div>

              {/* Log Filters & Search Bar */}
              <div className="log-controls-row">
                <div className="log-search-box">
                  <Search size={16} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Search by lecture topic or instructor..."
                    value={lectureSearch}
                    onChange={(e) => setLectureSearch(e.target.value)}
                  />
                  {lectureSearch && (
                    <button
                      onClick={() => setLectureSearch('')}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="log-filter-pills">
                  <button
                    className={`log-filter-pill-btn ${lectureFilterStatus === 'all' ? 'active' : ''}`}
                    onClick={() => setLectureFilterStatus('all')}
                  >
                    All ({lectureMetrics.total})
                  </button>
                  <button
                    className={`log-filter-pill-btn ${lectureFilterStatus === 'missed' ? 'active' : ''}`}
                    onClick={() => setLectureFilterStatus('missed')}
                    style={lectureFilterStatus === 'missed' ? { backgroundColor: 'var(--destructive)', borderColor: 'var(--destructive)' } : {}}
                  >
                    Missed / Absent ({lectureMetrics.missed})
                  </button>
                  <button
                    className={`log-filter-pill-btn ${lectureFilterStatus === 'attended' ? 'active' : ''}`}
                    onClick={() => setLectureFilterStatus('attended')}
                    style={lectureFilterStatus === 'attended' ? { backgroundColor: 'var(--status-green)', borderColor: 'var(--status-green)' } : {}}
                  >
                    Attended ({lectureMetrics.attended})
                  </button>
                </div>

                <select
                  className="art-select"
                  value={lectureFilterCourse}
                  onChange={(e) => setLectureFilterCourse(e.target.value)}
                  style={{ fontSize: '0.82rem', padding: '0.5rem 0.8rem' }}
                >
                  <option value="all">All Subjects</option>
                  {processedSubjects.map(s => (
                    <option key={s.hash} value={s.hash}>
                      {s.shortName || s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lecture List Table */}
              {lecturesLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <RefreshCw size={24} className="spin" style={{ margin: '0 auto 1rem' }} />
                  <p>Retrieving full lecture history from Newton School LMS...</p>
                </div>
              ) : filteredLectures.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-muted)' }}>
                  <Calendar size={36} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                  <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>No Lecture Records Match Filters</h4>
                  <p style={{ fontSize: '0.86rem' }}>Try clearing your search query or switching to another status tab.</p>
                </div>
              ) : (
                <div className="log-table-wrap">
                  <table className="lecture-log-table">
                    <thead>
                      <tr>
                        <th style={{ width: '190px' }}>Date & Time</th>
                        <th style={{ width: '180px' }}>Course / Subject</th>
                        <th>Lecture Topic</th>
                        <th style={{ width: '160px' }}>Instructor</th>
                        <th style={{ width: '120px' }}>LMS Status</th>
                        <th style={{ width: '150px', textAlign: 'right' }}>Slack Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLectures.map(lecture => {
                        const { dateStr, timeStr } = formatLectureDateTime(lecture.start_timestamp, lecture.end_timestamp);
                        const instName = `${lecture.instructor_user?.first_name || ''} ${lecture.instructor_user?.last_name || ''}`.trim() || 'Staff Faculty';

                        return (
                          <tr key={lecture.hash || lecture.id}>
                            <td>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{dateStr}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{timeStr}</div>
                            </td>
                            <td>
                              <span className="tag-badge terracotta" style={{ fontSize: '0.72rem', marginBottom: '0.2rem' }}>
                                {lecture.course?.short_display_name || 'Course'}
                              </span>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.25 }}>
                                {lecture.course?.title}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                                {lecture.title}
                              </div>
                              {lecture.whiteboard_file && (
                                <a
                                  href={lecture.whiteboard_file}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ fontSize: '0.72rem', color: 'var(--primary)', textDecoration: 'underline', marginTop: '0.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  <span>Whiteboard Notes</span>
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                {lecture.instructor_user?.instructor_avatar ? (
                                  <img
                                    src={lecture.instructor_user.instructor_avatar}
                                    alt={instName}
                                    style={{ width: '22px', height: '22px', borderRadius: '50%' }}
                                  />
                                ) : (
                                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                                    {instName.charAt(0)}
                                  </div>
                                )}
                                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{instName}</span>
                              </div>
                            </td>
                            <td>
                              {lecture.attended === true ? (
                                <span className="lecture-status-badge attended">
                                  <Check size={12} />
                                  <span>Attended</span>
                                </span>
                              ) : lecture.attended === false ? (
                                <span className="lecture-status-badge missed">
                                  <X size={12} />
                                  <span>Absent</span>
                                </span>
                              ) : (
                                <span className="lecture-status-badge" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                                  <Clock size={12} />
                                  <span>Upcoming</span>
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn-copy-teacher"
                                onClick={() => handleCopyForTeacher(lecture)}
                                title="Copy formatted Slack DM message for professor"
                              >
                                <Copy size={12} />
                                <span>Copy Slack DM</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {copiedToast && (
        <div className="toast-message">
          <Check size={16} color="var(--status-green)" />
          <span>{copiedToast}</span>
        </div>
      )}
    </div>
  );
}
