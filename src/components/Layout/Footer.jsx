import React from 'react';
import { ShieldCheck, BookOpen, ExternalLink, Code2, Heart, CheckCircle2, FileText, Globe } from 'lucide-react';

export default function Footer({ onOpenSources, onNavigateTab }) {
  return (
    <footer className="art-footer">
      <div className="art-footer-grid">
        {/* Column 1: Brand & Institution */}
        <div className="footer-col">
          <div className="footer-brand-title">
            <span className="brand-icon-box" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>NST</span>
            <span style={{ fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
              Newton School Attendance
            </span>
          </div>
          <p className="footer-text">
            Autonomous academic attendance workbook, discrete bunk quota calculator, and schedule simulator designed for Newton School of Technology engineering undergraduates.
          </p>
          <div className="footer-status-pill">
            <span className="status-dot green"></span>
            <span>Zero-Trust Client: 100% Local Browser Memory</span>
          </div>
        </div>

        {/* Column 2: Quick Internal Navigation */}
        <div className="footer-col">
          <h4 className="footer-col-title">Internal Navigation</h4>
          <ul className="footer-links-list">
            <li>
              <a
                href="#workbook"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateTab('workbook');
                }}
              >
                <BookOpen size={13} />
                <span>Course Workbook &amp; Steppers</span>
              </a>
            </li>
            <li>
              <a
                href="#attendance-log"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateTab('attendance-log');
                }}
              >
                <CheckCircle2 size={13} />
                <span>Class Attendance Ledger</span>
              </a>
            </li>
            <li>
              <a
                href="#sources"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenSources();
                }}
              >
                <FileText size={13} />
                <span>Page Sources &amp; Citations</span>
              </a>
            </li>
            <li>
              <a href="/404" target="_blank" rel="noreferrer">
                <Globe size={13} />
                <span>Custom 404 Error Page</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Column 3: Telemetry & Machine Specifications */}
        <div className="footer-col">
          <h4 className="footer-col-title">Machine &amp; SEO Specs</h4>
          <ul className="footer-links-list">
            <li>
              <a href="/sitemap.xml" target="_blank" rel="noreferrer">
                <Globe size={13} />
                <span>XML Sitemap (sitemap.xml)</span>
              </a>
            </li>
            <li>
              <a href="/robots.txt" target="_blank" rel="noreferrer">
                <ShieldCheck size={13} />
                <span>Robots Directives (robots.txt)</span>
              </a>
            </li>
            <li>
              <a href="/llms.txt" target="_blank" rel="noreferrer">
                <Code2 size={13} />
                <span>LLM Context Spec (llms.txt)</span>
              </a>
            </li>
            <li>
              <a href="/site.webmanifest" target="_blank" rel="noreferrer">
                <FileText size={13} />
                <span>PWA Manifest (site.webmanifest)</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Column 4: Official Affiliations & Repository */}
        <div className="footer-col">
          <h4 className="footer-col-title">Official Sources</h4>
          <ul className="footer-links-list">
            <li>
              <a href="https://my.newtonschool.co" target="_blank" rel="noreferrer">
                <span>Newton School LMS Portal</span>
                <ExternalLink size={12} />
              </a>
            </li>
            <li>
              <a href="https://www.newtonschool.co" target="_blank" rel="noreferrer">
                <span>Newton School of Technology</span>
                <ExternalLink size={12} />
              </a>
            </li>
            <li>
              <a href="https://github.com/Ar1es-XD/nst-attendance" target="_blank" rel="noreferrer">
                <span>GitHub Source Repository</span>
                <ExternalLink size={12} />
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <div>
          &copy; {new Date().getFullYear()} Newton School Attendance Tracker &bull; Designed for Newton School of Technology Students
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>Crafted with</span>
          <Heart size={12} color="var(--primary)" fill="var(--primary)" />
          <span>for Academic Excellence</span>
        </div>
      </div>
    </footer>
  );
}
