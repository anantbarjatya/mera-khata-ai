import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package, Users, Receipt, Mic, Sparkles } from 'lucide-react';
import './Sidebar.css';

const NAV = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard',     hi: 'डैशबोर्ड' },
  { to: '/inventory',    icon: Package,          label: 'Inventory',     hi: 'इन्वेंटरी' },
  { to: '/customers',    icon: Users,            label: 'Customers',     hi: 'ग्राहक' },
  { to: '/transactions', icon: Receipt,          label: 'Transactions',  hi: 'लेनदेन' },
];

export default function Sidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Mic size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div className="brand-name">मेरा खाता</div>
            <div className="brand-tag">AI Ledger</div>
          </div>
          <div className="brand-ai-badge">
            <Sparkles size={10} />
            AI
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon: Icon, label, hi }) => (
            <NavLink key={to} to={to} end={to === '/'} className="nav-item">
              {({ isActive }) => (
                <motion.div
                  className={`nav-inner ${isActive ? 'active' : ''}`}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {isActive && (
                    <motion.div
                      className="nav-active-bar"
                      layoutId="activeBar"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                  <div className="nav-labels">
                    <span className="nav-en">{label}</span>
                    <span className="nav-hi">{hi}</span>
                  </div>
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="powered-by">
            <span>Powered by</span>
            <span className="sarvam-badge">Sarvam AI</span>
          </div>
          <p className="footer-tagline">Voice-first kirana OS</p>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className="mobile-nav-item">
            {({ isActive }) => (
              <motion.div
                className={`mobile-nav-inner ${isActive ? 'active' : ''}`}
                whileTap={{ scale: 0.85 }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
