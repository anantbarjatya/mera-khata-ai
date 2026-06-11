import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  Check,
  Users,
  IndianRupee,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getCustomers,
  addCustomer,
  settleCustomer,
  deleteCustomer
} from '../services/api.js';
import './Page.css';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [showSettle,setShowSettle]= useState(null);
  const [newName,   setNewName]   = useState('');
  const [newPhone,  setNewPhone]  = useState('');
  const [settleAmt, setSettleAmt] = useState('');
  const [saving,    setSaving]    = useState(false);

  const load = async () => {
    try {
      const data = await getCustomers();
      setCustomers(Array.isArray(data) ? data : data.customers ?? []);
    } catch { toast.error('Failed to load customers'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return toast.error('Name required');
    setSaving(true);
    try {
      await addCustomer({ name: newName.trim(), phone: newPhone.trim() });
      toast.success('Customer added');
      setShowAdd(false); setNewName(''); setNewPhone('');
      load();
    } catch { toast.error('Failed to add customer'); }
    finally { setSaving(false); }
  };

  const handleSettle = async () => {
    if (!settleAmt || isNaN(Number(settleAmt))) return toast.error('Enter valid amount');
    setSaving(true);
    try {
      await settleCustomer(
  showSettle.customer_id,
  Number(settleAmt)
);
     toast.success('Balance settled!');
      setShowSettle(null); setSettleAmt('');
      load();
    } catch { toast.error('Settlement failed'); }
    finally { setSaving(false); }
  };
const handleDelete = async (customer) => {
  if (
    !window.confirm(
      `Delete ${customer.name} and all transactions?`
    )
  ) return;

  try {
    await deleteCustomer(
      customer.customer_id || customer.id
    );

    toast.success("Customer deleted");

    load();
  } catch (err) {
    console.error(err);
    toast.error("Delete failed");
  }
};
  const totalUdhaar = customers.reduce((s, c) => s + (c.total_due > 0 ? c.total_due : 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers <span className="page-title-hi">ग्राहक</span></h1>
          <p className="page-sub">
            {customers.length} customers · Total Udhaar: <span className="mono" style={{ color: 'var(--red)', fontWeight: 700 }}>₹{totalUdhaar.toFixed(0)}</span>
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {loading ? <div className="page-loading">Loading...</div> : customers.length === 0 ? (
        <div className="page-empty"><Users size={40} strokeWidth={1} /><p>No customers yet.</p></div>
      ) : (
        <motion.div className="customers-list"
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}>
        {[...customers]
  .sort((a, b) => (b.total_due ?? 0) - (a.total_due ?? 0))
  .map(c => (
    <motion.div
      key={c.customer_id || c.id}
      className="cust-card"
      variants={{
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 }
      }}
      whileHover={{ x: 3 }}
    >
      
              <div className="cust-avatar">{c.name?.[0]?.toUpperCase() ?? '?'}</div>
              <div className="cust-info">
                <div className="cust-name">{c.name}</div>
                {c.phone && <div className="cust-phone">{c.phone}</div>}
              </div>
             <div className="cust-right">

  <div className={`cust-balance mono ${c.total_due > 0 ? 'owe' : 'clear'}`}>
    {c.total_due > 0
      ? `₹${c.total_due} उधार`
      : 'Clear ✓'}
  </div>

  <button
    className="settle-btn"
    style={{
      background: "#ef4444",
      marginTop: "8px"
    }}
    onClick={() => handleDelete(c)}
  >
    <Trash2 size={12} />
    Delete
  </button>

  {c.total_due > 0 && (
    <button
      className="settle-btn"
      onClick={() => {
        setShowSettle(c);
        setSettleAmt('');
      }}
    >
      <IndianRupee size={12} />
      Settle
    </button>
  )}

</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add Customer Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)}>
            <motion.div className="modal"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add Customer</h3>
                <button className="icon-btn" onClick={() => setShowAdd(false)}><X size={16} /></button>
              </div>
              <div className="form-grid">
                <div className="form-field">
                  <label>Name</label>
                  <input placeholder="Ramesh Kumar" value={newName} onChange={e => setNewName(e.target.value)} />
                </div>
                <div className="form-field">
                  <label>Phone (optional)</label>
                  <input placeholder="98XXXXXX10" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleAdd} disabled={saving}>
                  <Check size={14} /> {saving ? 'Adding...' : 'Add'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settle Modal */}
      <AnimatePresence>
        {showSettle && (
          <motion.div className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowSettle(null)}>
            <motion.div className="modal"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Settle Account — {showSettle.name}</h3>
                <button className="icon-btn" onClick={() => setShowSettle(null)}><X size={16} /></button>
              </div>
              <div className="form-grid">
                <div className="form-field">
                  <label>Current Balance: <span className="mono" style={{ color: 'var(--red)' }}>₹{showSettle.total_due}</span></label>
                  <input type="number" placeholder="Amount paid" value={settleAmt}
                    onChange={e => setSettleAmt(e.target.value)} autoFocus />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-ghost" onClick={() => setShowSettle(null)}>Cancel</button>
                <button className="btn-primary" onClick={handleSettle} disabled={saving}>
                  <Check size={14} /> {saving ? 'Settling...' : 'Settle'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
