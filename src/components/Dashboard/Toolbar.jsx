import React from 'react';
import { RotateCcw } from 'lucide-react';

export default function Toolbar({
  semesters,
  selectedSemesterHash,
  semesterTitle,
  onSemesterChange,
  targetThreshold,
  onTargetChange,
  totalSimulations,
  onResetAdjustments
}) {
  return (
    <div className="toolbar-panel">
      <div className="toolbar-group">
        <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Sector / Semester:
        </span>
        {semesters.length > 0 ? (
          <select
            className="art-select"
            value={selectedSemesterHash}
            onChange={(e) => onSemesterChange(e.target.value)}
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
          <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Target:
          </span>
          <input
            type="range"
            min="50"
            max="100"
            value={targetThreshold}
            onChange={(e) => onTargetChange(parseInt(e.target.value, 10))}
            className="art-range-input"
          />
          <span className="target-slider-number">{targetThreshold}%</span>
        </div>

        <div className="preset-pills-cluster">
          {[75, 80, 85, 90].map(val => (
            <button
              key={val}
              className={`preset-pill-btn ${targetThreshold === val ? 'active' : ''}`}
              onClick={() => onTargetChange(val)}
            >
              {val}%
            </button>
          ))}
        </div>

        {totalSimulations > 0 && (
          <button
            className="btn-art btn-art-secondary"
            onClick={onResetAdjustments}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
          >
            <RotateCcw size={13} />
            <span>Reset Overrides ({totalSimulations})</span>
          </button>
        )}
      </div>
    </div>
  );
}
