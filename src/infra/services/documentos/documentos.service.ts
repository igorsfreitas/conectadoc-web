import { HttpClient } from '@afinz/rest-client';
import {
  AtributoDocumento,
  CaixaResponse,
  CaixaTab,
  CoautorDocumento,
  ComentarioDocumento,
  CreateDocumentoPayload,
  CreateDocumentoResponse,
  DespachoPadrao,
  DocumentoDetalhe,
  PecaDocumento,
  TipoDocumentoSimples,
  TramitacaoItem,
  TramitarDocumentoPayload,
  UsuarioPorSegmento,
  UpdateDocumentoPayload,
  UpsertAtributosPayload,
  UsuarioSearchItem,
} from '../../../features/documentos/models/documento.model';

export class DocumentosService {
  constructor(private readonly httpClient: HttpClient) {}

  async findCaixa(params: {
    tab?: CaixaTab;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<CaixaResponse> {
    const query = new URLSearchParams();
    if (params.tab) query.set('tab', params.tab);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);

    const res = await this.httpClient.get<CaixaResponse>(
      `/v1/documentos/caixa?${query.toString()}`,
    );
    return res.data;
  }

  async findById(id: number): Promise<DocumentoDetalhe> {
    const res = await this.httpClient.get<DocumentoDetalhe>(`/v1/documentos/${id}`);
    return res.data;
  }

  async findTiposInterno(): Promise<TipoDocumentoSimples[]> {
    const res = await this.httpClient.get<TipoDocumentoSimples[]>('/v1/documentos/tipos-interno');
    return res.data;
  }

  async criar(payload: CreateDocumentoPayload): Promise<CreateDocumentoResponse> {
    const res = await this.httpClient.post<CreateDocumentoResponse>('/v1/documentos', payload);
    return res.data;
  }

  async atualizar(id: number, payload: UpdateDocumentoPayload): Promise<void> {
    await this.httpClient.patch(`/v1/documentos/${id}`, payload);
  }

  async findAtributos(id: number): Promise<AtributoDocumento[]> {
    const res = await this.httpClient.get<AtributoDocumento[]>(`/v1/documentos/${id}/atributos`);
    return res.data;
  }

  async upsertAtributos(id: number, payload: UpsertAtributosPayload): Promise<AtributoDocumento[]> {
    const res = await this.httpClient.put<AtributoDocumento[]>(`/v1/documentos/${id}/atributos`, payload);
    return res.data;
  }

  async listPecas(id: number): Promise<PecaDocumento[]> {
    const res = await this.httpClient.get<PecaDocumento[]>(`/v1/documentos/${id}/pecas`);
    return res.data;
  }

  async uploadPeca(id: number, file: File): Promise<PecaDocumento> {
    const form = new FormData();
    form.append('file', file, file.name);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await this.httpClient.post<PecaDocumento>(
      `/v1/documentos/${id}/pecas`,
      form as any,
    );
    return res.data;
  }

  // ── Co-autores ─────────────────────────────────────────────────────────────

  async listCoautores(id: number): Promise<CoautorDocumento[]> {
    const res = await this.httpClient.get<CoautorDocumento[]>(`/v1/documentos/${id}/coautores`);
    return res.data;
  }

  async addCoautor(id: number, codigoUsuario: number, papel?: string): Promise<CoautorDocumento> {
    const res = await this.httpClient.post<CoautorDocumento>(`/v1/documentos/${id}/coautores`, {
      codigoUsuario,
      papel,
    });
    return res.data;
  }

  async removeCoautor(id: number, usuarioId: number): Promise<void> {
    await this.httpClient.delete(`/v1/documentos/${id}/coautores/${usuarioId}`);
  }

  async searchUsuarios(q: string): Promise<UsuarioSearchItem[]> {
    const res = await this.httpClient.get<UsuarioSearchItem[]>(
      `/v1/documentos/usuarios/search`,
      { params: { q, limit: 10 } },
    );
    return res.data;
  }

  // ── Comentários ─────────────────────────────────────────────────────────────

  async listComentarios(id: number): Promise<ComentarioDocumento[]> {
    const res = await this.httpClient.get<ComentarioDocumento[]>(`/v1/documentos/${id}/comentarios`);
    return res.data;
  }

  async addComentario(id: number, texto: string): Promise<ComentarioDocumento> {
    const res = await this.httpClient.post<ComentarioDocumento>(`/v1/documentos/${id}/comentarios`, { texto });
    return res.data;
  }

  async deleteComentario(id: number, comentarioId: number): Promise<void> {
    await this.httpClient.delete(`/v1/documentos/${id}/comentarios/${comentarioId}`);
  }

  // ── Tramitação ─────────────────────────────────────────────────────────────

  async tramitar(id: number, payload: TramitarDocumentoPayload): Promise<void> {
    await this.httpClient.post(`/v1/documentos/${id}/tramitar`, payload);
  }

  async listTramitacoes(id: number): Promise<TramitacaoItem[]> {
    const res = await this.httpClient.get<TramitacaoItem[]>(`/v1/documentos/${id}/tramitacoes`);
    return res.data;
  }

  async listDespachosPadrao(): Promise<DespachoPadrao[]> {
    const res = await this.httpClient.get<DespachoPadrao[]>(`/v1/documentos/despachos-padrao`);
    return res.data;
  }

  async listUsuariosPorSegmento(segmentoId: number): Promise<UsuarioPorSegmento[]> {
    const res = await this.httpClient.get<UsuarioPorSegmento[]>(
      `/v1/documentos/usuarios-por-segmento/${segmentoId}`,
    );
    return res.data;
  }

  /** Retorna a URL do GRT em PDF (abre em nova aba). */
  grtUrl(docId: number, tramId: number): string {
    return `/v1/documentos/${docId}/tramitacoes/${tramId}/grt`;
  }
}
