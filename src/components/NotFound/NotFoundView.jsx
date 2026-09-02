import React from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function NotFoundView({ onNavigateHome, onNavigateLog }) {
  return (
    <div className="not-found-container" style={{ maxWidth: '640px', margin: '3rem auto', padding: '0 1rem' }}>
      <div className="art-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--destructive-subtle)', color: 'var(--destructive)', border: '1.5px solid var(--destructive)', padding: '0.35rem 0.8rem', borderRadius: 'var(--radius-pill)', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
          <AlertTriangle size={14} />
          <span>HTTP 404 // ROUTE NOT FOUND</span>
        </div>

        <h1 className="hero-main-heading" style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>
          Lecture Record <span className="hero-accent-text">Not Found</span>
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          The requested course workbook view, lecture timestamp, or parameter does not exist in the current Newton School syllabus index.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-art btn-art-primary"
            onClick={onNavigateHome}
            style={{ padding: '0.75rem 1.4rem' }}
          >
            <ArrowLeft size={16} />
            <span>Return to Dashboard</span>
          </button>
          <button
            className="btn-art btn-art-secondary"
            onClick={onNavigateLog}
            style={{ padding: '0.75rem 1.4rem' }}
          >
            <CheckCircle2 size={16} />
            <span>Class Attendance Ledger</span>
          </button>
        </div>

        <div style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <a href="#workbook" onClick={onNavigateHome} style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>
            Course Workbook
          </a>
          <a href="#attendance-log" onClick={onNavigateLog} style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>
            Lecture History
          </a>
          <a href="/llms.txt" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>
            LLM Context (llms.txt)
          </a>
        </div>
      </div>
    </div>
  );
}
