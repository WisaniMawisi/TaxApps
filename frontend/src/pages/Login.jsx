import { useEffect, useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const { user, login, error, setError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { setError(''); }, [setError]);

  if (user && user !== false) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const ok = await login(email, password);
    setBusy(false);
    if (ok) navigate('/');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-page">
      <div className="hidden lg:block relative overflow-hidden border-r border-line">
        <img
          src="https://images.unsplash.com/photo-1560131914-2e469a0e8607?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHw0fHxjbGVhbiUyMG9mZmljZSUyMGRlc2slMjBwbGFudHxlbnwwfHx8fDE3ODA5NzA2MDl8MA&ixlib=rb-4.1.0&q=85"
          alt="Workspace"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-charcoal/40" />
        <div className="relative h-full flex flex-col justify-between p-12 text-page">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-page flex items-center justify-center"><span className="text-moss font-heading font-black">T</span></div>
            <span className="font-heading font-black text-xl tracking-tight">TaxApp · SARS</span>
          </div>
          <div className="space-y-4 max-w-md">
            <p className="label-tag text-page/70">South African Tax Year 2024/2025</p>
            <h1 className="font-heading font-black text-4xl leading-tight">Track every rand. Scan every slip. Calculate your SARS bill in seconds.</h1>
            <p className="text-page/80 text-base">Log monthly income & PAYE, snap receipts to extract expense data automatically with AI, and see exactly where you stand — refund or owed.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="font-heading font-black text-3xl tracking-tight" data-testid="login-title">Sign in</h2>
          <p className="text-charcoal-muted mt-2 text-sm">Use your account to access your tax dashboard.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="label-tag block mb-2">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email-input"
                className="w-full bg-surface border border-line px-3 py-2 text-sm focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/30"
                placeholder="you@example.co.za"
              />
            </div>
            <div>
              <label className="label-tag block mb-2">Password</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                data-testid="login-password-input"
                className="w-full bg-surface border border-line px-3 py-2 text-sm focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/30"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="border border-terra/40 bg-terra/10 text-terra text-sm px-3 py-2" data-testid="login-error">{error}</div>
            )}
            <button
              type="submit"
              disabled={busy}
              data-testid="login-submit-btn"
              className="w-full bg-moss text-page py-2.5 text-sm font-semibold tracking-wide hover:bg-moss-hover transition-colors duration-150 disabled:opacity-50"
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-sm text-charcoal-muted">
            New here?{' '}
            <Link to="/register" className="text-moss font-medium hover:underline" data-testid="link-to-register">Create an account</Link>
          </div>

          <div className="mt-10 text-xs text-charcoal-muted border-t border-line pt-4">
            <strong>Demo:</strong> admin@taxapp.za / Admin@2026
          </div>
        </div>
      </div>
    </div>
  );
}
