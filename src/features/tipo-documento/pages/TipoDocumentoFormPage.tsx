import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { RichEditor, RichEditorHandle } from '../../../infra/components/rich-editor';
import { useInject } from '../../../infra/hooks/inject';
import { afinzAppPaths } from '../../../infra/router/paths/afinz_app';
import {
  AtributoTipoDocumento,
  AtributoTipoPayload,
  ATRIBUTO_TIPOS,
  TipoDocumento,
  TipoDocumentoPayload,
} from '../models/tipo-documento.model';

// ── Icons ──────────────────────────────────────────────────────────────────
function IconArrowLeft({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  );
}
function IconTrash({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}

// ── Tab bar ────────────────────────────────────────────────────────────────
type TabId = 'principal' | 'numeracao' | 'artefatos' | 'estados' | 'ajuda' | 'tela';

const TABS: { id: TabId; label: string }[] = [
  { id: 'principal',  label: 'Principal'          },
  { id: 'numeracao',  label: 'Numeração'           },
  { id: 'artefatos',  label: 'Artefatos'           },
  { id: 'estados',    label: 'Estados Específicos' },
  { id: 'ajuda',      label: 'Ajuda'               },
  { id: 'tela',       label: 'Tela Customizada'    },
];

function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 24, gap: 0 }}>
      {TABS.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: active === t.id ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: -2,
            cursor: 'pointer',
            fontSize: 13.5,
            fontWeight: active === t.id ? 600 : 400,
            color: active === t.id ? 'var(--primary)' : 'var(--text-2)',
            transition: 'all .15s',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Checkbox field ─────────────────────────────────────────────────────────
function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, cursor: 'pointer', userSelect: 'none', padding: '6px 0' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ width: 15, height: 15, accentColor: 'var(--primary)', flexShrink: 0 }}
      />
      {label}
    </label>
  );
}

// ── Sub-tabela de atributos ────────────────────────────────────────────────
interface AtributoRowForm {
  nome: string;
  label: string;
  ordem: string;
  tipo: string;
  aba: string;
  nulo: boolean;
  pesquisa: boolean;
}

function emptyAtributo(nextOrdem: number): AtributoRowForm {
  return { nome: '', label: '', ordem: String(nextOrdem), tipo: '1', aba: '', nulo: false, pesquisa: false };
}

