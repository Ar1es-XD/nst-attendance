import React from 'react';
import { BookOpen, CheckCircle2 } from 'lucide-react';

export default function SectionTabs({
  activeTab,
  onTabChange,
  lectureCount = 0
}) {
  return (
    <div className="section-tabs-bar">
      <button
        className={`section-tab-btn ${activeTab === 'workbook' ? 'active' : ''}`}
        onClick={() => onTabChange('workbook')}
      >
        <BookOpen size={16} />
        <span>📚 Course Workbook & Simulator</span>
      </button>
      <button
        className={`section-tab-btn ${activeTab === 'attendance-log' ? 'active' : ''}`}
        onClick={() => onTabChange('attendance-log')}
      >
        <CheckCircle2 size={16} />
        <span>🗓️ Class Attendance Log (Teacher Reference)</span>
        <span className="tab-counter-badge">{lectureCount}</span>
      </button>
    </div>
  );
}
