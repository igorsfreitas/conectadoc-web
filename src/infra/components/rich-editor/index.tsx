/**
 * RichEditor — WYSIWYG editor baseado em contenteditable + execCommand.
 * Sem dependências externas. API compatível com valor HTML (string).
 *
 * Props:
 *   value          — HTML inicial (carregado apenas uma vez via defaultValue, não controlado)
 *   onChange       — chamado a cada input com o HTML atualizado
 *   onEditorReady  — recebe { insertText } para inserir texto/HTML na posição do cursor
 *   minHeight      — altura mínima da área editável (default: 280px)
 *   placeholder    — texto exibido quando vazio
 */

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react';

export interface RichEditorHandle {
  insertHtml(html: string): void;
  insertText(text: string): void;
  getHtml(): string;
}

interface Props {
  value?: string;
  onChange?: (html: string) => void;
  minHeight?: number;
  placeholder?: string;
  readOnly?: boolean;
}

// ── Toolbar button ────────────────────────────────────────────────────────
interface TBtnProps {
  title: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  danger?: boolean;
}
function TBtn({ title, onClick, active, children }: TBtnProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26, border: '1px solid transparent',
        borderRadius: 4, background: active ? 'var(--surface-2)' : 'none',
        borderColor: active ? 'var(--border)' : 'transparent',
        cursor: 'pointer', fontSize: 12, color: 'var(--text-2)',
        padding: 0, lineHeight: 1,
        transition: 'background .1s, border-color .1s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; } }}
    >
      {children}
    </button>
  );
}

function Div() {
  return <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />;
}

