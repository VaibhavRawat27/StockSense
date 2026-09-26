import React, { useState } from 'react';
import { Package, Layers, MapPin, AlertTriangle } from 'lucide-react';
import ProductCatalog from '../components/master-data/ProductCatalog';
import CategoryManagement from '../components/master-data/CategoryManagement';
import StockAvailability from '../components/master-data/StockAvailability';

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'categories' | 'stock'

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Title & Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 4px 0' }}>
          Product & Master Data Management
        </h1>
        <p style={{ color: '#6C7A9C', margin: 0, fontSize: '0.9rem' }}>
          Catalog classification, UOM standards, replenishment rules, and multi-facility stock allocation
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '24px',
        paddingBottom: '2px'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          style={{
            background: activeTab === 'catalog' ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
            color: activeTab === 'catalog' ? '#38bdf8' : 'var(--text-muted)',
            border: 'none',
            borderBottom: activeTab === 'catalog' ? '3px solid #0ea5e9' : '3px solid transparent',
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
          <Package size={16} />
          <span>Product Catalog & Reordering Rules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          style={{
            background: activeTab === 'categories' ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
            color: activeTab === 'categories' ? '#38bdf8' : 'var(--text-muted)',
            border: 'none',
            borderBottom: activeTab === 'categories' ? '3px solid #0ea5e9' : '3px solid transparent',
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
          <Layers size={16} />
          <span>Category Management</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stock')}
          style={{
            background: activeTab === 'stock' ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
            color: activeTab === 'stock' ? '#38bdf8' : 'var(--text-muted)',
            border: 'none',
            borderBottom: activeTab === 'stock' ? '3px solid #0ea5e9' : '3px solid transparent',
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
          <MapPin size={16} />
          <span>Stock Availability per Location</span>
        </button>
      </div>

      {/* Render Active View */}
      {activeTab === 'catalog' && <ProductCatalog />}
      {activeTab === 'categories' && <CategoryManagement />}
      {activeTab === 'stock' && <StockAvailability />}
    </div>
  );
}
