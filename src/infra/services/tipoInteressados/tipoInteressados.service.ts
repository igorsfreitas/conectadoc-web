import { HttpClient } from '@afinz/rest-client';

import { TipoInteressado, TipoInteressadoPayload } from '../../../features/tipoInteressados/models/tipoInteressado.model';

export class TipoInteressadosService {
  constructor(private readonly httpClient: HttpClient) {}

  async findAll(): Promise<TipoInteressado[]> {
    const res = await this.httpClient.get<TipoInteressado[]>('/v1/tipoInteressados', { withCredentials: true });
    return res.data;
  }

  async findOne(id: number): Promise<TipoInteressado> {
    const res = await this.httpClient.get<TipoInteressado>(`/v1/tipoInteressados/${id}`, { withCredentials: true });
    return res.data;
  }

  async create(payload: TipoInteressadoPayload): Promise<TipoInteressado> {
    const res = await this.httpClient.post<TipoInteressado>('/v1/tipoInteressados', payload, { withCredentials: true });
    return res.data;
  }

  async update(id: number, payload: Partial<TipoInteressadoPayload>): Promise<TipoInteressado> {
    const res = await this.httpClient.patch<TipoInteressado>(`/v1/tipoInteressados/${id}`, payload, { withCredentials: true });
    return res.data;
  }

  async remove(id: number): Promise<void> {
    await this.httpClient.delete(`/v1/tipoInteressados/${id}`, { withCredentials: true });
  }
}
