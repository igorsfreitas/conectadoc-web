import { HttpClient } from '@afinz/rest-client';
import { Usuario, UsuarioFilter, UsuarioPayload, PerfilSimple, LogAcesso, SegmentoSimple } from '../../../features/usuarios/models/usuario.model';
import { Paginated } from '../../types/paginated';

export class UsuariosService {
  constructor(private readonly httpClient: HttpClient) {}

  async findAll(page = 1, limit = 50, filter: UsuarioFilter = {}): Promise<Paginated<Usuario>> {
    const res = await this.httpClient.get<Paginated<Usuario>>('/v1/usuarios', { params: { page, limit, ...filter } });
    return res.data;
  }

  async downloadRelatorio(filter: UsuarioFilter = {}): Promise<void> {
    const params = new URLSearchParams(
      Object.entries(filter)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)]),
    );
    const url = `/v1/usuarios/relatorio${params.size ? '?' + params.toString() : ''}`;
    const res = await this.httpClient.get<Blob>(url, { responseType: 'blob' });
    const blob = new Blob([res.data as unknown as BlobPart], { type: 'application/pdf' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = 'relatorio-usuarios.pdf';
    a.click();
    URL.revokeObjectURL(href);
  }

  async findAllExport(filter: UsuarioFilter = {}): Promise<Usuario[]> {
    const first = await this.findAll(1, 1, filter);
    const total = first.meta.total;
    if (total === 0) return [];
    const res = await this.httpClient.get<Paginated<Usuario>>('/v1/usuarios', { params: { page: 1, limit: total, ...filter } });
    return res.data.data;
  }

  async findOne(id: number): Promise<Usuario> {
    const res = await this.httpClient.get<Usuario>(`/v1/usuarios/${id}`);
    return res.data;
  }

  async create(payload: UsuarioPayload): Promise<Usuario> {
    const res = await this.httpClient.post<Usuario>('/v1/usuarios', payload);
    return res.data;
  }

  async update(id: number, payload: Partial<UsuarioPayload>): Promise<Usuario> {
    const res = await this.httpClient.patch<Usuario>(`/v1/usuarios/${id}`, payload);
    return res.data;
  }

  async remove(id: number): Promise<void> {
    await this.httpClient.delete(`/v1/usuarios/${id}`);
  }

  async findPerfis(id: number): Promise<PerfilSimple[]> {
    const res = await this.httpClient.get<PerfilSimple[]>(`/v1/usuarios/${id}/perfis`);
    return res.data;
  }

  async addPerfil(id: number, perfilId: number): Promise<void> {
    await this.httpClient.post(`/v1/usuarios/${id}/perfis/${perfilId}`);
  }

  async removePerfil(id: number, perfilId: number): Promise<void> {
    await this.httpClient.delete(`/v1/usuarios/${id}/perfis/${perfilId}`);
  }

  async uploadFoto(id: number, file: File): Promise<{ fotoUrl: string; fotoUrlSigned: string }> {
    const form = new FormData();
    form.append('foto', file);
    const res = await this.httpClient.post<{ fotoUrl: string; fotoUrlSigned: string }>(
      `/v1/usuarios/${id}/foto`,
      form,
    );
    return res.data;
  }

  async removeFoto(id: number): Promise<void> {
    await this.httpClient.delete(`/v1/usuarios/${id}/foto`);
  }

  async uploadAssinatura(id: number, file: File): Promise<{ assinaturaUrl: string; assinaturaUrlSigned: string }> {
    const form = new FormData();
    form.append('assinatura', file);
    const res = await this.httpClient.post<{ assinaturaUrl: string; assinaturaUrlSigned: string }>(
      `/v1/usuarios/${id}/assinatura`,
      form,
    );
    return res.data;
  }

  async removeAssinatura(id: number): Promise<void> {
    await this.httpClient.delete(`/v1/usuarios/${id}/assinatura`);
  }

  async findLogsAcesso(id: number): Promise<LogAcesso[]> {
    const res = await this.httpClient.get<LogAcesso[]>(`/v1/usuarios/${id}/logs-acesso`);
    return res.data;
  }

  async findSegmentos(id: number): Promise<SegmentoSimple[]> {
    const res = await this.httpClient.get<SegmentoSimple[]>(`/v1/usuarios/${id}/segmentos`);
    return res.data;
  }

  async addSegmento(id: number, segmentoId: number): Promise<void> {
    await this.httpClient.post(`/v1/usuarios/${id}/segmentos/${segmentoId}`);
  }

  async removeSegmento(id: number, segmentoId: number): Promise<void> {
    await this.httpClient.delete(`/v1/usuarios/${id}/segmentos/${segmentoId}`);
  }
}
