import { useEffect, useState } from 'react';
import api, { formatApiError } from '@/lib/api';
import { ZAR, MONTH_NAMES } from '@/lib/format';
import { Trash2 } from 'lucide-react';

export default function Income() {
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [list, setList] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    income: '',
    tax_paid: '',
    note: '',
  });

  const load = async (selectedYear) => {
    try {
      setError('');

      const { data } = await api.get(`/income?year=${selectedYear}`);

      console.log('Income API Response:', data);

      // Handle different API response structures
      if (Array.isArray(data)) {
        setList(data);
      } else if (Array.isArray(data?.items)) {
        setList(data.items);
      } else if (Array.isArray(data?.data)) {
        setList(data.data);
      } else {
        setList([]);
      }
    } catch (err) {
      console.error(err);
      setError(
        formatApiError(err.response?.data?.detail) || err.message
      );
      setList([]);
    }
  };

  useEffect(() => {
    load(year);
  }, [year]);

  const submit = async (e) => {
    e.preventDefault();

    setBusy(true);
    setError('');

    try {
      await api.post('/income', {
        month: Number(form.month),
        year: Number(form.year),
        income: Number(form.income || 0),
        tax_paid: Number(form.tax_paid || 0),
        note: form.note.trim() || null,
      });

      setForm({
        ...form,
        income: '',
        tax_paid: '',
        note: '',
      });

      await load(year);
    } catch (err) {
      console.error(err);

      setError(
        formatApiError(err.response?.data?.detail) || err.message
      );
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (id) => {
    if (!window.confirm('Delete this income record?')) {
      return;
    }

    try {
      await api.delete(`/income/${id}`);
      await load(year);
    } catch (err) {
      console.error(err);

      setError(
        formatApiError(err.response?.data?.detail) || err.message
      );
    }
  };

  const safeList = Array.isArray(list) ? list : [];

  const totalIncome = safeList.reduce(
    (sum, item) => sum + Number(item.income || 0),
    0
  );

  const totalPaye = safeList.reduce(
    (sum, item) => sum + Number(item.tax_paid || 0),
    0
  );

  return (
    <div className="space-y-8" data-testid="income-page">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="label-tag">
            Module 1 · Income & PAYE
          </div>

          <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter mt-2">
            Monthly income
          </h1>

          <p className="text-charcoal-muted mt-2 max-w-2xl">
            Log each month's gross income and PAYE tax already
            deducted by your employer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="label-tag">Tax year</label>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            data-testid="income-year-select"
            className="border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:border-moss"
          >
            {[year + 1, year, year - 1, year - 2].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="border border-line bg-surface p-6 grid grid-cols-2 md:grid-cols-6 gap-4 items-end"
      >
        <div>
          <label className="label-tag block mb-2">
            Month
          </label>

          <select
            value={form.month}
            onChange={(e) =>
              setForm({
                ...form,
                month: e.target.value,
              })
            }
            className="w-full border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:border-moss"
          >
            {MONTH_NAMES.map((month, index) => (
              <option
                key={month}
                value={index + 1}
              >
                {month}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-tag block mb-2">
            Year
          </label>

          <input
            type="number"
            value={form.year}
            onChange={(e) =>
              setForm({
                ...form,
                year: e.target.value,
              })
            }
            className="w-full border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:border-moss"
          />
        </div>

        <div>
          <label className="label-tag block mb-2">
            Income (ZAR)
          </label>

          <input
            type="number"
            step="0.01"
            required
            value={form.income}
            onChange={(e) =>
              setForm({
                ...form,
                income: e.target.value,
              })
            }
            className="w-full border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:border-moss"
            placeholder="45000"
          />
        </div>

        <div>
          <label className="label-tag block mb-2">
            PAYE (ZAR)
          </label>

          <input
            type="number"
            step="0.01"
            required
            value={form.tax_paid}
            onChange={(e) =>
              setForm({
                ...form,
                tax_paid: e.target.value,
              })
            }
            className="w-full border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:border-moss"
            placeholder="7500"
          />
        </div>

        <div className="col-span-2">
          <label className="label-tag block mb-2">
            Note
          </label>

          <input
            value={form.note}
            onChange={(e) =>
              setForm({
                ...form,
                note: e.target.value,
              })
            }
            className="w-full border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:border-moss"
            placeholder="Employer / bonus / freelance"
          />
        </div>

        {error && (
          <div className="col-span-full border border-red-300 bg-red-50 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <div className="col-span-full md:col-span-1 md:col-start-6">
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-moss text-page py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {busy ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>

      <div className="border border-line bg-surface">
        <div className="grid grid-cols-2 md:grid-cols-5 border-b border-line bg-surfaceAlt font-heading font-bold">
          <Th>Month</Th>
          <Th align="right">Income</Th>
          <Th align="right" className="hidden md:block">
            PAYE
          </Th>
          <Th className="hidden md:block">
            Note
          </Th>
          <Th align="right"> </Th>
        </div>

        {safeList.length === 0 ? (
          <div className="p-10 text-center text-charcoal-muted text-sm">
            No income recorded for {year}.
          </div>
        ) : (
          safeList.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-2 md:grid-cols-5 border-b border-line/70"
            >
              <Td>
                <span className="font-semibold">
                  {MONTH_NAMES[r.month - 1]}
                </span>{' '}
                <span className="text-charcoal-muted text-xs">
                  {r.year}
                </span>
              </Td>

              <Td align="right">
                {ZAR(r.income)}
              </Td>

              <Td
                align="right"
                className="hidden md:block"
              >
                {ZAR(r.tax_paid)}
              </Td>

              <Td className="hidden md:block">
                {r.note || '—'}
              </Td>

              <Td align="right">
                <button
                  onClick={() => removeItem(r.id)}
                  className="inline-flex items-center gap-1 text-terra text-xs"
                >
                  <Trash2 size={14} />
                </button>
              </Td>
            </div>
          ))
        )}

        {safeList.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 bg-surfaceAlt font-heading font-bold">
            <Td>{safeList.length} months</Td>

            <Td align="right">
              {ZAR(totalIncome)}
            </Td>

            <Td
              align="right"
              className="hidden md:block"
            >
              {ZAR(totalPaye)}
            </Td>

            <Td className="hidden md:block" />

            <Td />
          </div>
        )}
      </div>
    </div>
  );
}

const Th = ({
  children,
  align = 'left',
  className = '',
}) => (
  <div
    className={`label-tag px-4 py-3 ${
      align === 'right' ? 'text-right' : ''
    } ${className}`}
  >
    {children}
  </div>
);

const Td = ({
  children,
  align = 'left',
  className = '',
}) => (
  <div
    className={`px-4 py-3 text-sm ${
      align === 'right'
        ? 'text-right tabular-nums'
        : ''
    } ${className}`}
  >
    {children}
  </div>
);