function AtributosSection({
  codigoTipoDocumento,
  onListChange,
}: {
  codigoTipoDocumento: string;
  onListChange: (list: AtributoTipoDocumento[]) => void;
}) {
  const service = useInject('TipoDocumentoService');
  const [rows, setRows]           = useState<AtributoTipoDocumento[]>([]);
  const [editRow, setEditRow]     = useState<AtributoTipoDocumento | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [formData, setFormData]   = useState<AtributoRowForm>(emptyAtributo(1));
  const [saving, setSaving]       = useState(false);
  const [delConfirm, setDelConfirm] = useState<AtributoTipoDocumento | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await service.findAtributos(codigoTipoDocumento);
      setRows(list);
      onListChange(list);
    } catch { /* ignore */ }
  }, [service, codigoTipoDocumento, onListChange]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    const nextOrdem = rows.length > 0 ? Math.max(...rows.map(r => Number(r.ordem) || 0)) + 1 : 1;
    setFormData(emptyAtributo(nextOrdem));
    setEditRow(null);
    setShowForm(true);
  }

  function openEdit(row: AtributoTipoDocumento) {
    setFormData({
      nome:    row.nome    ?? '',
      label:   row.label   ?? '',
      ordem:   row.ordem   ?? '',
      tipo:    row.tipo != null ? String(row.tipo) : '1',
      aba:     row.aba     ?? '',
      nulo:    row.flagCadastraComNulo === 1,
      pesquisa: row.flagPesquisaPor   === 1,
    });
    setEditRow(row);
    setShowForm(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!formData.nome.trim()) return;
    setSaving(true);
    try {
      const payload: AtributoTipoPayload = {
        nome:   formData.nome.trim().toLowerCase().replace(/\s+/g, '_'),
        label:  formData.label  || formData.nome,
        ordem:  formData.ordem  ? Number(formData.ordem)  : undefined,
        tipo:   formData.tipo   ? Number(formData.tipo)   : undefined,
        aba:    formData.aba    || undefined,
        nulo:   formData.nulo,
        pesquisa: formData.pesquisa,
      };
      if (editRow) {
        await service.updateAtributo(codigoTipoDocumento, editRow.codigo, payload);
      } else {
        await service.createAtributo(codigoTipoDocumento, payload);
      }
      setShowForm(false);
      await load();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: AtributoTipoDocumento) {
    setSaving(true);
    try {
      await service.removeAtributo(codigoTipoDocumento, row.codigo);
      setDelConfirm(null);
      await load();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  }

  function setF<K extends keyof AtributoRowForm>(k: K, v: AtributoRowForm[K]) {
    setFormData(p => ({ ...p, [k]: v }));
  }

  return (
    <div style={{ marginTop: 28, borderTop: '2px solid var(--border)', paddingTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)' }}>
          Atributos do Tipo de Documento
        </p>
        <button type="button" className="btn btn-secondary btn-sm" onClick={openCreate}>
          + Novo Atributo
        </button>
      </div>

      {/* Mini form */}
      {showForm && (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 12 }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 70px', gap: 10 }}>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">Nome (variável) <span style={{ color: 'var(--danger-500)' }}>*</span></label>
                <input className="input" value={formData.nome} onChange={e => setF('nome', e.target.value)}
                  placeholder="ex: tratamento" required autoFocus />
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Usado como :<b>{formData.nome || 'variavel'}</b> na tela</span>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">Label</label>
                <input className="input" value={formData.label} onChange={e => setF('label', e.target.value)} placeholder="Rótulo de exibição" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">Ordem</label>
                <input className="input" type="number" min={1} value={formData.ordem} onChange={e => setF('ordem', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10 }}>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">Tipo</label>
                <select className="input" value={formData.tipo} onChange={e => setF('tipo', e.target.value)}>
                  {Object.entries(ATRIBUTO_TIPOS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">Aba</label>
                <input className="input" value={formData.aba} onChange={e => setF('aba', e.target.value)} placeholder="Opcional" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.nulo} onChange={e => setF('nulo', e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: 'var(--primary)' }} />
                Nulo
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.pesquisa} onChange={e => setF('pesquisa', e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: 'var(--primary)' }} />
                Pesquisa
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)} disabled={saving}>Cancelar</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Salvando…' : editRow ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabela */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <table className="data" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ width: 60, textAlign: 'center' }}>ORDEM</th>
              <th style={{ width: 130 }}>NOME</th>
              <th style={{ width: 150 }}>LABEL</th>
              <th style={{ width: 130 }}>TIPO</th>
              <th style={{ width: 80 }}>ABA</th>
              <th style={{ width: 50, textAlign: 'center' }}>NULO</th>
              <th style={{ width: 70, textAlign: 'center' }}>PESQUISA</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="empty-state" style={{ fontSize: 13 }}>Nenhum atributo configurado.</td></tr>
            ) : (
              rows.map(row => (
                <tr key={row.codigo}>
                  <td style={{ textAlign: 'center', color: 'var(--text-3)' }}>{row.ordem ?? '—'}</td>
                  <td><code style={{ fontSize: 12, background: 'var(--surface-2)', padding: '1px 6px', borderRadius: 4 }}>:{row.nome}</code></td>
                  <td style={{ fontWeight: 500 }}>{row.label ?? row.nome}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{ATRIBUTO_TIPOS[row.tipo ?? 0] ?? `tipo ${row.tipo}`}</td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12.5 }}>{row.aba ?? '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {row.flagCadastraComNulo === 1
                      ? <span style={{ color: 'var(--primary)', fontWeight: 700 }}>✓</span>
                      : <span style={{ color: 'var(--border)' }}>—</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {row.flagPesquisaPor === 1
                      ? <span style={{ color: 'var(--primary)', fontWeight: 700 }}>✓</span>
                      : <span style={{ color: 'var(--border)' }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: 12 }}
                        onClick={() => openEdit(row)}>Editar</button>
                      {delConfirm?.codigo === row.codigo ? (
                        <>
                          <button type="button" className="btn btn-danger btn-sm" style={{ padding: '2px 8px', fontSize: 12 }}
                            onClick={() => handleDelete(row)} disabled={saving}>Confirmar</button>
                          <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: 12 }}
                            onClick={() => setDelConfirm(null)}>✕</button>
                        </>
                      ) : (
                        <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: 12, color: 'var(--danger-500)' }}
                          onClick={() => setDelConfirm(row)}>Excluir</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Form state ─────────────────────────────────────────────────────────────
interface FormState {
  nome:                      string;
  sigla:                     string;
  tipoDocumentoBase:         string; // '1' | '2' | '3' | ''
  codigoTipoDocumentoPai:    string;
  // Principal flags
  flagProtocolo:             boolean;
  flagProcesso:              boolean;
  flagWfTramitacao:          boolean;
  flagWfHierarquico:         boolean;
  flagImprimeEtiqueta:       boolean;
  flagTela:                  boolean;
  flagLei:                   boolean;
  flagSac:                   boolean;
  flagOuvidoria:             boolean;
  popHelpCriacao:            boolean;
  anexoAutomaticoObrigatorio:boolean;
  anexoModeloObrigatorio:    boolean;
  // Numeração
  flagNumeracao:             boolean;
  flagNumeraPorTipo:         boolean;
  flagNumeraPorTipoPai:      boolean;
  sentencaNumeracao:         string;
  mascaraNumero:             string;
  // Ajuda / Tela
  help:                      string;
  tela:                      string;
}

function emptyForm(): FormState {
  return {
    nome: '', sigla: '', tipoDocumentoBase: '', codigoTipoDocumentoPai: '',
    flagProtocolo: false, flagProcesso: false, flagWfTramitacao: false,
    flagWfHierarquico: false, flagImprimeEtiqueta: false, flagTela: false,
    flagLei: false, flagSac: false, flagOuvidoria: false, popHelpCriacao: false,
    anexoAutomaticoObrigatorio: false, anexoModeloObrigatorio: false,
    flagNumeracao: false, flagNumeraPorTipo: false, flagNumeraPorTipoPai: false,
    sentencaNumeracao: '', mascaraNumero: '',
    help: '', tela: '',
  };
}

function numericFlag(val: number | string | null | undefined): boolean {
  return val === 1 || val === '1';
}

function formFromEntity(e: TipoDocumento): FormState {
  return {
    nome:                       e.nome ?? '',
    sigla:                      e.sigla ?? '',
    tipoDocumentoBase:          e.tipoDocumentoBase != null ? String(e.tipoDocumentoBase) : '',
    codigoTipoDocumentoPai:     e.codigoTipoDocumentoPai != null ? String(e.codigoTipoDocumentoPai) : '',
    flagProtocolo:              numericFlag(e.flagProtocolo),
    flagProcesso:               numericFlag(e.flagProcesso),
    flagWfTramitacao:           numericFlag(e.flagWfTramitacao),
    flagWfHierarquico:          numericFlag(e.flagWfHierarquico),
    flagImprimeEtiqueta:        numericFlag(e.flagImprimeEtiqueta),
    flagTela:                   numericFlag(e.flagTela),
    flagLei:                    numericFlag(e.flagLei),
    flagSac:                    numericFlag(e.flagSac),
    flagOuvidoria:              numericFlag(e.flagOuvidoria),
    popHelpCriacao:             numericFlag(e.popHelpCriacao),
    anexoAutomaticoObrigatorio: numericFlag(e.anexoAutomaticoObrigatorio),
    anexoModeloObrigatorio:     numericFlag(e.anexoModeloObrigatorio),
    flagNumeracao:              numericFlag(e.flagNumeracao),
    flagNumeraPorTipo:          numericFlag(e.flagNumeraPorTipo),
    flagNumeraPorTipoPai:       numericFlag(e.flagNumeraPorTipoPai),
    sentencaNumeracao:          e.sentencaNumeracao ?? '',
    mascaraNumero:              e.mascaraNumero ?? '',
    help:                       e.help ?? '',
    tela:                       e.tela ?? '',
  };
}

function formToPayload(f: FormState): TipoDocumentoPayload {
  return {
    nome:                       f.nome || undefined,
    sigla:                      f.sigla || undefined,
    tipoDocumentoBase:          f.tipoDocumentoBase ? Number(f.tipoDocumentoBase) : undefined,
    codigoTipoDocumentoPai:     f.codigoTipoDocumentoPai ? Number(f.codigoTipoDocumentoPai) : undefined,
    flagProtocolo:              f.flagProtocolo,
    flagProcesso:               f.flagProcesso,
    flagWfTramitacao:           f.flagWfTramitacao,
    flagWfHierarquico:          f.flagWfHierarquico,
    flagImprimeEtiqueta:        f.flagImprimeEtiqueta,
    flagTela:                   f.flagTela,
    flagLei:                    f.flagLei,
    flagSac:                    f.flagSac,
    flagOuvidoria:              f.flagOuvidoria,
    popHelpCriacao:             f.popHelpCriacao,
    anexoAutomaticoObrigatorio: f.anexoAutomaticoObrigatorio,
    anexoModeloObrigatorio:     f.anexoModeloObrigatorio,
    flagNumeracao:              f.flagNumeracao,
    flagNumeraPorTipo:          f.flagNumeraPorTipo,
    flagNumeraPorTipoPai:       f.flagNumeraPorTipoPai,
    sentencaNumeracao:          f.sentencaNumeracao || undefined,
    mascaraNumero:              f.mascaraNumero || undefined,
    help:                       f.help || undefined,
    tela:                       f.tela || undefined,
  };
}

// ── Delete confirmation ────────────────────────────────────────────────────
function DeleteConfirm({ nome, onConfirm, onCancel, saving }: {
  nome: string; onConfirm: () => void; onCancel: () => void; saving: boolean;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,.4)',
    }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 28, maxWidth: 420, width: '90%', boxShadow: 'var(--shadow-xl)' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Excluir tipo de documento</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6 }}>
          Confirma a exclusão de <b>{nome}</b>? Esta ação não pode ser desfeita.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={saving}>
            {saving ? 'Excluindo…' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Form Page ──────────────────────────────────────────────────────────────
export function TipoDocumentoFormPage() {
  const { codigo }  = useParams<{ codigo?: string }>();
  const navigate    = useNavigate();
  const service     = useInject('TipoDocumentoService');
  const isNew       = !codigo;

  const [form, setForm]               = useState<FormState>(emptyForm());
  const [tiposSimple, setTiposSimple] = useState<TipoDocumento[]>([]);
  const [tab, setTab]                 = useState<TabId>('principal');
  const [loading, setLoading]         = useState(!isNew);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [showDelete, setShowDelete]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [entity, setEntity]           = useState<TipoDocumento | null>(null);

  // Atributos carregados (para variáveis dinâmicas na Tela Customizada)
  const [atributos, setAtributos] = useState<AtributoTipoDocumento[]>([]);

  // Refs para os editores rich text (lemos o HTML no submit)
  const helpEditorRef = useRef<RichEditorHandle>(null);
  const telaEditorRef = useRef<RichEditorHandle>(null);

  const goBack = () => navigate(afinzAppPaths.tipoDocumento.asRoute!);

  // Load simple list (for Tipo Superior select)
  const loadSimple = useCallback(async () => {
    try {
      const res = await service.findAllSimple();
      setTiposSimple(res);
    } catch { /* non-blocking */ }
  }, [service]);

  // Load entity for edit
  useEffect(() => {
    loadSimple();
    if (isNew) return;
    setLoading(true);
    service.findOne(codigo!)
      .then(e => { setEntity(e); setForm(formFromEntity(e)); })
      .catch(() => setError('Tipo de documento não encontrado.'))
      .finally(() => setLoading(false));
  }, [codigo, isNew, service, loadSimple]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) { setError('O campo Nome é obrigatório.'); return; }
    setSaving(true);
    setError(null);
    try {
      // Lê o HTML dos editores rich text no momento do submit
      const helpHtml = helpEditorRef.current?.getHtml() ?? form.help;
      const telaHtml = telaEditorRef.current?.getHtml() ?? form.tela;
      const payload = formToPayload({ ...form, help: helpHtml, tela: telaHtml });
      if (isNew) {
        await service.create(payload);
      } else {
        await service.update(codigo!, payload);
      }
      goBack();
    } catch {
      setError('Erro ao salvar tipo de documento.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await service.remove(codigo!);
      goBack();
    } catch {
      setError('Erro ao excluir tipo de documento.');
      setShowDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="content-wide">
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>
          Carregando…
        </div>
      </div>
    );
  }

  // Filter self from Tipo Superior select on edit
  const tiposParent = tiposSimple.filter(t => t.codigo !== codigo);

  return (
    <div className="content-wide">
      {showDelete && (
        <DeleteConfirm
          nome={entity?.nome ?? 'este tipo'}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          saving={deleting}
        />
      )}

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={goBack}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <IconArrowLeft size={14} /> Voltar
          </button>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>
              {isNew ? 'Novo tipo de documento' : (entity?.nome ?? 'Editar tipo')}
            </h1>
            {!isNew && entity?.sigla && (
              <p className="page-subtitle" style={{ margin: '2px 0 0' }}>
                Sigla: <b style={{ fontFamily: 'JetBrains Mono, monospace' }}>{entity.sigla}</b>
                {' · '}Código: <b style={{ fontFamily: 'JetBrains Mono, monospace' }}>{entity.codigo}</b>
              </p>
            )}
          </div>
        </div>
        {!isNew && (
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => setShowDelete(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <IconTrash size={14} /> Excluir
          </button>
        )}
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 16px', background: 'var(--danger-50, #fef2f2)', border: '1px solid var(--danger-200, #fecaca)', borderRadius: 'var(--radius)', color: 'var(--danger-500)', fontSize: 13.5 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: '24px 28px' }}>
          <TabBar active={tab} onChange={setTab} />

          {/* ── Principal ──────────────────────────────────────────── */}
          {tab === 'principal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Nome + Sigla */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 16 }}>
                <div className="field">
                  <label className="field-label">
                    Nome <span style={{ color: 'var(--danger-500)' }}>*</span>
                  </label>
                  <input
                    className="input"
                    value={form.nome}
                    onChange={e => set('nome', e.target.value)}
                    placeholder="Ex: Ofício"
                    required
                    autoFocus={isNew}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Sigla</label>
                  <input
                    className="input"
                    value={form.sigla}
                    onChange={e => set('sigla', e.target.value.toUpperCase())}
                    placeholder="OF"
                  />
                </div>
              </div>

              {/* Aplicável a + Tipo Superior */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="field">
                  <label className="field-label">Aplicável a</label>
                  <select className="input" value={form.tipoDocumentoBase} onChange={e => set('tipoDocumentoBase', e.target.value)}>
                    <option value="">— selecione —</option>
                    <option value="1">Interno</option>
                    <option value="2">Externo</option>
                    <option value="3">Ambos</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Tipo Superior</label>
                  <select className="input" value={form.codigoTipoDocumentoPai} onChange={e => set('codigoTipoDocumentoPai', e.target.value)}>
                    <option value="">— nenhum —</option>
                    {tiposParent.map(t => (
                      <option key={t.codigo} value={String(t.codigo)}>
                        {t.sigla ? `${t.sigla} — ` : ''}{t.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Flags — 2 columns */}
              <div>
                <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)' }}>
                  Características
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  <CheckField label="É de Protocolo"             checked={form.flagProtocolo}              onChange={v => set('flagProtocolo', v)} />
                  <CheckField label="É de Processo"              checked={form.flagProcesso}               onChange={v => set('flagProcesso', v)} />
                  <CheckField label="WF de Tramitação"           checked={form.flagWfTramitacao}           onChange={v => set('flagWfTramitacao', v)} />
                  <CheckField label="WF Hierárquico"             checked={form.flagWfHierarquico}          onChange={v => set('flagWfHierarquico', v)} />
                  <CheckField label="Imprime Etiqueta"           checked={form.flagImprimeEtiqueta}        onChange={v => set('flagImprimeEtiqueta', v)} />
                  <CheckField label="Possui Tela Customizada"    checked={form.flagTela}                   onChange={v => set('flagTela', v)} />
                  <CheckField label="É um Ato Normativo (Lei)"   checked={form.flagLei}                    onChange={v => set('flagLei', v)} />
                  <CheckField label="SAC"                        checked={form.flagSac}                    onChange={v => set('flagSac', v)} />
                  <CheckField label="Ouvidoria"                  checked={form.flagOuvidoria}              onChange={v => set('flagOuvidoria', v)} />
                  <CheckField label="Pop-up de Ajuda na Criação" checked={form.popHelpCriacao}             onChange={v => set('popHelpCriacao', v)} />
                  <CheckField label="Anexo Automático Obrigatório" checked={form.anexoAutomaticoObrigatorio} onChange={v => set('anexoAutomaticoObrigatorio', v)} />
                  <CheckField label="Modelo de Anexo Obrigatório"  checked={form.anexoModeloObrigatorio}    onChange={v => set('anexoModeloObrigatorio', v)} />
                </div>
              </div>

              {/* Atributos — visível apenas no modo edição (precisa de codigo salvo) */}
              {!isNew && (
                <AtributosSection
                  codigoTipoDocumento={codigo!}
                  onListChange={setAtributos}
                />
              )}
              {isNew && (
                <div style={{ marginTop: 24, borderTop: '2px solid var(--border)', paddingTop: 16, color: 'var(--text-3)', fontSize: 13 }}>
                  Salve o tipo de documento primeiro para configurar os atributos (variáveis).
                </div>
              )}
            </div>
          )}

          {/* ── Numeração ──────────────────────────────────────────── */}
          {tab === 'numeracao' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
                <CheckField label="Possui Numeração"          checked={form.flagNumeracao}       onChange={v => set('flagNumeracao', v)} />
                <CheckField label="Numera por Tipo"           checked={form.flagNumeraPorTipo}   onChange={v => set('flagNumeraPorTipo', v)} />
                <CheckField label="Numera por Tipo Superior"  checked={form.flagNumeraPorTipoPai} onChange={v => set('flagNumeraPorTipoPai', v)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
                <div className="field">
                  <label className="field-label">Sentença de Numeração</label>
                  <input
                    className="input"
                    value={form.sentencaNumeracao}
                    onChange={e => set('sentencaNumeracao', e.target.value)}
                    placeholder="Ex: {NUMERO}/{ANO}"
                    disabled={!form.flagNumeracao}
                    style={{ opacity: form.flagNumeracao ? 1 : .5 }}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
                    Template para geração do número
                  </p>
                </div>
                <div className="field">
                  <label className="field-label">Máscara do Número</label>
                  <input
                    className="input"
                    value={form.mascaraNumero}
                    onChange={e => set('mascaraNumero', e.target.value)}
                    placeholder="Ex: 9999/9999"
                    disabled={!form.flagNumeracao}
                    style={{ opacity: form.flagNumeracao ? 1 : .5 }}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
                    Máscara de exibição do número gerado
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Artefatos ──────────────────────────────────────────── */}
          {tab === 'artefatos' && (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-3)' }}>
              <p style={{ margin: 0, fontSize: 14 }}>
                Configuração de artefatos (em desenvolvimento)
              </p>
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>
                Esta seção gerenciará os modelos de documento vinculados a este tipo.
              </p>
            </div>
          )}

          {/* ── Estados Específicos ────────────────────────────────── */}
          {tab === 'estados' && (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-3)' }}>
              <p style={{ margin: 0, fontSize: 14 }}>
                Estados específicos (em desenvolvimento)
              </p>
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>
                Esta seção permitirá configurar estados personalizados para documentos deste tipo.
              </p>
            </div>
          )}

          {/* ── Ajuda ──────────────────────────────────────────────── */}
          {tab === 'ajuda' && (
            <div>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                Texto de ajuda exibido ao usuário durante a criação de documentos deste tipo.
                {form.popHelpCriacao && (
                  <span style={{ marginLeft: 8, color: 'var(--primary)', fontWeight: 600, fontSize: 12 }}>
                    ✓ Pop-up de ajuda ativo
                  </span>
                )}
              </p>
              <RichEditor
                key={`help-${codigo ?? 'new'}`}
                ref={helpEditorRef}
                value={form.help}
                minHeight={320}
                placeholder="Descreva aqui as instruções de preenchimento, regras de negócio, ou qualquer informação útil para o usuário..."
              />
            </div>
          )}

          {/* ── Tela Customizada ───────────────────────────────────── */}
          {tab === 'tela' && (
            <div>
              <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                Template WYSIWYG da tela customizada de criação de documento.
                {!form.flagTela && (
                  <span style={{ marginLeft: 8, color: '#d97706', fontWeight: 500, fontSize: 12 }}>
                    ⚠ Ative "Possui Tela Customizada" na aba Principal para habilitar esta funcionalidade.
                  </span>
                )}
              </p>

              {/* Barra de variáveis dinâmicas — vêm dos atributos configurados */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Inserir variável:</span>
                {atributos.length === 0 && (
                  <span style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>
                    Configure os atributos na aba Principal para habilitar as variáveis.
                  </span>
                )}
                {atributos.map(a => {
                  const variable = `:${a.nome}`;
                  return (
                    <button
                      key={a.codigo}
                      type="button"
                      title={a.label ?? a.nome ?? ''}
                      onMouseDown={e => {
                        e.preventDefault(); // mantém foco no editor
                        telaEditorRef.current?.insertText(variable);
                      }}
                      style={{
                        padding: '3px 10px',
                        fontSize: 12.5,
                        fontFamily: 'JetBrains Mono, monospace',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        color: 'var(--primary)',
                        fontWeight: 600,
                      }}
                    >
                      {variable}
                    </button>
                  );
                })}
              </div>

              <RichEditor
                key={`tela-${codigo ?? 'new'}`}
                ref={telaEditorRef}
                value={form.tela}
                minHeight={340}
                placeholder="Monte o template da tela customizada. Use os botões acima para inserir variáveis na posição do cursor."
              />
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-3)' }}>
                Os botões de variável inserem o marcador na posição atual do cursor.
              </p>
            </div>
          )}

          {/* ── Actions ────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 24, borderTop: '1px solid var(--border)', marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={goBack} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : isNew ? 'Criar tipo' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
