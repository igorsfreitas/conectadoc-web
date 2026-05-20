import { HttpClient } from '@afinz/rest-client';
import {
  AtributoDocumento,
  CaixaResponse,
  CaixaTab,
  CreateDocumentoPayload,
  CreateDocumentoResponse,
  DocumentoDetalhe,
  TipoDocumentoSimples,
  UpdateDocumentoPayload,
  UpsertAtributosPayload,
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
}
