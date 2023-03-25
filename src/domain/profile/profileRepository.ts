import { ExtensionContext } from 'vscode';
import {
  MementoStateAccessor,
  StateAccessor,
} from '../../infrastracture/stateAccessor';
import { Profile } from './profile';

export interface ProfileRepository {
  setProfile(profile: Profile): void;
  getProfile(): Profile | undefined;
}

export class WorkspaceStateProfileRepository implements ProfileRepository {
  constructor(private accessor: StateAccessor<Profile>) {}

  setProfile(profile: Profile): void {
    this.accessor.set('profile', profile);
  }

  getProfile(): Profile | undefined {
    return this.accessor.get('profile');
  }

  static craeteDefault(ctx: ExtensionContext): WorkspaceStateProfileRepository {
    const accessor = new MementoStateAccessor<Profile>(ctx);
    return new WorkspaceStateProfileRepository(accessor);
  }
}
