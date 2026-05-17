import { createContext, ReactElement, useEffect, useState } from "react";
import { useInject } from "../hooks/inject";
import { ProfileResponse } from "../services/profile/profile.model";

export interface ProfileContextType {
  profile?: ProfileResponse;
  loadingProfile: boolean;
  setProfile(p: ProfileResponse | undefined): void;
}

export const ProfileContext = createContext<ProfileContextType>({
  profile: undefined,
  loadingProfile: true,
  setProfile() {},
});

export function ProfileManager({ children }: { children: ReactElement }) {
  const profileService = useInject("ProfileService");

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<ProfileResponse | undefined>();

  useEffect(() => {
    profileService
      .getProfile()
      .then((res) => {
        if (!(res instanceof Error)) setProfile(res as ProfileResponse);
      })
      .finally(() => setLoadingProfile(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, loadingProfile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}
