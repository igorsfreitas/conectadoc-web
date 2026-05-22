export type CaixaTab = 'entrada' | 'saida' | 'posse' | 'pendencia' | 'circular' | 'gerencia';

// ── Dashboard ──────────────────────────────────────────────────────────────────

export interface DashboardCounts {
  posse: number;
  entrada: number;
  aguardandoAssinatura: number;
  tramitadosMes: number;
}

export interface DashboardAtividade {
  tramitacaoCodigo: number | null;
  documentoCodigo: number;
  numeroNetdoc: string | null;
  numero: string | null;
  resumo: string | null;
  tipoDocumentoSigla: string | null;
  tipoDocumentoNome: string | null;
  origemSigla: string | null;
  destinoSigla: string | null;
  flagPendencia: number | null;
  dataEnvio: string | null;
}

export interface DashboardPendenteAssinatura {
  codigo: number;
  documentoCodigo: number | null;
  numeroNetdoc: string | null;
  tipoDocumentoNome: string | null;
  tipoDocumentoSigla: string | null;
  resumo: string | null;
  modalidade: string;
  status: string;
  dataAssinatura: string | null;
}

export interface DashboardSituacao {
  label: string;
  value: number;
  color: string;
}

export interface DashboardVolumeDiario {
  day: string;
  date: string;
  count: number;
}

export interface DashboardData {
  counts: DashboardCounts;
  atividades: DashboardAtividade[];
  pendentesAssinatura: DashboardPendenteAssinatura[];
  tramitacoesPorSituacao: DashboardSituacao[];
  volumeDiario: DashboardVolumeDiario[];
  nomeUsuario: string | null;
  segmentoSigla: string | null;
}

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

export interface DocumentoDetalheAnexo {
  id: number;
  nome: string;
  tamanho: string | null;
  mime: string | null;
  url: string | null;
}

export interface PecaDocumento {
  codigo: number;
  nome: string | null;
  mimeType: string | null;
  tamanhoBytes: number | null;
  url: string | null;
  dataCriacao: string | null;
}

export interface DocumentoDetalhePessoa {
  codigo: number;
  nome: string | null;
  papel: string;
}

export interface CoautorDocumento {
  codigo: number;
  codigoDocumento: number;
  codigoUsuario: number;
  nomeUsuario: string | null;
  fotoUrl: string | null;
  papel: string;
  dataCriacao: string | null;
}

export interface UsuarioSearchItem {
  codigo: number;
  nome: string | null;
  cpf: string | null;
  matricula: string | null;
}

export interface ComentarioDocumento {
  codigo: number;
  codigoDocumento: number;
  codigoUsuario: number;
  nomeUsuario: string | null;
  fotoUrl: string | null;
  texto: string;
  dataCriacao: string | null;
}

export interface TramitarDocumentoPayload {
  codigoSegmentoDestino: number;
  codigoUsuarioDestino?: number;
  despacho?: string;
  dataLimite?: string;
  tipoDespacho?: string;
  anexarDespachoComoPeca?: boolean;
}

export interface DespachoPadrao {
  codigo: number;
  nome: string;
  conteudo: string;
}

export interface UsuarioPorSegmento {
  codigo: number;
  nome: string | null;
  segmentoCodigo: number;
  segmentoNome: string | null;
  segmentoSigla: string | null;
}

export interface TramitacaoItem {
  codigo: number;
  codigoDocumento: number;
  origemCodigo: number | null;
  origemSigla: string | null;
  origemNome: string | null;
  destinoCodigo: number | null;
  destinoSigla: string | null;
  destinoNome: string | null;
  usuarioOrigemNome: string | null;
  usuarioDestinoNome: string | null;
  despacho: string | null;
  tipoDespacho: string | null;
  dataEnvio: string | null;
  dataLimite: string | null;
  flagAceite: number | null;
  flagRecusada: number | null;
  flagCancelada: number | null;
}

export interface DocumentoDetalhe {
  codigo: number;
  numeroNetdoc: string | null;
  numero: string | null;
  resumo: string | null;
  despacho: string | null;
  dataCriacao: string | null;
  dataAtualizacao: string | null;
  flagConfidencial: number | null;
  flagFinalizado: number | null;
  flagPendencia: number | null;

  tipoDocumentoCodigo: number | null;
  tipoDocumentoNome: string | null;
  tipoDocumentoSigla: string | null;
  tipoDocumentoBase: number | null;

  assuntoCodigo: number | null;
  assuntoDescricao: string | null;

  segmentoOrigemSigla: string | null;
  segmentoOrigemNome: string | null;
  segmentoAtualSigla: string | null;
  segmentoAtualNome: string | null;

  usuarioCriadorCodigo: number | null;
  usuarioCriadorNome: string | null;

  dataRecebido: string | null;
  tipoDespacho: string | null;

  anexos: DocumentoDetalheAnexo[];
  pessoas: DocumentoDetalhePessoa[];
}
