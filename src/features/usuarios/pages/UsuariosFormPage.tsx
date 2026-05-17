import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Autocomplete, AutocompleteOption } from '../../../infra/components/autocomplete';
import { useInject } from '../../../infra/hooks/inject';
import { LogAcesso, PerfilSimple, TIPO_SANGUINEO, Usuario, UsuarioPayload } from '../models/usuario.model';
import { afinzAppPaths } from '../../../infra/router/paths/afinz_app';

type Tab = 'dados' | 'perfis' | 'foto' | 'assinatura' | 'logs';

function IconArrowLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="19 12 5 12"/><polyline points="12 19 5 12 12 5"/></svg>;
}
function IconTrash({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
}
function IconPlus({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function IconUpload({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
}
function IconPencil({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}

interface FormState {
  nome: string; cpf: string; senha: string;
  matricula: string; matriculaReal: string; email: string;
  funcao: string; projAtv: string; localTrabalho: string;
  endTrabalho: string; telefone: string; celular: string; ramais: string;
  rg: string; orgaoExp: string; dataNascimento: string;
  tipoSanguineo: string;
  segmento: number | null; segmentoLabel: string;
  entidadeExterna: number | null; entidadeExternaLabel: string;
  estagiario: boolean; dataInicio: string; dataFim: string;
  obs: string; nomeAbreviado: string; inativo: boolean; tipo: string;
}

const empty = (): FormState => ({
  nome: '', cpf: '', senha: '', matricula: '', matriculaReal: '', email: '',
  funcao: '', projAtv: '', localTrabalho: '', endTrabalho: '',
  telefone: '', celular: '', ramais: '', rg: '', orgaoExp: '', dataNascimento: '',
  tipoSanguineo: '', segmento: null, segmentoLabel: '', entidadeExterna: null, entidadeExternaLabel: '',
  estagiario: false, dataInicio: '', dataFim: '', obs: '', nomeAbreviado: '', inativo: false, tipo: 'USU',
});

function fromEntity(u: Usuario): FormState {
  return {
    nome: u.nome ?? '', cpf: u.cpf ?? '', senha: '',
    matricula: u.matricula ?? '', matriculaReal: u.matriculaReal ?? '',
    email: u.email ?? '', funcao: u.funcao ?? '', projAtv: u.projAtv ?? '',
    localTrabalho: u.localTrabalho ?? '', endTrabalho: u.endTrabalho ?? '',
    telefone: u.telefone ?? '', celular: u.celular ?? '', ramais: u.ramais ?? '',
    rg: u.rg ?? '', orgaoExp: u.orgaoExp ?? '',
    dataNascimento: u.dataNascimento ? u.dataNascimento.slice(0, 10) : '',
    tipoSanguineo: u.tipoSanguineo !== null ? String(u.tipoSanguineo) : '',
    segmento: u.segmento ?? null, segmentoLabel: '',
    entidadeExterna: u.entidadeExterna ?? null, entidadeExternaLabel: '',
    estagiario: !!u.flagEstagiario, dataInicio: u.dataInicio ? String(u.dataInicio).slice(0, 10) : '',
    dataFim: u.dataFim ? String(u.dataFim).slice(0, 10) : '',
    obs: u.obs ?? '', nomeAbreviado: u.nomeAbreviado ?? '',
    inativo: u.flagExcluido === 1, tipo: u.tipo ?? 'USU',
  };
}

export function UsuariosFormPage() {
  const { codigo } = useParams<{ codigo?: string }>();
  const navigate   = useNavigate();
  const isEdit     = !!codigo;

  const service              = useInject('UsuariosService');
  const entidadeExternaService = useInject('EntidadeExternaService');
  const unidadeAdmService    = useInject('UnidadeAdministrativaService');
  const perfisService        = useInject('PerfisService');

  const [tab, setTab]       = useState<Tab>('dados');
  const [form, setForm]     = useState<FormState>(empty());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // Perfis
  const [perfisUsuario, setPerfisUsuario] = useState<PerfilSimple[]>([]);
  const [todosPerfis, setTodosPerfis]     = useState<PerfilSimple[]>([]);
  const [selectedPerfil, setSelectedPerfil] = useState('');
  const [perfilSaving, setPerfilSaving]   = useState(false);

  // Foto
  const [fotoUrl, setFotoUrl]           = useState<string | null>(null);
  const [fotoUploading, setFotoUploading] = useState(false);
  const fotoInputRef                      = useRef<HTMLInputElement>(null);

  // Assinatura
  const [assinaturaUrl, setAssinaturaUrl]         = useState<string | null>(null);
  const [assinaturaUploading, setAssinaturaUploading] = useState(false);
  const assinaturaInputRef                            = useRef<HTMLInputElement>(null);
  // Canvas
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos        = useRef<{ x: number; y: number } | null>(null);

  // Logs de acesso
  const [logs, setLogs]           = useState<LogAcesso[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(p => ({ ...p, [k]: v }));
  }

  const loadPerfisUsuario = useCallback(async (id: number) => {
    try {
      const list = await service.findPerfis(id);
      setPerfisUsuario(list as PerfilSimple[]);
    } catch { /* silencioso */ }
  }, [service]);

  // Carregar dados do usuário em modo edição
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    service.findOne(Number(codigo))
      .then(u => {
        setForm(fromEntity(u));
        setFotoUrl(u.fotoUrlSigned ?? null);
        setAssinaturaUrl(u.assinaturaUrlSigned ?? null);
      })
      .catch(() => setError('Não foi possível carregar o usuário.'))
      .finally(() => setLoading(false));
    loadPerfisUsuario(Number(codigo));
  }, [codigo, isEdit, service, loadPerfisUsuario]);

  // Carregar todos os perfis para o select
  useEffect(() => {
    if (!isEdit) return;
    perfisService.findAll(1, 200, {})
      .then(r => setTodosPerfis(r.data as PerfilSimple[]))
      .catch(() => {});
  }, [isEdit, perfisService]);

  // Carregar logs de acesso ao abrir a aba
  useEffect(() => {
    if (!isEdit || tab !== 'logs') return;
    setLogsLoading(true);
    service.findLogsAcesso(Number(codigo))
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLogsLoading(false));
  }, [isEdit, tab, codigo, service]);

  // Autocomplete: busca Unidade Administrativa (nome OU sigla)
  const fetchSegmentos = useCallback(async (q: string): Promise<AutocompleteOption[]> => {
    const res = await unidadeAdmService.search(q, 20);
    return res.data.map(s => ({ value: s.codigo, label: `${s.sigla ? s.sigla + ' — ' : ''}${s.nome}` }));
  }, [unidadeAdmService]);

  // Autocomplete: busca Entidade Externa (por nome)
  const fetchEntidades = useCallback(async (q: string): Promise<AutocompleteOption[]> => {
    const res = await entidadeExternaService.search(q, 20);
    return res.map(e => ({ value: e.codigo, label: `${e.sigla ? e.sigla + ' — ' : ''}${e.nome}` }));
  }, [entidadeExternaService]);

  // ── Foto handlers ──────────────────────────────────────────────────────────
  async function handleFotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !isEdit) return;
    setFotoUploading(true);
    try {
      const res = await service.uploadFoto(Number(codigo), file);
      setFotoUrl(res.fotoUrlSigned);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao enviar foto.');
    } finally {
      setFotoUploading(false);
      if (fotoInputRef.current) fotoInputRef.current.value = '';
    }
  }

  async function handleFotoRemove() {
    if (!isEdit) return;
    setFotoUploading(true);
    try {
      await service.removeFoto(Number(codigo));
      setFotoUrl(null);
    } catch { setError('Erro ao remover foto.'); }
    finally { setFotoUploading(false); }
  }

  // ── Assinatura upload handler ───────────────────────────────────────────────
  async function handleAssinaturaChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !isEdit) return;
    setAssinaturaUploading(true);
    try {
      const res = await service.uploadAssinatura(Number(codigo), file);
      setAssinaturaUrl(res.assinaturaUrlSigned);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao enviar assinatura.');
    } finally {
      setAssinaturaUploading(false);
      if (assinaturaInputRef.current) assinaturaInputRef.current.value = '';
    }
  }

  async function handleAssinaturaRemove() {
    if (!isEdit) return;
    setAssinaturaUploading(true);
    try {
      await service.removeAssinatura(Number(codigo));
      setAssinaturaUrl(null);
    } catch { setError('Erro ao remover assinatura.'); }
    finally { setAssinaturaUploading(false); }
  }

  // ── Canvas drawing ──────────────────────────────────────────────────────────
  function getPos(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function canvasStart(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getPos(e);
  }

  function canvasDraw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  }

  function canvasEnd() { setIsDrawing(false); lastPos.current = null; }

  function canvasClear() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function canvasSave() {
    const canvas = canvasRef.current!;
    if (!isEdit) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'assinatura.png', { type: 'image/png' });
      setAssinaturaUploading(true);
      try {
        const res = await service.uploadAssinatura(Number(codigo), file);
        setAssinaturaUrl(res.assinaturaUrlSigned);
        canvasClear();
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Erro ao salvar assinatura.');
      } finally { setAssinaturaUploading(false); }
    }, 'image/png');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const payload: Partial<UsuarioPayload> = {
        nome: form.nome, cpf: form.cpf,
        matricula:     form.matricula      || undefined,
        matriculaReal: form.matriculaReal  || undefined,
        email:         form.email          || undefined,
        funcao:        form.funcao         || undefined,
        projAtv:       form.projAtv        || undefined,
        localTrabalho: form.localTrabalho  || undefined,
        endTrabalho:   form.endTrabalho    || undefined,
        telefone:      form.telefone       || undefined,
        celular:       form.celular        || undefined,
        ramais:        form.ramais         || undefined,
        rg:            form.rg             || undefined,
        orgaoExp:      form.orgaoExp       || undefined,
        dataNascimento: form.dataNascimento || undefined,
        tipoSanguineo: form.tipoSanguineo ? Number(form.tipoSanguineo) : undefined,
        segmento:      form.segmento       ?? undefined,
        entidadeExterna: form.entidadeExterna ?? undefined,
        estagiario:    form.estagiario,
        dataInicio:    form.dataInicio     || undefined,
        dataFim:       form.dataFim        || undefined,
        obs:           form.obs            || undefined,
        nomeAbreviado: form.nomeAbreviado  || undefined,
        inativo:       form.inativo,
        tipo:          form.tipo           || undefined,
      };
      if (!isEdit && form.senha) (payload as UsuarioPayload).senha = form.senha;
      if (isEdit && form.senha)  (payload as UsuarioPayload).senha = form.senha;

      if (isEdit) {
        await service.update(Number(codigo), payload as UsuarioPayload);
        navigate(afinzAppPaths.usuarios.asRoute!);
      } else {
        await service.create(payload as UsuarioPayload);
        navigate(afinzAppPaths.usuarios.asRoute!);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao salvar usuário.');
    } finally { setSaving(false); }
  }

  async function handleAddPerfil() {
    if (!selectedPerfil || !isEdit) return;
    setPerfilSaving(true);
    try {
      await service.addPerfil(Number(codigo), Number(selectedPerfil));
      await loadPerfisUsuario(Number(codigo));
      setSelectedPerfil('');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao adicionar perfil.');
    } finally { setPerfilSaving(false); }
  }

  async function handleRemovePerfil(perfilId: number) {
    if (!isEdit) return;
    setPerfilSaving(true);
    try {
      await service.removePerfil(Number(codigo), perfilId);
      await loadPerfisUsuario(Number(codigo));
    } catch { setError('Erro ao remover perfil.'); }
    finally { setPerfilSaving(false); }
  }

  const assignedIds = new Set(perfisUsuario.map(p => p.codigo));
  const availablePerfis = todosPerfis.filter(p => !assignedIds.has(p.codigo));

  if (loading) {
    return <div className="content-wide"><div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Carregando…</div></div>;
  }

  return (
    <div className="content-wide">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(afinzAppPaths.usuarios.asRoute!)}>
            <IconArrowLeft size={14} />
          </button>
          <div>
            <h1 className="page-title">{isEdit ? (form.nome || 'Editar usuário') : 'Novo usuário'}</h1>
            <p className="page-subtitle">{isEdit ? `Usuário #${codigo}` : 'Preencha os dados abaixo'}</p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, background: '#fef2f2', color: 'var(--danger-500)', fontSize: 13, border: '1px solid #fecaca' }}>{error}</div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {([ ['dados', 'Dados Pessoais'], ['perfis', 'Perfis'], ...(isEdit ? [['foto', 'Foto'], ['assinatura', 'Assinatura'], ['logs', 'Logs de Acesso']] : [])] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '9px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13.5, fontWeight: tab === t ? 600 : 400,
            color: tab === t ? 'var(--primary, #2563eb)' : 'var(--text-2)',
            borderBottom: tab === t ? '2px solid var(--primary, #2563eb)' : '2px solid transparent',
            marginBottom: -1,
          }}>{label}</button>
        ))}
      </div>

      {/* ── Tab: Dados Pessoais ── */}
      {tab === 'dados' && (
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Linha 1: Login/CPF + Senha */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">CPF / Login <span style={{ color: 'var(--danger-500)' }}>*</span></label>
                <input className="input" value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="00000000000" required maxLength={11} style={{ fontFamily: 'JetBrains Mono, monospace' }} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">Senha {!isEdit && <span style={{ color: 'var(--danger-500)' }}>*</span>}</label>
                <input className="input" type="password" value={form.senha} onChange={e => set('senha', e.target.value)} placeholder={isEdit ? 'Deixe em branco para não alterar' : '••••••••'} required={!isEdit} />
              </div>
            </div>

            {/* Linha 2: Nome */}
            <div className="field" style={{ margin: 0 }}>
              <label className="field-label">Nome completo <span style={{ color: 'var(--danger-500)' }}>*</span></label>
              <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome do usuário" required />
            </div>

            {/* Linha 3: Matrícula + Matrícula Real */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">Matrícula</label>
                <input className="input" value={form.matricula} onChange={e => set('matricula', e.target.value)} placeholder="12345" style={{ fontFamily: 'JetBrains Mono, monospace' }} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">Matrícula Real</label>
                <input className="input" value={form.matriculaReal} onChange={e => set('matriculaReal', e.target.value)} placeholder="12345" style={{ fontFamily: 'JetBrains Mono, monospace' }} />
              </div>
            </div>

            {/* Linha 4: RG + Órgão + UF */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 16 }}>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">RG</label>
                <input className="input" value={form.rg} onChange={e => set('rg', e.target.value)} placeholder="0000000" style={{ fontFamily: 'JetBrains Mono, monospace' }} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">Órgão Exp. / UF</label>
                <input className="input" value={form.orgaoExp} onChange={e => set('orgaoExp', e.target.value.toUpperCase())} placeholder="SSP/PE" maxLength={20} />
              </div>
            </div>

            {/* Linha 5: Telefone + Celular + Ramal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">Telefone</label>
                <input className="input" value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(87) 9 9999-9999" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">Celular</label>
                <input className="input" value={form.celular} onChange={e => set('celular', e.target.value)} placeholder="(87) 9 9999-9999" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">Ramal</label>
                <input className="input" value={form.ramais} onChange={e => set('ramais', e.target.value)} placeholder="2100" />
              </div>
            </div>

            {/* Linha 6: Data nascimento + Tipo sanguíneo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">Data de Nascimento</label>
                <input className="input" type="date" value={form.dataNascimento} onChange={e => set('dataNascimento', e.target.value)} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">Tipo Sanguíneo / Fator RH</label>
                <select className="input" value={form.tipoSanguineo} onChange={e => set('tipoSanguineo', e.target.value)}>
                  <option value="">Selecione…</option>
                  {Object.entries(TIPO_SANGUINEO).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Linha 7: Email */}
            <div className="field" style={{ margin: 0 }}>
              <label className="field-label">E-mail</label>
              <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="usuario@prefeitura.gov.br" />
            </div>

            {/* Linha 8: Função + Projeto/Atividade */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">Função</label>
                <input className="input" value={form.funcao} onChange={e => set('funcao', e.target.value)} placeholder="Coordenador Pedagógico" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">Projeto / Atividade</label>
                <input className="input" value={form.projAtv} onChange={e => set('projAtv', e.target.value)} placeholder="Professor II" />
              </div>
            </div>

            {/* Linha 9: Local de trabalho */}
            <div className="field" style={{ margin: 0 }}>
              <label className="field-label">Local de Trabalho</label>
              <input className="input" value={form.localTrabalho} onChange={e => set('localTrabalho', e.target.value)} placeholder="Escola Municipal…" />
            </div>

            {/* Linha 10: Unidade Externa */}
            <div className="field" style={{ margin: 0 }}>
              <label className="field-label">Unidade Externa</label>
              <Autocomplete
                key={`ue-${codigo ?? 'new'}`}
                value={form.entidadeExterna}
                initialLabel={form.entidadeExternaLabel}
                onChange={(val, label) => setForm(p => ({ ...p, entidadeExterna: val, entidadeExternaLabel: label }))}
                fetchOptions={fetchEntidades}
                placeholder="Digite para buscar entidade externa…"
              />
            </div>

            {/* Linha 11: Unidade Administrativa */}
            <div className="field" style={{ margin: 0 }}>
              <label className="field-label">Unidade Administrativa</label>
              <Autocomplete
                key={`ua-${codigo ?? 'new'}`}
                value={form.segmento}
                initialLabel={form.segmentoLabel}
                onChange={(val, label) => setForm(p => ({ ...p, segmento: val, segmentoLabel: label }))}
                fetchOptions={fetchSegmentos}
                placeholder="Digite para buscar unidade administrativa…"
              />
            </div>

            {/* Linha 12: Endereço + Fone */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">Endereço de Trabalho</label>
                <input className="input" value={form.endTrabalho} onChange={e => set('endTrabalho', e.target.value)} placeholder="Rua…" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="field-label">Fone de Trabalho</label>
                <input className="input" value={form.ramais} onChange={e => set('ramais', e.target.value)} placeholder="(87) 3761-…" />
              </div>
            </div>

            {/* Linha 13: Estagiário + Datas */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer', paddingBottom: 6 }}>
                <input type="checkbox" checked={form.estagiario} onChange={e => set('estagiario', e.target.checked)} />
                Estagiário
              </label>
              {form.estagiario && (
                <>
                  <div className="field" style={{ margin: 0, flex: '0 1 160px' }}>
                    <label className="field-label">Data Início Estágio</label>
                    <input className="input" type="date" value={form.dataInicio} onChange={e => set('dataInicio', e.target.value)} />
                  </div>
                  <div className="field" style={{ margin: 0, flex: '0 1 160px' }}>
                    <label className="field-label">Data Fim Estágio</label>
                    <input className="input" type="date" value={form.dataFim} onChange={e => set('dataFim', e.target.value)} />
                  </div>
                </>
              )}
            </div>

            {/* Linha 14: Inativo */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.inativo} onChange={e => set('inativo', e.target.checked)} />
              <span style={{ color: form.inativo ? 'var(--danger-500)' : 'var(--text-2)' }}>Inativo</span>
            </label>

            {/* Linha 15: Observação */}
            <div className="field" style={{ margin: 0 }}>
              <label className="field-label">Observação</label>
              <textarea className="input" rows={3} value={form.obs} onChange={e => set('obs', e.target.value)} placeholder="Observações sobre o usuário…" style={{ resize: 'vertical' }} />
            </div>

            {/* Ações */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate(afinzAppPaths.usuarios.asRoute!)} disabled={saving}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── Tab: Foto ── */}
      {tab === 'foto' && (
        <div className="card" style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          {/* Foto atual */}
          <div style={{
            width: 200, height: 200, borderRadius: 12,
            border: '2px dashed var(--border)', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--surface-2)',
          }}>
            {fotoUrl ? (
              <img src={fotoUrl} alt="Foto de perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Sem foto</span>
            )}
          </div>

          {/* Ações */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleFotoChange}
            />
            <button
              className="btn btn-primary btn-sm"
              disabled={fotoUploading}
              onClick={() => fotoInputRef.current?.click()}
            >
              <IconUpload size={13} />
              {fotoUrl ? ' Alterar foto' : ' Enviar foto'}
            </button>
            {fotoUrl && (
              <button
                className="btn btn-secondary btn-sm"
                disabled={fotoUploading}
                onClick={handleFotoRemove}
                style={{ color: 'var(--danger-500)' }}
              >
                <IconTrash size={13} /> Remover
              </button>
            )}
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', maxWidth: 320 }}>
            Formatos aceitos: JPEG, PNG, WebP, GIF · Tamanho máximo: 5 MB<br />
            A imagem será redimensionada para até 400×400 px.
          </p>
        </div>
      )}

      {/* ── Tab: Assinatura ── */}
      {tab === 'assinatura' && (
        <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Assinatura atual */}
          {assinaturaUrl && (
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>Assinatura atual</p>
              <div style={{
                border: '1px solid var(--border)', borderRadius: 10, padding: 16,
                background: '#fff', display: 'inline-block',
              }}>
                <img src={assinaturaUrl} alt="Assinatura" style={{ maxHeight: 120, display: 'block' }} />
              </div>
              <div style={{ marginTop: 10 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={assinaturaUploading}
                  onClick={handleAssinaturaRemove}
                  style={{ color: 'var(--danger-500)' }}
                >
                  <IconTrash size={13} /> Remover assinatura
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Opção 1: desenhar */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
                <IconPencil size={13} /> Desenhar assinatura
              </p>
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff', display: 'inline-block', cursor: 'crosshair', touchAction: 'none' }}>
                <canvas
                  ref={canvasRef}
                  width={520}
                  height={180}
                  style={{ display: 'block', maxWidth: '100%' }}
                  onMouseDown={canvasStart}
                  onMouseMove={canvasDraw}
                  onMouseUp={canvasEnd}
                  onMouseLeave={canvasEnd}
                  onTouchStart={canvasStart}
                  onTouchMove={canvasDraw}
                  onTouchEnd={canvasEnd}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn btn-primary btn-sm" disabled={assinaturaUploading} onClick={canvasSave}>
                  {assinaturaUploading ? 'Salvando…' : 'Salvar assinatura desenhada'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={canvasClear}>Limpar</button>
              </div>
            </div>

            {/* Opção 2: upload de arquivo */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
                <IconUpload size={13} /> Ou enviar imagem de arquivo
              </p>
              <input
                ref={assinaturaInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleAssinaturaChange}
              />
              <button
                className="btn btn-secondary btn-sm"
                disabled={assinaturaUploading}
                onClick={() => assinaturaInputRef.current?.click()}
              >
                <IconUpload size={13} /> Selecionar arquivo
              </button>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
                JPEG, PNG, WebP · máx. 5 MB · fundo branco recomendado
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Logs de Acesso ── */}
      {tab === 'logs' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Logs de Acesso</h3>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Últimos 50 registros</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  <th style={{ width: 180 }}>Data / Hora</th>
                  <th style={{ width: 140 }}>IP</th>
                  <th>Navegador / Dispositivo</th>
                  <th style={{ width: 90, textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {logsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {[180, 140, undefined, 90].map((w, j) => (
                        <td key={j} style={{ width: w }}>
                          <div style={{ height: 14, borderRadius: 4, background: 'var(--surface-2)', width: '80%' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr><td colSpan={4} className="empty-state">Nenhum registro de acesso encontrado.</td></tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.codigo}>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5 }}>
                        {new Date(log.dataAcesso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5 }}>
                        {log.ip ?? '—'}
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--text-2)', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.userAgent ?? '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {log.status === 'SUCESSO' ? (
                          <span style={{ fontSize: 11.5, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', fontWeight: 600 }}>Sucesso</span>
                        ) : (
                          <span style={{ fontSize: 11.5, padding: '2px 8px', borderRadius: 20, background: '#fef2f2', color: 'var(--danger-500)', fontWeight: 600 }}>Falha</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Perfis ── */}
      {tab === 'perfis' && (
        <div className="card" style={{ padding: '24px 28px' }}>
          {!isEdit ? (
            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Salve o usuário primeiro para vincular perfis.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Adicionar */}
              {availablePerfis.length > 0 && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select className="input" value={selectedPerfil} onChange={e => setSelectedPerfil(e.target.value)} style={{ flex: 1 }}>
                    <option value="">Selecione um perfil…</option>
                    {availablePerfis.map(p => <option key={p.codigo} value={p.codigo}>{p.nome}</option>)}
                  </select>
                  <button className="btn btn-primary btn-sm" disabled={perfilSaving || !selectedPerfil} onClick={handleAddPerfil}>
                    <IconPlus /> Adicionar
                  </button>
                </div>
              )}

              {/* Lista */}
              {perfisUsuario.length === 0 ? (
                <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Nenhum perfil vinculado.</p>
              ) : (
                <table className="data">
                  <thead><tr><th>Perfil</th><th style={{ width: 44 }}></th></tr></thead>
                  <tbody>
                    {perfisUsuario.map(p => (
                      <tr key={p.codigo}>
                        <td style={{ fontWeight: 500 }}>{p.nome ?? '—'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="icon-btn" title="Remover" disabled={perfilSaving} onClick={() => handleRemovePerfil(p.codigo)} style={{ color: 'var(--danger-500)' }}>
                            <IconTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
