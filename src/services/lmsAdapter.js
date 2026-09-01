/**
 * Isolated LMS API Adapter for Newton School
 * 
 * Centralizes all reverse-engineered API endpoints, authentication header injection,
 * response normalization, and defensive fallbacks to protect against LMS API shifts.
 */

const BASE_URL = "";

// Realistic baseline fallback fixtures for offline/demo operation
export const DEMO_PROFILE = {
  first_name: 'NST',
  last_name: 'Student',
  email: 'student@newtonschool.co',
  username: 'nst_cs25'
};

export const DEMO_SEMESTERS = [
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

export const DEMO_PERFORMANCES = {
  'u4fvf1rm9v2e': { total_lectures: 55, total_lectures_attended: 46 },
  'y4jra1o5yjcj': { total_lectures: 5, total_lectures_attended: 5 },
  'x3300pxoaayu': { total_lectures: 4, total_lectures_attended: 4 },
  'ar66n55tzlgl': { total_lectures: 5, total_lectures_attended: 4 },
  '3d7pc6pq59so': { total_lectures: 2, total_lectures_attended: 1 },
  'pqnjkav8dobe': { total_lectures: 2, total_lectures_attended: 2 },
  'rw4p1qnhjcfn': { total_lectures: 6, total_lectures_attended: 5 },
  'oojehllgsouk': { total_lectures: 8, total_lectures_attended: 6 },
  'qobpbvdsyekt': { total_lectures: 5, total_lectures_attended: 5 },
  'onr65jwzgdgj': { total_lectures: 4, total_lectures_attended: 4 },
  'abqtra71lo83': { total_lectures: 7, total_lectures_attended: 5 },
  'pplfefkvvgtw': { total_lectures: 7, total_lectures_attended: 5 },
  'c6ootz3nd2y8': { total_lectures: 80, total_lectures_attended: 68 }
};

export const DEMO_LECTURES = [
  {
    hash: 'lec-demo-1',
    title: 'Elementary Matrices, LU Decomposition, Rank',
    start_timestamp: '2026-09-01T09:30:00+05:30',
    end_timestamp: '2026-09-01T11:00:00+05:30',
    attended: false,
    attendance_waived: false,
    course: {
      hash: 'oojehllgsouk',
      title: "Newton School of Technology'25 (SVYASA) - Calculus and linear Algebra for AI",
      short_display_name: 'Calculus and Algebra'
    },
    instructor_user: {
      first_name: 'Adhiraj',
      last_name: 'Mandal',
      username: 'adhiraj.mandal'
    }
  },
  {
    hash: 'lec-demo-2',
    title: 'Binary Search Tree, Searching in BST, Insertion in BST',
    start_timestamp: '2026-08-31T11:00:00+05:30',
    end_timestamp: '2026-08-31T12:30:00+05:30',
    attended: true,
    attendance_waived: false,
    course: {
      hash: 'y4jra1o5yjcj',
      title: "Newton School of Technology'25 (SVYASA) - Analysis and Design of Algorithms",
      short_display_name: 'ADA'
    },
    instructor_user: {
      first_name: 'Ashwin',
      last_name: 'Krishnamoorthy',
      username: 'ashwin.krishnamoorthy'
    }
  },
  {
    hash: 'lec-demo-3',
    title: 'EventEmitter, Event-Driven Programming, Streams, Observer Pattern',
    start_timestamp: '2026-08-31T09:30:00+05:30',
    end_timestamp: '2026-08-31T11:00:00+05:30',
    attended: true,
    attendance_waived: false,
    course: {
      hash: 'ar66n55tzlgl',
      title: "Newton School of Technology'25 (SVYASA) - Advanced Programming",
      short_display_name: 'Advanced Programming'
    },
    instructor_user: {
      first_name: 'Pranav',
      last_name: 'Huchche',
      username: 'pranav.huchche'
    }
  },
  {
    hash: 'lec-demo-4',
    title: 'Lecture 7 - YOGA 2 Practicum',
    start_timestamp: '2026-08-28T14:00:00+05:30',
    end_timestamp: '2026-08-28T15:30:00+05:30',
    attended: false,
    attendance_waived: false,
    course: {
      hash: 'pplfefkvvgtw',
      title: "Newton School of Technology'25 (SVYASA) - YOGA 2",
      short_display_name: 'YOGA 2'
    },
    instructor_user: {
      first_name: 'Nikhil',
      last_name: 'Menon',
      username: 'nikhil.menon'
    }
  },
  {
    hash: 'lec-demo-5',
    title: 'Calculus and Linear Algebra Lab 2 Session',
    start_timestamp: '2026-08-27T17:00:00+05:30',
    end_timestamp: '2026-08-27T18:30:00+05:30',
    attended: true,
    attendance_waived: false,
    course: {
      hash: 'abqtra71lo83',
      title: "Newton School of Technology'25 (SVYASA) - Calculus and linear Algebra for AI Lab 2",
      short_display_name: 'Maths-3 Lab 2'
    },
    instructor_user: {
      first_name: 'Anupam',
      last_name: 'Nigam',
      username: 'anupam.nigam'
    }
  },
  {
    hash: 'lec-demo-6',
    title: 'System of Linear Equations, Gaussian Elimination',
    start_timestamp: '2026-08-27T09:30:00+05:30',
    end_timestamp: '2026-08-27T11:00:00+05:30',
    attended: false,
    attendance_waived: false,
    course: {
      hash: 'oojehllgsouk',
      title: "Newton School of Technology'25 (SVYASA) - Calculus and linear Algebra for AI",
      short_display_name: 'Calculus and Algebra'
    },
    instructor_user: {
      first_name: 'Adhiraj',
      last_name: 'Mandal',
      username: 'adhiraj.mandal'
    }
  },
  {
    hash: 'lec-demo-7',
    title: 'AI Interdisciplinary Introduction & Foundations',
    start_timestamp: '2026-08-26T10:00:00+05:30',
    end_timestamp: '2026-08-26T11:30:00+05:30',
    attended: false,
    attendance_waived: false,
    course: {
      hash: '3d7pc6pq59so',
      title: "Newton School of Technology'25 (SVYASA) - AI for Interdisciplinary Applications",
      short_display_name: 'AI - IA'
    },
    instructor_user: {
      first_name: 'Mahfooj',
      last_name: 'Ali',
      username: 'mahfooj.ali'
    }
  }
];

function sanitizeToken(token) {
  if (!token) return "";
  return token.replace(/^Bearer\s+/i, '').trim();
}

/**
 * Low-level HTTP fetcher with standard headers and error handling
 */
async function fetchLms(endpoint, token) {
  const clean = sanitizeToken(token);
  if (!clean) {
    throw new Error("No authentication token provided.");
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${clean}`,
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    const error = new Error(`LMS API Error [${res.status}]: ${res.statusText}`);
    error.status = res.status;
    throw error;
  }

  return await res.json();
}

/**
 * Fetches authenticated student profile.
 */
export async function fetchUserProfile(token) {
  return await fetchLms('/api/v1/user/me/', token);
}

/**
 * Fetches enrolled/applied courses and extracts semester hierarchies.
 */
export async function fetchAppliedSemesters(token) {
  const data = await fetchLms('/api/v2/course/all/applied/?pagination=false&completed=false', token);
  const semesters = [];

  for (const course of data) {
    const children = course.children_courses || {};
    const adminUnits = children.admin_unit_courses || [];

    for (const unit of adminUnits) {
      const units = (unit.learning_unit_courses || []).map((lu, idx) => ({
        id: lu.id || idx,
        hash: lu.hash,
        title: lu.title || lu.short_display_name,
        short_display_name: lu.short_display_name || lu.title
      }));

      semesters.push({
        hash: unit.hash,
        title: unit.title || unit.short_display_name,
        shortName: unit.short_display_name || unit.title,
        isActive: unit.is_active_admin_unit_course || false,
        learningUnits: units
      });
    }

    // Direct fallback if no admin unit children
    if (adminUnits.length === 0 && children.learning_unit_courses?.length > 0) {
      semesters.push({
        hash: course.hash,
        title: course.title || course.short_display_name,
        shortName: course.short_display_name || course.title,
        isActive: true,
        learningUnits: children.learning_unit_courses.map((lu, idx) => ({
          id: lu.id || idx,
          hash: lu.hash,
          title: lu.title || lu.short_display_name,
          short_display_name: lu.short_display_name || lu.title
        }))
      });
    }
  }

  return semesters;
}

/**
 * Fetches performance telemetry for a specific course/subject hash.
 */
export async function fetchCoursePerformance(token, courseHash) {
  return await fetchLms(`/api/v2/course/h/${courseHash}/self_performance/`, token);
}

/**
 * Fetches all lectures for a semester course hash.
 * Endpoint: /api/v2/course/h/{courseHash}/lecture/all/?pagination=false
 */
export async function fetchCourseLectures(token, courseHash) {
  const raw = await fetchLms(`/api/v2/course/h/${courseHash}/lecture/all/?pagination=false`, token);
  
  let list = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && Array.isArray(raw.results)) {
    list = raw.results;
  }

  // Normalize each lecture record
  return list.map((lec, idx) => ({
    id: lec.id || lec.hash || idx,
    hash: lec.hash || `lec-${idx}`,
    title: lec.title || 'Untitled Session',
    start_timestamp: lec.start_timestamp,
    end_timestamp: lec.end_timestamp,
    attended: lec.attended, // true | false | null (null indicates future/unscheduled)
    attendance_waived: Boolean(lec.attendance_waived),
    course: {
      hash: lec.course?.hash,
      title: lec.course?.title || 'Unknown Course',
      short_display_name: lec.course?.short_display_name || lec.course?.title || 'Course'
    },
    instructor_user: {
      first_name: lec.instructor_user?.first_name || '',
      last_name: lec.instructor_user?.last_name || '',
      username: lec.instructor_user?.username || '',
      instructor_avatar: lec.instructor_user?.instructor_avatar || null
    },
    topics: Array.isArray(lec.topics) ? lec.topics : [],
    whiteboard_file: lec.whiteboard_file || null
  }));
}
