/**
 * Shared formatting utilities for dates, times, and metrics.
 */

/**
 * Formats ISO timestamps into human-readable date and time ranges.
 * @param {string} isoStart - ISO timestamp string for start time
 * @param {string} [isoEnd] - ISO timestamp string for end time
 * @returns {{ dateStr: string, timeStr: string }}
 */
export function formatLectureDateTime(isoStart, isoEnd) {
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
}
