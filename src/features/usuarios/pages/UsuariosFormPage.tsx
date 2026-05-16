import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Autocomplete, AutocompleteOption } from '../../../infra/components/autocomplete';
import { useInject } from '../../../infra/hooks/inject';
import { PerfilSimple, TIPO_SANGUINEO, Usuario, UsuarioPayload } from '../models/usuario.model';
import { afinzAppPaths } from '../../../infra/router/paths/afinz_app';

type Tab = 'dados' | 'perfis';

function IconArrowLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="19 12 5 12"/><polyline points="12 19 5 12 12 5"/></svg>;
}
function IconTrash({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
}
function IconPlus({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
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
      .then(u => setForm(fromEntity(u)))
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

  // Autocomplete: busca Unidade Administrativa (segmento)
  const fetchSegmentos = useCallback(async (q: string): Promise<AutocompleteOption[]> => {
    const res = await unidadeAdmService.findAll(1, 20, { nome: q } as any);
    return (res.data as any[]).map((s: any) => ({ value: s.codigo, label: `${s.sigla ? s.sigla + ' - ' : ''}${s.nome}` }));
  }, [unidadeAdmService]);

  // Autocomplete: busca Entidade Externa
  const fetchEntidades = useCallback(async (q: string): Promise<AutocompleteOption[]> => {
    const res = await (entidadeExternaService as any).search({ q, limit: 20 });
    return (res as any[]).map((e: any) => ({ value: e.codigo, label: e.nome }));
  }, [entidadeExternaService]);

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
        {([['dados', 'Dados Pessoais'], ['perfis', 'Perfis']] as [Tab, string][]).map(([t, label]) => (
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
