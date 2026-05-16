import { FormEvent, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from '../../../infra/components/pagination';
import { useInject } from '../../../infra/hooks/inject';
import { Usuario, UsuarioFilter, TIPO_SANGUINEO } from '../models/usuario.model';
import { Paginated } from '../../../infra/types/paginated';
import { afinzAppPaths } from '../../../infra/router/paths/afinz_app';

function IconPlus({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function IconSearch({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function IconChevron({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
}

const DEFAULT_LIMIT = 50;

export function UsuariosListPage() {
  const service  = useInject('UsuariosService');
  const navigate = useNavigate();

  const [data, setData]       = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter]   = useState<UsuarioFilter>({});

  const [fNome, setFNome]         = useState('');
  const [fCpf, setFCpf]           = useState('');
  const [fMatricula, setFMatricula] = useState('');
  const [fAtivo, setFAtivo]       = useState(false);
  const [fInativo, setFInativo]   = useState(false);

  const load = useCallback(async (p: number, f: UsuarioFilter) => {
    setLoading(true); setError(null);
    try {
      const res: Paginated<Usuario> = await service.findAll(p, DEFAULT_LIMIT, f);
      setData(res.data); setTotal(res.meta.total); setTotalPages(res.meta.totalPages);
    } catch { setError('Não foi possível carregar os usuários.'); }
    finally { setLoading(false); }
  }, [service]);

  useEffect(() => { load(page, filter); }, [load, page, filter]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const f: UsuarioFilter = {};
    if (fNome)      f.nome      = fNome;
    if (fCpf)       f.cpf       = fCpf;
    if (fMatricula) f.matricula = fMatricula;
    if (fAtivo)     f.ativo     = true;
    if (fInativo)   f.inativo   = true;
    setFilter(f); setPage(1);
  }

  function handleClear() {
    setFNome(''); setFCpf(''); setFMatricula('');
    setFAtivo(false); setFInativo(false);
    setFilter({}); setPage(1);
  }

  return (
    <div className="content-wide">
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuários</h1>
          <p className="page-subtitle">Usuários cadastrados no sistema</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 16 }}>
        <form onSubmit={handleSearch} style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: '1 1 220px', margin: 0 }}>
              <label className="field-label">Nome</label>
              <input className="input" value={fNome} onChange={e => setFNome(e.target.value)} placeholder="Nome do usuário…" />
            </div>
            <div className="field" style={{ flex: '0 1 160px', margin: 0 }}>
              <label className="field-label">CPF / Login</label>
              <input className="input" value={fCpf} onChange={e => setFCpf(e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div className="field" style={{ flex: '0 1 140px', margin: 0 }}>
              <label className="field-label">Matrícula</label>
              <input className="input" value={fMatricula} onChange={e => setFMatricula(e.target.value)} placeholder="12345" />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, paddingBottom: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={fAtivo} onChange={e => setFAtivo(e.target.checked)} /> Ativo
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={fInativo} onChange={e => setFInativo(e.target.checked)} /> Inativo
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, paddingBottom: 2 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleClear}>Limpar</button>
              <button type="submit" className="btn btn-primary btn-sm"><IconSearch size={13} /> Pesquisar</button>
            </div>
          </div>
        </form>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Usuários {total > 0 && <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>[{total}]</span>}
          </h3>
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`${afinzAppPaths.usuarios.asRoute}/novo`)}>
            <IconPlus size={13} /> Novo usuário
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 20px', color: 'var(--danger-500)', fontSize: 13, borderBottom: '1px solid var(--border)' }}>{error}</div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table className="data">
            <thead>
              <tr>
                <th>Nome</th>
                <th style={{ width: 140 }}>CPF / Login</th>
                <th style={{ width: 110 }}>Matrícula</th>
                <th>Função</th>
                <th style={{ width: 80, textAlign: 'center' }}>Status</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {[undefined, 140, 110, undefined, 80, 40].map((w, j) => (
                      <td key={j} style={{ width: w }}><div style={{ height: 14, borderRadius: 4, background: 'var(--surface-2)', width: '75%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">Nenhum usuário encontrado.</td></tr>
              ) : (
                data.map(row => (
                  <tr key={row.codigo} style={{ cursor: 'pointer' }} onClick={() => navigate(`${afinzAppPaths.usuarios.asRoute}/${row.codigo}`)}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text)' }}>{row.nome ?? '—'}</div>
                      {row.funcao && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{row.funcao}</div>}
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5 }}>{row.cpf ?? '—'}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5 }}>{row.matricula ?? '—'}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{row.funcao ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {row.flagExcluido === 1 ? (
                        <span style={{ fontSize: 11.5, padding: '2px 8px', borderRadius: 20, background: '#fef2f2', color: 'var(--danger-500)', fontWeight: 600 }}>Inativo</span>
                      ) : (
                        <span style={{ fontSize: 11.5, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', fontWeight: 600 }}>Ativo</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--text-3)' }}><IconChevron size={14} /></span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} total={total} limit={DEFAULT_LIMIT} onPageChange={p => { setPage(p); }} />
      </div>
    </div>
  );
}
