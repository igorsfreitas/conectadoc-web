import { useEffect, useRef, useState } from "react";

interface Props {
  onConfirmar: (code: string) => void;
  loading: boolean;
  expiresAt: string | null;
  onReenviar: () => void;
}

export function ConectadocTokenForm({ onConfirmar, loading, expiresAt, onReenviar }: Props) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) { setRemaining(null); return; }
    function tick() {
      const diff = Math.max(0, Math.floor((new Date(expiresAt!).getTime() - Date.now()) / 1000));
      setRemaining(diff);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  function formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  function handleChange(i: number, v: string) {
    const d = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    text.split('').forEach((c, i) => { next[i] = c; });
    setDigits(next);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
  }

  const code = digits.join('');
  const complete = code.length === 6;
  const expired = remaining !== null && remaining <= 0;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            style={{
              width: 44, height: 52, textAlign: 'center', fontSize: 22, fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace',
              border: `2px solid ${d ? 'var(--brand-600, #2563eb)' : 'var(--border, #d1d5db)'}`,
              borderRadius: 8, outline: 'none', color: 'var(--text, #111)',
              background: d ? 'oklch(0.96 0.04 250)' : '#fff',
              transition: 'border-color .1s, background .1s',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--brand-600, #2563eb)')}
          />
        ))}
      </div>

      {remaining !== null && (
        <p style={{ textAlign: 'center', fontSize: 12.5, marginBottom: 16, color: remaining < 120 ? '#dc2626' : 'var(--text-3, #6b7280)' }}>
          {expired ? '⚠ Código expirado' : `Expira em ${formatTime(remaining)}`}
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary"
        style={{ width: '100%', height: 42, fontSize: 14, marginBottom: 12 }}
        disabled={!complete || loading || expired}
        onClick={() => onConfirmar(code)}
      >
        {loading ? 'Verificando…' : '✓ Confirmar assinatura'}
      </button>

      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={onReenviar}
          disabled={loading}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--brand-600, #2563eb)', textDecoration: 'underline' }}
        >
          Reenviar código
        </button>
      </div>
    </div>
  );
}
