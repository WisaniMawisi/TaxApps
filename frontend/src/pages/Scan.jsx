import { useEffect, useRef, useState } from 'react';
import api, { formatApiError } from '@/lib/api';
import { ZAR, CATEGORIES } from '@/lib/format';
import { Camera, Upload, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';

export default function Scan() {
  const fileInput = useRef(null);
  const cameraInput = useRef(null);

  const [preview, setPreview] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | uploading | scanning | done | error
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
      setError(formatApiError(err.response?.data?.detail) || err.message);
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
      setError(formatApiError(err.response?.data?.detail) || err.message);
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
    <div className="space-y-8" data-testid="scan-page">
      <div>
        <div className="label-tag">Module 4 · OCR Scanner</div>
        <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter mt-2">Scan a receipt</h1>
        <p className="text-charcoal-muted mt-2 max-w-2xl">Snap a photo or upload an image. GPT-4o vision extracts amount, date, vendor, and category — then auto-creates the expense. Original image is preserved for audit.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-0 border border-line bg-surface">
        {/* Left: capture / preview */}
        <div className="p-6 md:p-8 border-r border-line">
          <div className="label-tag mb-3">Step 1 · Capture</div>

          {!preview && (
            <div className="border-2 border-dashed border-line p-8 flex flex-col items-center justify-center text-center min-h-[280px]" data-testid="scan-dropzone">
              <img src="https://images.pexels.com/photos/13431686/pexels-photo-13431686.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                alt="" className="w-24 h-24 object-cover rounded grayscale opacity-80 mb-4" />
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
                className="hidden" onChange={(e) => onFile(e.target.files?.[0])} data-testid="scan-camera-input"/>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp"
                className="hidden" onChange={(e) => onFile(e.target.files?.[0])} data-testid="scan-file-input"/>
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
              <Field label="Vendor"><input value={edited.vendor} onChange={(e) => setEdited({ ...edited, vendor: e.target.value })} data-testid="scan-vendor-input" className="w-full border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:border-moss"/></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount (ZAR)"><input type="number" step="0.01" value={edited.amount} onChange={(e) => setEdited({ ...edited, amount: e.target.value })} data-testid="scan-amount-input" className="w-full border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:border-moss"/></Field>
                <Field label="Date"><input type="date" value={edited.date} onChange={(e) => setEdited({ ...edited, date: e.target.value })} data-testid="scan-date-input" className="w-full border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:border-moss"/></Field>
              </div>
              <Field label="Category">
                <select value={edited.category} onChange={(e) => setEdited({ ...edited, category: e.target.value })} data-testid="scan-category-input"
                  className="w-full border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:border-moss">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Notes"><input value={edited.notes || ''} onChange={(e) => setEdited({ ...edited, notes: e.target.value })} data-testid="scan-notes-input" className="w-full border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:border-moss"/></Field>

              <div className="flex items-center gap-2 pt-2">
                {phase !== 'saved' && (
                  <button onClick={saveEdits} disabled={saving} data-testid="scan-save-btn"
                    className="bg-moss text-page px-4 py-2 text-sm font-semibold hover:bg-moss-hover transition-colors disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save expense'}
                  </button>
                )}
                {phase === 'saved' && <div className="text-moss text-sm font-semibold flex items-center gap-1" data-testid="scan-saved-banner"><CheckCircle2 size={14}/> Saved · {ZAR(edited.amount)}</div>}
                <button onClick={reset} data-testid="scan-new-btn"
                  className="border border-line px-4 py-2 text-sm font-semibold hover:bg-surfaceAlt transition-colors">Scan another</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
