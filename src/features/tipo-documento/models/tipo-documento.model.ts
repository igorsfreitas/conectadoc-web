export type AplicavelA = 1 | 2 | 3; // 1=INTERNO 2=EXTERNO 3=AMBOS

// ── Atributo tipo documento ────────────────────────────────────────────────
/**
 * Tipos de atributo (coluna `tipo` em comum.netdoc_atributo_tipo) — mapping do legado:
 *  1=Fone, 2=Data, 3=CPF, 4=CEP, 5=Moeda, 6=Numero, 7=String HTML,
 *  8=Multi Valorado, 9=Associação, 10=Mascara, 11=Checkbox,
 *  12=Associação Estática, 13=CNPJ, 14=Radio, 15=String, 16=String Maiúsculo
 */
export const ATRIBUTO_TIPOS: Record<number, string> = {
  1:  'Fone',
  2:  'Data',
  3:  'CPF',
  4:  'CEP',
  5:  'Moeda',
  6:  'Numero',
  7:  'String HTML',
  8:  'Multi Valorado',
  9:  'Associação',
  10: 'Mascara',
  11: 'Checkbox',
  12: 'Associação Estática',
  13: 'CNPJ',
  14: 'Radio',
  15: 'String',
  16: 'String Maiúsculo',
};

export interface AtributoTipoDocumento {
  codigo: number;
  codigoTipoDocumento: number;
  nome: string | null;
  label: string | null;
  ordem: string | null;
  tipo: number | null;
  aba: string | null;
  flagCadastraComNulo: number | null;
  flagPesquisaPor: number | null;
  flagExcluido: number | null;
  multiploValor?: string | null;
  mascara?: string | null;
}

export interface AtributoTipoPayload {
  nome: string;
  label?: string;
  ordem?: number;
  tipo?: number;
  aba?: string;
  nulo?: boolean;
  pesquisa?: boolean;
}

export interface TipoDocumento {
  codigo: string;
  nome: string | null;
  sigla: string | null;
  tipoDocumentoBase: number | null;
  codigoTipoDocumentoPai: number | null;
  flagExcluido: number | null;
  flagProtocolo: number | null;
  flagProcesso: number | null;
  flagWfTramitacao: string | null;
  flagWfHierarquico: string | null;
  flagImprimeEtiqueta: number | null;
  flagTela: number | null;
  popHelpCriacao: string | null;
  flagLei: string | null;
  flagSac: string | null;
  flagOuvidoria: string | null;
  anexoAutomaticoObrigatorio: string | null;
  anexoModeloObrigatorio: string | null;
  flagNumeracao: number | null;
  flagNumeraPorTipo: number | null;
  flagNumeraPorTipoPai: number | null;
  sentencaNumeracao: string | null;
  mascaraNumero: string | null;
  help: string | null;
  tela: string | null;
}

export interface TipoDocumentoFilter {
  nome?: string;
  sigla?: string;
  flagProtocolo?: boolean;
  flagProcesso?: boolean;
  flagWfTramitacao?: boolean;
}

export type TipoDocumentoPayload = Partial<{
  nome: string;
  sigla: string;
  tipoDocumentoBase: number;
  codigoTipoDocumentoPai: number;
  flagProtocolo: boolean;
  flagProcesso: boolean;
  flagWfTramitacao: boolean;
  flagWfHierarquico: boolean;
  flagImprimeEtiqueta: boolean;
  flagTela: boolean;
  popHelpCriacao: boolean;
  flagLei: boolean;
  flagSac: boolean;
  flagOuvidoria: boolean;
  anexoAutomaticoObrigatorio: boolean;
  anexoModeloObrigatorio: boolean;
  flagNumeracao: boolean;
  flagNumeraPorTipo: boolean;
  flagNumeraPorTipoPai: boolean;
  sentencaNumeracao: string;
  mascaraNumero: string;
  help: string;
  tela: string;
}>;
