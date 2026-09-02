/**
 * Formats a natural, human Slack direct message for professors regarding attendance.
 * Designed to sound like a polite, respectful student message rather than an automated bot report.
 *
 * @param {Object} params
 * @param {Object} params.lecture - The lecture object from LMS ledger
 * @param {Object} [params.studentProfile] - Current logged in student profile
 * @param {'Sir'|'Ma'am'} [params.honorific='Sir'] - Addressing preference
 * @param {number} [params.temperature=0.5] - Tone temperature from 0.0 (formal/crisp) to 1.0 (expressive/warm)
 * @param {boolean} [params.isDemoMode=false] - Whether offline demo mode is active
 * @returns {string} - Formatted Slack direct message
 */

/**
 * Maps a numeric temperature (0.0 to 1.0) to a semantic tone category.
 * @param {number} [temperature=0.5]
 * @returns {'formal'|'concise'|'balanced'|'warm'|'expressive'}
 */
export function getTemperatureTone(temperature = 0.5) {
  const t = Number(temperature);
  const clamped = isNaN(t) ? 0.5 : Math.min(Math.max(t, 0), 1);
  if (clamped <= 0.2) return 'formal';
  if (clamped <= 0.4) return 'concise';
  if (clamped <= 0.6) return 'balanced';
  if (clamped <= 0.8) return 'warm';
  return 'expressive';
}

/**
 * Returns a human-readable display label for the given temperature.
 * @param {number} [temperature=0.5]
 * @returns {string}
 */
export function getTemperatureLabel(temperature = 0.5) {
  const tone = getTemperatureTone(temperature);
  switch (tone) {
    case 'formal': return 'Formal';
    case 'concise': return 'Concise';
    case 'balanced': return 'Balanced';
    case 'warm': return 'Warm';
    case 'expressive': return 'Expressive';
    default: return 'Balanced';
  }
}

export function formatSlackTeacherMessage({
  lecture,
  studentProfile,
  honorific = 'Sir',
  temperature = 0.5,
  isDemoMode = false
}) {
  if (!lecture) return '';

  const teacherFirstName = lecture.instructor_user?.first_name?.trim() || '';
  const honorificLower = (honorific || 'Sir').toLowerCase();
  const tone = getTemperatureTone(temperature);

  // Clean Course Name (prefer short display name e.g. "ADA", "Advanced Programming", fallback to clean title)
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

  // Natural Date & Time formatting: "Mon, 31 Aug (11:00 AM)"
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

  // Construct message phrasing based on temperature / tone
  let salutation = '';
  let body = '';
  let signoff = '';

  const isAbsent = lecture.attended === false;

  switch (tone) {
    case 'formal': {
      salutation = teacherFirstName
        ? `Dear ${teacherFirstName} ${honorificLower},`
        : `Respected ${honorificLower},`;

      if (isAbsent) {
        body = `I am writing to bring to your attention that I am marked absent on the portal for the *${courseName}* session on *${sessionDetails}*${topicNote}.\n\nI was present during this class. Could you please review and update my attendance record at your earliest convenience?`;
      } else {
        body = `I am writing regarding my attendance for the *${courseName}* session on *${sessionDetails}*${topicNote}. Could you kindly verify if my attendance has been updated on the portal?`;
      }

      signoff = `Thank you,\n${studentName}`;
      break;
    }

    case 'concise': {
      salutation = teacherFirstName
        ? `Good day ${teacherFirstName} ${honorificLower},`
        : `Good day ${honorificLower},`;

      if (isAbsent) {
        body = `I noticed I'm marked absent on the portal for the *${courseName}* class on *${sessionDetails}*${topicNote}.\n\nI attended this session—could you please update my attendance record when possible?`;
      } else {
        body = `Quick check regarding my attendance for the *${courseName}* class on *${sessionDetails}*${topicNote}—could you please confirm if it's updated on the portal?`;
      }

      signoff = `Best regards,\n${studentName}`;
      break;
    }

    case 'warm': {
      salutation = teacherFirstName
        ? `Hi ${teacherFirstName} ${honorificLower}, hope you're having a great week!`
        : `Hi ${honorificLower}, hope you're having a great week!`;

      if (isAbsent) {
        body = `Hope your week is going well! I was checking the portal and noticed I'm marked absent for the *${courseName}* class on *${sessionDetails}*${topicNote}.\n\nI attended this lecture—whenever you get a chance, could you please help update my attendance? Really appreciate your time!`;
      } else {
        body = `Hope you're having a good day! Just wanted to check in regarding my attendance for *${courseName}* on *${sessionDetails}*${topicNote}—whenever you have a second, could you please verify if it's reflected on the portal?`;
      }

      signoff = `Thanks so much!\n${studentName}`;
      break;
    }

    case 'expressive': {
      salutation = teacherFirstName
        ? `Hey ${teacherFirstName} ${honorificLower}! Hope you're having a wonderful week!`
        : `Hey ${honorificLower}! Hope you're having a wonderful week!`;

      if (isAbsent) {
        body = `Sorry to trouble you! I was reviewing the portal and saw that I was marked absent for the *${courseName}* session on *${sessionDetails}*${topicNote}.\n\nI was present throughout and really enjoyed the class. Whenever you get a free moment, could you please help me update my attendance? Truly grateful for your support!`;
      } else {
        body = `Hope you're doing wonderful! Just wanted to kindly follow up regarding my attendance for the *${courseName}* class on *${sessionDetails}*${topicNote}—whenever you get a moment, could you please check if it's updated on the portal? Really appreciate your help!`;
      }

      signoff = `Warm regards,\n${studentName}`;
      break;
    }

    case 'balanced':
    default: {
      salutation = teacherFirstName
        ? `Hi ${teacherFirstName} ${honorificLower}, hope you're doing well!`
        : `Hi ${honorificLower}, hope you're doing well!`;

      if (isAbsent) {
        body = `I was checking the portal and noticed I'm marked absent for the *${courseName}* class on *${sessionDetails}*${topicNote}.\n\nI attended the class—could you please update my attendance when you get some time?`;
      } else {
        body = `Just wanted to quickly check regarding my attendance for the *${courseName}* class on *${sessionDetails}*${topicNote}—could you please verify if it's updated on the portal?`;
      }

      signoff = `Thanks a lot!\n${studentName}`;
      break;
    }
  }

  let message = `${salutation}\n\n${body}\n\n${signoff}`;

  // Subtle demo mode guard
  if (isDemoMode) {
    message += `\n\n> ⚠️ _(Simulated demo fixture — ensure your live token is connected before sending to faculty)_`;
  }

  return message;
}
