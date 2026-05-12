import { HttpClient } from '@afinz/rest-client';

import { TipoEntidadeExterna, CreateTipoEntidadeExternaPayload, UpdateTipoEntidadeExternaPayload } from '../../../features/tipo-entidade-externa/models/tipo-entidade-externa.model';
import { Paginated } from '../../types/paginated';

export class TipoEntidadeExternaService {
  constructor(private readonly httpClient: HttpClient) {}

  async findAll(page = 1, limit = 20): Promise<Paginated<TipoEntidadeExterna>> {
    const res = await this.httpClient.get<Paginated<TipoEntidadeExterna>>('/v1/tipo-entidade-externa', {
      params: { page, limit },
    });
    return res.data;
  }

  async findOne(codigo: string): Promise<TipoEntidadeExterna> {
    const res = await this.httpClient.get<TipoEntidadeExterna>(`/v1/tipo-entidade-externa/${codigo}`);
    return res.data;
  }

  async create(payload: CreateTipoEntidadeExternaPayload): Promise<TipoEntidadeExterna> {
    const res = await this.httpClient.post<TipoEntidadeExterna>('/v1/tipo-entidade-externa', payload);
    return res.data;
  }

  async update(codigo: string, payload: UpdateTipoEntidadeExternaPayload): Promise<TipoEntidadeExterna> {
    const res = await this.httpClient.patch<TipoEntidadeExterna>(`/v1/tipo-entidade-externa/${codigo}`, payload);
    return res.data;
  }

  async remove(codigo: string): Promise<void> {
    await this.httpClient.delete(`/v1/tipo-entidade-externa/${codigo}`);
  }
}
