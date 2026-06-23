import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ZAR } from '@/lib/format';

export default function TaxSummary() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState(null);
  const [brackets, setBrackets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [s, b] = await Promise.all([
        api.get(`/tax/summary?year=${year}`),
        api.get('/tax/brackets'),
      ]);

      setSummary(s.data || {});
      setBrackets(Array.isArray(b.data?.brackets)
        ? b.data.brackets
        : []);

    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
        err.message ||
        'Failed to load tax summary'
      );

      setSummary({});
      setBrackets([]);
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, [year]);

  const refund = summary?.refund_or_owed || 0;
  const status = summary?.status || 'balanced';

  return (
    <div className="space-y-8" data-testid="tax-page">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="label-tag">Module 3 · SARS Tax Engine</div>
          <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter mt-2">Annual tax summary</h1>
          <p className="text-charcoal-muted mt-2 max-w-2xl">SARS 2024/2025 brackets applied to your taxable income (Income − Deductible expenses).</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="label-tag">Year</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} data-testid="tax-year-select"
            className="border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:border-moss">
            {[year + 1, year, year - 1, year - 2].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Headline */}
      <div className={`border border-line p-8 md:p-10 ${status === 'refund' ? 'bg-moss text-page' : status === 'owed' ? 'bg-terra text-page' : 'bg-surface'}`} data-testid="tax-headline">
        <div className="label-tag opacity-80">{status === 'refund' ? 'Estimated refund' : status === 'owed' ? 'Estimated tax owed' : 'Status'}</div>
        <div className="mt-2 font-heading font-black text-5xl md:text-6xl tracking-tighter">
          {status === 'balanced' ? 'You are balanced.' : ZAR(Math.abs(refund))}
        </div>
        <div className="mt-2 text-sm opacity-90">
          {status === 'refund' && 'SARS should owe you this amount based on PAYE already paid.'}
          {status === 'owed' && 'You may owe SARS additional tax this year.'}
          {status === 'balanced' && 'No refund and nothing owed.'}
        </div>
      </div>

      {/* Calculation */}
      <div className="border border-line bg-surface">
        <div className="p-6 border-b border-line">
          <h3 className="font-heading font-bold text-xl">Calculation breakdown</h3>
        </div>
        <Row label="Total income" value={ZAR(summary?.total_income)} />
        <Row label="− Deductible expenses (Medical + Business)" value={`− ${ZAR(summary?.total_deductions)}`} />
        <Row label="Taxable income" value={ZAR(summary?.taxable_income)} bold />
        <Row label={`Tax @ marginal bracket ${summary?.bracket ? `(${(summary.bracket.rate * 100).toFixed(0)}%)` : ''}`} value={ZAR(summary?.tax_before_rebate)} />
        <Row label="− Primary rebate" value={`− ${ZAR(summary?.rebate)}`} />
        <Row label="Annual tax payable" value={ZAR(summary?.tax_payable)} bold highlight />
        <Row label="PAYE paid year-to-date" value={ZAR(summary?.total_paye_paid)} />
        <Row label={status === 'refund' ? 'Refund due' : status === 'owed' ? 'Tax still owed' : 'Balanced'} value={ZAR(Math.abs(refund))} bold tone={status} />
      </div>

      {/* Brackets reference */}
      <div className="border border-line bg-surface">
        <div className="p-6 border-b border-line flex items-baseline justify-between">
          <h3 className="font-heading font-bold text-xl">SARS 2024/2025 brackets</h3>
          <span className="label-tag">Reference</span>
        </div>
        <div className="grid grid-cols-3 border-b border-line bg-surfaceAlt">
          <Th>From</Th>
          <Th>To</Th>
          <Th align="right">Rate</Th>
        </div>
        {brackets.map((b, i) => {
          const isCurrent = summary?.bracket && summary.bracket.lower === b.lower;
          return (
            <div key={i} className={`grid grid-cols-3 border-b border-line/70 ${isCurrent ? 'bg-moss/5' : ''}`} data-testid={`bracket-row-${i}`}>
              <Td>R{b.lower.toLocaleString()}</Td>
              <Td>{b.upper ? `R${b.upper.toLocaleString()}` : 'and above'}</Td>
              <Td align="right" className="font-heading font-bold">
                {(b.rate * 100).toFixed(0)}%
                {isCurrent && <span className="ml-2 text-xs text-moss font-semibold">YOUR BRACKET</span>}
              </Td>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const Row = ({ label, value, bold, highlight, tone }) => {
  const toneCls = tone === 'refund' ? 'text-moss' : tone === 'owed' ? 'text-terra' : highlight ? 'text-moss' : 'text-charcoal';
  return (
    <div className="grid grid-cols-2 px-6 py-4 border-b border-line/70 last:border-b-0">
      <div className={`text-sm ${bold ? 'font-semibold' : 'text-charcoal-muted'}`}>{label}</div>
      <div className={`text-right tabular-nums ${bold ? 'font-heading font-bold text-lg' : ''} ${toneCls}`}>{value}</div>
    </div>
  );
};
const Th = ({ children, align = 'left' }) => (
  <div className={`label-tag px-6 py-3 ${align === 'right' ? 'text-right' : ''}`}>{children}</div>
);
const Td = ({ children, align = 'left', className = '' }) => (
  <div className={`px-6 py-3 text-sm ${align === 'right' ? 'text-right tabular-nums' : ''} ${className}`}>{children}</div>
);
