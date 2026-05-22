export type ModalidadeAssinatura = 'MANUSCRITA' | 'CONECTADOC_TOKEN' | 'GOVBR' | 'ICP_BRASIL_EXTERNA';
export type StatusAssinatura = 'INICIADA' | 'AGUARDANDO_CONFIRMACAO' | 'CONCLUIDA' | 'FALHOU' | 'CANCELADA';
export type ValorJuridico = 'SIMPLES' | 'AVANCADA' | 'QUALIFICADA';
export type TabAssinatura = 'pendentes' | 'fila' | 'assinados' | 'recusados';

export interface SolicitacaoAssinatura {
  codigo: number;
  documentoCodigo: number | null;
  codigoPeca: number;
  numeroNetdoc: string | null;
  numero: string | null;
  tipoDocumentoSigla: string | null;
  resumo: string | null;
  flagUrgente: boolean;
  solicitadoPor: string | null;
  solicitadoEm: string | null;
  modalidade: string;
  status: string;
  dataAssinatura: string | null;
}

export interface AssinaturasContagens {
  pendentes: number;
  fila: number;
  assinados: number;
  recusados: number;
}

export interface SolicitacoesResponse {
  data: SolicitacaoAssinatura[];
  counts: AssinaturasContagens;
}

export interface AssinaturaEletronica {
  codigo: number;
  codigoPeca: number;
  codigoUsuario: number;
  modalidade: ModalidadeAssinatura;
  valorJuridico: ValorJuridico;
  hashDocumento: string;
  pdfAssinadoUrl: string | null;
  imagemUrl: string | null;
  status: StatusAssinatura;
  dataAssinatura: string | null;
  dataCriacao: string;
}

export interface IniciarAssinaturaPayload {
  codigoPeca: number;
  modalidade: ModalidadeAssinatura;
  pdfStorageKey: string;
  emailOverride?: string;
}

export interface IniciarAssinaturaResponse {
  assinaturaId: number;
  status: StatusAssinatura;
  payload?: { expiresAt: string };
}

export interface PosicaoAssinatura {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ConfirmarAssinaturaPayload {
  imagemBase64?: string;
  posicao?: PosicaoAssinatura;
  codigoEmail?: string;
}

export interface DocumentoAssinado {
  assinaturaId: number;
  pdfStorageKey: string;
  hashDocumento: string;
  dataAssinatura: string;
  modalidade: ModalidadeAssinatura;
  valorJuridico: ValorJuridico;
}
