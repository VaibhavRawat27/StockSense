import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  Building2,
  Edit,
  Trash2,
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronUp,
  MapPin,
  Barcode
} from 'lucide-react';
import { api } from '../../services/api';
import ProductModal from './ProductModal';

// ---- Light theme tokens (local to this component) ----
const C = {
  navy: '#1e2a4a',
  muted: '#6b7a99',
  dim: '#94a3b8',
  border: 'rgba(0, 0, 0, 0.08)',
  cardBg: '#ffffff',
  hoverBg: '#f8fafc',
  blue: '#2563eb',
  blueBg: 'rgba(37, 99, 235, 0.08)',
  amber: '#b45309',
  amberBg: 'rgba(245, 158, 11, 0.12)',
  green: '#047857',
  greenBg: 'rgba(16, 185, 129, 0.12)',
  red: '#b91c1c',
  redBg: 'rgba(244, 63, 94, 0.1)',
};

const cardStyle = {
  background: C.cardBg,
  border: `1px solid ${C.border}`,
  borderRadius: '14px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const inputStyle = {
  width: '100%',
  fontSize: '0.92rem',
  color: C.navy,
  background: '#ffffff',
  border: `1px solid ${C.border}`,
  borderRadius: '10px',
  padding: '10px 14px',
  outline: 'none',
};

