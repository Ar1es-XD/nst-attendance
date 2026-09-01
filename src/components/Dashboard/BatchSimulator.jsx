import React from 'react';
import { Sparkles, Plus, Minus, RotateCcw } from 'lucide-react';

export default function BatchSimulator({
  totalSimulations,
  onApplyBatchSimulation,
  onResetAllAdjustments
}) {
  return (
    <div className="batch-simulator-card">
      <div className="batch-info-cluster">
        <Sparkles size={20} color="var(--primary)" />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.15rem' }}>
            <span className="tag-badge terracotta">WHAT-IF ENGINE // PROJECTIONS</span>
            {totalSimulations > 0 && (
              <span className="tag-badge orange">
                {totalSimulations} ACTIVE OVERRIDE{totalSimulations > 1 ? 'S' : ''}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600 }}>
            Simulate universal schedule scenarios to test your attendance:
          </span>
        </div>
      </div>

      <div className="batch-actions-cluster">
        <button
          className="btn-art btn-art-secondary"
          onClick={() => onApplyBatchSimulation('attend_all', 1)}
          style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
        >
          <Plus size={13} color="var(--status-green)" />
          <span>+1 All (Day Present)</span>
        </button>
        <button
          className="btn-art btn-art-secondary"
          onClick={() => onApplyBatchSimulation('miss_all', 1)}
          style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
        >
          <Minus size={13} color="var(--destructive)" />
          <span>+1 Miss All (Bunk Day)</span>
        </button>
        <button
          className="btn-art btn-art-secondary"
          onClick={() => onApplyBatchSimulation('attend_all', 3)}
          style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
        >
          <span>+3 Full Week Present</span>
        </button>
        <button
          className="btn-art btn-art-secondary"
          onClick={() => onApplyBatchSimulation('miss_all', 3)}
          style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
        >
          <span>Miss Full Week</span>
        </button>
        <button
          className={`btn-art ${totalSimulations > 0 ? 'btn-art-destructive' : 'btn-art-secondary'}`}
          onClick={onResetAllAdjustments}
          disabled={totalSimulations === 0}
          style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          title="Reset all simulated adjustments back to portal values"
        >
          <RotateCcw size={13} />
          <span>Reset All {totalSimulations > 0 ? `(${totalSimulations})` : ''}</span>
        </button>
      </div>
    </div>
  );
}
