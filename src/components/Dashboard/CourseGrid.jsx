import React from 'react';
import { Search, Sparkles, FolderPlus, Trash2, CheckCircle2, AlertTriangle, Code2 } from 'lucide-react';
import CourseCard from './CourseCard.jsx';

export default function CourseGrid({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  processedSubjects,
  filteredSubjects,
  targetThreshold,
  loading,
  totalSimulations,
  onAdjustAttendance,
  onResetAdjustment,
  groups,
  showCreateGroup,
  onToggleShowCreateGroup,
  newGroupName,
  onNewGroupNameChange,
  newGroupSubjects,
  onToggleGroupSubject,
  onCreateGroup,
  onDeleteGroup,
  onUpdateGroupThreshold,
  getGroupStats
}) {
  return (
    <>
      {/* Search, Filter & View Controls */}
      <div className="filter-search-row">
        <div className="search-field-box">
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search course name or code..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-tabs-cluster">
          <button
            className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => onStatusFilterChange('all')}
          >
            <span>All Courses</span>
            <span className="filter-num">{processedSubjects.length}</span>
          </button>
          <button
            className={`filter-tab ${statusFilter === 'safe' ? 'active' : ''}`}
            onClick={() => onStatusFilterChange('safe')}
          >
            <span className="status-dot green"></span>
            <span>Safe</span>
            <span className="filter-num">{processedSubjects.filter(s => s.status === 'safe' || s.status === 'warning').length}</span>
          </button>
          <button
            className={`filter-tab ${statusFilter === 'warning' ? 'active' : ''}`}
            onClick={() => onStatusFilterChange('warning')}
          >
            <span className="status-dot yellow"></span>
            <span>Caution</span>
            <span className="filter-num">{processedSubjects.filter(s => s.status === 'warning').length}</span>
          </button>
          <button
            className={`filter-tab ${statusFilter === 'danger' ? 'active' : ''}`}
            onClick={() => onStatusFilterChange('danger')}
          >
            <span className="status-dot red"></span>
            <span>Low Attendance</span>
            <span className="filter-num">{processedSubjects.filter(s => s.status === 'danger').length}</span>
          </button>
          {totalSimulations > 0 && (
            <button
              className={`filter-tab ${statusFilter === 'simulated' ? 'active' : ''}`}
              onClick={() => onStatusFilterChange('simulated')}
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
        <div className="courses-stream-column">
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
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)' }}>
                No Courses Match Search
              </h3>
              <p style={{ fontSize: '0.88rem' }}>Try refining your query or reset the status filter.</p>
            </div>
          ) : (
            <div className="courses-stream">
              {filteredSubjects.map(subject => (
                <CourseCard
                  key={subject.hash}
                  subject={subject}
                  targetThreshold={targetThreshold}
                  onAdjustAttendance={onAdjustAttendance}
                  onResetAdjustment={onResetAdjustment}
                />
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
                onClick={onToggleShowCreateGroup}
              >
                <FolderPlus size={13} />
                <span>New Group</span>
              </button>
            </div>

            {/* Create Group Form Drawer */}
            {showCreateGroup && (
              <form onSubmit={onCreateGroup} style={{ backgroundColor: 'var(--bg-muted)', padding: '1rem', borderRadius: 'var(--radius-nested)', border: '2px solid var(--border-color)', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Group Title:</span>
                <input
                  type="text"
                  placeholder="e.g. Lab Practicals, Theory Bucket"
                  className="art-select"
                  style={{ width: '100%', marginBottom: '0.75rem' }}
                  value={newGroupName}
                  onChange={(e) => onNewGroupNameChange(e.target.value)}
                />

                <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Select Courses:</span>
                <div style={{ maxHeight: '140px', overflowY: 'auto', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-button)', padding: '0.5rem', backgroundColor: 'var(--bg-surface)', marginBottom: '0.85rem' }}>
                  {processedSubjects.map(sub => (
                    <label key={sub.hash} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-primary)', padding: '0.3rem 0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newGroupSubjects.includes(sub.hash)}
                        onChange={() => onToggleGroupSubject(sub.hash)}
                      />
                      <span>{sub.name}</span>
                    </label>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn-art btn-art-primary" style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem' }}>Create Group</button>
                  <button type="button" className="btn-art btn-art-secondary" style={{ padding: '0.45rem', fontSize: '0.8rem' }} onClick={onToggleShowCreateGroup}>Cancel</button>
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
                          onClick={() => onDeleteGroup(group.id)}
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
                          onChange={(e) => onUpdateGroupThreshold(group.id, e.target.value)}
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
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Where T = Target % / 100.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
