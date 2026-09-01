import React from 'react';

export default function Ticker({ overallStats, targetThreshold, processedSubjects }) {
  const subjectsList = processedSubjects.length > 0 ? processedSubjects : [
    { hash: 'ada', name: 'Analysis & Design of Algorithms', percent: 100.0, status: 'safe' },
    { hash: 'ap', name: 'Advanced Programming', percent: 80.0, status: 'safe' },
    { hash: 'calc', name: 'Calculus & Linear Algebra', percent: 83.3, status: 'safe' },
    { hash: 'de', name: 'Data Engineering', percent: 100.0, status: 'safe' }
  ];

  return (
    <div className="ticker-container">
      <div className="ticker-track">
        {/* Target Threshold & Overall Delta */}
        <div className="ticker-item">
          <span className={`status-dot ${overallStats.percent >= targetThreshold ? 'green' : 'yellow'}`}></span>
          <span>Target Threshold: {targetThreshold}%</span>
          <span className="pixel-tag">
            {overallStats.percent >= targetThreshold
              ? `BUFFER +${(overallStats.percent - targetThreshold).toFixed(1)}% (${overallStats.bunkable} BUNKABLE)`
              : `NEED +${(targetThreshold - overallStats.percent).toFixed(1)}% (ATTEND ${overallStats.required})`}
          </span>
        </div>

        {/* Dynamic Subject Status Stream */}
        {subjectsList.map(sub => (
          <div key={sub.hash} className="ticker-item">
            <span className={`status-dot ${sub.status === 'safe' ? 'green' : sub.status === 'warning' ? 'yellow' : 'red'}`}></span>
            <span>{sub.shortName || sub.name}</span>
            <span className="pixel-tag">
              {sub.percent.toFixed(1)}% {sub.status === 'safe' ? 'SAFE' : sub.status === 'warning' ? 'CAUTION' : 'LOW'}
            </span>
          </div>
        ))}

        {/* Repeat for continuous 40s seamless loop */}
        <div className="ticker-item">
          <span className={`status-dot ${overallStats.percent >= targetThreshold ? 'green' : 'yellow'}`}></span>
          <span>Target Threshold: {targetThreshold}%</span>
          <span className="pixel-tag">
            {overallStats.percent >= targetThreshold
              ? `BUFFER +${(overallStats.percent - targetThreshold).toFixed(1)}% (${overallStats.bunkable} BUNKABLE)`
              : `NEED +${(targetThreshold - overallStats.percent).toFixed(1)}% (ATTEND ${overallStats.required})`}
          </span>
        </div>

        {subjectsList.map(sub => (
          <div key={`dup-${sub.hash}`} className="ticker-item">
            <span className={`status-dot ${sub.status === 'safe' ? 'green' : sub.status === 'warning' ? 'yellow' : 'red'}`}></span>
            <span>{sub.shortName || sub.name}</span>
            <span className="pixel-tag">
              {sub.percent.toFixed(1)}% {sub.status === 'safe' ? 'SAFE' : sub.status === 'warning' ? 'CAUTION' : 'LOW'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
