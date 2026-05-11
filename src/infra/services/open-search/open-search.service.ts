import {
  AfinzLogModel,
  DeviceInfoModel,
  OpenSearchModel,
  UserInfoModel,
} from "./open-search.models";
import packageInfo from "../../../../package.json";
import { AfinzApiError, HttpClient } from "@afinz/rest-client";
import { afinzStorageKeys } from "../../afinz_storage/afinz_storage_keys";

const OPEN_SEARCH_ENDPOINT = "/opensearch/document";

export class OpenSearchService {
  constructor(private readonly httpClient: HttpClient) {}

  private getSessionId() {
    const sessionId = sessionStorage.getItem("uuidSession");
    if (!sessionId) {
      return "";
    }
    return sessionId;
  }

  async log(afinzLogModel: AfinzLogModel): Promise<void | AfinzApiError> {
    try {
      const deviceInfoModel: DeviceInfoModel = {
        device: navigator.userAgent,
        os: navigator.platform,
        version: navigator.appVersion,
      };

      const storedUserInfo = localStorage.getItem(
        afinzStorageKeys.authenticatedCpf,
      );

      const userInfoModel: UserInfoModel = {
        cpf: storedUserInfo!,
        uuid: this.getSessionId(),
      };

      const openSearchModel: OpenSearchModel = {
        appVersion: packageInfo.version,
        afinzLogModel,
        deviceInfoModel,
        userInfoModel,
      };

      await this.httpClient.post(OPEN_SEARCH_ENDPOINT, openSearchModel, {
        headers: {
          "x-span": openSearchModel.userInfoModel.cpf,
        },
      });

      return;
    } catch (error: unknown) {
      console.error("Falha ao enviar log para o OpenSearch:", error);
    }
  }
}
