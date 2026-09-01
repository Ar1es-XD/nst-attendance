import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DemoBanner() {
  return (
    <div className="demo-mode-alert-banner">
      <AlertTriangle size={20} color="var(--destructive)" style={{ flexShrink: 0 }} />
      <div>
        <strong>DEMO / SIMULATED DATA ACTIVE:</strong> You are currently viewing offline baseline fixture data. 
        Do not cite these class dates, topics, or attendance records in teacher inquiries until a live LMS session is connected.
      </div>
    </div>
  );
}
