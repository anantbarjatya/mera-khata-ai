import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, Receipt } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { getTransactions } from '../services/api.js';
import './Page.css';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('all');

  const load = async () => {
    try {
      const data = await getTransactions();
      setTransactions(Array.isArray(data) ? data : data.transactions ?? []);
    } catch { toast.error('Failed to load transactions'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const totalIn  = transactions.filter(t => t.type === 'credit').reduce((s,t) => s + Math.abs(t.amount??0), 0);
  const totalOut = transactions.filter(t => t.type !== 'credit').reduce((s,t) => s + Math.abs(t.amount??0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions <span className="page-title-hi">लेनदेन</span></h1>
          <p className="page-sub">{transactions.length} records</p>
        </div>
        <div className="txn-summary">
          <div className="txn-sum-item green">
            <ArrowUpRight size={14} />
            <span className="mono">₹{totalIn.toFixed(0)}</span>
            <span>received</span>
          </div>
          <div className="txn-sum-item red">
            <ArrowDownLeft size={14} />
            <span className="mono">₹{totalOut.toFixed(0)}</span>
            <span>udhaar</span>
          </div>
        </div>
      </div>

      <div className="filter-tabs">
        {['all', 'debit', 'credit'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'debit' ? '↓ Udhaar' : '↑ Payment'}
          </button>
        ))}
      </div>

      {loading ? <div className="page-loading">Loading...</div>
        : filtered.length === 0 ? (
          <div className="page-empty"><Receipt size={40} strokeWidth={1} /><p>No transactions found.</p></div>
        ) : (
          <motion.div className="txn-list"
            initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}>
            {[...filtered].reverse().map((txn, i) => {
              const isCredit = txn.type === 'credit';
              const abs = Math.abs(txn.amount ?? 0);
              return (
                <motion.div key={txn.id ?? i} className="txn-row"
                  variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}>
                  <div className={`txn-icon ${isCredit ? 'credit' : 'debit'}`}>
                    {isCredit ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                  </div>
                  <div className="txn-main">
                    <div className="txn-customer">{txn.customer_name ?? 'Unknown'}</div>
                    {txn.notes && <div className="txn-notes">{txn.notes}</div>}
                  </div>
                  <div className="txn-meta">
                    <div className={`txn-amount mono ${isCredit ? 'credit' : 'debit'}`}>
                      {isCredit ? '+' : '-'}₹{abs.toFixed(0)}
                    </div>
                    <div className="txn-time">
                      {txn.created_at
                        ? formatDistanceToNow(new Date(txn.created_at), { addSuffix: true })
                        : 'Recently'}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
    </div>
  );
}