export default function ProductCatalog({ onSelectProductLocation }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodsRes, catsRes, whsRes] = await Promise.all([
        api.getProducts({ search, category_id: selectedCategory, status: selectedStatus }),
        api.getCategories(),
        api.getWarehouses(),
      ]);

      if (prodsRes?.data) setProducts(prodsRes.data);
      if (catsRes?.data) setCategories(catsRes.data);
      if (whsRes?.data) setWarehouses(whsRes.data);
    } catch (err) {
      console.error('Error fetching catalog data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategory, selectedStatus]);

  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to remove "${product.name}" (${product.sku}) from the catalog?`)) {
      return;
    }
    try {
      await api.deleteProduct(product.id);
      setStatusMessage({ type: 'success', text: `Product "${product.name}" deleted successfully.` });
      loadData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete product.' });
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setIsModalOpen(true);
  };

  const handleModalSave = () => {
    setIsModalOpen(false);
    setStatusMessage({ type: 'success', text: 'Product saved to catalog successfully.' });
    loadData();
  };

  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock_status === 'low_stock' || p.stock_status === 'out_of_stock').length;
  const totalUnits = products.reduce((acc, p) => acc + (p.total_stock || 0), 0);

  return (
    <div>
      {/* Top KPI Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ ...cardStyle, padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: C.muted, fontWeight: '600' }}>Active Catalog SKUs</span>
            <div style={{ background: C.blueBg, color: C.blue, padding: '6px', borderRadius: '8px' }}>
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: C.navy }}>{totalProducts}</div>
          <div style={{ fontSize: '0.75rem', color: C.dim }}>Across {categories.length} categories</div>
        </div>

        <div style={{ ...cardStyle, padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: C.muted, fontWeight: '600' }}>Reorder Rule Triggers</span>
            <div style={{ background: C.amberBg, color: C.amber, padding: '6px', borderRadius: '8px' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: lowStockCount > 0 ? C.amber : C.navy }}>
            {lowStockCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: lowStockCount > 0 ? C.amber : C.dim }}>
            {lowStockCount > 0 ? 'Action required: Below min stock' : 'All thresholds optimal'}
          </div>
        </div>

        <div style={{ ...cardStyle, padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: C.muted, fontWeight: '600' }}>Total Inventory On-Hand</span>
            <div style={{ background: C.greenBg, color: C.green, padding: '6px', borderRadius: '8px' }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: C.navy }}>
            {totalUnits.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: '500', color: C.dim }}>units</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: C.dim }}>Distributed in {warehouses.length} warehouse sites</div>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '18px',
            background: statusMessage.type === 'error' ? C.redBg : C.greenBg,
            color: statusMessage.type === 'error' ? C.red : C.green,
            border: `1px solid ${statusMessage.type === 'error' ? 'rgba(244,63,94,0.25)' : 'rgba(16,185,129,0.25)'}`,
            fontSize: '0.88rem'
          }}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: '700' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ ...cardStyle, padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: C.dim }} />
            <input
              type="text"
              style={{ ...inputStyle, paddingLeft: '40px' }}
              placeholder="Search by product name, SKU, or barcode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ flex: '0 1 200px' }}>
            <select style={inputStyle} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '0 1 180px' }}>
            <select style={inputStyle} value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
              <option value="">All Stock Statuses</option>
              <option value="low_stock">⚠️ Reorder Alerts Only</option>
              <option value="optimal">✓ Optimal Levels</option>
              <option value="out_of_stock">✕ Out of Stock</option>
            </select>
          </div>

          <button type="button" className="btn btn-primary" onClick={handleOpenCreate} style={{ whiteSpace: 'nowrap' }}>
            <Plus size={16} /> New Product
          </button>
        </div>
      </div>

      {/* Catalog Table */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: `1px solid ${C.border}` }}>
                <th style={{ width: '30px', padding: '14px 16px' }}></th>
                <th style={thStyle}>Product & SKU</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>UOM</th>
                <th style={thStyle}>Total On-Hand</th>
                <th style={thStyle}>Reorder Rules (Min / Max)</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: C.muted }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <RefreshCw size={18} className="spinner" /> Loading product catalog...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '48px', color: C.muted }}>
                    <Package size={36} color={C.dim} style={{ marginBottom: '8px' }} />
                    <div>No products found matching your search or filter.</div>
                    <button type="button" className="btn btn-secondary" style={{ marginTop: '12px', fontSize: '0.82rem' }} onClick={handleOpenCreate}>
                      <Plus size={14} /> Add First Product
                    </button>
                  </td>
                </tr>
              ) : (
                products.map(p => {
                  const isExpanded = expandedProductId === p.id;
                  const total = Number(p.total_stock);
                  const min = Number(p.min_stock);
                  const max = Number(p.max_stock);
                  const pct = max > 0 ? Math.min(100, Math.round((total / max) * 100)) : 50;

                  return (
                    <React.Fragment key={p.id}>
                      <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={tdStyle}>
                          <button
                            type="button"
                            onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                            style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                            title="Toggle warehouse location breakdown"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>

                        <td style={tdStyle}>
                          <div style={{ fontWeight: '600', color: C.navy, fontSize: '0.92rem' }}>{p.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: C.blue, background: C.blueBg, padding: '2px 7px', borderRadius: '9999px' }}>
                              {p.sku}
                            </span>
                            {p.barcode && (
                              <span style={{ fontSize: '0.72rem', color: C.dim, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Barcode size={12} /> {p.barcode}
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '600', padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#475569' }}>
                            {p.category_name}
                          </span>
                        </td>

                        <td style={tdStyle}>
                          <span style={{ fontSize: '0.85rem', color: C.muted }}>{p.uom}</span>
                        </td>

                        <td style={tdStyle}>
                          <div style={{ fontSize: '1.05rem', fontWeight: '700', color: total === 0 ? C.red : C.navy }}>
                            {total} <span style={{ fontSize: '0.75rem', fontWeight: '400', color: C.dim }}>{p.uom}</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: C.dim }}>
                            across {p.locations?.length || 0} facility locations
                          </div>
                        </td>

                        <td style={{ ...tdStyle, minWidth: '150px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: C.dim, marginBottom: '3px' }}>
                            <span>Min: <strong style={{ color: C.amber }}>{min}</strong></span>
                            <span>Max: {max}</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: '#e5e9f2', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: '999px', width: `${pct}%`, background: total <= min ? '#f59e0b' : '#10b981' }} />
                          </div>
                          {p.suggested_reorder_qty > 0 && (
                            <div style={{ fontSize: '0.7rem', color: C.amber, marginTop: '3px' }}>
                              Suggested Reorder: +{p.suggested_reorder_qty} {p.uom}
                            </div>
                          )}
                        </td>

                        <td style={tdStyle}>
                          {p.stock_status === 'out_of_stock' && <StatusBadge text="Out of Stock" color={C.red} bg={C.redBg} />}
                          {p.stock_status === 'low_stock' && <StatusBadge text="⚠️ Reorder Alert" color={C.amber} bg={C.amberBg} title={p.alert_message} />}
                          {p.stock_status === 'optimal' && <StatusBadge text="✓ Optimal" color={C.green} bg={C.greenBg} />}
                          {p.stock_status === 'overstock' && <StatusBadge text="Surplus" color={C.blue} bg={C.blueBg} />}
                        </td>

                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button type="button" onClick={() => setExpandedProductId(isExpanded ? null : p.id)} className="btn btn-secondary" style={secondaryBtnLight} title="View stock across warehouse locations">
                              <Building2 size={13} /> <span>Locations</span>
                            </button>
                            <button type="button" onClick={() => handleOpenEdit(p)} className="btn btn-secondary" style={secondaryBtnLight} title="Edit product catalog details">
                              <Edit size={13} />
                            </button>
                            <button type="button" onClick={() => handleDelete(p)} style={dangerBtnLight} title="Delete product">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr style={{ background: '#f8fafc' }}>
                          <td colSpan="8" style={{ padding: '16px 24px' }}>
                            <div style={{ background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px 18px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <MapPin size={16} color={C.blue} />
                                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: C.navy }}>
                                    Warehouse Location Breakdown for {p.name}
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.78rem', color: C.muted }}>
                                  Preferred Vendor: <strong style={{ color: C.navy }}>{p.preferred_vendor || 'Not specified'}</strong>
                                </span>
                              </div>

                              {p.locations && p.locations.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                                  {p.locations.map((loc, idx) => (
                                    <div key={idx} style={{ background: '#f8fafc', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: C.navy }}>{loc.warehouse_name}</div>
                                        <div style={{ fontSize: '0.72rem', color: C.dim, fontFamily: 'var(--font-mono)' }}>
                                          Facility: {loc.warehouse_code} | Bin: <span style={{ color: C.blue }}>{loc.bin_location}</span>
                                        </div>
                                      </div>
                                      <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.05rem', fontWeight: '800', color: loc.quantity > 0 ? C.green : C.red }}>{loc.quantity}</div>
                                        <div style={{ fontSize: '0.7rem', color: C.dim }}>{p.uom}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ fontSize: '0.8rem', color: C.dim, fontStyle: 'italic' }}>
                                  No active location stock assigned. Create a receipt or manual stock adjustment to place stock in a warehouse.
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          warehouses={warehouses}
          onClose={() => setIsModalOpen(false)}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}

const thStyle = {
  padding: '14px 16px',
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase',
  fontSize: '0.75rem',
  letterSpacing: '0.5px',
};

const tdStyle = {
  padding: '14px 16px',
};

const secondaryBtnLight = {
  padding: '6px 10px',
  fontSize: '0.78rem',
  background: '#f1f5f9',
  color: '#334155',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: '8px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  cursor: 'pointer',
};

const dangerBtnLight = {
  padding: '6px 10px',
  fontSize: '0.78rem',
  background: '#fef2f2',
  color: '#b91c1c',
  border: '1px solid rgba(244,63,94,0.25)',
  borderRadius: '8px',
  cursor: 'pointer',
};

function StatusBadge({ text, color, bg, title }) {
  return (
    <span title={title} style={{
      display: 'inline-flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600,
      padding: '3px 9px', borderRadius: '9999px', color, background: bg,
    }}>
      {text}
    </span>
  );
}