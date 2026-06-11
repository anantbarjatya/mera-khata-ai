import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import './VoiceTimeline.css';

export default function VoiceTimeline({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="vt-root">
        <div className="vt-header">
          <Mic size={15} />
          <span>Voice Activity</span>
          <span className="vt-hi">आवाज़ इतिहास</span>
        </div>
        <div className="vt-empty">
          <div className="vt-empty-icon">🎤</div>
          <p>No voice commands yet</p>
          <p className="vt-empty-sub">Try saying "Raju ko 1kg atta diya"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vt-root">
      <div className="vt-header">
        <Mic size={15} />
        <span>Voice Activity</span>
        <span className="vt-hi">आवाज़ इतिहास</span>
        <span className="vt-count">{entries.length}</span>
      </div>

      <div className="vt-list">
        <AnimatePresence initial={false}>
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id ?? i}
              className="vt-entry"
              initial={{ opacity: 0, x: -12, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 12, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="vt-line-wrap">
                <div className="vt-dot" />
                {i < entries.length - 1 && <div className="vt-line" />}
              </div>

              <div className="vt-content">
                {entry.transcript && (
                  <div className="vt-transcript">"{entry.transcript}"</div>
                )}
                <div className="vt-meta-row">
                  {entry.customer_name && (
                    <span className="vt-chip vt-chip-blue">👤 {entry.customer_name}</span>
                  )}
                  {entry.amount != null && (
                    <span className="vt-chip vt-chip-saffron">₹{Math.abs(entry.amount)}</span>
                  )}
                  {entry.type && (
                    <span className={`vt-chip ${entry.type === 'credit' ? 'vt-chip-green' : 'vt-chip-red'}`}>
                      {entry.type === 'credit' ? '↑ credit' : '↓ debit'}
                    </span>
                  )}
                  <span className="vt-time">
                    <Clock size={9} />
                    {entry.created_at
                      ? formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })
                      : 'just now'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
