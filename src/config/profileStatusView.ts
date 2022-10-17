import {
  Event,
  EventEmitter,
  StatusBarAlignment,
  StatusBarItem,
  window,
} from 'vscode';
import { ConfigurationRepository } from './configRepository';

export class ProfileStatusViewProvider {
  private item: StatusBarItem;

  constructor(private configRepository: ConfigurationRepository) {
    this.item = window.createStatusBarItem(StatusBarAlignment.Left, 1);
    this.item.command = 'vscode-athena-viewer.setupConfigs';
    this.refresh();
  }

  show() {
    this.item.show();
  }

  hide() {
    this.item.hide();
  }

  refresh() {
    const config = this.configRepository.getConfig();
    this.item.text = config?.profile
      ? `Athena Profile: ${config.profile}`
      : 'Athena Profile: Not configured';
  }

  provide(): StatusBarItem {
    this.show();
    return this.item;
  }
}
