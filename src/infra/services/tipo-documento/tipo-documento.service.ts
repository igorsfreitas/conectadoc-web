import { HttpClient } from '@afinz/rest-client';
import {
  AtributoTipoDocumento,
  AtributoTipoPayload,
  TipoDocumento,
  TipoDocumentoFilter,
  TipoDocumentoPayload,
} from '../../../features/tipo-documento/models/tipo-documento.model';
import { Paginated } from '../../types/paginated';

export class TipoDocumentoService {
  constructor(private readonly httpClient: HttpClient) {}

  async findAll(page = 1, limit = 20, filter: TipoDocumentoFilter = {}): Promise<Paginated<TipoDocumento>> {
    const res = await this.httpClient.get<Paginated<TipoDocumento>>('/v1/tipo-documento', { params: { page, limit, ...filter } });
    return res.data;
  }

  async findAllSimple(): Promise<TipoDocumento[]> {
    const res = await this.httpClient.get<TipoDocumento[]>('/v1/tipo-documento/simple');
    return res.data;
  }

  async findOne(codigo: string): Promise<TipoDocumento> {
    const res = await this.httpClient.get<TipoDocumento>(`/v1/tipo-documento/${codigo}`);
    return res.data;
  }

  async create(payload: TipoDocumentoPayload): Promise<TipoDocumento> {
    const res = await this.httpClient.post<TipoDocumento>('/v1/tipo-documento', payload);
    return res.data;
  }

  async update(codigo: string, payload: TipoDocumentoPayload): Promise<TipoDocumento> {
    const res = await this.httpClient.patch<TipoDocumento>(`/v1/tipo-documento/${codigo}`, payload);
    return res.data;
  }

  async remove(codigo: string): Promise<void> {
    await this.httpClient.delete(`/v1/tipo-documento/${codigo}`);
  }

  // ── Atributos ─────────────────────────────────────────────────────────────

  async findAtributos(codigo: string): Promise<AtributoTipoDocumento[]> {
    const res = await this.httpClient.get<AtributoTipoDocumento[]>(`/v1/tipo-documento/${codigo}/atributos`);
    return res.data;
  }

  async createAtributo(codigo: string, payload: AtributoTipoPayload): Promise<AtributoTipoDocumento> {
    const res = await this.httpClient.post<AtributoTipoDocumento>(`/v1/tipo-documento/${codigo}/atributos`, payload);
    return res.data;
  }

  async updateAtributo(codigo: string, atributoId: number, payload: AtributoTipoPayload): Promise<AtributoTipoDocumento> {
    const res = await this.httpClient.patch<AtributoTipoDocumento>(`/v1/tipo-documento/${codigo}/atributos/${atributoId}`, payload);
    return res.data;
  }

  async removeAtributo(codigo: string, atributoId: number): Promise<void> {
    await this.httpClient.delete(`/v1/tipo-documento/${codigo}/atributos/${atributoId}`);
  }
}
