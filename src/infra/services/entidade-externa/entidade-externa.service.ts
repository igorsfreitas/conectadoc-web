import { HttpClient } from '@afinz/rest-client';

import {
  EntidadeExterna,
  CreateEntidadeExternaPayload,
  UpdateEntidadeExternaPayload,
} from '../../../features/entidade-externa/models/entidade-externa.model';
import { Paginated } from '../../types/paginated';

export class EntidadeExternaService {
  constructor(private readonly httpClient: HttpClient) {}

  async findAll(page = 1, limit = 20): Promise<Paginated<EntidadeExterna>> {
    const res = await this.httpClient.get<Paginated<EntidadeExterna>>('/v1/entidade-externa', {
      params: { page, limit },
    });
    return res.data;
  }

  async findOne(codigo: number): Promise<EntidadeExterna> {
    const res = await this.httpClient.get<EntidadeExterna>(`/v1/entidade-externa/${codigo}`);
    return res.data;
  }

  async create(payload: CreateEntidadeExternaPayload): Promise<EntidadeExterna> {
    const res = await this.httpClient.post<EntidadeExterna>('/v1/entidade-externa', payload);
    return res.data;
  }

  async update(codigo: number, payload: UpdateEntidadeExternaPayload): Promise<EntidadeExterna> {
    const res = await this.httpClient.patch<EntidadeExterna>(`/v1/entidade-externa/${codigo}`, payload);
    return res.data;
  }

  async remove(codigo: number): Promise<void> {
    await this.httpClient.delete(`/v1/entidade-externa/${codigo}`);
  }
}
