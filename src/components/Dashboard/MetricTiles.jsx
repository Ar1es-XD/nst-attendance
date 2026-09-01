import React from 'react';
import { Flame, AlertTriangle, Calculator, Layers } from 'lucide-react';

export default function MetricTiles({
  overallStats,
  targetThreshold,
  causationReport,
  healthStats
}) {
  return (
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
  );
}
