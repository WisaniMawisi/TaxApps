import { useRef, useState } from 'react';
import api, { formatApiError } from '@/lib/api';
import { ZAR, CATEGORIES } from '@/lib/format';
import { Camera, Upload, CheckCircle2, AlertTriangle, RotateCcw, PenLine, ScanLine } from 'lucide-react';

const TABS = [
  { id: 'scan', label: 'Scan receipt', icon: ScanLine },
  { id: 'manual', label: 'Enter manually', icon: PenLine },
];

const EMPTY_MANUAL = {
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  vendor: '',
  category: 'Other',
  notes: '',
};

export default function Scan() {
  const [tab, setTab] = useState('scan');

  return (
    <div className="space-y-8" data-testid="scan-page">
      <div>
        <div className="label-tag">Module 4 · OCR Scanner</div>
        <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter mt-2">Add an expense</h1>
        <p className="text-charcoal-muted mt-2 max-w-2xl">
          Snap a receipt to auto-extract details with AI, or enter the expense manually.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-line">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            data-testid={`tab-${id}`}
            className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px
              ${tab === id
                ? 'border-moss text-moss'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'}`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'scan' ? <ScanTab /> : <ManualTab />}
    </div>
  );
}

/* ─── SCAN TAB ─────────────────────────────────────────────────────────────── */
function ScanTab() {
  const fileInput = useRef(null);
  const cameraInput = useRef(null);

  const [preview, setPreview] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [edited, setEdited] = useState(null);
  const [saving, setSaving] = useState(false);

  const onFile = async (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a JPEG, PNG or WEBP image.');
      setPhase('error');
      return;
    }
    setError('');
    setPreview(URL.createObjectURL(file));
    setPhase('uploading');
    setResult(null);
    setEdited(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      setPhase('scanning');
      const { data } = await api.post('/slips/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      if (data.ocr_result) {
        setEdited({ ...data.ocr_result });
        setPhase('done');
      } else {
        setError(data.ocr_error || 'OCR could not read this receipt. You can still add it manually.');
        setPhase('error');
      }
    } catch (err) {
      setError(formatApiError(err?.data?.detail) || err?.message || 'Upload failed.');
      setPhase('error');
    }
  };

  const saveEdits = async () => {
    if (!result?.expense_id || !edited) return;
    setSaving(true);
    try {
      await api.patch(`/expenses/${result.expense_id}`, {
        amount: Number(edited.amount || 0),
        date: edited.date,
        vendor: edited.vendor,
        category: edited.category,
        notes: edited.notes || null,
      });
      setPhase('saved');
    } catch (err) {
      setError(formatApiError(err?.data?.detail) || err?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setEdited(null);
    setError('');
    setPhase('idle');
  };

  return (
    <div className="grid lg:grid-cols-2 gap-0 border border-line bg-surface">
      {/* Left: capture / preview */}
      <div className="p-6 md:p-8 border-r border-line">
        <div className="label-tag mb-3">Step 1 · Capture</div>

        {!preview && (
          <div className="border-2 border-dashed border-line p-8 flex flex-col items-center justify-center text-center min-h-[280px]" data-testid="scan-dropzone">
            <img
              src="https://images.pexels.com/photos/13431686/pexels-photo-13431686.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
              alt="" className="w-24 h-24 object-cover rounded grayscale opacity-80 mb-4"
            />
            <p className="text-charcoal-muted text-sm max-w-xs">
              Use your phone camera for the best results, or upload a clear photo or scan of your slip.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              <button onClick={() => cameraInput.current?.click()} data-testid="scan-camera-btn"
                className="inline-flex items-center gap-2 bg-moss text-page px-4 py-2.5 text-sm font-semibold hover:bg-moss-hover transition-colors">
                <Camera size={16} /> Open camera
              </button>
              <button onClick={() => fileInput.current?.click()} data-testid="scan-upload-btn"
                className="inline-flex items-center gap-2 border border-line px-4 py-2.5 text-sm font-semibold hover:bg-surfaceAlt transition-colors">
                <Upload size={16} /> Upload file
              </button>
            </div>
            <input ref={cameraInput} type="file" accept="image/jpeg,image/png,image/webp" capture="environment"
              className="hidden" onChange={(e) => onFile(e.target.files?.[0])} data-testid="scan-camera-input" />
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp"
              className="hidden" onChange={(e) => onFile(e.target.files?.[0])} data-testid="scan-file-input" />
          </div>
        )}

        {preview && (
          <div className="relative border border-line bg-charcoal/5 overflow-hidden" data-testid="scan-preview">
            <img src={preview} alt="Receipt" className="w-full max-h-[480px] object-contain" />
            {phase === 'scanning' && (
              <div className="absolute inset-0 flex items-center justify-center bg-charcoal/30">
                <div className="bg-page border border-line px-6 py-4 shadow-sm">
                  <div className="label-tag text-moss">Reading slip…</div>
                  <div className="mt-3 w-48 h-1 bg-line overflow-hidden">
                    <div className="h-full scan-pulse" />
                  </div>
                </div>
              </div>
            )}
            <button onClick={reset} data-testid="scan-reset-btn"
              className="absolute top-3 right-3 inline-flex items-center gap-1 bg-page border border-line px-3 py-1.5 text-xs font-semibold hover:bg-surfaceAlt">
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        )}
      </div>

      {/* Right: extracted data */}
      <div className="p-6 md:p-8">
        <div className="label-tag mb-3">Step 2 · Verify & save</div>

        {phase === 'idle' && (
          <p className="text-charcoal-muted text-sm">The OCR result will appear here. You can edit any field before saving.</p>
        )}
        {(phase === 'uploading' || phase === 'scanning') && (
          <div className="space-y-3" data-testid="scan-processing">
            <FieldSkeleton label="Vendor" />
            <FieldSkeleton label="Amount" />
            <FieldSkeleton label="Date" />
            <FieldSkeleton label="Category" />
          </div>
        )}

        {phase === 'error' && (
          <div className="border border-terra/40 bg-terra/10 text-terra text-sm px-3 py-3 flex items-start gap-2" data-testid="scan-error">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" /> <span>{error}</span>
          </div>
        )}

        {(phase === 'done' || phase === 'saved') && edited && (
          <div className="space-y-4" data-testid="scan-result">
            <div className="flex items-center gap-2 text-moss text-sm font-semibold">
              <CheckCircle2 size={16} /> Extracted with confidence {((result?.ocr_result?.confidence || 0) * 100).toFixed(0)}%
            </div>
            <Field label="Vendor">
              <input value={edited.vendor} onChange={(e) => setEdited({ ...edited, vendor: e.target.value })}
                data-testid="scan-vendor-input" className="field-input" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount (ZAR)">
                <input type="number" step="0.01" value={edited.amount} onChange={(e) => setEdited({ ...edited, amount: e.target.value })}
                  data-testid="scan-amount-input" className="field-input" />
              </Field>
              <Field label="Date">
                <input type="date" value={edited.date} onChange={(e) => setEdited({ ...edited, date: e.target.value })}
                  data-testid="scan-date-input" className="field-input" />
              </Field>
            </div>
            <Field label="Category">
              <select value={edited.category} onChange={(e) => setEdited({ ...edited, category: e.target.value })}
                data-testid="scan-category-input" className="field-input">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Notes">
              <input value={edited.notes || ''} onChange={(e) => setEdited({ ...edited, notes: e.target.value })}
                data-testid="scan-notes-input" className="field-input" />
            </Field>

            <div className="flex items-center gap-2 pt-2">
              {phase !== 'saved' && (
                <button onClick={saveEdits} disabled={saving} data-testid="scan-save-btn"
                  className="bg-moss text-page px-4 py-2 text-sm font-semibold hover:bg-moss-hover transition-colors disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save expense'}
                </button>
              )}
              {phase === 'saved' && (
                <div className="text-moss text-sm font-semibold flex items-center gap-1" data-testid="scan-saved-banner">
                  <CheckCircle2 size={14} /> Saved · {ZAR(edited.amount)}
                </div>
              )}
              <button onClick={reset} data-testid="scan-new-btn"
                className="border border-line px-4 py-2 text-sm font-semibold hover:bg-surfaceAlt transition-colors">
                Scan another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── MANUAL TAB ────────────────────────────────────────────────────────────── */
function ManualTab() {
  const [form, setForm] = useState(EMPTY_MANUAL);
  const [phase, setPhase] = useState('idle'); // idle | saving | saved | error
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(null);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPhase('saving');
    try {
      const { data } = await api.post('/expenses', {
        amount: Number(form.amount),
        date: form.date,
        vendor: form.vendor.trim(),
        category: form.category,
        notes: form.notes.trim() || null,
      });
      setSaved(data);
      setPhase('saved');
    } catch (err) {
      setError(formatApiError(err?.data?.detail) || err?.message || 'Could not save expense.');
      setPhase('error');
    }
  };

  const reset = () => {
    setForm(EMPTY_MANUAL);
    setPhase('idle');
    setError('');
    setSaved(null);
  };

  if (phase === 'saved' && saved) {
    return (
      <div className="border border-line bg-surface p-8 flex flex-col items-start gap-4" data-testid="manual-saved">
        <div className="flex items-center gap-2 text-moss font-semibold">
          <CheckCircle2 size={18} /> Expense saved
        </div>
        <div className="text-sm text-charcoal-muted space-y-1">
          <div><span className="label-tag mr-2">Vendor</span>{saved.vendor}</div>
          <div><span className="label-tag mr-2">Amount</span>{ZAR(saved.amount)}</div>
          <div><span className="label-tag mr-2">Date</span>{saved.date}</div>
          <div><span className="label-tag mr-2">Category</span>{saved.category}</div>
          {saved.notes && <div><span className="label-tag mr-2">Notes</span>{saved.notes}</div>}
        </div>
        <button onClick={reset} data-testid="manual-add-another-btn"
          className="inline-flex items-center gap-2 bg-moss text-page px-4 py-2 text-sm font-semibold hover:bg-moss-hover transition-colors">
          <PenLine size={14} /> Add another
        </button>
      </div>
    );
  }

  return (
    <div className="border border-line bg-surface" data-testid="manual-tab">
      <div className="p-6 md:p-8 max-w-lg">
        <div className="label-tag mb-5">Expense details</div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Vendor / merchant *">
            <input
              required value={form.vendor} onChange={update('vendor')}
              placeholder="e.g. Woolworths, Uber, Discovery"
              data-testid="manual-vendor-input"
              className="field-input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (ZAR) *">
              <input
                required type="number" step="0.01" min="0.01"
                value={form.amount} onChange={update('amount')}
                placeholder="0.00"
                data-testid="manual-amount-input"
                className="field-input"
              />
            </Field>
            <Field label="Date *">
              <input
                required type="date"
                value={form.date} onChange={update('date')}
                data-testid="manual-date-input"
                className="field-input"
              />
            </Field>
          </div>

          <Field label="Category">
            <select
              value={form.category} onChange={update('category')}
              data-testid="manual-category-input"
              className="field-input"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Notes">
            <input
              value={form.notes} onChange={update('notes')}
              placeholder="Optional — reference number, project, etc."
              data-testid="manual-notes-input"
              className="field-input"
            />
          </Field>

          {phase === 'error' && (
            <div className="border border-terra/40 bg-terra/10 text-terra text-sm px-3 py-2 flex items-start gap-2" data-testid="manual-error">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={phase === 'saving'}
              data-testid="manual-save-btn"
              className="bg-moss text-page px-5 py-2.5 text-sm font-semibold hover:bg-moss-hover transition-colors disabled:opacity-50"
            >
              {phase === 'saving' ? 'Saving…' : 'Save expense'}
            </button>
            <button
              type="button"
              onClick={reset}
              data-testid="manual-reset-btn"
              className="border border-line px-4 py-2.5 text-sm font-semibold hover:bg-surfaceAlt transition-colors"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── SHARED HELPERS ─────────────────────────────────────────────────────────── */
const Field = ({ label, children }) => (
  <div>
    <label className="label-tag block mb-2">{label}</label>
    {children}
  </div>
);

const FieldSkeleton = ({ label }) => (
  <div>
    <div className="label-tag mb-2">{label}</div>
    <div className="h-9 bg-surfaceAlt animate-pulse" />
  </div>
);
