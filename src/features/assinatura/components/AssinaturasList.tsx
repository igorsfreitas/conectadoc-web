import { AssinaturaEletronica, ModalidadeAssinatura, StatusAssinatura, ValorJuridico } from '../models/assinatura.model';

interface Props {
  assinaturas: AssinaturaEletronica[];
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return (
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
}

function modalidadeLabel(m: ModalidadeAssinatura): string {
  switch (m) {
    case 'MANUSCRITA': return '✍ Manuscrita';
    case 'CONECTADOC_TOKEN': return '🔑 ConectaDoc';
    case 'GOVBR': return '🏛 gov.br';
    case 'ICP_BRASIL_EXTERNA': return '🔐 ICP-Brasil';
    default: return m;
  }
}

function statusConfig(s: StatusAssinatura): { label: string; color: string; bg: string } {
  switch (s) {
    case 'CONCLUIDA':
      return { label: 'Concluída', color: '#15803d', bg: '#dcfce7' };
    case 'AGUARDANDO_CONFIRMACAO':
      return { label: 'Aguardando', color: '#92400e', bg: '#fef3c7' };
    case 'FALHOU':
      return { label: 'Falhou', color: '#b91c1c', bg: '#fee2e2' };
    case 'CANCELADA':
      return { label: 'Cancelada', color: '#6b7280', bg: '#f3f4f6' };
    case 'INICIADA':
      return { label: 'Iniciada', color: '#1d4ed8', bg: '#dbeafe' };
    default:
      return { label: s, color: '#6b7280', bg: '#f3f4f6' };
  }
}

function valorJuridicoConfig(v: ValorJuridico): { label: string; color: string; bg: string } {
  switch (v) {
    case 'SIMPLES':
      return { label: 'Simples', color: '#6b7280', bg: '#f3f4f6' };
    case 'AVANCADA':
      return { label: 'Avançada', color: '#1d4ed8', bg: '#dbeafe' };
    case 'QUALIFICADA':
      return { label: 'Qualificada', color: '#15803d', bg: '#dcfce7' };
    default:
      return { label: v, color: '#6b7280', bg: '#f3f4f6' };
  }
}

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 600,
      color,
      background: bg,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

export function AssinaturasList({ assinaturas }: Props) {
  if (assinaturas.length === 0) {
    return (
      <p style={{ fontSize: 12.5, color: 'var(--text-3, #6b7280)', fontStyle: 'italic', margin: 0 }}>
        Nenhuma assinatura registrada.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {assinaturas.map(a => {
        const sc = statusConfig(a.status);
        const vj = valorJuridicoConfig(a.valorJuridico);
        return (
          <div key={a.codigo} style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            padding: '8px 12px',
            background: 'var(--surface-2, #f9fafb)',
            borderRadius: 8,
            border: '1px solid var(--border, #e5e7eb)',
            fontSize: 13,
          }}>
            <span style={{ flex: '1 1 140px', color: 'var(--text-2, #374151)' }}>
              {modalidadeLabel(a.modalidade)}
            </span>
            <Pill label={sc.label} color={sc.color} bg={sc.bg} />
            <Pill label={vj.label} color={vj.color} bg={vj.bg} />
            <span style={{ fontSize: 11.5, color: 'var(--text-3, #6b7280)', whiteSpace: 'nowrap' }}>
              {fmtDate(a.dataAssinatura ?? a.dataCriacao)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
