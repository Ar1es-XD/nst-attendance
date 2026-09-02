import React from 'react';
import { BookOpen, Play, AlertTriangle, RefreshCw, ShieldCheck, ExternalLink, Flame, Sparkles, Layers } from 'lucide-react';

export default function ConnectView({
  inputToken,
  onInputTokenChange,
  error,
  loading,
  onConnect,
  onEnableDemoMode
}) {
  return (
    <div>
      <div className="connect-hero-box">
        <div className="hero-pill-badge">
          <BookOpen size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
          <span>FLAT ART COURSE // ATTENDANCE WORKBOOK</span>
        </div>
        <h1 className="hero-main-heading">
          Calculate bunk capacity with <span className="hero-accent-text">mathematical certainty</span>.
        </h1>
        <p className="hero-description">
          A warm, paper-like attendance workbook for Newton School students. Real-time LMS telemetry, exact bunk quotas, threshold proofs, and multi-course simulation.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <button className="btn-art btn-art-secondary" onClick={onEnableDemoMode} style={{ padding: '0.85rem 1.75rem', fontSize: '0.94rem' }}>
            <Play size={16} />
            <span>Explore Live Demo Sandbox</span>
          </button>
        </div>
      </div>

      <div className="connect-grid-layout">
        {/* Card 1: Direct Bearer Token Input */}
        <div className="art-card">
          <div className="art-card-header">
            <div>
              <span className="tag-badge terracotta" style={{ marginBottom: '0.5rem' }}>01 // DIRECT TOKEN</span>
              <h3 className="art-card-title">🔑 Direct Bearer Token</h3>
            </div>
            <span className="tag-badge green">Instant</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.55 }}>
            Paste your active Bearer token or JWT session key copied from network request headers:
          </p>

          <form onSubmit={onConnect}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Bearer Token / JWT:
              </label>
              <textarea
                rows={4}
                className="art-select font-mono"
                style={{ width: '100%', resize: 'none', fontSize: '0.82rem', padding: '0.75rem', borderRadius: 'var(--radius-nested)' }}
                placeholder="Paste Bearer token from Newton School LMS Authorization header..."
                value={inputToken}
                onChange={(e) => onInputTokenChange(e.target.value)}
              />
            </div>

            {error && (
              <div style={{ color: 'var(--destructive)', backgroundColor: 'var(--destructive-subtle)', border: '1.5px solid hsl(0, 84%, 60%, 0.3)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-button)', fontSize: '0.84rem', marginBottom: '1rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button type="submit" className="btn-art btn-art-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                <span>Load Attendance</span>
              </button>
              <button type="button" className="btn-art btn-art-secondary" onClick={onEnableDemoMode} title="Try without credentials">
                Demo Mode
              </button>
            </div>
          </form>

          <ul className="instructions-list" style={{ marginTop: '1.25rem' }}>
            <li className="instruction-step">
              <span className="step-num-badge">1</span>
              <span>Open <a href="https://my.newtonschool.co/course/u4fvf1rm9v2e/details?tab=my-timeline" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>Newton School LMS <ExternalLink size={11} style={{ display: 'inline' }} /></a> &rarr; Press <kbd>F12</kbd></span>
            </li>
            <li className="instruction-step">
              <span className="step-num-badge">2</span>
              <span>Go to <strong>Network</strong> tab &rarr; Filter for <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>/api/</code></span>
            </li>
            <li className="instruction-step">
              <span className="step-num-badge">3</span>
              <span>Copy <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>Authorization</code> header value & paste above</span>
            </li>
          </ul>
        </div>

        {/* Card 2: Workbook Capabilities & Formulas */}
        <div className="art-card">
          <div className="art-card-header">
            <div>
              <span className="tag-badge gold" style={{ marginBottom: '0.5rem' }}>02 // WORKBOOK FEATURES</span>
              <h3 className="art-card-title">📐 Certainty Engine</h3>
            </div>
            <span className="tag-badge terracotta">v2.0</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '1.25rem' }}>
            Engineered with mathematical precision to prevent debarment and track elective tracks:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ backgroundColor: 'var(--bg-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-nested)', border: '1.5px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <Flame size={14} color="var(--primary)" />
                <strong style={{ fontSize: '0.85rem' }}>Exact Bunk Quota Calculation</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Computes <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>floor((A - T*N)/T)</code> so you know exactly how many lectures you can safely miss.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-nested)', border: '1.5px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <Sparkles size={14} color="var(--tag-orange)" />
                <strong style={{ fontSize: '0.85rem' }}>Real-time What-If Stepper Simulation</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Fine-grained simulation on every course with instant recalculation of required attendance.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-nested)', border: '1.5px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <Layers size={14} color="var(--status-green)" />
                <strong style={{ fontSize: '0.85rem' }}>Custom Subject Buckets & Tracks</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Group Labs, Core CS, and Electives into custom threshold groups with isolated analytics.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn-art btn-art-secondary" onClick={onEnableDemoMode} style={{ width: '100%', fontSize: '0.86rem' }}>
              <Play size={13} />
              <span>Preview Full Dashboard (Demo)</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
        <ShieldCheck size={16} color="var(--primary)" />
        <span>Zero-Trust Architecture: Your session tokens remain stored strictly in local browser memory and never leave your machine.</span>
      </div>
    </div>
  );
}
