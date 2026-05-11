import { AfinzApiError } from "@afinz/rest-client";
import { ReactElement, createContext, useState } from "react";
import { afinzStorageKeys } from "../afinz_storage/afinz_storage_keys";
import { useInject } from "../hooks/inject";
import { ProfileResponse } from "../services/profile/profile.model";
import { ProfileService } from "../services/profile/profile.service";

export interface Context {
  profile?: ProfileResponse;
  loadingProfile: boolean;

  loadProfile(): Promise<void>;
}

export const ProfileContext = createContext<Context>({
  profile: undefined,
  loadingProfile: false,

  async loadProfile() {},
});

export function ProfileManager({ children }: { children: ReactElement }) {
  const profileService = useInject("ProfileService") as ProfileService;

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | undefined>();

  function getAuthenticatedCpf(): string | undefined {
    return localStorage.getItem(afinzStorageKeys.authenticatedCpf) ?? undefined;
  }

  async function loadProfile(): Promise<void> {
    if (profile) return;

    const cpf = getAuthenticatedCpf();

    if (cpf) {
      setLoadingProfile(true);

      const response = await profileService.getProfile();

      setLoadingProfile(false);

      if (response instanceof AfinzApiError) {
        setProfile(undefined);
      }

      setProfile(response as ProfileResponse);
    }
  }

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loadingProfile,
        loadProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export type ProfileContextType = Context;
