import React from 'react';
import { Search, RefreshCw, Calendar, ExternalLink, Check, X, Clock, Copy } from 'lucide-react';
import { formatLectureDateTime } from '../../utils/formatters.js';
import { getTemperatureLabel, getTemperatureTone } from '../../utils/slackMessageFormatter.js';

export default function AttendanceLogView({
  lectureMetrics,
  lectureSearch,
  onLectureSearchChange,
  lectureFilterStatus,
  onLectureFilterStatusChange,
  lectureFilterCourse,
  onLectureFilterCourseChange,
  processedSubjects,
  teacherHonorific,
  onTeacherHonorificChange,
  messageTemperature = 0.5,
  onMessageTemperatureChange,
  lecturesLoading,
  filteredLectures,
  onCopyForTeacher
}) {
  return (
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
            onChange={(e) => onLectureSearchChange(e.target.value)}
          />
          {lectureSearch && (
            <button
              onClick={() => onLectureSearchChange('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              ✕
            </button>
          )}
        </div>

        <div className="log-filter-pills">
          <button
            className={`log-filter-pill-btn ${lectureFilterStatus === 'all' ? 'active' : ''}`}
            onClick={() => onLectureFilterStatusChange('all')}
          >
            All ({lectureMetrics.total})
          </button>
          <button
            className={`log-filter-pill-btn ${lectureFilterStatus === 'missed' ? 'active' : ''}`}
            onClick={() => onLectureFilterStatusChange('missed')}
            style={lectureFilterStatus === 'missed' ? { backgroundColor: 'var(--destructive)', borderColor: 'var(--destructive)' } : {}}
          >
            Missed / Absent ({lectureMetrics.missed})
          </button>
          <button
            className={`log-filter-pill-btn ${lectureFilterStatus === 'attended' ? 'active' : ''}`}
            onClick={() => onLectureFilterStatusChange('attended')}
            style={lectureFilterStatus === 'attended' ? { backgroundColor: 'var(--status-green)', borderColor: 'var(--status-green)' } : {}}
          >
            Attended ({lectureMetrics.attended})
          </button>
        </div>

        <select
          className="art-select"
          value={lectureFilterCourse}
          onChange={(e) => onLectureFilterCourseChange(e.target.value)}
          style={{ fontSize: '0.82rem', padding: '0.5rem 0.8rem' }}
        >
          <option value="all">All Subjects</option>
          {processedSubjects.map(s => (
            <option key={s.hash} value={s.hash}>
              {s.shortName || s.name}
            </option>
          ))}
        </select>

        <div className="honorific-toggle-group" title="Choose salutation for copied Slack message">
          <span className="honorific-label">Salutation:</span>
          <button
            type="button"
            className={`honorific-toggle-btn ${teacherHonorific === 'Sir' ? 'active' : ''}`}
            onClick={() => onTeacherHonorificChange('Sir')}
          >
            Sir
          </button>
          <button
            type="button"
            className={`honorific-toggle-btn ${teacherHonorific === "Ma'am" ? 'active' : ''}`}
            onClick={() => onTeacherHonorificChange("Ma'am")}
          >
            Ma'am
          </button>
        </div>

        <div
          className="message-temp-group"
          title={`Message Temperature: ${messageTemperature.toFixed(1)} (${getTemperatureLabel(messageTemperature)} tone)\nAdjusts phrasing from Formal (0.0) to Expressive (1.0)`}
        >
          <span className="temp-label">Temp:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={messageTemperature}
            onChange={(e) => onMessageTemperatureChange?.(parseFloat(e.target.value))}
            className="art-range-input temp-range-input"
            aria-label="Message Temperature"
          />
          <span className="temp-value-display">{messageTemperature.toFixed(1)}</span>
          <span className={`temp-tone-chip tone-${getTemperatureTone(messageTemperature)}`}>
            {getTemperatureLabel(messageTemperature)}
          </span>
        </div>
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
          <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
            No Lecture Records Match Filters
          </h4>
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
                        onClick={() => onCopyForTeacher(lecture)}
                        title={`Copy Slack DM (${getTemperatureLabel(messageTemperature)} tone · Temp ${messageTemperature.toFixed(1)})`}
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
  );
}
