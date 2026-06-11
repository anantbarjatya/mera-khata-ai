import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, ShoppingBag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import './TransactionFeed.css';

export default function TransactionFeed({ transactions }) {
const recent = [...(transactions || [])].slice(0, 8);

  if (recent.length === 0) {
    return (
      <div className="tf-root">
        <div className="tf-header">
          <ShoppingBag size={15} />
          <span>Recent Transactions</span>
          <span className="tf-hi">हाल के लेनदेन</span>
        </div>
        <div className="tf-empty">
          <ShoppingBag size={32} strokeWidth={1} />
          <p>No transactions yet</p>
          <p className="tf-empty-sub">Use voice command to add a transaction</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tf-root">
      <div className="tf-header">
        <ShoppingBag size={15} />
        <span>Recent Transactions</span>
        <span className="tf-hi">हाल के लेनदेन</span>
        <span className="tf-badge">{transactions.length} total</span>
      </div>

      <div className="tf-list">
        {recent.map((txn, i) => {
         const isCredit = txn.status === 'paid';
const absAmount = Math.abs(Number(txn.total_amount) || 0);

          return (
            <motion.div
              key={txn.txn_id ?? i}
              className="tf-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              whileHover={{ x: 3, transition: { duration: 0.15 } }}
            >
              <div className={`tf-icon-wrap ${isCredit ? 'credit' : 'debit'}`}>
                {isCredit
                  ? <ArrowUpRight size={16} strokeWidth={2.5} />
                  : <ArrowDownLeft size={16} strokeWidth={2.5} />}
              </div>

              <div className="tf-info">
                <div className="tf-name">
                  {txn.customer_name ?? txn.description ?? 'Transaction'}
                </div>
                {txn.notes && (
                  <div className="tf-notes">{txn.notes}</div>
                )}
                <div className="tf-time">
                  {txn.created_at
                    ? formatDistanceToNow(new Date(txn.created_at), { addSuffix: true })
                    : 'Recently'}
                </div>
              </div>

              <div className="tf-right">
                <div className={`tf-amount mono ${isCredit ? 'credit' : 'debit'}`}>
  ₹{absAmount.toFixed(0)}
</div>
                <div className={`tf-type-tag ${isCredit ? 'credit' : 'debit'}`}>
  {txn.status}
</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
