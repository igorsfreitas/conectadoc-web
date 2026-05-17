export type CaixaTab = 'entrada' | 'saida' | 'posse' | 'pendencia' | 'circular' | 'gerencia';

export interface TipoDocumentoSimples {
  codigo: string;
  nome: string | null;
  sigla: string | null;
}

export interface CreateDocumentoPayload {
  codigoTipoDocumento: number;
  codigoAssunto?: number;
  codigoSegmentoDestino?: number;
  resumo: string;
  despacho?: string;
  flagConfidencial?: number;
}

export interface CreateDocumentoResponse {
  codigo: number;
  numeroNetdoc: string;
  codigoTramitacao: number | null;
}

export interface CaixaItem {
  tramitacaoCodigo: number;
  dataEnvio: string | null;
  tipoDespacho: string | null;
  flagAceite: number | null;
  flagRecusada: number | null;
  documentoCodigo: number;
  numeroNetdoc: string | null;
  numero: string | null;
  resumo: string | null;
  assuntoTexto: string | null;
  flagPendencia: number | null;
  flagConfidencial: number | null;
  origemSigla: string | null;
  origemNome: string | null;
  destinoSigla: string | null;
  destinoNome: string | null;
  tipoDocumentoNome: string | null;
  tipoDocumentoSigla: string | null;
}

export interface CaixaCounts {
  entrada: number;
  saida: number;
  posse: number;
  pendencia: number;
  circular: number;
  gerencia: number;
}

export interface CaixaResponse {
  data: CaixaItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  counts: CaixaCounts;
  segmentoSigla: string | null;
  segmentoNome: string | null;
}
