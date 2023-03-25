import { window } from 'vscode';
import { Profile } from '../domain/profile/profile';
import { ProfileProvider } from '../domain/profile/profileProvider';

export class ProfileInputBox implements ProfileProvider {
  async provideProfile(candidates: string[]): Promise<Profile | undefined> {
    const result = await window.showQuickPick(candidates, {
      title: 'AWS Profile?',
      placeHolder: 'ex) default',
    });
    return result ? { id: result } : undefined;
  }
}
