import { HttpClient } from '@afinz/rest-client';
import {
  AssinaturaEletronica,
  ConfirmarAssinaturaPayload,
  DocumentoAssinado,
  IniciarAssinaturaPayload,
  IniciarAssinaturaResponse,
  SolicitacoesResponse,
  TabAssinatura,
} from '../../../features/assinatura/models/assinatura.model';

export class AssinaturaService {
  constructor(private readonly httpClient: HttpClient) {}

  async iniciar(payload: IniciarAssinaturaPayload): Promise<IniciarAssinaturaResponse> {
    const res = await this.httpClient.post<IniciarAssinaturaResponse>('/v1/assinatura/iniciar', payload);
    return res.data;
  }

  async confirmar(id: number, payload: ConfirmarAssinaturaPayload): Promise<DocumentoAssinado> {
    const res = await this.httpClient.post<DocumentoAssinado>(`/v1/assinatura/${id}/confirmar`, payload);
    return res.data;
  }

  async listarPorPeca(codigoPeca: number): Promise<AssinaturaEletronica[]> {
    const res = await this.httpClient.get<AssinaturaEletronica[]>(`/v1/assinatura/peca/${codigoPeca}`);
    return res.data;
  }

  async minhas(status?: string): Promise<AssinaturaEletronica[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    const res = await this.httpClient.get<AssinaturaEletronica[]>('/v1/assinatura/minhas', { params });
    return res.data;
  }

  async solicitacoes(tab: TabAssinatura): Promise<SolicitacoesResponse> {
    const res = await this.httpClient.get<SolicitacoesResponse>('/v1/assinatura/solicitacoes', {
      params: { tab },
    });
    return res.data;
  }

  async recusar(id: number): Promise<void> {
    await this.httpClient.patch(`/v1/assinatura/${id}/recusar`, {});
  }
}
