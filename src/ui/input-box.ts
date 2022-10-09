import * as vscode from 'vscode';
import { IConfigurationProvider } from '../config/config-repository';

export class InputBoxConfigurationProvider implements IConfigurationProvider {
  async provideProfile(candidates: string[]): Promise<string | undefined> {
    return await vscode.window.showQuickPick(candidates, {
      title: 'AWS Profile?',
      placeHolder: 'ex) default',
    });
  }

  async provideRegion(): Promise<string | undefined> {
    return await vscode.window.showInputBox({
      title: 'AWS Region?',
      placeHolder: 'ex) ap-northeast-1',
      value: 'ap-northeast-1',
      valueSelection: [0, -1],
    });
  }

  async provideWorkgroup(): Promise<string | undefined> {
    return await vscode.window.showInputBox({
      title: 'Workgroup?',
      placeHolder: 'ex) primary',
      value: 'primary',
      valueSelection: [0, -1],
    });
  }
}
