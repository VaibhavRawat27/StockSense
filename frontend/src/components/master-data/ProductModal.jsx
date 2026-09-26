import React, { useState, useEffect } from 'react';
import { X, Package, ShieldAlert, Building2, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

const C = {
  navy: '#1e2a4a',
  muted: '#6b7a99',
  dim: '#94a3b8',
  border: 'rgba(0, 0, 0, 0.08)',
  blue: '#2563eb',
  amber: '#b45309',
  amberBg: 'rgba(245, 158, 11, 0.08)',
  red: '#b91c1c',
  redBg: 'rgba(244, 63, 94, 0.08)',
  panelBg: '#f8fafc',
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

export default function ProductModal({ product, categories, warehouses, onClose, onSave }) {
  const isEditing = Boolean(product && product.id);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: '',
    uom: 'Units',
    description: '',
    barcode: '',
    price: 0,
    min_stock: 10,
    max_stock: 100,
    reorder_qty: 50,
    preferred_vendor: '',
  });

  const [initialStocks, setInitialStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        category_id: product.category_id || (categories[0]?.id || ''),
        uom: product.uom || product.unit || 'Units',
        description: product.description || '',
        barcode: product.barcode || '',
        price: product.price || 0,
        min_stock: product.min_stock !== undefined ? product.min_stock : 10,
        max_stock: product.max_stock !== undefined ? product.max_stock : 100,
        reorder_qty: product.reorder_qty !== undefined ? product.reorder_qty : 50,
        preferred_vendor: product.preferred_vendor || '',
      });
    } else {
      if (categories.length > 0) {
        setFormData(prev => ({ ...prev, category_id: categories[0].id }));
      }
      if (warehouses.length > 0) {
        setInitialStocks([
          { warehouse_id: warehouses[0].id, quantity: 0, bin_location: 'A-01-01' }
        ]);
      }
    }
  }, [product, categories, warehouses]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateSku = () => {
    const prefix = formData.name
      ? formData.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()
      : 'SKU';
    const random = Math.floor(1000 + Math.random() * 9000);
    setFormData(prev => ({ ...prev, sku: `${prefix}-${random}` }));
  };

  const handleStockChange = (index, field, value) => {
    setInitialStocks(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addStockRow = () => {
    const unusedWh = warehouses.find(w => !initialStocks.some(s => Number(s.warehouse_id) === w.id)) || warehouses[0];
    if (unusedWh) {
      setInitialStocks(prev => [
        ...prev,
        { warehouse_id: unusedWh.id, quantity: 10, bin_location: 'A-01-01' }
      ]);
    }
  };

  const removeStockRow = (index) => {
    setInitialStocks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) return setErrorMsg('Product name is required.');
    if (!formData.sku.trim()) return setErrorMsg('SKU code is required.');

    try {
      setLoading(true);

      const payload = {
        ...formData,
        price: Number(formData.price) || 0,
        min_stock: Number(formData.min_stock) || 0,
        max_stock: Number(formData.max_stock) || 0,
        reorder_qty: Number(formData.reorder_qty) || 0,
      };

      if (!isEditing) {
        payload.initial_stocks = initialStocks
          .filter(s => Number(s.quantity) > 0)
          .map(s => ({
            warehouse_id: Number(s.warehouse_id),
            quantity: Number(s.quantity),
            bin_location: s.bin_location || 'A-01'
          }));
      }

      if (isEditing) {
        await api.updateProduct(product.id, payload);
      } else {
        await api.createProduct(payload);
      }

      onSave();
    } catch (err) {
      setErrorMsg(err.message || 'Error saving product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          border: `1px solid ${C.border}`,
          borderRadius: '18px',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.25)',
          width: '100%', maxWidth: '680px', maxHeight: '90vh',
          overflowY: 'auto', position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: C.blue, padding: '8px', borderRadius: '8px' }}>
              <Package size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: C.navy, margin: 0 }}>
                {isEditing ? `Edit Product: ${product.sku}` : 'Create New Catalog Product'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: C.muted, margin: 0 }}>
                Master data catalog entry with location stock and replenishment rules
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px' }}>

            {errorMsg && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
                background: C.redBg, color: C.red, border: '1px solid rgba(244,63,94,0.25)', fontSize: '0.88rem',
              }}>
                <ShieldAlert size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Section 1 */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: C.blue, letterSpacing: '0.5px', marginBottom: '12px' }}>
                1. Product Identification
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Product Name *</label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="e.g. Industrial Handheld Barcode Scanner"
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={labelStyle}>SKU / Code *</label>
                    <button
                      type="button"
                      onClick={generateSku}
                      style={{ background: 'transparent', border: 'none', color: C.blue, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}
                    >
                      <Sparkles size={12} /> Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                    placeholder="e.g. SCAN-PRO-01"
                    value={formData.sku}
                    onChange={e => handleChange('sku', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Category</label>
                  <select style={inputStyle} value={formData.category_id} onChange={e => handleChange('category_id', e.target.value)}>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code || 'CAT'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Unit of Measure (UOM)</label>
                  <select style={inputStyle} value={formData.uom} onChange={e => handleChange('uom', e.target.value)}>
                    <option value="Units">Units (pcs)</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Pallets">Pallets</option>
                    <option value="Kg">Kilograms (kg)</option>
                    <option value="Liters">Liters (L)</option>
                    <option value="Meters">Meters (m)</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Packs">Packs</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Barcode / UPC (Optional)</label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="e.g. 840192837401"
                    value={formData.barcode}
                    onChange={e => handleChange('barcode', e.target.value)}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Description / Specifications</label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="Brief specs or handling notes..."
                    value={formData.description}
                    onChange={e => handleChange('description', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div style={{ background: C.panelBg, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <ShieldAlert size={16} color={C.amber} />
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: C.amber, letterSpacing: '0.5px', margin: 0 }}>
                  2. Reordering & Replenishment Rules
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Min Stock Level (Alert Point)</label>
                  <input type="number" min="0" style={inputStyle} value={formData.min_stock} onChange={e => handleChange('min_stock', e.target.value)} />
                  <span style={{ fontSize: '0.72rem', color: C.dim, marginTop: '3px', display: 'block' }}>Triggers low stock warnings</span>
                </div>

                <div>
                  <label style={labelStyle}>Max Target Stock</label>
                  <input type="number" min="0" style={inputStyle} value={formData.max_stock} onChange={e => handleChange('max_stock', e.target.value)} />
                  <span style={{ fontSize: '0.72rem', color: C.dim, marginTop: '3px', display: 'block' }}>Storage threshold ceiling</span>
                </div>

                <div>
                  <label style={labelStyle}>Reorder Quantity</label>
                  <input type="number" min="0" style={inputStyle} value={formData.reorder_qty} onChange={e => handleChange('reorder_qty', e.target.value)} />
                  <span style={{ fontSize: '0.72rem', color: C.dim, marginTop: '3px', display: 'block' }}>Recommended batch order</span>
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={labelStyle}>Preferred Vendor / Supplier</label>
                <input
                  type="text"
                  style={inputStyle}
                  placeholder="e.g. ZebraTech Distribution or Grainger Industrial"
                  value={formData.preferred_vendor}
                  onChange={e => handleChange('preferred_vendor', e.target.value)}
                />
              </div>
            </div>

            {/* Section 3 */}
            {!isEditing && (
              <div style={{ background: C.panelBg, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={16} color={C.blue} />
                    <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: C.blue, letterSpacing: '0.5px', margin: 0 }}>
                      3. Initial Warehouse Stock Allocation (Optional)
                    </h4>
                  </div>
                  {initialStocks.length < warehouses.length && (
                    <button
                      type="button"
                      onClick={addStockRow}
                      style={{
                        padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px',
                        background: '#eef2ff', color: C.blue, border: `1px solid ${C.border}`,
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px',
                      }}
                    >
                      <Plus size={14} /> Add Location
                    </button>
                  )}
                </div>

                {initialStocks.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: C.dim, margin: 0 }}>
                    No initial stock allocated. Products will start with 0 units across warehouses.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {initialStocks.map((stock, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr auto', gap: '10px', alignItems: 'center' }}>
                        <select
                          style={{ ...inputStyle, fontSize: '0.85rem', padding: '8px 12px' }}
                          value={stock.warehouse_id}
                          onChange={e => handleStockChange(idx, 'warehouse_id', e.target.value)}
                        >
                          {warehouses.map(w => (
                            <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                          ))}
                        </select>

                        <input
                          type="number"
                          min="0"
                          placeholder="Quantity"
                          style={{ ...inputStyle, fontSize: '0.85rem', padding: '8px 12px' }}
                          value={stock.quantity}
                          onChange={e => handleStockChange(idx, 'quantity', e.target.value)}
                        />

                        <input
                          type="text"
                          placeholder="Bin (e.g. A-12-01)"
                          style={{ ...inputStyle, fontSize: '0.85rem', padding: '8px 12px', fontFamily: 'var(--font-mono)' }}
                          value={stock.bin_location}
                          onChange={e => handleStockChange(idx, 'bin_location', e.target.value)}
                        />

                        <button
                          type="button"
                          onClick={() => removeStockRow(idx)}
                          style={{ background: 'transparent', border: 'none', color: C.red, cursor: 'pointer', padding: '6px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px', borderTop: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px',
            background: C.panelBg,
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 18px', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem',
                background: '#f1f5f9', color: '#334155', border: `1px solid ${C.border}`, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  Saving to Catalog...
                </>
              ) : (
                isEditing ? 'Save Product Changes' : 'Create Catalog Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}