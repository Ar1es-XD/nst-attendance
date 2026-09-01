/**
 * Formats a natural, human Slack direct message for professors regarding attendance.
 * Designed to sound like a polite, respectful student message rather than an automated bot report.
 *
 * @param {Object} params
 * @param {Object} params.lecture - The lecture object from LMS ledger
 * @param {Object} [params.studentProfile] - Current logged in student profile
 * @param {'Sir'|'Ma'am'} [params.honorific='Sir'] - Addressing preference
 * @param {boolean} [params.isDemoMode=false] - Whether offline demo mode is active
 * @returns {string} - Formatted Slack direct message
 */
export function formatSlackTeacherMessage({
  lecture,
  studentProfile,
  honorific = 'Sir',
  isDemoMode = false
}) {
  if (!lecture) return '';

  const teacherFirstName = lecture.instructor_user?.first_name?.trim() || '';
  const honorificLower = (honorific || 'Sir').toLowerCase();

  // 1. Natural greeting
  const salutation = teacherFirstName
    ? `Hi ${teacherFirstName} ${honorificLower}, hope you're doing well!`
    : `Hi ${honorificLower}, hope you're doing well!`;

  // 2. Clean Course Name (prefer short display name e.g. "ADA", "Advanced Programming", fallback to clean title)
  let courseName = lecture.course?.short_display_name;
  if (!courseName && lecture.course?.title) {
    courseName = lecture.course.title
      .replace(/^Newton School of Technology'25\s*\([^)]*\)\s*-\s*/i, '')
      .replace(/\s*\(SVYASA\)\s*/i, '')
      .trim();
  }
  if (!courseName) {
    courseName = 'class';
  }

  // 3. Natural Date & Time formatting: "Mon, 31 Aug (11:00 AM)"
  let dateStr = '';
  let timeStr = '';
  if (lecture.start_timestamp) {
    try {
      const start = new Date(lecture.start_timestamp);
      dateStr = start.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      timeStr = start.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      dateStr = lecture.start_timestamp;
    }
  }

  const sessionDetails = dateStr
    ? `${dateStr}${timeStr ? `, ${timeStr}` : ''}`
    : 'recent session';

  const topicNote = lecture.title
    ? ` (${lecture.title.trim()})`
    : '';

  const studentName = studentProfile?.first_name
    ? `${studentProfile.first_name} ${studentProfile.last_name || ''}`.trim()
    : 'Student';

  // 4. Conversational body phrasing
  let message = '';
  if (lecture.attended === false) {
    message = `${salutation}

I was checking the portal and noticed I'm marked absent for the *${courseName}* class on *${sessionDetails}*${topicNote}.

I attended the class—could you please update my attendance when you get some time?

Thanks a lot!
${studentName}`;
  } else {
    // For checking verification on an already marked or upcoming session
    message = `${salutation}

Just wanted to quickly check regarding my attendance for the *${courseName}* class on *${sessionDetails}*${topicNote}—could you please verify if it's updated on the portal?

Thanks a lot!
${studentName}`;
  }

  // 5. Subtle demo mode guard
  if (isDemoMode) {
    message += `\n\n> ⚠️ _(Simulated demo fixture — ensure your live token is connected before sending to faculty)_`;
  }

  return message;
}
