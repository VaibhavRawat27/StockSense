import React, { useState } from 'react';
import { Building2, Settings, ShieldCheck, Database } from 'lucide-react';
import WarehouseSettings from '../components/master-data/WarehouseSettings';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('warehouse'); // 'warehouse' | 'general'

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 4px 0' }}>
          System Settings & Master Setup
        </h1>
        <p style={{ color: '#6C7A9C', margin: 0, fontSize: '0.9rem' }}>
          Manage warehouse sites, location hierarchies, and system configuration
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '24px',
        paddingBottom: '2px'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('warehouse')}
          style={{
            background: activeTab === 'warehouse' ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
            color: activeTab === 'warehouse' ? '#38bdf8' : 'var(--text-muted)',
            border: 'none',
            borderBottom: activeTab === 'warehouse' ? '3px solid #0ea5e9' : '3px solid transparent',
            padding: '10px 18px',
            borderRadius: '8px 8px 0 0',
            fontSize: '0.92rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Building2 size={16} />
          <span>Warehouse Setup</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('general')}
          style={{
            background: activeTab === 'general' ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
            color: activeTab === 'general' ? '#38bdf8' : 'var(--text-muted)',
            border: 'none',
            borderBottom: activeTab === 'general' ? '3px solid #0ea5e9' : '3px solid transparent',
            padding: '10px 18px',
            borderRadius: '8px 8px 0 0',
            fontSize: '0.92rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Database size={16} />
          <span>Database & Environment</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'warehouse' && <WarehouseSettings />}

      {activeTab === 'general' && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', marginBottom: '14px' }}>
            System Environment & Database Engine
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Database Engine</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981', marginTop: '4px' }}>SQLite 3 (WAL Mode)</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Path: <code>backend/data/stock-sense.db</code></div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Module Phase</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0ea5e9', marginTop: '4px' }}>Phase 3 Master Data</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Products, Categories, Warehouses, Stock Levels</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>API Server Status</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginTop: '4px' }}>Port 5000 Active</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Reverse proxy configured via Vite</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
