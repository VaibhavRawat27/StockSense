import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, MapPin, Phone, User, RefreshCw, X, ShieldAlert, CheckCircle2, Loader2, Gauge } from 'lucide-react';
import { api } from '../../services/api';

export default function WarehouseSettings() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    address: '',
    capacity: 50000,
    type: 'Distribution Center',
    is_active: 1,
    contact_person: '',
    contact_phone: ''
  });

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const res = await api.getWarehouses();
      if (res?.data) {
        setWarehouses(res.data);
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const handleOpenCreate = () => {
    setEditingWh(null);
    setFormData({
      name: '',
      code: '',
      location: '',
      address: '',
      capacity: 50000,
      type: 'Distribution Center',
      is_active: 1,
      contact_person: '',
      contact_phone: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w) => {
    setEditingWh(w);
    setFormData({
      name: w.name,
      code: w.code || '',
      location: w.location || '',
      address: w.address || '',
      capacity: w.capacity || 50000,
      type: w.type || 'Distribution Center',
      is_active: w.is_active !== undefined ? w.is_active : 1,
      contact_person: w.contact_person || '',
      contact_phone: w.contact_phone || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSubmitting(true);
      if (editingWh) {
        await api.updateWarehouse(editingWh.id, formData);
        setStatusMessage({ type: 'success', text: `Warehouse "${formData.name}" updated successfully.` });
      } else {
        await api.createWarehouse(formData);
        setStatusMessage({ type: 'success', text: `Warehouse "${formData.name}" added successfully.` });
      }
      setIsModalOpen(false);
      loadWarehouses();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Operation failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (w) => {
    if (!window.confirm(`Are you sure you want to decommission warehouse "${w.name}" (${w.code})?`)) return;

    try {
      await api.deleteWarehouse(w.id);
      setStatusMessage({ type: 'success', text: `Warehouse "${w.name}" removed.` });
      loadWarehouses();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to remove warehouse.' });
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#0ea5e9', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Settings &bull; Warehouse Master
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', margin: '4px 0 0 0' }}>
            Warehouse Facilities & Sites Setup
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Configure fulfillment centers, cross-docks, transit hubs, and storage capacities
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={loadWarehouses}
          >
            <RefreshCw size={15} className={loading ? 'spinner' : ''} />
            <span>Refresh</span>
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleOpenCreate}
          >
            <Plus size={16} /> + Add Warehouse
          </button>
        </div>
      </div>

      {/* Notifications */}
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

      {/* Warehouse Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px'
      }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spinner" style={{ marginBottom: '8px' }} />
            <div>Loading warehouse facilities...</div>
          </div>
        ) : warehouses.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Building2 size={36} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
            <div>No warehouses configured yet. Click "+ Add Warehouse" to set up your first facility.</div>
          </div>
        ) : (
          warehouses.map(w => {
            const cap = w.capacity || 50000;
            const stored = w.total_units_stored || 0;
            const util = w.utilization_percentage || 0;

            return (
              <div key={w.id} className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  {/* Top Row: Code, Status & Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        background: 'rgba(14, 165, 233, 0.15)',
                        color: '#0ea5e9',
                        padding: '10px',
                        borderRadius: '10px'
                      }}>
                        <Building2 size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge badge-mono" style={{ color: '#38bdf8' }}>
                            {w.code}
                          </span>
                          <span className={`badge ${w.is_active ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                            {w.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff', margin: '4px 0 0 0' }}>
                          {w.name}
                        </h3>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(w)}
                        className="input-action-btn"
                        style={{ position: 'static' }}
                        title="Edit Warehouse Settings"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(w)}
                        className="input-action-btn"
                        style={{ position: 'static', color: '#f87171' }}
                        title="Delete Warehouse"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Location & Address */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <MapPin size={14} color="#0ea5e9" />
                      <span>{w.address || w.location || 'Location not specified'}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginLeft: '20px' }}>
                      Facility Type: <strong style={{ color: 'var(--text-muted)' }}>{w.type || 'Distribution Center'}</strong>
                    </div>
                  </div>

                  {/* Contact Details */}
                  {(w.contact_person || w.contact_phone) && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      {w.contact_person && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={13} color="var(--text-dim)" /> {w.contact_person}
                        </div>
                      )}
                      {w.contact_phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={13} color="var(--text-dim)" /> {w.contact_phone}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Utilization Gauge & KPIs */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Gauge size={14} color="#0ea5e9" />
                      <span>Capacity Utilization</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: util > 85 ? '#f87171' : (util > 60 ? '#fbbf24' : '#10b981') }}>
                      {util}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-track" style={{ height: '8px', marginBottom: '12px' }}>
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${Math.min(100, util)}%`,
                        background: util > 85 ? '#f43f5e' : (util > 60 ? '#f59e0b' : '#10b981')
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.78rem', textAlign: 'center' }}>
                    <div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Stored Units</div>
                      <div style={{ fontWeight: '700', color: '#fff' }}>{stored.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Capacity</div>
                      <div style={{ fontWeight: '700', color: '#fff' }}>{cap.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Active SKUs</div>
                      <div style={{ fontWeight: '700', color: '#38bdf8' }}>{w.distinct_skus || 0}</div>
                    </div>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                {editingWh ? `Edit Warehouse Facility: ${editingWh.name}` : 'Setup New Warehouse Facility'}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="input-action-btn"
                style={{ position: 'static' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Warehouse Name *</label>
                    <input
                      type="text"
                      className="input-field no-icon"
                      placeholder="e.g. Central Logistics Hub"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Warehouse Code *</label>
                    <input
                      type="text"
                      className="input-field no-icon"
                      style={{ fontFamily: 'var(--font-mono)' }}
                      placeholder="e.g. WH-CENTRAL"
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Facility Type</label>
                    <select
                      className="input-field no-icon"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="Central Distribution Hub" style={{ background: '#111726' }}>Central Distribution Hub</option>
                      <option value="Regional Fulfillment Center" style={{ background: '#111726' }}>Regional Fulfillment Center</option>
                      <option value="Cross-Dock & Transit Facility" style={{ background: '#111726' }}>Cross-Dock & Transit Facility</option>
                      <option value="Cold Storage Warehouse" style={{ background: '#111726' }}>Cold Storage Warehouse</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Full Address / Location</label>
                    <input
                      type="text"
                      className="input-field no-icon"
                      placeholder="e.g. 1000 Logistics Blvd, Dallas, TX 75201"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value, location: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Total Storage Capacity (Units)</label>
                    <input
                      type="number"
                      min="100"
                      className="input-field no-icon"
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Operational Status</label>
                    <select
                      className="input-field no-icon"
                      value={formData.is_active}
                      onChange={e => setFormData({ ...formData, is_active: Number(e.target.value) })}
                    >
                      <option value={1} style={{ background: '#111726' }}>Active & Operational</option>
                      <option value={0} style={{ background: '#111726' }}>Temporarily Inactive / Maintenance</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Primary Site Contact Person</label>
                    <input
                      type="text"
                      className="input-field no-icon"
                      placeholder="e.g. Sarah Jenkins (Operations Lead)"
                      value={formData.contact_person}
                      onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Phone / Extension</label>
                    <input
                      type="text"
                      className="input-field no-icon"
                      placeholder="e.g. +1 (555) 234-5678"
                      value={formData.contact_phone}
                      onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={16} className="spinner" /> : (editingWh ? 'Save Warehouse' : 'Setup Warehouse')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
