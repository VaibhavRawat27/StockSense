import React, { useState } from 'react';
import { Package, Layers, MapPin } from 'lucide-react';
import ProductCatalog from '../components/master-data/ProductCatalog';
import CategoryManagement from '../components/master-data/CategoryManagement';
import StockAvailability from '../components/master-data/StockAvailability';

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'categories' | 'stock'

  const tabs = [
    { key: 'catalog', label: 'Product Catalog & Reordering Rules', icon: Package },
    { key: 'categories', label: 'Category Management', icon: Layers },
    { key: 'stock', label: 'Stock Availability per Location', icon: MapPin },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Title & Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: '800',
          margin: '0 0 4px 0',
          color: '#1e2a4a'
        }}>
          Product & Master Data Management
        </h1>
        <p style={{ color: '#6b7a99', margin: 0, fontSize: '0.9rem' }}>
          Catalog classification, UOM standards, replenishment rules, and multi-facility stock allocation
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid rgba(0, 0, 0, 0.08)',
        marginBottom: '24px',
        paddingBottom: '2px'
      }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            style={{
              background: activeTab === key ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
              color: activeTab === key ? '#2563eb' : '#6b7a99',
              border: 'none',
              borderBottom: activeTab === key ? '3px solid #2563eb' : '3px solid transparent',
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

      {/* Render Active View */}
      <div style={{
        background: '#ffffff',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        borderRadius: '14px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        {activeTab === 'catalog' && <ProductCatalog />}
        {activeTab === 'categories' && <CategoryManagement />}
        {activeTab === 'stock' && <StockAvailability />}
      </div>
    </div>
  );
}