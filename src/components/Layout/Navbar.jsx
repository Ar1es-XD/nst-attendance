import React from 'react';
import { RefreshCw, LogOut } from 'lucide-react';

export default function Navbar({
  isAuthenticated,
  isDemoMode,
  profile,
  loading,
  onRefresh,
  onDisconnect
}) {
  return (
    <nav className="art-nav">
      <div className="nav-brand-group">
        <div className="brand-icon-box">
          NST
        </div>
        <div className="brand-details">
          <div className="brand-title-row">
            <span className="brand-main-title">Newton School Attendance</span>
            {isAuthenticated && (
              <span className={`tag-badge ${isDemoMode ? 'orange' : 'terracotta'}`}>
                <span className={`status-dot ${isDemoMode ? 'yellow' : 'green'}`}></span>
                {isDemoMode ? 'Sandbox Demo' : 'Application Live'}
              </span>
            )}
          </div>
          {profile && (
            <span className="user-tagline">
              Student: <strong>{profile.first_name} {profile.last_name}</strong> · <span className="font-mono">@{profile.username || profile.email?.split('@')[0]}</span>
            </span>
          )}
        </div>
      </div>

      <div className="nav-controls">
        {isAuthenticated && (
          <button
            className="btn-art btn-art-secondary"
            onClick={onRefresh}
            disabled={loading}
            title="Resync data from LMS"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh LMS</span>
          </button>
        )}

        {isAuthenticated && (
          <button
            className="btn-art btn-art-destructive"
            onClick={onDisconnect}
            title="Disconnect session"
          >
            <LogOut size={14} />
            <span>Exit</span>
          </button>
        )}
      </div>
    </nav>
  );
}
