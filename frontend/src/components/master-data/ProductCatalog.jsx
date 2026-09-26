import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Edit, 
  Trash2, 
  Eye, 
  RefreshCw, 
  Layers, 
  ShieldAlert, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  MapPin,
  Barcode
} from 'lucide-react';
import { api } from '../../services/api';
import ProductModal from './ProductModal';

export default function ProductCatalog({ onSelectProductLocation }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals & view states
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

  // KPI Calculations
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock_status === 'low_stock' || p.stock_status === 'out_of_stock').length;
  const totalUnits = products.reduce((acc, p) => acc + (p.total_stock || 0), 0);

  return (
    <div>
      {/* Top Action & KPI Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>Active Catalog SKUs</span>
            <div style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', padding: '6px', borderRadius: '8px' }}>
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff' }}>{totalProducts}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Across {categories.length} categories</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>Reorder Rule Triggers</span>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '6px', borderRadius: '8px' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: lowStockCount > 0 ? '#fbbf24' : '#fff' }}>
            {lowStockCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: lowStockCount > 0 ? '#f59e0b' : 'var(--text-dim)' }}>
            {lowStockCount > 0 ? 'Action required: Below min stock' : 'All thresholds optimal'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total Inventory On-Hand</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '6px', borderRadius: '8px' }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff' }}>
            {totalUnits.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-dim)' }}>units</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Distributed in {warehouses.length} warehouse sites</div>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div 
          className={`alert ${statusMessage.type === 'error' ? 'alert-error' : 'alert-success'}`}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
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
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Search */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              className="input-field"
              placeholder="Search by product name, SKU, or barcode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div style={{ flex: '0 1 200px' }}>
            <select
              className="input-field no-icon"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="" style={{ background: '#111726' }}>All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id} style={{ background: '#111726' }}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Alert Status Filter */}
          <div style={{ flex: '0 1 180px' }}>
            <select
              className="input-field no-icon"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
            >
              <option value="" style={{ background: '#111726' }}>All Stock Statuses</option>
              <option value="low_stock" style={{ background: '#111726' }}>⚠️ Reorder Alerts Only</option>
              <option value="optimal" style={{ background: '#111726' }}>✓ Optimal Levels</option>
              <option value="out_of_stock" style={{ background: '#111726' }}>✕ Out of Stock</option>
            </select>
          </div>

          {/* Create Button */}
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleOpenCreate}
            style={{ whiteSpace: 'nowrap' }}
          >
            <Plus size={16} /> + New Product
          </button>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="data-table-wrapper" style={{ border: 'none', borderRadius: '0' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '30px' }}></th>
                <th>Product & SKU</th>
                <th>Category</th>
                <th>UOM</th>
                <th>Total On-Hand</th>
                <th>Reorder Rules (Min / Max)</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <RefreshCw size={18} className="spinner" /> Loading product catalog...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <Package size={36} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
                    <div>No products found matching your search or filter.</div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ marginTop: '12px', fontSize: '0.82rem' }}
                      onClick={handleOpenCreate}
                    >
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
                      <tr>
                        {/* Expand warehouse breakdown button */}
                        <td>
                          <button
                            type="button"
                            onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '4px'
                            }}
                            title="Toggle warehouse location breakdown"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>

                        {/* Product Name & SKU */}
                        <td>
                          <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.92rem' }}>
                            {p.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                            <span className="badge badge-mono" style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
                              {p.sku}
                            </span>
                            {p.barcode && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Barcode size={12} /> {p.barcode}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td>
                          <span style={{
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#cbd5e1'
                          }}>
                            {p.category_name}
                          </span>
                        </td>

                        {/* UOM */}
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {p.uom}
                          </span>
                        </td>

                        {/* Total Stock */}
                        <td>
                          <div style={{ fontSize: '1.05rem', fontWeight: '700', color: total === 0 ? '#f87171' : '#fff' }}>
                            {total} <span style={{ fontSize: '0.75rem', fontWeight: '400', color: 'var(--text-dim)' }}>{p.uom}</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            across {p.locations?.length || 0} facility locations
                          </div>
                        </td>

                        {/* Reorder Rules (Min / Max gauge) */}
                        <td style={{ minWidth: '150px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '3px' }}>
                            <span>Min: <strong style={{ color: '#fbbf24' }}>{min}</strong></span>
                            <span>Max: {max}</span>
                          </div>
                          <div className="progress-track">
                            <div 
                              className="progress-fill" 
                              style={{ 
                                width: `${pct}%`,
                                background: total <= min ? '#f59e0b' : '#10b981'
                              }}
                            />
                          </div>
                          {p.suggested_reorder_qty > 0 && (
                            <div style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: '3px' }}>
                              Suggested Reorder: +{p.suggested_reorder_qty} {p.uom}
                            </div>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td>
                          {p.stock_status === 'out_of_stock' && (
                            <span className="badge badge-danger">
                              Out of Stock
                            </span>
                          )}
                          {p.stock_status === 'low_stock' && (
                            <span className="badge badge-warning" title={p.alert_message}>
                              ⚠️ Reorder Alert
                            </span>
                          )}
                          {p.stock_status === 'optimal' && (
                            <span className="badge badge-success">
                              ✓ Optimal
                            </span>
                          )}
                          {p.stock_status === 'overstock' && (
                            <span className="badge badge-info">
                              Surplus
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                              title="View stock across warehouse locations"
                            >
                              <Building2 size={13} />
                              <span>Locations</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                              title="Edit product catalog details"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p)}
                              className="btn btn-danger"
                              style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                              title="Delete product"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Location Stock Breakdown Drawer */}
                      {isExpanded && (
                        <tr style={{ background: 'rgba(14, 165, 233, 0.04)' }}>
                          <td colSpan="8" style={{ padding: '16px 24px' }}>
                            <div style={{
                              background: 'rgba(0, 0, 0, 0.25)',
                              border: '1px solid rgba(14, 165, 233, 0.2)',
                              borderRadius: 'var(--radius-md)',
                              padding: '14px 18px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <MapPin size={16} color="#38bdf8" />
                                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>
                                    Warehouse Location Breakdown for {p.name}
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  Preferred Vendor: <strong style={{ color: '#fff' }}>{p.preferred_vendor || 'Not specified'}</strong>
                                </span>
                              </div>

                              {p.locations && p.locations.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                                  {p.locations.map((loc, idx) => (
                                    <div key={idx} style={{
                                      background: 'rgba(255, 255, 255, 0.03)',
                                      border: '1px solid var(--border-subtle)',
                                      borderRadius: '8px',
                                      padding: '10px 14px',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center'
                                    }}>
                                      <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>
                                          {loc.warehouse_name}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                                          Facility: {loc.warehouse_code} | Bin: <span style={{ color: '#38bdf8' }}>{loc.bin_location}</span>
                                        </div>
                                      </div>
                                      <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.05rem', fontWeight: '800', color: loc.quantity > 0 ? '#10b981' : '#f87171' }}>
                                          {loc.quantity}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{p.uom}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
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

      {/* Product Create/Edit Modal */}
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
