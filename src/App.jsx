import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
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
import { formatSlackTeacherMessage } from './utils/slackMessageFormatter.js';
import Navbar from './components/Layout/Navbar.jsx';
import Ticker from './components/Layout/Ticker.jsx';
import DemoBanner from './components/Layout/DemoBanner.jsx';
import SectionTabs from './components/Layout/SectionTabs.jsx';
import Toolbar from './components/Dashboard/Toolbar.jsx';
import MetricTiles from './components/Dashboard/MetricTiles.jsx';
import BatchSimulator from './components/Dashboard/BatchSimulator.jsx';
import CourseGrid from './components/Dashboard/CourseGrid.jsx';
import AttendanceLogView from './components/AttendanceLog/AttendanceLogView.jsx';
import ConnectView from './components/Modals/ConnectView.jsx';

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
  const [teacherHonorific, setTeacherHonorific] = useState('Sir');

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

  const handleCopyForTeacher = (lecture) => {
    const firstName = lecture.instructor_user?.first_name ? lecture.instructor_user.first_name.trim() : '';
    const slackMsg = formatSlackTeacherMessage({
      lecture,
      studentProfile: profile,
      honorific: teacherHonorific,
      isDemoMode
    });

    navigator.clipboard.writeText(slackMsg).then(() => {
      const recipientName = firstName ? `${firstName} ${teacherHonorific.toLowerCase()}` : teacherHonorific;
      setCopiedToast(`Copied Slack message for ${recipientName}!`);
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
      <Ticker
        overallStats={overallStats}
        targetThreshold={targetThreshold}
        processedSubjects={processedSubjects}
      />

      {/* Flat Art Course Header Navigation */}
      <Navbar
        isAuthenticated={isAuthenticated}
        isDemoMode={isDemoMode}
        profile={profile}
        loading={loading}
        onRefresh={() => isDemoMode ? enableDemoMode() : loadLiveDashboard(token, selectedSemesterHash)}
        onDisconnect={handleDisconnect}
      />

      {/* Main View: Connect Gateway vs Authenticated Command Center */}
      {!isAuthenticated ? (
        <ConnectView
          inputToken={inputToken}
          onInputTokenChange={setInputToken}
          error={error}
          loading={loading}
          onConnect={handleConnect}
          onEnableDemoMode={enableDemoMode}
        />
      ) : (
        <div>
          {/* Offline/Demo Mode Alert Banner */}
          {isDemoMode && <DemoBanner />}

          {/* Top Intelligence Toolbar */}
          <Toolbar
            semesters={semesters}
            selectedSemesterHash={selectedSemesterHash}
            semesterTitle={semesterTitle}
            onSemesterChange={handleSemesterChange}
            targetThreshold={targetThreshold}
            onTargetChange={setTargetThreshold}
            totalSimulations={healthStats.totalSimulations}
            onResetAdjustments={resetAllAdjustments}
          />

          {error && (
            <div style={{ color: 'var(--destructive)', backgroundColor: 'var(--destructive-subtle)', border: '2px solid var(--destructive)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-button)', fontSize: '0.88rem', marginBottom: '1.75rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* 4 Flat Metric Hero Tiles */}
          <MetricTiles
            overallStats={overallStats}
            targetThreshold={targetThreshold}
            causationReport={causationReport}
            healthStats={healthStats}
          />

          {/* Quick Batch Simulator Strip */}
          <BatchSimulator
            totalSimulations={healthStats.totalSimulations}
            onApplyBatchSimulation={applyBatchSimulation}
            onResetAllAdjustments={resetAllAdjustments}
          />

          {/* Main Navigation Tabs: Course Workbook vs Class Attendance Log */}
          <SectionTabs
            activeTab={activeSectionTab}
            onTabChange={setActiveSectionTab}
            lectureCount={lectures.length}
          />

          {activeSectionTab === 'workbook' ? (
            <CourseGrid
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              processedSubjects={processedSubjects}
              filteredSubjects={filteredSubjects}
              targetThreshold={targetThreshold}
              loading={loading}
              totalSimulations={healthStats.totalSimulations}
              onAdjustAttendance={adjustSubjectAttendance}
              onResetAdjustment={resetAdjustment}
              groups={groups}
              showCreateGroup={showCreateGroup}
              onToggleShowCreateGroup={() => setShowCreateGroup(prev => !prev)}
              newGroupName={newGroupName}
              onNewGroupNameChange={setNewGroupName}
              newGroupSubjects={newGroupSubjects}
              onToggleGroupSubject={toggleGroupSubject}
              onCreateGroup={handleCreateGroup}
              onDeleteGroup={handleDeleteGroup}
              onUpdateGroupThreshold={handleUpdateGroupThreshold}
              getGroupStats={getGroupStats}
            />
          ) : (
            <AttendanceLogView
              lectureMetrics={lectureMetrics}
              lectureSearch={lectureSearch}
              onLectureSearchChange={setLectureSearch}
              lectureFilterStatus={lectureFilterStatus}
              onLectureFilterStatusChange={setLectureFilterStatus}
              lectureFilterCourse={lectureFilterCourse}
              onLectureFilterCourseChange={setLectureFilterCourse}
              processedSubjects={processedSubjects}
              teacherHonorific={teacherHonorific}
              onTeacherHonorificChange={setTeacherHonorific}
              lecturesLoading={lecturesLoading}
              filteredLectures={filteredLectures}
              onCopyForTeacher={handleCopyForTeacher}
            />
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
