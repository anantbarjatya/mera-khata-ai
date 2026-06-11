import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import './App.css';

export default function App() {
  return (
    <div className="app-shell">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Poppins, sans-serif',
            fontSize: '14px',
            background: '#1A1A2E',
            color: '#FAF7F2',
            borderRadius: '12px',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#2D6A4F', secondary: '#FAF7F2' } },
          error:   { iconTheme: { primary: '#C0392B', secondary: '#FAF7F2' } },
        }}
      />
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/inventory"    element={<InventoryPage />} />
          <Route path="/customers"    element={<CustomersPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="*"             element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
