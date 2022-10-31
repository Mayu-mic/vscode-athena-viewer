import { GlobalStateRepository } from '../baseRepository';
import { Profile } from './profile';

export interface ProfileRepository {
  setProfile(profile: Profile): void;
  getProfile(): Profile | undefined;
}

export class WorkspaceStateProfileRepository
  extends GlobalStateRepository
  implements ProfileRepository
{
  setProfile(profile: Profile): void {
    this.set('profile', profile);
  }
  getProfile(): Profile | undefined {
    return this.get<Profile>('profile');
  }
}
