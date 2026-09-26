import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit, Trash2, RefreshCw, X, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

const C = {
  navy: '#1e2a4a',
  muted: '#6b7a99',
  dim: '#94a3b8',
  border: 'rgba(0, 0, 0, 0.08)',
  blue: '#2563eb',
  blueBg: 'rgba(37, 99, 235, 0.08)',
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

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getCategories();
      if (res?.data) setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', code: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCategory(c);
    setFormData({ name: c.name, code: c.code || '', description: c.description || '' });
    setIsModalOpen(true);
  };

  const handleAutoCode = () => {
    if (formData.name) {
      const code = 'CAT-' + formData.name.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase();
      setFormData(prev => ({ ...prev, code }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSubmitting(true);
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, formData);
        setStatusMessage({ type: 'success', text: `Category "${formData.name}" updated successfully.` });
      } else {
        await api.createCategory(formData);
        setStatusMessage({ type: 'success', text: `Category "${formData.name}" created successfully.` });
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Operation failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Are you sure you want to delete category "${category.name}"?`)) return;

    try {
      await api.deleteCategory(category.id);
      setStatusMessage({ type: 'success', text: `Category "${category.name}" deleted.` });
      loadCategories();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete category.' });
    }
  };

  return (
    <div>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: C.navy, margin: 0 }}>
            Product Categories
          </h2>
          <p style={{ fontSize: '0.85rem', color: C.muted, marginTop: '4px' }}>
            Structure and taxonomy for catalog classification and inventory allocation
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={loadCategories}
            title="Refresh categories list"
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
            <Plus size={16} /> New Category
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

      {/* Categories Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: C.muted }}>
            <RefreshCw size={24} className="spinner" style={{ marginBottom: '8px' }} />
            <div>Loading product categories...</div>
          </div>
        ) : categories.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: C.muted }}>
            <Layers size={36} color={C.dim} style={{ marginBottom: '8px' }} />
            <div>No categories found. Create your first category to organize products.</div>
          </div>
        ) : (
          categories.map(c => (
            <div key={c.id} style={{ ...cardStyle, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: C.blueBg, color: C.blue, padding: '8px', borderRadius: '8px' }}>
                      <Layers size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: C.navy, margin: 0 }}>{c.name}</h4>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: C.blue,
                        background: C.blueBg, padding: '2px 7px', borderRadius: '9999px',
                      }}>
                        {c.code || 'CAT-NONE'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      title="Edit Category"
                      style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', padding: '6px' }}
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      title="Delete Category"
                      style={{ background: 'transparent', border: 'none', color: C.red, cursor: 'pointer', padding: '6px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', color: C.muted, lineHeight: '1.4', marginBottom: '16px' }}>
                  {c.description || 'No description provided.'}
                </p>
              </div>

              <div style={{
                background: C.panelBg, border: `1px solid ${C.border}`, borderRadius: '10px',
                padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: C.dim, textTransform: 'uppercase' }}>Products Assigned</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: C.navy }}>
                    {c.product_count} <span style={{ fontSize: '0.75rem', fontWeight: '400', color: C.dim }}>SKUs</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: C.dim, textTransform: 'uppercase' }}>Total Stock Units</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: C.green }}>
                    {c.total_units_in_stock?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            </div>
          ))
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
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.25)', width: '100%', maxWidth: '500px',
              maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: C.navy, margin: 0 }}>
                {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
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
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Category Name *</label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="e.g. Electrical Components"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={labelStyle}>Category Code</label>
                    <button
                      type="button"
                      onClick={handleAutoCode}
                      style={{ background: 'transparent', border: 'none', color: C.blue, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}
                    >
                      <Sparkles size={12} /> Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                    placeholder="e.g. CAT-ELEC"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    rows="3"
                    style={{ ...inputStyle, resize: 'vertical' }}
                    placeholder="Description of products in this category..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
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
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '10px 18px', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem',
                    background: '#f1f5f9', color: '#334155', border: `1px solid ${C.border}`, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={16} className="spinner" /> : (editingCategory ? 'Save Changes' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}