function TSelect({ title, options, onSelect }: {
  title: string;
  options: { label: string; value: string }[];
  onSelect: (v: string) => void;
}) {
  return (
    <select
      title={title}
      style={{ height: 26, fontSize: 12, border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface)', color: 'var(--text-2)', padding: '0 4px', cursor: 'pointer' }}
      defaultValue=""
      onChange={e => { onSelect(e.target.value); e.target.value = ''; }}
    >
      <option value="" disabled>{title}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── SVG icons ─────────────────────────────────────────────────────────────
const B  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>;
const I  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z"/></svg>;
const U  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>;
const S  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/></svg>;
const OL = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>;
const UL = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>;
const AL = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>;
const AC = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/></svg>;
const AR = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/></svg>;
const AJ = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"/></svg>;
const UN = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>;
const RD = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>;
const HR = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const LK = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const SRC = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
const IMG = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;

// ── RichEditor ─────────────────────────────────────────────────────────────
export const RichEditor = forwardRef<RichEditorHandle, Props>(function RichEditor(
  { value = '', onChange, minHeight = 280, placeholder = 'Digite aqui...', readOnly = false },
  ref,
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showingSource = useRef(false);
  const savedRange = useRef<Range | null>(null);
  const [uploading, setUploading] = useState(false);

  // Initialize content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    insertHtml(html: string) {
      restoreSelection();
      editorRef.current?.focus();
      document.execCommand('insertHTML', false, html);
      emitChange();
    },
    insertText(text: string) {
      restoreSelection();
      editorRef.current?.focus();
      document.execCommand('insertText', false, text);
      emitChange();
    },
    getHtml() {
      return editorRef.current?.innerHTML ?? '';
    },
  }));

  const emitChange = useCallback(() => {
    onChange?.(editorRef.current?.innerHTML ?? '');
  }, [onChange]);

  function exec(cmd: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    emitChange();
  }

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0);
    }
  }

  function restoreSelection() {
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  }

  function toggleSource() {
    if (!showingSource.current) {
      // Switch to source
      if (sourceRef.current && editorRef.current) {
        sourceRef.current.value = editorRef.current.innerHTML;
        editorRef.current.style.display = 'none';
        sourceRef.current.style.display = 'block';
        showingSource.current = true;
      }
    } else {
      // Switch back to visual
      if (sourceRef.current && editorRef.current) {
        editorRef.current.innerHTML = sourceRef.current.value;
        sourceRef.current.style.display = 'none';
        editorRef.current.style.display = 'block';
        showingSource.current = false;
        emitChange();
      }
    }
  }

  function insertLink() {
    const url = prompt('URL do link:');
    if (url) exec('createLink', url);
  }

  async function handleImageUpload(file: File) {
    saveSelection();
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/v1/storage/upload-editor-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert((err as { message?: string }).message ?? 'Erro ao fazer upload da imagem.');
        return;
      }
      const { url } = await res.json() as { key: string; url: string };
      restoreSelection();
      editorRef.current?.focus();
      document.execCommand('insertHTML', false, `<img src="${url}" alt="" style="max-width:100%;height:auto;border-radius:4px;" />`);
      emitChange();
    } catch {
      alert('Erro ao enviar a imagem. Verifique sua conexão.');
    } finally {
      setUploading(false);
    }
  }

  const formatOptions = [
    { label: 'Normal',    value: '<p>' },
    { label: 'Título 1',  value: 'h1' },
    { label: 'Título 2',  value: 'h2' },
    { label: 'Título 3',  value: 'h3' },
    { label: 'Título 4',  value: 'h4' },
    { label: 'Pré-formatado', value: 'pre' },
  ];

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--surface)' }}>
      {/* Toolbar */}
      {!readOnly && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 2, padding: '6px 8px',
          borderBottom: '1px solid var(--border)', background: 'var(--bg)',
          alignItems: 'center',
        }}>
          <TBtn title="Código-Fonte HTML" onClick={toggleSource}><SRC /></TBtn>
          <Div />
          <TBtn title="Desfazer (Ctrl+Z)" onClick={() => exec('undo')}><UN /></TBtn>
          <TBtn title="Refazer (Ctrl+Y)" onClick={() => exec('redo')}><RD /></TBtn>
          <Div />
          <TSelect
            title="Formato"
            options={formatOptions}
            onSelect={v => exec('formatBlock', v)}
          />
          <Div />
          <TBtn title="Negrito (Ctrl+B)"     onClick={() => exec('bold')}><B /></TBtn>
          <TBtn title="Itálico (Ctrl+I)"     onClick={() => exec('italic')}><I /></TBtn>
          <TBtn title="Sublinhado (Ctrl+U)"  onClick={() => exec('underline')}><U /></TBtn>
          <TBtn title="Tachado"              onClick={() => exec('strikeThrough')}><S /></TBtn>
          <Div />
          <TBtn title="Lista numerada"       onClick={() => exec('insertOrderedList')}><OL /></TBtn>
          <TBtn title="Lista com marcadores" onClick={() => exec('insertUnorderedList')}><UL /></TBtn>
          <Div />
          <TBtn title="Alinhar à esquerda"   onClick={() => exec('justifyLeft')}><AL /></TBtn>
          <TBtn title="Centralizar"          onClick={() => exec('justifyCenter')}><AC /></TBtn>
          <TBtn title="Alinhar à direita"    onClick={() => exec('justifyRight')}><AR /></TBtn>
          <TBtn title="Justificar"           onClick={() => exec('justifyFull')}><AJ /></TBtn>
          <Div />
          <TBtn title="Inserir link"         onClick={insertLink}><LK /></TBtn>
          <TBtn title="Linha horizontal"     onClick={() => exec('insertHorizontalRule')}><HR /></TBtn>
          <Div />
          <TBtn
            title={uploading ? 'Enviando imagem…' : 'Inserir imagem'}
            onClick={() => { if (!uploading) fileInputRef.current?.click(); }}
          >
            {uploading
              ? <span style={{ fontSize: 10, color: 'var(--text-3)' }}>…</span>
              : <IMG />}
          </TBtn>
        </div>
      )}

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/avif"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) void handleImageUpload(file);
          e.target.value = '';
        }}
      />

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={saveSelection}
        style={{
          minHeight,
          padding: '14px 16px',
          outline: 'none',
          fontSize: 13.5,
          lineHeight: 1.7,
          color: 'var(--text)',
          background: '#fff',
          overflowY: 'auto',
        }}
        data-placeholder={placeholder}
      />

      {/* Source textarea (hidden by default) */}
      <textarea
        ref={sourceRef}
        onChange={emitChange}
        style={{
          display: 'none',
          width: '100%',
          minHeight,
          padding: '14px 16px',
          fontSize: 12.5,
          fontFamily: 'JetBrains Mono, monospace',
          lineHeight: 1.6,
          border: 'none',
          outline: 'none',
          background: '#1e1e2e',
          color: '#cdd6f4',
          boxSizing: 'border-box',
          resize: 'none',
        }}
      />

      <style>{`
        [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: var(--text-3);
          pointer-events: none;
        }
        [contenteditable] h1 { font-size: 1.6em; font-weight: 700; margin: .5em 0; }
        [contenteditable] h2 { font-size: 1.35em; font-weight: 700; margin: .5em 0; }
        [contenteditable] h3 { font-size: 1.15em; font-weight: 600; margin: .5em 0; }
        [contenteditable] h4 { font-size: 1em; font-weight: 600; margin: .5em 0; }
        [contenteditable] ul { padding-left: 22px; margin: .4em 0; list-style: disc; }
        [contenteditable] ol { padding-left: 22px; margin: .4em 0; list-style: decimal; }
        [contenteditable] li { margin: .2em 0; }
        [contenteditable] blockquote { border-left: 3px solid var(--border); margin: .5em 0; padding-left: 14px; color: var(--text-2); }
        [contenteditable] a { color: var(--primary); text-decoration: underline; }
        [contenteditable] hr { border: none; border-top: 1px solid var(--border); margin: 1em 0; }
        [contenteditable] p { margin: .3em 0; }
        [contenteditable] table { border-collapse: collapse; width: 100%; margin: .5em 0; }
        [contenteditable] td, [contenteditable] th { border: 1px solid var(--border); padding: 6px 10px; }
        [contenteditable] pre { background: var(--surface-2); padding: 10px 14px; border-radius: 6px; font-family: monospace; font-size: 12.5px; }
        [contenteditable] img { max-width: 100%; height: auto; border-radius: 4px; display: inline-block; }
      `}</style>
    </div>
  );
});
