import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit, Trash2, Package, RefreshCw, X, ShieldAlert, Sparkles, Loader2, Database } from 'lucide-react';
import { api } from '../../services/api';

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
      if (res?.data) {
        setCategories(res.data);
      }
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
      {/* Top Action & KPI Bar */}
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
            Product Categories
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Structure and taxonomy for catalog classification and inventory allocation
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={loadCategories}
            title="Refresh categories list"
          >
            <RefreshCw size={15} className={loading ? 'spinner' : ''} />
            <span>Refresh</span>
          </button>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleOpenCreate}
          >
            <Plus size={16} /> + New Category
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

      {/* Categories Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px'
      }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spinner" style={{ marginBottom: '8px' }} />
            <div>Loading product categories...</div>
          </div>
        ) : categories.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Layers size={36} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
            <div>No categories found. Create your first category to organize products.</div>
          </div>
        ) : (
          categories.map(c => (
            <div key={c.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      background: 'rgba(14, 165, 233, 0.15)',
                      color: '#0ea5e9',
                      padding: '8px',
                      borderRadius: '8px'
                    }}>
                      <Layers size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                        {c.name}
                      </h4>
                      <span className="badge badge-mono" style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
                        {c.code || 'CAT-NONE'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      className="input-action-btn"
                      style={{ position: 'static' }}
                      title="Edit Category"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      className="input-action-btn"
                      style={{ position: 'static', color: '#f87171' }}
                      title="Delete Category"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '16px' }}>
                  {c.description || 'No description provided.'}
                </p>
              </div>

              {/* Statistics Pill */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Products Assigned</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff' }}>
                    {c.product_count} <span style={{ fontSize: '0.75rem', fontWeight: '400', color: 'var(--text-dim)' }}>SKUs</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Stock Units</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#10b981' }}>
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
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
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
                <div className="form-group">
                  <label className="form-label">Category Name *</label>
                  <input
                    type="text"
                    className="input-field no-icon"
                    placeholder="e.g. Electrical Components"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Category Code</label>
                    <button
                      type="button"
                      onClick={handleAutoCode}
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
                    placeholder="e.g. CAT-ELEC"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="input-field no-icon"
                    rows="3"
                    style={{ resize: 'vertical' }}
                    placeholder="Description of products in this category..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
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
