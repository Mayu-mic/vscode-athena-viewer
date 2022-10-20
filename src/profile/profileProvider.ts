import { window } from 'vscode';
import { Profile } from './profile';

export interface ProfileProvider {
  provideProfile(candidates: string[]): Promise<Profile | undefined>;
}

export class InputBoxProfileProvider implements ProfileProvider {
  async provideProfile(candidates: string[]): Promise<Profile | undefined> {
    const result = await window.showQuickPick(candidates, {
      title: 'AWS Profile?',
      placeHolder: 'ex) default',
    });
    return result ? { id: result } : undefined;
  }
}
