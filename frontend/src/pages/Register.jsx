import { useEffect, useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Register() {
  const { user, register, error, setError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', age: 30 });
  const [busy, setBusy] = useState(false);

  useEffect(() => { setError(''); }, [setError]);

  if (user && user !== false) return <Navigate to="/" replace />;

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const ok = await register({ ...form, age: Number(form.age) || 30 });
    setBusy(false);
    if (ok) navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page p-6">
      <div className="w-full max-w-md border border-line bg-surface p-8">
        <h2 className="font-heading font-black text-3xl tracking-tight" data-testid="register-title">Create your account</h2>
        <p className="text-charcoal-muted mt-2 text-sm">Track your SARS income, expenses & receipts in one place.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label-tag block mb-2">Full name</label>
            <input required value={form.name} onChange={update('name')}
              data-testid="register-name-input"
              className="w-full bg-surface border border-line px-3 py-2 text-sm focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/30"/>
          </div>
          <div>
            <label className="label-tag block mb-2">Email</label>
            <input type="email" required value={form.email} onChange={update('email')}
              data-testid="register-email-input"
              className="w-full bg-surface border border-line px-3 py-2 text-sm focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/30"/>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label-tag block mb-2">Password</label>
              <input type="password" required minLength={6} value={form.password} onChange={update('password')}
                data-testid="register-password-input"
                className="w-full bg-surface border border-line px-3 py-2 text-sm focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/30"/>
            </div>
            <div>
              <label className="label-tag block mb-2">Age</label>
              <input type="number" required min={18} max={120} value={form.age} onChange={update('age')}
                data-testid="register-age-input"
                className="w-full bg-surface border border-line px-3 py-2 text-sm focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/30"/>
            </div>
          </div>
          {error && (
            <div className="border border-terra/40 bg-terra/10 text-terra text-sm px-3 py-2" data-testid="register-error">{error}</div>
          )}
          <button
            type="submit" disabled={busy}
            data-testid="register-submit-btn"
            className="w-full bg-moss text-page py-2.5 text-sm font-semibold tracking-wide hover:bg-moss-hover transition-colors duration-150 disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <div className="mt-5 text-sm text-charcoal-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-moss font-medium hover:underline" data-testid="link-to-login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
