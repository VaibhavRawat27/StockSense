import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Package, 
  Layers, 
  MapPin, 
  Building2, 
  AlertTriangle, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  HardHat, 
  Database,
  ArrowLeft
} from 'lucide-react';
import ProductCatalog from './ProductCatalog';
import CategoryManagement from './CategoryManagement';
import StockAvailability from './StockAvailability';
import WarehouseSettings from './WarehouseSettings';
import { api, getStoredUser, clearAuthSession } from '../../services/api';

export default function MasterDataHub({ onBackToAuth }) {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories' | 'stock' | 'warehouses'
  const [alertCount, setAlertCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user) setCurrentUser(user);

    // Fetch reorder alert count for badge indicator
    const fetchAlerts = async () => {
      try {
        const res = await api.getReorderAlerts();
        if (res?.count !== undefined) {
          setAlertCount(res.count);
        }
      } catch (e) {
        // silent fallback
      }
    };

    fetchAlerts();
  }, [activeTab]);

  const handleLogout = () => {
    clearAuthSession();
    if (onBackToAuth) onBackToAuth();
  };

  const isManager = currentUser?.role === 'manager';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar */}
      <header style={{
        background: 'rgba(11, 15, 25, 0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '12px 24px'
      }}>
        <div style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Brand & Connection Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'var(--primary-gradient)',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
            }}>
              <Boxes size={22} color="#ffffff" />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.3px', color: '#fff' }}>
                StockSense
              </span>
              <span style={{ fontSize: '0.72rem', color: '#38bdf8', marginLeft: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Master Data Hub
              </span>
            </div>
            <div className="system-status-pill" style={{ marginLeft: '10px' }}>
              <span className="status-dot"></span>
              SQLite WAL Active
            </div>
          </div>

          {/* Module Navigation Tabs */}
          <nav style={{ display: 'flex', gap: '6px', background: 'rgba(0, 0, 0, 0.25)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              style={{
                background: activeTab === 'products' ? 'var(--bg-card-hover)' : 'transparent',
                color: activeTab === 'products' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Package size={15} color={activeTab === 'products' ? '#0ea5e9' : 'inherit'} />
              <span>Product Catalog</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              style={{
                background: activeTab === 'categories' ? 'var(--bg-card-hover)' : 'transparent',
                color: activeTab === 'categories' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Layers size={15} color={activeTab === 'categories' ? '#0ea5e9' : 'inherit'} />
              <span>Categories</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('stock')}
              style={{
                background: activeTab === 'stock' ? 'var(--bg-card-hover)' : 'transparent',
                color: activeTab === 'stock' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <MapPin size={15} color={activeTab === 'stock' ? '#0ea5e9' : 'inherit'} />
              <span>Stock by Location</span>
              {alertCount > 0 && (
                <span style={{
                  background: '#f59e0b',
                  color: '#000',
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  marginLeft: '4px'
                }}>
                  {alertCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('warehouses')}
              style={{
                background: activeTab === 'warehouses' ? 'var(--bg-card-hover)' : 'transparent',
                color: activeTab === 'warehouses' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Settings size={15} color={activeTab === 'warehouses' ? '#0ea5e9' : 'inherit'} />
              <span>Settings &rarr; Warehouse</span>
            </button>
          </nav>

          {/* User Profile & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentUser && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '999px',
                padding: '4px 12px 4px 6px'
              }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: isManager ? 'rgba(16, 185, 129, 0.2)' : 'rgba(14, 165, 233, 0.2)',
                  color: isManager ? '#10b981' : '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.75rem'
                }}>
                  {currentUser.name?.slice(0, 2).toUpperCase() || 'US'}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#fff' }}>
                  {currentUser.name}
                </div>
                <span className={`badge ${isManager ? 'badge-manager' : 'badge-staff'}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                  {isManager ? 'Manager' : 'Staff'}
                </span>
              </div>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleLogout}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              title="Return to Authentication Portal"
            >
              <ArrowLeft size={14} />
              <span>Auth Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '28px 24px', flex: 1 }}>
        {activeTab === 'products' && <ProductCatalog />}
        {activeTab === 'categories' && <CategoryManagement />}
        {activeTab === 'stock' && <StockAvailability />}
        {activeTab === 'warehouses' && <WarehouseSettings />}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '16px',
        color: 'var(--text-dim)',
        fontSize: '0.78rem',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: 'auto'
      }}>
        StockSense Phase 3 Master Data Management &bull; SQLite Engine (better-sqlite3) &bull; 2026
      </footer>
    </div>
  );
}
