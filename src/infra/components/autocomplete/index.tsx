import { useEffect, useRef, useState } from 'react';

export interface AutocompleteOption {
  value: number;
  label: string;
}

interface Props {
  value: number | null;
  onChange: (val: number | null, label: string) => void;
  fetchOptions: (q: string) => Promise<AutocompleteOption[]>;
  placeholder?: string;
  disabled?: boolean;
  initialLabel?: string;
}

export function Autocomplete({ value, onChange, fetchOptions, placeholder = 'Digite para buscar…', disabled, initialLabel = '' }: Props) {
  const [inputVal, setInputVal] = useState(initialLabel);
  const [options, setOptions]   = useState<AutocompleteOption[]>([]);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const timerRef  = useRef<ReturnType<typeof setTimeout>>();
  const wrapRef   = useRef<HTMLDivElement>(null);

  // Sync when initialLabel changes (edit mode load)
  useEffect(() => { setInputVal(initialLabel); }, [initialLabel]);

  function handleInput(q: string) {
    setInputVal(q);
    if (!q) { onChange(null, ''); setOptions([]); setOpen(false); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetchOptions(q);
        setOptions(res);
        setOpen(true);
      } finally { setLoading(false); }
    }, 2000);
  }

  function select(opt: AutocompleteOption) {
    setInputVal(opt.label);
    onChange(opt.value, opt.label);
    setOpen(false);
  }

  function handleBlur(e: React.FocusEvent) {
    // fechar só se o foco saiu do componente inteiro
    if (!wrapRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false);
      // Se o campo não corresponde a nenhuma opção, limpar
      if (value === null) setInputVal('');
    }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }} onBlur={handleBlur}>
      <input
        className="input"
        value={inputVal}
        onChange={e => handleInput(e.target.value)}
        onFocus={() => { if (options.length && inputVal) setOpen(true); }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {loading && (
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-3)' }}>…</span>
      )}
      {open && options.length > 0 && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
          margin: '2px 0 0', padding: '4px 0', listStyle: 'none',
          maxHeight: 220, overflowY: 'auto',
        }}>
          {options.map(opt => (
            <li
              key={opt.value}
              tabIndex={0}
              onMouseDown={() => select(opt)}
              onKeyDown={e => e.key === 'Enter' && select(opt)}
              style={{
                padding: '7px 12px', cursor: 'pointer', fontSize: 13.5,
                background: opt.value === value ? 'var(--surface-2)' : 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = opt.value === value ? 'var(--surface-2)' : 'transparent')}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
      {open && options.length === 0 && !loading && inputVal && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '10px 12px', fontSize: 13,
          color: 'var(--text-3)', boxShadow: 'var(--shadow-lg)',
        }}>
          Nenhum resultado encontrado.
        </div>
      )}
    </div>
  );
}
