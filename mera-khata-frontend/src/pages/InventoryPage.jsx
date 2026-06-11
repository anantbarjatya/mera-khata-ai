import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Package, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../services/api.js';
import './Page.css';

const EMPTY = { name: '', quantity: '', unit: 'kg', price: '', low_stock_threshold: '5' };

const statusOf = (item) => {
  const t = item.low_stock_threshold ?? 5;
  if (item.quantity === 0) return { label: 'Out of Stock', color: 'red' };
  if (item.quantity <= t)  return { label: 'Low Stock',    color: 'ochre' };
  return                          { label: 'In Stock',     color: 'green' };
};

export default function InventoryPage() {
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);

  const load = async () => {
    try {
      const data = await getInventory();
      setItems(Array.isArray(data) ? data : data.inventory ?? []);
    } catch { toast.error('Failed to load inventory'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = ()     => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (item) => {
    setEditing(item.id);
    setForm({ name: item.name, quantity: item.quantity, unit: item.unit ?? 'kg',
              price: item.price ?? '', low_stock_threshold: item.low_stock_threshold ?? 5 });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name required');
    setSaving(true);
    try {
      const payload = { ...form, quantity: Number(form.quantity), price: Number(form.price),
                        low_stock_threshold: Number(form.low_stock_threshold) };
      if (editing) await updateInventoryItem(editing, payload);
      else         await addInventoryItem(payload);
      toast.success(editing ? 'Item updated' : 'Item added');
      setShowForm(false);
      load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try { await deleteInventoryItem(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory <span className="page-title-hi">इन्वेंटरी</span></h1>
          <p className="page-sub">{items.length} items tracked</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={16} strokeWidth={2.5} /> Add Item
        </button>
      </div>

      {loading ? (
        <div className="page-loading">Loading inventory...</div>
      ) : items.length === 0 ? (
        <div className="page-empty">
          <Package size={40} strokeWidth={1} />
          <p>No items yet. Add your first product.</p>
        </div>
      ) : (
        <motion.div className="inv-grid"
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}>
          {items.map(item => {
            const st = statusOf(item);
            return (
              <motion.div key={item.id} className="inv-card"
                variants={{ hidden: { opacity: 0, scale: 0.97 }, show: { opacity: 1, scale: 1 } }}
                whileHover={{ y: -2 }}>
                <div className="inv-card-top">
                  <span className="inv-name">
  {item.name || item.item_name}
</span>
                  <span className={`status-pill pill-${st.color}`}>{st.label}</span>
                </div>
                <div className="inv-qty mono">
                  {item.quantity} <span className="inv-unit">{item.unit ?? 'units'}</span>
                </div>
                {item.price != null && (
                  <div className="inv-price">₹{item.price} / {item.unit ?? 'unit'}</div>
                )}
                <div className="inv-card-actions">
                  <button className="icon-btn" onClick={() => openEdit(item)}><Pencil size={14} /></button>
                  <button className="icon-btn danger" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}>
            <motion.div className="modal"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editing ? 'Edit Item' : 'Add Item'}</h3>
                <button className="icon-btn" onClick={() => setShowForm(false)}><X size={16} /></button>
              </div>
              <div className="form-grid">
                {[
                  ['name', 'Item Name', 'text', 'e.g. Basmati Rice'],
                  ['quantity', 'Quantity', 'number', '0'],
                  ['unit', 'Unit', 'text', 'kg / litre / pcs'],
                  ['price', 'Price (₹)', 'number', '0'],
                  ['low_stock_threshold', 'Low Stock Alert', 'number', '5'],
                ].map(([key, label, type, ph]) => (
                  <div key={key} className="form-field">
                    <label>{label}</label>
                    <input type={type} placeholder={ph} value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  <Check size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
