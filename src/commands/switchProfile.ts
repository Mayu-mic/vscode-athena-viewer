import { commands, EventEmitter, window } from 'vscode';
import { getCredentialProfiles } from '../credentials/getCredentialProfiles';
import { ProfileProvider } from '../profile/profileProvider';
import { ProfileRepository } from '../profile/profileRepository';

export class SwitchProfileCommandProvider {
  constructor(
    private profileRepository: ProfileRepository,
    private profileProvider: ProfileProvider
  ) {}

  private _onChangeProfileStatus: EventEmitter<void> = new EventEmitter();
  readonly onChangeProfileStatus = this._onChangeProfileStatus.event;

  async switchProfileCommand() {
    const candidates = await getCredentialProfiles();
    const profile = await this.profileProvider.provideProfile(candidates);
    if (!profile) {
      return;
    }
    this.profileRepository.setProfile(profile);
    this._onChangeProfileStatus.fire();
    commands.executeCommand('vscode-athena-viewer.refreshConnection');
    window.showInformationMessage('Profile updated!');
  }
}
