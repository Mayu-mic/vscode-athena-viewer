import { commands, EventEmitter, window } from 'vscode';
import { ProfileProvider } from '../domain/profile/profileProvider';
import { ProfileRepository } from '../domain/profile/profileRepository';
import { parseKnownFiles } from '@aws-sdk/shared-ini-file-loader';

export class SwitchProfileCommandProvider {
  constructor(
    private profileRepository: ProfileRepository,
    private profileProvider: ProfileProvider
  ) {}

  private _onChangeProfileStatus: EventEmitter<void> = new EventEmitter();
  readonly onChangeProfileStatus = this._onChangeProfileStatus.event;

  async switchProfileCommand() {
    const candidates = await this.getCredentialProfiles();
    const profile = await this.profileProvider.provideProfile(candidates);
    if (!profile) {
      return;
    }
    this.profileRepository.setProfile(profile);
    this._onChangeProfileStatus.fire();
    commands.executeCommand('vscode-athena-viewer.refreshConnection');
    window.showInformationMessage('Profile updated!');
  }

  private async getCredentialProfiles(): Promise<string[]> {
    const result = await parseKnownFiles({});
    return Object.keys(result);
  }
}
