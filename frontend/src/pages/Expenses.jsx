import { useEffect, useState } from 'react';
import api, { formatApiError } from '@/lib/api';
import { ZAR, CATEGORIES, MONTH_NAMES } from '@/lib/format';
import { Pencil, Trash2, Plus, X } from 'lucide-react';

export default function Expenses() {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState({ category: '', year: new Date().getFullYear(), month: '' });
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(defaultForm());
  const [error, setError] = useState('');

  function defaultForm() {
    const today = new Date().toISOString().slice(0, 10);
    return { amount: '', date: today, vendor: '', category: 'Other', notes: '' };
  }

  const load = async () => {
  try {
    const params = new URLSearchParams();

    if (filter.year) params.set('year', String(filter.year));
    if (filter.month) params.set('month', String(filter.month));
    if (filter.category) params.set('category', filter.category);

    const { data } = await api.get(`/expenses?${params.toString()}`);

    setList(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    setError(formatApiError(err?.response?.data?.detail) || err.message);
    setList([]);
  }
};

  useEffect(() => {
  load();
}, [filter.year, filter.month, filter.category]);

  const openAdd = () => { setForm(defaultForm()); setAdding(true); setEditing(null); setError(''); };
  const openEdit = (item) => {
    setForm({ amount: item.amount, date: item.date, vendor: item.vendor, category: item.category, notes: item.notes || '' });
    setEditing(item.id); setAdding(false); setError('');
  };
  const close = () => { setEditing(null); setAdding(false); setError(''); };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      amount: Number(form.amount || 0),
      date: form.date,
      vendor: form.vendor,
      category: form.category,
      notes: form.notes || null,
    };
    try {
      if (editing) {
        await api.patch(`/expenses/${editing}`, payload);
      } else {
        await api.post('/expenses', payload);
      }
      close();
      load();
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    }
  };

  const remove = async (id) => {
  if (!window.confirm('Delete this expense?')) return;

  try {
    await api.delete(`/expenses/${id}`);
    await load();
  } catch (err) {
    setError(formatApiError(err?.response?.data?.detail) || err.message);
  }
};

  const total = list.reduce((s, x) => s + x.amount, 0);

  return (
    <div className="space-y-8" data-testid="expenses-page">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="label-tag">Module 2 · Expenses</div>
          <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter mt-2">Expenses</h1>
          <p className="text-charcoal-muted mt-2 max-w-2xl">Filter by month, year or category. Medical & Business are treated as deductible for the SARS calculation.</p>
        </div>
        <button onClick={openAdd} data-testid="expense-add-btn"
          className="inline-flex items-center gap-2 bg-moss text-page px-4 py-2.5 text-sm font-semibold hover:bg-moss-hover transition-colors">
          <Plus size={16} /> Add expense
        </button>
      </div>

      {/* Filters */}
      <div className="border border-line bg-surface p-4 flex flex-wrap gap-3" data-testid="expense-filters">
        <Select label="Year" value={filter.year} onChange={(v) => setFilter({ ...filter, year: Number(v) })} options={[2024, 2025, 2026].map(y => ({ value: y, label: y }))} testid="filter-year"/>
        <Select label="Month" value={filter.month} onChange={(v) => setFilter({ ...filter, month: v })} options={[{ value: '', label: 'All' }, ...MONTH_NAMES.map((m, i) => ({ value: i + 1, label: m }))]} testid="filter-month"/>
        <Select label="Category" value={filter.category} onChange={(v) => setFilter({ ...filter, category: v })} options={[{ value: '', label: 'All' }, ...CATEGORIES.map(c => ({ value: c, label: c }))]} testid="filter-category"/>
      </div>

      {/* List */}
      <div className="border border-line bg-surface" data-testid="expense-list">
        <div className="grid grid-cols-6 border-b border-line bg-surfaceAlt font-medium text-sm" data-testid="expense-list-header">
          <Th>Date</Th>
          <Th className="col-span-2">Vendor</Th>
          <Th>Category</Th>
          <Th>Source</Th>
          <Th align="right">Amount</Th>
        </div>
        {list.length === 0 ? (
          <div className="p-10 text-center text-charcoal-muted text-sm">No expenses match these filters.</div>
        ) : (
          list.map((x) => (
            <div key={x.id} className="grid grid-cols-6 border-b border-line/70 hover:bg-surfaceAlt/40 transition-colors items-center" data-testid={`expense-row-${x.id}`}>
              <Td>{x.date}</Td>
              <Td className="col-span-2 truncate">
                <div className="font-medium truncate">{x.vendor}</div>
                {x.notes && <div className="text-xs text-charcoal-muted truncate">{x.notes}</div>}
              </Td>
              <Td><CategoryPill cat={x.category} /></Td>
              <Td>
                <span className={`text-xs font-semibold px-2 py-0.5 ${x.source === 'OCR' ? 'bg-moss/10 text-moss border border-moss/20' : 'bg-surfaceAlt text-charcoal-muted border border-line'}`}>{x.source}</span>
              </Td>
              <Td align="right" className="flex items-center justify-end gap-3">
                <span className="font-heading font-bold tabular-nums">{ZAR(x.amount)}</span>
                <button onClick={() => openEdit(x)} data-testid={`expense-edit-${x.id}`} className="text-charcoal-muted hover:text-moss"><Pencil size={14}/></button>
                <button onClick={() => remove(x.id)} data-testid={`expense-delete-${x.id}`} className="text-terra hover:text-terra-hover"><Trash2 size={14}/></button>
              </Td>
            </div>
          ))
        )}
        {list.length > 0 && (
          <div className="grid grid-cols-6 bg-surfaceAlt font-heading font-bold" data-testid="expense-total">
            <Td className="col-span-5">{list.length} expenses</Td>
            <Td align="right">{ZAR(total)}</Td>
          </div>
        )}
      </div>

      {/* Modal */}
      {(adding || editing) && (
        <div className="fixed inset-0 bg-charcoal/40 flex items-center justify-center p-4 z-50" data-testid="expense-modal">
          <form onSubmit={save} className="bg-surface w-full max-w-md border border-line p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-2xl">{editing ? 'Edit expense' : 'Add expense'}</h3>
              <button type="button" onClick={close} data-testid="expense-modal-close"><X size={18} /></button>
            </div>
            <Field label="Vendor"><input required value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} data-testid="expense-vendor-input" className="w-full border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:border-moss"/></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount"><input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} data-testid="expense-amount-input" className="w-full border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:border-moss"/></Field>
              <Field label="Date"><input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} data-testid="expense-date-input" className="w-full border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:border-moss"/></Field>
            </div>
            <Field label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} data-testid="expense-category-input"
                className="w-full border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:border-moss">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Notes"><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} data-testid="expense-notes-input" className="w-full border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:border-moss"/></Field>
            {error && <div className="border border-terra/40 bg-terra/10 text-terra text-sm px-3 py-2">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={close} className="border border-line px-4 py-2 text-sm hover:bg-surfaceAlt">Cancel</button>
              <button type="submit" data-testid="expense-save-btn" className="bg-moss text-page px-4 py-2 text-sm font-semibold hover:bg-moss-hover">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const Th = ({ children, align = 'left', className = '' }) => (
  <div className={`label-tag px-4 py-3 ${align === 'right' ? 'text-right' : ''} ${className}`}>{children}</div>
);
const Td = ({ children, align = 'left', className = '' }) => (
  <div className={`px-4 py-3 text-sm ${align === 'right' ? 'text-right tabular-nums' : ''} ${className}`}>{children}</div>
);
const Field = ({ label, children }) => (
  <div>
    <label className="label-tag block mb-2">{label}</label>
    {children}
  </div>
);
const Select = ({ label, value, onChange, options, testid }) => (
  <div>
    <label className="label-tag block mb-1">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid}
      className="border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:border-moss">
      {options.map((o) => <option key={String(o.value)} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);
const CategoryPill = ({ cat }) => {
  const color = {
    Transport: 'text-info border-info/30 bg-info/10',
    Medical: 'text-moss border-moss/30 bg-moss/10',
    Education: 'text-charcoal border-line bg-surfaceAlt',
    Business: 'text-terra border-terra/30 bg-terra/10',
    Other: 'text-charcoal-muted border-line bg-surfaceAlt',
  }[cat] || 'text-charcoal-muted border-line bg-surfaceAlt';
  return <span className={`text-xs font-semibold px-2 py-0.5 border ${color}`}>{cat}</span>;
};
