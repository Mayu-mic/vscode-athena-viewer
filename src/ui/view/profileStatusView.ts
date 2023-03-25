import { StatusBarAlignment, StatusBarItem, window } from 'vscode';
import { ProfileRepository } from '../../domain/profile/profileRepository';

export class ProfileStatusView {
  private item: StatusBarItem;

  constructor(private profileRepository: ProfileRepository) {
    this.item = window.createStatusBarItem(StatusBarAlignment.Left, 1);
    this.item.command = 'vscode-athena-viewer.switchProfile';
    this.refresh();
  }

  show() {
    this.item.show();
  }

  hide() {
    this.item.hide();
  }

  refresh() {
    const profile = this.profileRepository.getProfile();
    this.item.text = profile?.id
      ? `Athena Profile: ${profile.id}`
      : 'Athena Profile: Not configured';
  }

  provide(): StatusBarItem {
    this.show();
    return this.item;
  }
}
