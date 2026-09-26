import React, { useState, useEffect } from 'react';
import { Building2, Search, RefreshCw, AlertTriangle, Edit3, MapPin, X, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

const C = {
  navy: '#1e2a4a',
  muted: '#6b7a99',
  dim: '#94a3b8',
  border: 'rgba(0, 0, 0, 0.08)',
  blue: '#2563eb',
  blueBg: 'rgba(37, 99, 235, 0.08)',
  amber: '#b45309',
  amberBg: 'rgba(245, 158, 11, 0.12)',
  green: '#047857',
  greenBg: 'rgba(16, 185, 129, 0.12)',
  red: '#b91c1c',
  redBg: 'rgba(244, 63, 94, 0.1)',
  panelBg: '#f8fafc',
};

const cardStyle = {
  background: '#ffffff',
  border: `1px solid ${C.border}`,
  borderRadius: '14px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const inputStyle = {
  width: '100%',
  fontSize: '0.9rem',
  color: C.navy,
  background: '#ffffff',
  border: `1px solid ${C.border}`,
  borderRadius: '10px',
  padding: '10px 12px',
  outline: 'none',
};

const labelStyle = {
  fontSize: '0.8rem',
  fontWeight: 600,
  color: C.muted,
  marginBottom: '6px',
  display: 'block',
};

export default function StockAvailability() {
  const [stockList, setStockList] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: C.navy, margin: 0 }}>
            Stock Availability per Location
          </h2>
          <p style={{ fontSize: '0.85rem', color: C.muted, marginTop: '4px' }}>
            Real-time on-hand inventory levels and storage bins across warehouse facilities
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          title="Refresh stock levels"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 16px', fontSize: '0.85rem', fontWeight: 600,
            background: '#f1f5f9', color: '#334155', border: `1px solid ${C.border}`,
            borderRadius: '10px', cursor: 'pointer',
          }}
        >
          <RefreshCw size={15} className={loading ? 'spinner' : ''} />
          <span>Refresh Live Stock</span>
        </button>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', borderRadius: '10px', marginBottom: '18px',
          background: toast.type === 'error' ? C.redBg : C.greenBg,
          color: toast.type === 'error' ? C.red : C.green,
          border: `1px solid ${toast.type === 'error' ? 'rgba(244,63,94,0.25)' : 'rgba(16,185,129,0.25)'}`,
          fontSize: '0.88rem',
        }}>
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
      <div style={{ ...cardStyle, padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ flex: '1 1 260px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={16} color={C.blue} />
            <select style={inputStyle} value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)}>
              <option value="">All Warehouse Facilities (Consolidated)</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: C.dim }} />
            <input
              type="text"
              style={{ ...inputStyle, paddingLeft: '40px' }}
              placeholder="Search product, SKU, or bin location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setOnlyAlerts(!onlyAlerts)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '0.8rem', fontWeight: 600, padding: '9px 14px', borderRadius: '10px',
                cursor: 'pointer', border: '1px solid',
                background: onlyAlerts ? C.redBg : '#f1f5f9',
                color: onlyAlerts ? C.red : '#334155',
                borderColor: onlyAlerts ? 'rgba(244,63,94,0.3)' : C.border,
              }}
            >
              <AlertTriangle size={14} />
              {onlyAlerts ? 'Showing Low Stock Only' : 'Filter Low Stock Triggers'}
            </button>
          </div>
        </div>
      </div>

      {/* Availability Table */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: `1px solid ${C.border}` }}>
                <th style={thStyle}>Warehouse Site</th>
                <th style={thStyle}>Product & SKU</th>
                <th style={thStyle}>Storage Bin</th>
                <th style={thStyle}>On-Hand Qty</th>
                <th style={thStyle}>Reorder Threshold</th>
                <th style={thStyle}>Stock Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: C.muted }}>
                    <RefreshCw size={20} className="spinner" style={{ marginBottom: '8px' }} />
                    <div>Loading warehouse stock distribution...</div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: C.muted }}>
                    <Building2 size={32} color={C.dim} style={{ marginBottom: '8px' }} />
                    <div>No location stock records found.</div>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const qty = Number(item.quantity);
                  const min = Number(item.min_stock);
                  const isLow = qty <= min;

                  return (
                    <tr key={item.stock_id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: '700', color: C.navy, fontSize: '0.9rem' }}>{item.warehouse_name}</div>
                        <div style={{ fontSize: '0.72rem', color: C.dim, fontFamily: 'var(--font-mono)' }}>{item.warehouse_code}</div>
                      </td>

                      <td style={tdStyle}>
                        <div style={{ fontWeight: '600', color: C.navy, fontSize: '0.9rem' }}>{item.product_name}</div>
                        <div style={{ fontSize: '0.72rem', color: C.blue, fontFamily: 'var(--font-mono)' }}>
                          {item.product_sku} &bull; <span style={{ color: C.dim }}>{item.category_name}</span>
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
                          background: C.blueBg, border: '1px solid rgba(37,99,235,0.2)',
                          color: C.blue, padding: '3px 8px', borderRadius: '6px',
                        }}>
                          <MapPin size={12} /> {item.bin_location || 'A-01'}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: isLow ? C.amber : C.navy }}>
                          {qty} <span style={{ fontSize: '0.75rem', fontWeight: '400', color: C.dim }}>{item.uom}</span>
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <div style={{ fontSize: '0.8rem', color: C.muted }}>
                          Min: <strong style={{ color: C.amber }}>{min}</strong> | Max: {item.max_stock}
                        </div>
                        {isLow && (
                          <div style={{ fontSize: '0.7rem', color: C.amber, marginTop: '2px' }}>
                            Deficit: {Math.max(0, min - qty)} {item.uom}
                          </div>
                        )}
                      </td>

                      <td style={tdStyle}>
                        {qty === 0 ? (
                          <StatusBadge text="Out of Stock" color={C.red} bg={C.redBg} />
                        ) : isLow ? (
                          <StatusBadge text={`⚠️ Below Min (${min})`} color={C.amber} bg={C.amberBg} />
                        ) : (
                          <StatusBadge text="✓ Stock Optimal" color={C.green} bg={C.greenBg} />
                        )}
                      </td>

                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenAdjust(item)}
                          title="Adjust on-hand count or bin"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '6px 12px', fontSize: '0.78rem', fontWeight: 600,
                            background: '#f1f5f9', color: '#334155', border: `1px solid ${C.border}`,
                            borderRadius: '8px', cursor: 'pointer',
                          }}
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
        <div
          onClick={() => setAdjustingItem(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: '18px',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.25)', width: '100%', maxWidth: '480px',
              maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: C.navy, margin: 0 }}>
                Adjust Stock Level & Bin
              </h3>
              <button
                type="button"
                onClick={() => setAdjustingItem(null)}
                style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust}>
              <div style={{ padding: '24px' }}>
                <div style={{ background: C.panelBg, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: C.navy }}>{adjustingItem.product_name}</div>
                  <div style={{ fontSize: '0.75rem', color: C.dim, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    SKU: {adjustingItem.product_sku} | Facility: {adjustingItem.warehouse_name}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Updated On-Hand Quantity ({adjustingItem.uom})</label>
                  <input
                    type="number"
                    min="0"
                    style={{ ...inputStyle, fontSize: '1.1rem', fontWeight: '700' }}
                    value={adjustQty}
                    onChange={e => setAdjustQty(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: C.dim, marginTop: '3px', display: 'block' }}>
                    Previous recorded count: {adjustingItem.quantity} {adjustingItem.uom}
                  </span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Storage Bin / Rack Location</label>
                  <input
                    type="text"
                    style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                    placeholder="e.g. A-12-01 or BAY-NORTH-04"
                    value={adjustBin}
                    onChange={e => setAdjustBin(e.target.value)}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Adjustment Reason / Audit Note</label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="e.g. Cycle count reconciliation, damaged goods write-off"
                    value={adjustReason}
                    onChange={e => setAdjustReason(e.target.value)}
                  />
                </div>
              </div>

              <div style={{
                padding: '16px 24px', borderTop: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px',
                background: C.panelBg,
              }}>
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  style={{
                    padding: '10px 18px', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem',
                    background: '#f1f5f9', color: '#334155', border: `1px solid ${C.border}`, cursor: 'pointer',
                  }}
                >
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

const thStyle = {
  padding: '14px 16px',
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase',
  fontSize: '0.75rem',
  letterSpacing: '0.5px',
};

const tdStyle = { padding: '14px 16px' };

function StatusBadge({ text, color, bg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600,
      padding: '3px 9px', borderRadius: '9999px', color, background: bg,
    }}>
      {text}
    </span>
  );
}