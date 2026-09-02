import React from 'react';
import { X, ExternalLink, Database, ShieldCheck, BookOpen, Code, GraduationCap } from 'lucide-react';

export default function SourcesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog art-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', width: '92%', maxHeight: '85vh', overflowY: 'auto', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div>
            <span className="tag-badge terracotta" style={{ marginBottom: '0.3rem' }}>METHODOLOGY &amp; TRANSPARENCY</span>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-display)' }}>Verified Page Sources &amp; Citations</h3>
          </div>
          <button
            onClick={onClose}
            className="btn-art btn-art-secondary"
            style={{ padding: '0.35rem 0.6rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '1.25rem' }}>
          Newton School Attendance Tracker synthesizes official learning management data with discrete mathematical models. Every metric, timestamp, and formula is backed by official sources:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Source 1: Official LMS Telemetry */}
          <div style={{ border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-nested)', padding: '1rem', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Database size={16} color="var(--primary)" />
              <strong style={{ fontSize: '0.9rem' }}>Primary LMS Telemetry API</strong>
              <span className="tag-badge green" style={{ marginLeft: 'auto' }}>Official</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>
              Real-time attendance tallies, lecture records, and enrolled course hierarchies are queried directly from Newton School's LMS backend:
            </p>
            <ul style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
              <li>User Identity: <code style={{ color: 'var(--primary)' }}>GET /api/v1/user/me/</code></li>
              <li>Course Hierarchy: <code style={{ color: 'var(--primary)' }}>GET /api/v2/course/all/applied/</code></li>
              <li>Attendance Standing: <code style={{ color: 'var(--primary)' }}>GET /api/v2/course/h/&#123;hash&#125;/self_performance/</code></li>
              <li>Timetable &amp; Whiteboard: <code style={{ color: 'var(--primary)' }}>GET /api/v2/course/h/&#123;hash&#125;/lectures/</code></li>
            </ul>
            <a
              href="https://my.newtonschool.co"
              target="_blank"
              rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--primary)', marginTop: '0.5rem', textDecoration: 'underline' }}
            >
              <span>Visit my.newtonschool.co</span>
              <ExternalLink size={11} />
            </a>
          </div>

          {/* Source 2: Academic Regulations Policy */}
          <div style={{ border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-nested)', padding: '1rem', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <GraduationCap size={16} color="var(--tag-gold)" />
              <strong style={{ fontSize: '0.9rem' }}>Academic Council Attendance Regulation</strong>
              <span className="tag-badge gold" style={{ marginLeft: 'auto' }}>Mandate</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Pursuant to the Newton School of Technology undergraduate academic handbook, students are required to maintain a minimum aggregate and subject-level attendance of <strong>75.0%</strong> to be eligible for end-semester examinations.
            </p>
          </div>

          {/* Source 3: Mathematical Causation Formulations */}
          <div style={{ border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-nested)', padding: '1rem', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <BookOpen size={16} color="var(--status-green)" />
              <strong style={{ fontSize: '0.9rem' }}>Mathematical Causation Formulas</strong>
              <span className="tag-badge orange" style={{ marginLeft: 'auto' }}>Discrete Proof</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 0.4rem 0', lineHeight: 1.5 }}>
              Quota calculations use deterministic floor and ceiling invariants derived from inequality constraints:
            </p>
            <div style={{ backgroundColor: 'var(--bg-muted)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-button)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
              <div>Bunk Quota = &lfloor;(Attended - Target &times; Total) / Target&rfloor;</div>
              <div style={{ marginTop: '0.3rem' }}>Recovery = &lceil;(Target &times; Total - Attended) / (1 - Target)&rceil;</div>
            </div>
          </div>

          {/* Source 4: Open Source Repository */}
          <div style={{ border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-nested)', padding: '1rem', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Code size={16} color="var(--primary)" />
              <strong style={{ fontSize: '0.9rem' }}>Public Source Code Repository</strong>
              <span className="tag-badge terracotta" style={{ marginLeft: 'auto' }}>GPL / Open</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 0.4rem 0', lineHeight: 1.5 }}>
              The full client codebase, test suites, and formatting logic are publicly auditable on GitHub:
            </p>
            <a
              href="https://github.com/Ar1es-XD/nst-attendance"
              target="_blank"
              rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
            >
              <span>github.com/Ar1es-XD/nst-attendance</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Source 5: Zero-Trust Security Model */}
          <div style={{ border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-nested)', padding: '1rem', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <ShieldCheck size={16} color="var(--status-green)" />
              <strong style={{ fontSize: '0.9rem' }}>Local-First Privacy Architecture</strong>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Zero external databases. Session tokens, simulated overrides, and custom subject groups remain strictly in the browser&apos;s localStorage and are never collected by third parties.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
          <button className="btn-art btn-art-primary" onClick={onClose} style={{ padding: '0.5rem 1.25rem' }}>
            Close Sources
          </button>
        </div>
      </div>
    </div>
  );
}
