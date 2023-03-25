import { window } from 'vscode';
import { ConnectionRepository } from '../domain/connection/connectionRepository';

export interface WorkgroupProvider {
  provideWorkgroup(): Promise<string | undefined>;
}

export class InputBoxWorkgroupProvider implements WorkgroupProvider {
  constructor(private connectionRepository: ConnectionRepository) {}

  async provideWorkgroup(): Promise<string | undefined> {
    const connection = this.connectionRepository.getConnection();
    const workgroup = connection?.workgroup;
    const result = await window.showInputBox({
      ignoreFocusOut: true,
      title: 'Workgroup?',
      placeHolder: 'primary',
      value: workgroup,
      valueSelection: [0, -1],
    });
    return result;
  }
}
