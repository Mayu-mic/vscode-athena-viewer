// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { QueryCommandProvider } from './commands/query';
import { SetupConfigsCommandProvider } from './commands/setup-configs';
import { WorkspaceStateConfigRepository } from './config/config-repository';
import {
  CredentialsProvider,
  WorkspaceStateCredentialsRepository,
} from './credentials/credentials';
import { InputBoxConfigurationProvider } from './ui/input-box';
import { DatabasesViewProvider, TableItem } from './view/databases-view';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  const configRepository = new WorkspaceStateConfigRepository(context);
  const configProvider = new InputBoxConfigurationProvider();
  const credentialsRepository = new WorkspaceStateCredentialsRepository(
    context
  );
  const credentialsProvider = new CredentialsProvider();
  const databasesView = new DatabasesViewProvider(
    configRepository,
    credentialsRepository,
    credentialsProvider
  );

  const queryCommandProvider = new QueryCommandProvider(
    configRepository,
    configProvider,
    credentialsRepository,
    credentialsProvider
  );
  const setupConfigsCommandProvider = new SetupConfigsCommandProvider(
    configRepository,
    configProvider
  );

  const disposables = [
    vscode.commands.registerCommand('vscode-athena-viewer.runQuery', () =>
      queryCommandProvider.runQueryCommand()
    ),
    vscode.commands.registerCommand(
      'vscode-athena-viewer.showTable',
      (item: TableItem) => queryCommandProvider.showTablesCommand(item)
    ),
    vscode.commands.registerCommand('vscode-athena-viewer.setupConfigs', () =>
      setupConfigsCommandProvider.setupConfigsCommand()
    ),
    vscode.commands.registerCommand(
      'vscode-athena-viewer.refreshDatabases',
      () => databasesView.refresh()
    ),
    vscode.window.registerTreeDataProvider('view-databases', databasesView),
  ];

  disposables.forEach((disposable) => context.subscriptions.push(disposable));
}

// this method is called when your extension is deactivated
export function deactivate() {}
