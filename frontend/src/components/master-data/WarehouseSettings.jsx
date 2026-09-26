import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, MapPin, Phone, User, RefreshCw, X, Loader2, Gauge } from 'lucide-react';
import { api } from '../../services/api';

const C = {
  navy: '#1e2a4a',
  muted: '#6b7a99',
  dim: '#94a3b8',
  border: 'rgba(0, 0, 0, 0.08)',
  blue: '#2563eb',
  blueBg: 'rgba(37, 99, 235, 0.08)',
  green: '#047857',
  greenBg: 'rgba(16, 185, 129, 0.1)',
  amber: '#b45309',
  red: '#b91c1c',
  redBg: 'rgba(244, 63, 94, 0.08)',
  panelBg: '#f8fafc',
};

const cardStyle = {
  background: '#ffffff',
  border: `1px solid ${C.border}`,
  borderRadius: '16px',
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
      if (res?.data) setWarehouses(res.data);
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
      name: '', code: '', location: '', address: '', capacity: 50000,
      type: 'Distribution Center', is_active: 1, contact_person: '', contact_phone: ''
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: C.blue, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Settings &bull; Warehouse Master
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: C.navy, margin: '4px 0 0 0' }}>
            Warehouse Facilities & Sites Setup
          </h2>
          <p style={{ fontSize: '0.85rem', color: C.muted, marginTop: '4px' }}>
            Configure fulfillment centers, cross-docks, transit hubs, and storage capacities
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={loadWarehouses}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px', fontSize: '0.85rem', fontWeight: 600,
              background: '#f1f5f9', color: '#334155', border: `1px solid ${C.border}`,
              borderRadius: '10px', cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} className={loading ? 'spinner' : ''} />
            <span>Refresh</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Add Warehouse
          </button>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', borderRadius: '10px', marginBottom: '18px',
          background: statusMessage.type === 'error' ? C.redBg : C.greenBg,
          color: statusMessage.type === 'error' ? C.red : C.green,
          border: `1px solid ${statusMessage.type === 'error' ? 'rgba(244,63,94,0.25)' : 'rgba(16,185,129,0.25)'}`,
          fontSize: '0.88rem',
        }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: C.muted }}>
            <RefreshCw size={24} className="spinner" style={{ marginBottom: '8px' }} />
            <div>Loading warehouse facilities...</div>
          </div>
        ) : warehouses.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: C.muted }}>
            <Building2 size={36} color={C.dim} style={{ marginBottom: '8px' }} />
            <div>No warehouses configured yet. Click "+ Add Warehouse" to set up your first facility.</div>
          </div>
        ) : (
          warehouses.map(w => {
            const cap = w.capacity || 50000;
            const stored = w.total_units_stored || 0;
            const util = w.utilization_percentage || 0;
            const utilColor = util > 85 ? '#dc2626' : util > 60 ? C.amber : C.green;

            return (
              <div key={w.id} style={{ ...cardStyle, padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ background: C.blueBg, color: C.blue, padding: '10px', borderRadius: '10px' }}>
                        <Building2 size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: C.blue,
                            background: C.blueBg, padding: '2px 7px', borderRadius: '9999px',
                          }}>
                            {w.code}
                          </span>
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px',
                            background: w.is_active ? C.greenBg : C.redBg,
                            color: w.is_active ? C.green : C.red,
                          }}>
                            {w.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: C.navy, margin: '4px 0 0 0' }}>
                          {w.name}
                        </h3>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(w)}
                        title="Edit Warehouse Settings"
                        style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', padding: '6px' }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(w)}
                        title="Delete Warehouse"
                        style={{ background: 'transparent', border: 'none', color: C.red, cursor: 'pointer', padding: '6px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <MapPin size={14} color={C.blue} />
                      <span>{w.address || w.location || 'Location not specified'}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: C.dim, marginLeft: '20px' }}>
                      Facility Type: <strong style={{ color: C.muted }}>{w.type || 'Distribution Center'}</strong>
                    </div>
                  </div>

                  {(w.contact_person || w.contact_phone) && (
                    <div style={{
                      background: C.panelBg, border: `1px solid ${C.border}`, borderRadius: '8px',
                      padding: '8px 12px', fontSize: '0.78rem', color: C.muted,
                      display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px',
                    }}>
                      {w.contact_person && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={13} color={C.dim} /> {w.contact_person}
                        </div>
                      )}
                      {w.contact_phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={13} color={C.dim} /> {w.contact_phone}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Utilization Gauge & KPIs */}
                <div style={{ background: C.panelBg, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: C.muted }}>
                      <Gauge size={14} color={C.blue} />
                      <span>Capacity Utilization</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: utilColor }}>
                      {util}%
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '8px', background: '#e5e9f2', borderRadius: '999px', overflow: 'hidden', marginBottom: '12px' }}>
                    <div style={{ height: '100%', borderRadius: '999px', width: `${Math.min(100, util)}%`, background: utilColor }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.78rem', textAlign: 'center' }}>
                    <div>
                      <div style={{ color: C.dim, fontSize: '0.7rem' }}>Stored Units</div>
                      <div style={{ fontWeight: '700', color: C.navy }}>{stored.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ color: C.dim, fontSize: '0.7rem' }}>Capacity</div>
                      <div style={{ fontWeight: '700', color: C.navy }}>{cap.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ color: C.dim, fontSize: '0.7rem' }}>Active SKUs</div>
                      <div style={{ fontWeight: '700', color: C.blue }}>{w.distinct_skus || 0}</div>
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
        <div
          onClick={() => setIsModalOpen(false)}
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
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.25)', width: '100%', maxWidth: '680px',
              maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: C.navy, margin: 0 }}>
                {editingWh ? `Edit Warehouse Facility: ${editingWh.name}` : 'Setup New Warehouse Facility'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Warehouse Name *</label>
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder="e.g. Central Logistics Hub"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Warehouse Code *</label>
                    <input
                      type="text"
                      style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                      placeholder="e.g. WH-CENTRAL"
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Facility Type</label>
                    <select style={inputStyle} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                      <option value="Central Distribution Hub">Central Distribution Hub</option>
                      <option value="Regional Fulfillment Center">Regional Fulfillment Center</option>
                      <option value="Cross-Dock & Transit Facility">Cross-Dock & Transit Facility</option>
                      <option value="Cold Storage Warehouse">Cold Storage Warehouse</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Full Address / Location</label>
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder="e.g. 1000 Logistics Blvd, Dallas, TX 75201"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value, location: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Total Storage Capacity (Units)</label>
                    <input
                      type="number"
                      min="100"
                      style={inputStyle}
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Operational Status</label>
                    <select
                      style={inputStyle}
                      value={formData.is_active}
                      onChange={e => setFormData({ ...formData, is_active: Number(e.target.value) })}
                    >
                      <option value={1}>Active & Operational</option>
                      <option value={0}>Temporarily Inactive / Maintenance</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Primary Site Contact Person</label>
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder="e.g. Sarah Jenkins (Operations Lead)"
                      value={formData.contact_person}
                      onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Contact Phone / Extension</label>
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder="e.g. +1 (555) 234-5678"
                      value={formData.contact_phone}
                      onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{
                padding: '16px 24px', borderTop: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px',
                background: C.panelBg,
              }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '10px 18px', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem',
                    background: '#f1f5f9', color: '#334155', border: `1px solid ${C.border}`, cursor: 'pointer',
                  }}
                >
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