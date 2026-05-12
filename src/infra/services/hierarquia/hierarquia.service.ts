import { HttpClient } from "@afinz/rest-client";
import { HierarquiaPayload, ItemArquivologia } from "../../../features/hierarquia/models/hierarquia.model";

export class HierarquiaService {
  constructor(private readonly httpClient: HttpClient) {}

  async findAll(): Promise<ItemArquivologia[]> {
    const response = await this.httpClient.get<ItemArquivologia[]>("/v1/hierarquia");
    return response.data;
  }

  async findRoots(): Promise<ItemArquivologia[]> {
    const response = await this.httpClient.get<ItemArquivologia[]>("/v1/hierarquia/roots");
    return response.data;
  }

  async findOne(id: string): Promise<ItemArquivologia> {
    const response = await this.httpClient.get<ItemArquivologia>(`/v1/hierarquia/${id}`);
    return response.data;
  }

  async create(payload: HierarquiaPayload): Promise<ItemArquivologia> {
    const response = await this.httpClient.post<ItemArquivologia>("/v1/hierarquia", payload);
    return response.data;
  }

  async update(id: string, payload: HierarquiaPayload): Promise<ItemArquivologia> {
    const response = await this.httpClient.patch<ItemArquivologia>(`/v1/hierarquia/${id}`, payload);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await this.httpClient.delete(`/v1/hierarquia/${id}`);
  }
}
