import React, { useState, useEffect } from 'react';
import { X, Package, Layers, ShieldAlert, Barcode, DollarSign, Building2, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

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

  // Initial stock breakdown (only on create)
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
      // Default to first category if available
      if (categories.length > 0) {
        setFormData(prev => ({ ...prev, category_id: categories[0].id }));
      }
      // Provide first warehouse for initial stock convenience
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(14, 165, 233, 0.15)',
              color: '#0ea5e9',
              padding: '8px',
              borderRadius: '8px'
            }}>
              <Package size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                {isEditing ? `Edit Product: ${product.sku}` : 'Create New Catalog Product'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Master data catalog entry with location stock and replenishment rules
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="input-action-btn"
            style={{ position: 'static' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {errorMsg && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                <ShieldAlert size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* General Information Section */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.5px', marginBottom: '12px' }}>
                1. Product Identification
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="input-field no-icon"
                    placeholder="e.g. Industrial Handheld Barcode Scanner"
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">SKU / Code *</label>
                    <button
                      type="button"
                      onClick={generateSku}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#0ea5e9',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Sparkles size={12} /> Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    className="input-field no-icon"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    placeholder="e.g. SCAN-PRO-01"
                    value={formData.sku}
                    onChange={e => handleChange('sku', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="input-field no-icon"
                    value={formData.category_id}
                    onChange={e => handleChange('category_id', e.target.value)}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id} style={{ background: '#111726' }}>
                        {c.name} ({c.code || 'CAT'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Unit of Measure (UOM)</label>
                  <select
                    className="input-field no-icon"
                    value={formData.uom}
                    onChange={e => handleChange('uom', e.target.value)}
                  >
                    <option value="Units" style={{ background: '#111726' }}>Units (pcs)</option>
                    <option value="Boxes" style={{ background: '#111726' }}>Boxes</option>
                    <option value="Pallets" style={{ background: '#111726' }}>Pallets</option>
                    <option value="Kg" style={{ background: '#111726' }}>Kilograms (kg)</option>
                    <option value="Liters" style={{ background: '#111726' }}>Liters (L)</option>
                    <option value="Meters" style={{ background: '#111726' }}>Meters (m)</option>
                    <option value="Rolls" style={{ background: '#111726' }}>Rolls</option>
                    <option value="Packs" style={{ background: '#111726' }}>Packs</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Barcode / UPC (Optional)</label>
                  <input
                    type="text"
                    className="input-field no-icon"
                    placeholder="e.g. 840192837401"
                    value={formData.barcode}
                    onChange={e => handleChange('barcode', e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Description / Specifications</label>
                  <input
                    type="text"
                    className="input-field no-icon"
                    placeholder="Brief specs or handling notes..."
                    value={formData.description}
                    onChange={e => handleChange('description', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Reordering Rules Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <ShieldAlert size={16} color="#f59e0b" />
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#fbbf24', letterSpacing: '0.5px', margin: 0 }}>
                  2. Reordering & Replenishment Rules
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Min Stock Level (Alert Point)</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field no-icon"
                    value={formData.min_stock}
                    onChange={e => handleChange('min_stock', e.target.value)}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '3px' }}>
                    Triggers low stock warnings
                  </span>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Max Target Stock</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field no-icon"
                    value={formData.max_stock}
                    onChange={e => handleChange('max_stock', e.target.value)}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '3px' }}>
                    Storage threshold ceiling
                  </span>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Reorder Quantity</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field no-icon"
                    value={formData.reorder_qty}
                    onChange={e => handleChange('reorder_qty', e.target.value)}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '3px' }}>
                    Recommended batch order
                  </span>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
                <label className="form-label">Preferred Vendor / Supplier</label>
                <input
                  type="text"
                  className="input-field no-icon"
                  placeholder="e.g. ZebraTech Distribution or Grainger Industrial"
                  value={formData.preferred_vendor}
                  onChange={e => handleChange('preferred_vendor', e.target.value)}
                />
              </div>
            </div>

            {/* Optional Initial Stock Allocation (Creation Mode Only) */}
            {!isEditing && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={16} color="#0ea5e9" />
                    <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.5px', margin: 0 }}>
                      3. Initial Warehouse Stock Allocation (Optional)
                    </h4>
                  </div>
                  {initialStocks.length < warehouses.length && (
                    <button
                      type="button"
                      onClick={addStockRow}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                    >
                      <Plus size={14} /> Add Location
                    </button>
                  )}
                </div>

                {initialStocks.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
                    No initial stock allocated. Products will start with 0 units across warehouses.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {initialStocks.map((stock, idx) => (
                      <div key={idx} style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1.5fr auto',
                        gap: '10px',
                        alignItems: 'center'
                      }}>
                        <select
                          className="input-field no-icon"
                          style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                          value={stock.warehouse_id}
                          onChange={e => handleStockChange(idx, 'warehouse_id', e.target.value)}
                        >
                          {warehouses.map(w => (
                            <option key={w.id} value={w.id} style={{ background: '#111726' }}>
                              {w.name} ({w.code})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          min="0"
                          placeholder="Quantity"
                          className="input-field no-icon"
                          style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                          value={stock.quantity}
                          onChange={e => handleStockChange(idx, 'quantity', e.target.value)}
                        />

                        <input
                          type="text"
                          placeholder="Bin (e.g. A-12-01)"
                          className="input-field no-icon"
                          style={{ fontSize: '0.85rem', padding: '8px 12px', fontFamily: 'var(--font-mono)' }}
                          value={stock.bin_location}
                          onChange={e => handleStockChange(idx, 'bin_location', e.target.value)}
                        />

                        <button
                          type="button"
                          onClick={() => removeStockRow(idx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#f87171',
                            cursor: 'pointer',
                            padding: '6px'
                          }}
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
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
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
