import React, { useState, useEffect } from 'react';
import { Building2, Search, Filter, RefreshCw, AlertTriangle, CheckCircle2, Edit3, MapPin, Package, ArrowUpDown, X, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export default function StockAvailability() {
  const [stockList, setStockList] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Quick Adjustment Modal state
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustBin, setAdjustBin] = useState('');
  const [adjustReason, setAdjustReason] = useState('Physical count reconciliation');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);
  const [toast, setToast] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stockRes, whRes] = await Promise.all([
        api.getStockAvailability({
          warehouse_id: selectedWarehouse || undefined,
          low_stock_only: onlyAlerts ? 'true' : undefined
        }),
        api.getWarehouses()
      ]);

      if (stockRes?.data) setStockList(stockRes.data);
      if (whRes?.data) setWarehouses(whRes.data);
    } catch (err) {
      console.error('Error loading stock availability:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedWarehouse, onlyAlerts]);

  const handleOpenAdjust = (item) => {
    setAdjustingItem(item);
    setAdjustQty(item.quantity);
    setAdjustBin(item.bin_location || '');
    setAdjustReason('Physical inventory recount');
  };

  const handleSaveAdjust = async (e) => {
    e.preventDefault();
    if (!adjustingItem) return;

    try {
      setSubmittingAdjust(true);
      await api.adjustStock({
        product_id: adjustingItem.product_id,
        warehouse_id: adjustingItem.warehouse_id,
        quantity: Number(adjustQty),
        bin_location: adjustBin.trim(),
        reason: adjustReason.trim()
      });

      setToast({ type: 'success', text: `Stock for ${adjustingItem.product_name} updated successfully.` });
      setAdjustingItem(null);
      loadData();
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Failed to adjust stock.' });
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const filteredItems = stockList.filter(item => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      item.product_name?.toLowerCase().includes(term) ||
      item.product_sku?.toLowerCase().includes(term) ||
      item.warehouse_name?.toLowerCase().includes(term) ||
      item.bin_location?.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      {/* Top Header & Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', margin: 0 }}>
            Stock Availability per Location
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Real-time on-hand inventory levels and storage bins across warehouse facilities
          </p>
        </div>

        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={loadData}
          title="Refresh stock levels"
        >
          <RefreshCw size={15} className={loading ? 'spinner' : ''} />
          <span>Refresh Live Stock</span>
        </button>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div 
          className={`alert ${toast.type === 'error' ? 'alert-error' : 'alert-success'}`}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span>{toast.text}</span>
          <button 
            type="button" 
            onClick={() => setToast(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: '700' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Warehouse Selector */}
          <div style={{ flex: '1 1 260px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={16} color="#0ea5e9" />
            <select
              className="input-field no-icon"
              value={selectedWarehouse}
              onChange={e => setSelectedWarehouse(e.target.value)}
            >
              <option value="" style={{ background: '#111726' }}>All Warehouse Facilities (Consolidated)</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id} style={{ background: '#111726' }}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              className="input-field"
              placeholder="Search product, SKU, or bin location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Reorder Alerts Toggle Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className={`btn ${onlyAlerts ? 'btn-danger' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '8px 14px' }}
              onClick={() => setOnlyAlerts(!onlyAlerts)}
            >
              <AlertTriangle size={14} />
              {onlyAlerts ? 'Showing Low Stock Only' : 'Filter Low Stock Triggers'}
            </button>
          </div>
        </div>
      </div>

      {/* Availability Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Warehouse Site</th>
                <th>Product & SKU</th>
                <th>Storage Bin</th>
                <th>On-Hand Qty</th>
                <th>Reorder Threshold</th>
                <th>Stock Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={20} className="spinner" style={{ marginBottom: '8px' }} />
                    <div>Loading warehouse stock distribution...</div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <Building2 size={32} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
                    <div>No location stock records found.</div>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const qty = Number(item.quantity);
                  const min = Number(item.min_stock);
                  const isLow = qty <= min;

                  return (
                    <tr key={item.stock_id}>
                      {/* Warehouse Site */}
                      <td>
                        <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.9rem' }}>
                          {item.warehouse_name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {item.warehouse_code}
                        </div>
                      </td>

                      {/* Product Name & SKU */}
                      <td>
                        <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.9rem' }}>
                          {item.product_name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                          {item.product_sku} &bull; <span style={{ color: 'var(--text-dim)' }}>{item.category_name}</span>
                        </div>
                      </td>

                      {/* Storage Bin Location */}
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.78rem',
                          background: 'rgba(14, 165, 233, 0.1)',
                          border: '1px solid rgba(14, 165, 233, 0.25)',
                          color: '#38bdf8',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}>
                          <MapPin size={12} /> {item.bin_location || 'A-01'}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: isLow ? '#fbbf24' : '#fff' }}>
                          {qty} <span style={{ fontSize: '0.75rem', fontWeight: '400', color: 'var(--text-dim)' }}>{item.uom}</span>
                        </div>
                      </td>

                      {/* Min / Max Reorder Threshold */}
                      <td>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Min: <strong style={{ color: '#fbbf24' }}>{min}</strong> | Max: {item.max_stock}
                        </div>
                        {isLow && (
                          <div style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: '2px' }}>
                            Deficit: {Math.max(0, min - qty)} {item.uom}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        {qty === 0 ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : isLow ? (
                          <span className="badge badge-warning">⚠️ Below Min ({min})</span>
                        ) : (
                          <span className="badge badge-success">✓ Stock Optimal</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          onClick={() => handleOpenAdjust(item)}
                          title="Adjust on-hand count or bin"
                        >
                          <Edit3 size={13} />
                          <span>Adjust</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustingItem && (
        <div className="modal-overlay" onClick={() => setAdjustingItem(null)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                Adjust Stock Level & Bin
              </h3>
              <button 
                type="button" 
                onClick={() => setAdjustingItem(null)} 
                className="input-action-btn"
                style={{ position: 'static' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust}>
              <div className="modal-body">
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>
                    {adjustingItem.product_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    SKU: {adjustingItem.product_sku} | Facility: {adjustingItem.warehouse_name}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Updated On-Hand Quantity ({adjustingItem.uom})</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field no-icon"
                    style={{ fontSize: '1.1rem', fontWeight: '700' }}
                    value={adjustQty}
                    onChange={e => setAdjustQty(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '3px' }}>
                    Previous recorded count: {adjustingItem.quantity} {adjustingItem.uom}
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Storage Bin / Rack Location</label>
                  <input
                    type="text"
                    className="input-field no-icon"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    placeholder="e.g. A-12-01 or BAY-NORTH-04"
                    value={adjustBin}
                    onChange={e => setAdjustBin(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Adjustment Reason / Audit Note</label>
                  <input
                    type="text"
                    className="input-field no-icon"
                    placeholder="e.g. Cycle count reconciliation, damaged goods write-off"
                    value={adjustReason}
                    onChange={e => setAdjustReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAdjustingItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingAdjust}>
                  {submittingAdjust ? <Loader2 size={16} className="spinner" /> : 'Confirm Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
