import { createContext, ReactElement, useState } from "react";
import { useInject } from "../hooks/inject";
import { ProfileResponse } from "../services/profile/profile.model";

export interface ProfileContextType {
  profile?: ProfileResponse;
  loadingProfile: boolean;
  loadProfile(): Promise<void>;
}

export const ProfileContext = createContext<ProfileContextType>({
  profile: undefined,
  loadingProfile: false,
  async loadProfile() {},
});

export function ProfileManager({ children }: { children: ReactElement }) {
  const profileService = useInject("ProfileService");

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | undefined>();

  async function loadProfile(): Promise<void> {
    if (profile) return;
    setLoadingProfile(true);
    try {
      const response = await profileService.getProfile();
      if (!(response instanceof Error)) {
        setProfile(response as ProfileResponse);
      }
    } finally {
      setLoadingProfile(false);
    }
  }

  return (
    <ProfileContext.Provider value={{ profile, loadingProfile, loadProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}
