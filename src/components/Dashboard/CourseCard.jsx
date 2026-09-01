import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Info, Sliders, RotateCcw } from 'lucide-react';

export default function CourseCard({
  subject,
  targetThreshold,
  onAdjustAttendance,
  onResetAdjustment
}) {
  return (
    <div className="course-card">
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
            <div
              className="rate-big-pct"
              style={{
                color: subject.status === 'safe'
                  ? 'var(--status-green)'
                  : subject.status === 'warning'
                    ? 'var(--tag-gold)'
                    : 'var(--destructive)'
              }}
            >
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
              onClick={() => onResetAdjustment(subject.hash)}
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
                onClick={() => onAdjustAttendance(subject.hash, 'attend', -1)}
                title="Subtract simulated attend"
              >
                -
              </button>
              <span className={`stepper-count-num ${subject.adjAttended > 0 ? 'active-plus' : ''}`}>
                {subject.adjAttended >= 0 ? `+${subject.adjAttended}` : subject.adjAttended}
              </span>
              <button
                className="stepper-click-btn"
                onClick={() => onAdjustAttendance(subject.hash, 'attend', 1)}
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
                onClick={() => onAdjustAttendance(subject.hash, 'miss', -1)}
                title="Subtract simulated miss"
              >
                -
              </button>
              <span className={`stepper-count-num ${subject.adjTotal - subject.adjAttended > 0 ? 'active-minus' : ''}`}>
                +{subject.adjTotal - subject.adjAttended}
              </span>
              <button
                className="stepper-click-btn"
                onClick={() => onAdjustAttendance(subject.hash, 'miss', 1)}
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
  );
}
