import { commands, window } from 'vscode';
import { ConnectionRepository } from '../domain/connection/connectionRepository';
import { WorkgroupProvider } from '../domain/connection/workgroupProvider';

export class InputWorkgroupCommandProvider {
  constructor(
    private workgroupProvider: WorkgroupProvider,
    private connectionRepository: ConnectionRepository
  ) {}

  async inputWorkgroupCommand() {
    const workgroup = await this.workgroupProvider.provideWorkgroup();
    if (!workgroup) {
      return;
    }
    const connection = this.connectionRepository.getConnection();
    if (!connection) {
      throw new Error('connection is not configured.');
    }
    connection.workgroup = workgroup;
    this.connectionRepository.setConnection(connection);
    commands.executeCommand('vscode-athena-viewer.refreshConnection');
    window.showInformationMessage('Connection updated!');
  }
}
