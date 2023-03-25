import { Profile } from './profile';

export interface ProfileProvider {
  provideProfile(candidates: string[]): Promise<Profile | undefined>;
}
