import { commands, Event, EventEmitter, window } from 'vscode';
import { Connection, defaultWorkgroup } from '../domain/connection/connection';
import { ConnectionRepository } from '../domain/connection/connectionRepository';
import { RegionProvider } from '../domain/connection/regionProvider';

export class SwitchRegionCommandProvider {
  constructor(
    private connectionsRepository: ConnectionRepository,
    private regionProvider: RegionProvider
  ) {}

  private _onChangeProfileStatus: EventEmitter<void> = new EventEmitter();
  readonly onChangeProfileStatus: Event<void> =
    this._onChangeProfileStatus.event;

  async switchRegionCommand() {
    const region = await this.regionProvider.provideRegion();
    if (!region) {
      return;
    }
    const connection: Connection = {
      region,
      workgroup: defaultWorkgroup,
    };
    this.connectionsRepository.setConnection(connection);
    commands.executeCommand('vscode-athena-viewer.refreshConnection');
    window.showInformationMessage('Connection updated!');
  }
}
