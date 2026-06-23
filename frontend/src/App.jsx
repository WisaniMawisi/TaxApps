import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Income from '@/pages/Income';
import Scan from '@/pages/Scan';
import Expenses from '@/pages/Expenses';
import TaxSummary from '@/pages/TaxSummary';

function PrivateLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
            <Route path="/income" element={<PrivateLayout><Income /></PrivateLayout>} />
            <Route path="/scan" element={<PrivateLayout><Scan /></PrivateLayout>} />
            <Route path="/expenses" element={<PrivateLayout><Expenses /></PrivateLayout>} />
            <Route path="/tax" element={<PrivateLayout><TaxSummary /></PrivateLayout>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
