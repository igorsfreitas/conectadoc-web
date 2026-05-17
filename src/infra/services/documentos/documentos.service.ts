import { HttpClient } from '@afinz/rest-client';
import { CaixaResponse, CaixaTab } from '../../../features/documentos/models/documento.model';

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
}
