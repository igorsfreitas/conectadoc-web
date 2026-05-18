export type CaixaTab = 'entrada' | 'saida' | 'posse' | 'pendencia' | 'circular' | 'gerencia';

/** Tipo do campo: 1=STRING, 2=STRING HTML, 3=DATE, 4=INTEGER, 5=NUMERIC, 6=ASSOCIAÇÃO, 7=MULTI VALORADO, 8=BOOLEAN */
export type AtributoTipoEnum = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface AtributoTipo {
  codigo: number;
  codigoTipoDocumento: number;
  nome: string | null;
  label: string | null;
  ordem: string | null;
  tipo: AtributoTipoEnum | null;
  aba: string | null;
  flagCadastraComNulo: number | null;
  multiploValor: string | null;
  mascara: string | null;
}

export interface AtributoDocumento {
  codigo: number;
  codigoDocumento: number;
  codigoAtributoTipo: number;
  valor: string | null;
  valorFloat: string | null;
  valorData: string | null;
}

export interface AtributoValorPayload {
  codigoAtributoTipo: number;
  valor?: string | null;
  valorFloat?: number | null;
  valorData?: string | null;
}

export interface UpsertAtributosPayload {
  atributos: AtributoValorPayload[];
}

export interface TipoDocumentoSimples {
  codigo: string;
  nome: string | null;
  sigla: string | null;
}

export interface CreateDocumentoPayload {
  codigoTipoDocumento: number;
  codigoAssunto?: number;
  codigoSegmentoDestino?: number;
  resumo?: string;
  despacho?: string;
  flagConfidencial?: number;
}

export interface CreateDocumentoResponse {
  codigo: number;
  numeroNetdoc: string;
  numero: string | null;
  codigoTramitacao: number | null;
  dataHoraCriacao: string;
  tipoDocumentoNome: string | null;
  tipoDocumentoSigla: string | null;
  segmentoOrigemNome: string | null;
  segmentoOrigemSigla: string | null;
}

export interface UpdateDocumentoPayload {
  resumo?: string;
  despacho?: string;
  codigoAssunto?: number;
  codigoEstado?: number;
  flagExpedienteImpresso?: number;
  codigoSegmentoCriador?: number;
  flagConfidencial?: number;
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
