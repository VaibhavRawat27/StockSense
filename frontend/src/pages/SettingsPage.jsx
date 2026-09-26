import React, { useState } from 'react';
import { Building2, Database } from 'lucide-react';
import WarehouseSettings from '../components/master-data/WarehouseSettings';

const C = {
  navy: '#1e2a4a',
  muted: '#6b7a99',
  dim: '#94a3b8',
  border: 'rgba(0, 0, 0, 0.08)',
  blue: '#2563eb',
  blueBg: 'rgba(37, 99, 235, 0.08)',
  green: '#047857',
  panelBg: '#f8fafc',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general'); // 'warehouse' | 'general'

  const tabs = [
    { key: 'warehouse', label: 'Warehouse Setup', icon: Building2 },
    { key: 'general', label: 'Database & Environment', icon: Database },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 4px 0', color: C.navy }}>
          System Settings & Master Setup
        </h1>
        <p style={{ color: C.muted, margin: 0, fontSize: '0.9rem' }}>
          Manage warehouse sites, location hierarchies, and system configuration
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: `2px solid ${C.border}`,
        marginBottom: '24px',
        paddingBottom: '2px'
      }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            style={{
              background: activeTab === key ? C.blueBg : 'transparent',
              color: activeTab === key ? C.blue : C.muted,
              border: 'none',
              borderBottom: activeTab === key ? `3px solid ${C.blue}` : '3px solid transparent',
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
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'warehouse' && <WarehouseSettings />}

      {activeTab === 'general' && (
        <div style={{ background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: '14px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: C.navy, marginBottom: '14px' }}>
            System Environment & Database Engine
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div style={{ background: C.panelBg, border: `1px solid ${C.border}`, padding: '16px', borderRadius: '12px' }}>
              <div style={{ color: C.dim, fontSize: '0.75rem', textTransform: 'uppercase' }}>Database Engine</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: C.green, marginTop: '4px' }}>SQLite 3 (WAL Mode)</div>
              <div style={{ fontSize: '0.78rem', color: C.muted, marginTop: '4px' }}>Path: <code>backend/data/stock-sense.db</code></div>
            </div>

            <div style={{ background: C.panelBg, border: `1px solid ${C.border}`, padding: '16px', borderRadius: '12px' }}>
              <div style={{ color: C.dim, fontSize: '0.75rem', textTransform: 'uppercase' }}>Module Phase</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: C.blue, marginTop: '4px' }}>Phase 3 Master Data</div>
              <div style={{ fontSize: '0.78rem', color: C.muted, marginTop: '4px' }}>Products, Categories, Warehouses, Stock Levels</div>
            </div>

            <div style={{ background: C.panelBg, border: `1px solid ${C.border}`, padding: '16px', borderRadius: '12px' }}>
              <div style={{ color: C.dim, fontSize: '0.75rem', textTransform: 'uppercase' }}>API Server Status</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: C.navy, marginTop: '4px' }}>Port 5000 Active</div>
              <div style={{ fontSize: '0.78rem', color: C.muted, marginTop: '4px' }}>Reverse proxy configured via Vite</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}