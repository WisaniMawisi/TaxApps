import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ZAR, MONTH_NAMES, CATEGORY_COLORS } from '@/lib/format';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { ArrowUpRight, ScanLine, Plus } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const year = new Date().getFullYear();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

useEffect(() => {
  (async () => {
    try {
      const { data } = await api.get(`/tax/summary?year=${year}`);
      setSummary(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err?.data?.detail || err?.message || 'Could not load your tax summary.');
    } finally {
      setLoading(false);
    }
  })();
}, [year]);

  const monthly = MONTH_NAMES.map((m, i) => {
  const recs = summary?.monthly_records?.filter((r) => r.month === i + 1) || [];
  const income = recs.reduce((sum, r) => sum + Number(r.income || 0), 0);
  const paye = recs.reduce((sum, r) => sum + Number(r.tax_paid || 0), 0);
  return { month: m, income, paye };
});

  const pieData = Object.entries(summary?.category_breakdown || {}).map(([name, value]) => ({ name, value }));

  const status = summary?.status || 'balanced';
  const refundOrOwed = summary?.refund_or_owed || 0;

  return (
    <div className="space-y-8" data-testid="dashboard-root">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="label-tag">Tax year · {year}</div>
          <h1 className="font-heading font-black text-4xl md:text-5xl tracking-tighter mt-2" data-testid="dashboard-title">
            Welcome back, {user?.name?.split(' ')[0] || 'taxpayer'}.
          </h1>
          <p className="text-charcoal-muted mt-2 max-w-2xl" data-testid="dashboard-subtitle">
            Your live SARS picture for {year}. Add income, scan receipts, and watch your refund or tax owed update in real-time.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/scan" data-testid="cta-scan" className="inline-flex items-center gap-2 bg-moss text-page px-4 py-2.5 text-sm font-semibold hover:bg-moss-hover transition-colors">
            <ScanLine size={16} /> Scan slip
          </Link>
          <Link to="/income" data-testid="cta-add-income" className="inline-flex items-center gap-2 border border-line px-4 py-2.5 text-sm font-semibold hover:bg-surfaceAlt transition-colors">
            <Plus size={16} /> Add income
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="border border-line bg-surface grid grid-cols-2 md:grid-cols-4 grid-lines">
        <Kpi label="Total income" value={ZAR(summary?.total_income)} loading={loading} testid="kpi-income" />
        <Kpi label="PAYE paid" value={ZAR(summary?.total_paye_paid)} loading={loading} testid="kpi-paye" />
        <Kpi label="Deductions" value={ZAR(summary?.total_deductions)} loading={loading} testid="kpi-deductions" />
        <Kpi
          label={status === 'refund' ? 'Estimated refund' : status === 'owed' ? 'Owed to SARS' : 'Balanced'}
          value={ZAR(Math.abs(refundOrOwed))}
          tone={status === 'refund' ? 'moss' : status === 'owed' ? 'terra' : 'muted'}
          loading={loading}
          testid="kpi-refund-or-owed"
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-5 gap-0 border border-line bg-surface grid-lines">
        <div className="lg:col-span-3 p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="font-heading font-bold text-xl">Income vs PAYE by month</h3>
            <span className="label-tag">ZAR</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#E5E2D9" vertical={false} />
                <XAxis dataKey="month" stroke="#5C5F58" tickLine={false} axisLine={false} style={{ fontSize: 11 }} />
                <YAxis stroke="#5C5F58" tickLine={false} axisLine={false} style={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#FFF', border: '1px solid #D1CEC7', fontSize: 12 }} formatter={(v) => ZAR(v)} />
                <Bar dataKey="income" fill="#2C5545" name="Income" />
                <Bar dataKey="paye" fill="#C25934" name="PAYE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-2 p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="font-heading font-bold text-xl">Expenses by category</h3>
            <Link to="/expenses" className="text-xs text-moss font-semibold inline-flex items-center gap-1 hover:underline">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {pieData.length === 0 ? (
            <EmptyTile imageUrl="https://images.unsplash.com/photo-1497215641119-bbe6d71ebaae?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwyfHxjbGVhbiUyMG9mZmljZSUyMGRlc2slMjBwbGFudHxlbnwwfHx8fDE3ODA5NzA2MDl8MA&ixlib=rb-4.1.0&q=85" title="No expenses logged yet" cta="Scan your first slip" to="/scan"/>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} stroke="#F7F5F0" strokeWidth={2}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#5C5F58'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#FFF', border: '1px solid #D1CEC7', fontSize: 12 }} formatter={(v) => ZAR(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Tax breakdown card */}
      <div className="border border-line bg-surface p-6 md:p-8" data-testid="tax-snapshot">
        <div className="flex items-baseline justify-between mb-6">
          <h3 className="font-heading font-bold text-2xl">SARS Snapshot · {year}</h3>
          <Link to="/tax" className="text-sm text-moss font-semibold hover:underline inline-flex items-center gap-1">
            Full breakdown <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Stat label="Taxable income" value={ZAR(summary?.taxable_income)} />
          <Stat label="Tax before rebate" value={ZAR(summary?.tax_before_rebate)} />
          <Stat label="Primary rebate" value={`− ${ZAR(summary?.rebate)}`} />
          <Stat label="Annual tax payable" value={ZAR(summary?.tax_payable)} highlight />
        </div>
        <div className="mt-6 border-t border-line pt-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="text-charcoal-muted text-sm">
            Marginal bracket:{' '}
            <span className="text-charcoal font-semibold">
              {summary?.bracket ? `${(summary.bracket.rate * 100).toFixed(0)}% · R${summary.bracket.lower.toLocaleString()}${summary.bracket.upper ? ` — R${summary.bracket.upper.toLocaleString()}` : '+'}` : '—'}
            </span>
          </div>
          <div className={`text-lg font-heading font-bold ${status === 'refund' ? 'text-moss' : status === 'owed' ? 'text-terra' : 'text-charcoal'}`} data-testid="refund-owed-banner">
            {status === 'refund' && `Estimated refund: ${ZAR(refundOrOwed)}`}
            {status === 'owed' && `Owed to SARS: ${ZAR(Math.abs(refundOrOwed))}`}
            {status === 'balanced' && `You're balanced.`}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone = 'default', loading, testid }) {
  const toneCls = tone === 'moss' ? 'text-moss' : tone === 'terra' ? 'text-terra' : 'text-charcoal';
  return (
    <div className="p-6" data-testid={testid}>
      <div className="label-tag">{label}</div>
      <div className={`mt-3 font-heading font-black text-2xl md:text-3xl tracking-tight ${toneCls}`}>
        {loading ? <span className="inline-block w-24 h-7 bg-surfaceAlt animate-pulse" /> : value}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div>
      <div className="label-tag">{label}</div>
      <div className={`mt-2 font-heading ${highlight ? 'text-moss font-black text-2xl' : 'text-charcoal font-bold text-xl'}`}>{value}</div>
    </div>
  );
}

function EmptyTile({ imageUrl, title, cta, to }) {
  return (
    <div className="h-64 flex flex-col items-center justify-center text-center px-4">
      <img src={imageUrl} alt="" className="w-20 h-20 object-cover grayscale opacity-70 mb-3" />
      <div className="text-sm text-charcoal-muted">{title}</div>
      <Link to={to} className="mt-3 text-sm font-semibold text-moss hover:underline">{cta} →</Link>
    </div>
  );
}
